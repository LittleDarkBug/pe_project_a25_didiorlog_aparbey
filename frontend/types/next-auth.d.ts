import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's access token. */
      accessToken: string
      /** The user's id */
      id: string
      /** The user's full name */
      full_name?: string
      /** The user's role */
      role?: string
    } & DefaultSession["user"]
  }

  interface User {
    accessToken: string
    refreshToken: string
    id: string
    full_name?: string
    role?: string
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    accessToken: string
    refreshToken: string
    id: string
    full_name?: string
    role?: string
  }
}
