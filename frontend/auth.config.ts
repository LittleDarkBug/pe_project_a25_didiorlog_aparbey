import type { NextAuthConfig } from 'next-auth';
import { API_ENDPOINTS, API_CONFIG } from '@/app/config/api';

async function refreshAccessToken(token: any) {
  try {
    const baseUrl = process.env.INTERNAL_API_URL || API_CONFIG.BASE_URL;
    const response = await fetch(`${baseUrl}${API_ENDPOINTS.AUTH.REFRESH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fallback to old refresh token
    };
  } catch (error) {
    console.error("RefreshAccessTokenError", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        return {
          accessToken: (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
          expiresAt: (user as any).expiresAt,
          id: (user as any).id,
          full_name: (user as any).full_name,
          role: (user as any).role,
          is_superuser: (user as any).is_superuser,
        };
      }

      // Return previous token if the access token has not expired yet
      // Subtract 1 minute for safety margin
      if (Date.now() < (token as any).expiresAt - 60 * 1000) {
        return token;
      }

      // Access token has expired, try to update it
      console.log("Access token expired, refreshing...");
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).id = token.id;
        (session.user as any).full_name = token.full_name;
        (session.user as any).role = token.role;
        (session.user as any).is_superuser = token.is_superuser;
        (session.user as any).error = token.error;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }: { auth: any; request: { nextUrl: URL } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtected =
        nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/workspace') ||
        nextUrl.pathname.startsWith('/projects') ||
        nextUrl.pathname.startsWith('/admin') ||
        nextUrl.pathname.startsWith('/profile');

      if (isOnProtected) {
        if (isLoggedIn) {
          // Prevent admin from accessing user dashboard/projects
          if ((auth?.user as any)?.role === 'admin' && (
            nextUrl.pathname.startsWith('/dashboard') ||
            nextUrl.pathname.startsWith('/workspace') ||
            nextUrl.pathname.startsWith('/projects')
          )) {
            return Response.redirect(new URL('/admin', nextUrl));
          }
          // Prevent regular users from accessing admin
          if ((auth?.user as any)?.role !== 'admin' && nextUrl.pathname.startsWith('/admin')) {
            return Response.redirect(new URL('/dashboard', nextUrl));
          }
          return true;
        }
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
        if ((auth?.user as any)?.role === 'admin') {
          return Response.redirect(new URL('/admin', nextUrl));
        }
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;

