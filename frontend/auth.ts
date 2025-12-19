import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { API_ENDPOINTS, API_CONFIG } from '@/app/config/api';

const nextAuthResult = NextAuth({
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
});

export const { auth, signIn, signOut, handlers } = nextAuthResult;
