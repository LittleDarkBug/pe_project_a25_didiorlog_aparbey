export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  TIMEOUT: 30000,
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
  },
  SCENES: {
    BASE: '/scenes',
    BY_ID: (id: string) => `/scenes/${id}`,
    SAVE: '/scenes/save',
  },
} as const;

export const QUERY_KEYS = {
  AUTH: {
    USER: ['auth', 'user'],
  },
  USERS: {
    ALL: ['users'],
    BY_ID: (id: string) => ['users', id],
    PROFILE: ['users', 'profile'],
  },
  SCENES: {
    ALL: ['scenes'],
    BY_ID: (id: string) => ['scenes', id],
  },
} as const;
