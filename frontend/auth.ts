import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
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

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (credentials?.email && credentials?.password) {
            try {
                // Use internal URL for server-side calls if available, otherwise fallback to public URL
                const baseUrl = process.env.INTERNAL_API_URL || API_CONFIG.BASE_URL;
                
                console.log(`[Auth] Attempting login to ${baseUrl}${API_ENDPOINTS.AUTH.LOGIN}`);

                // 1. Login to get tokens
                const loginRes = await fetch(`${baseUrl}${API_ENDPOINTS.AUTH.LOGIN}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password,
                    }),
                });

                if (!loginRes.ok) {
                    const errorText = await loginRes.text();
                    console.error("[Auth] Login failed", loginRes.status, errorText);
                    return null;
                }
                const tokens = await loginRes.json();

                // 2. Get User Profile
                const userRes = await fetch(`${baseUrl}${API_ENDPOINTS.USERS.ME}`, {
                    headers: { 
                        'Authorization': `Bearer ${tokens.access_token}` 
                    },
                });

                if (!userRes.ok) {
                     console.error("[Auth] User fetch failed", await userRes.text());
                     return null;
                }
                const user = await userRes.json();

                return {
                    ...user,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiresAt: Date.now() + tokens.expires_in * 1000,
                };
            } catch (e) {
                console.error("[Auth] Auth error", e);
                return null;
            }
        }
        return null;
    },
    }),
  ],
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
        (session.user as any).error = token.error;
      }
      return session;
    },
  },
});
