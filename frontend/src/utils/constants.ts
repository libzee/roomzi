/**
 * Application constants and configuration
 */

// Local storage keys
export const STORAGE_KEYS = {
  SELECTED_ROLE: 'roomzi_selected_role',
} as const;

// User roles
export const USER_ROLES = {
  TENANT: 'tenant',
  LANDLORD: 'landlord',
} as const;

// Route paths
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  ROLE_SELECTION: '/role-selection',
  TENANT_DASHBOARD: '/tenant',
  LANDLORD_DASHBOARD: '/landlord',
  TENANT_PROFILE: '/tenant/profile',
  LANDLORD_PROFILE: '/landlord/profile',
} as const;

// API configuration
export const API_CONFIG = {
  DEFAULT_TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

// App metadata
export const APP_METADATA = {
  SIGNUP_SOURCE: 'web_app',
  APP_NAME: 'Roomzi',
} as const;

// Type exports for better TypeScript support
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
export type RoutePath = typeof ROUTES[keyof typeof ROUTES]; 