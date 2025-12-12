/**
 * App Configuration
 */

// API Configuration
export const API_CONFIG = {
  // Use deployed AWS API for mobile
  // For local development, set EXPO_PUBLIC_API_URL to your computer's IP (e.g., http://192.168.1.x:4000)
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://gpajab36b7.execute-api.us-east-1.amazonaws.com/prod',
  TIMEOUT: 30000, // 30 seconds
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'FieldSmartPro',
  VERSION: '1.0.0',
  // Default tenant for development
  DEFAULT_TENANT_ID: process.env.EXPO_PUBLIC_TENANT_ID || 'local-tenant',
};

// Feature Flags
export const FEATURES = {
  OFFLINE_MODE: true,
  VOICE_AI: true,
  BIOMETRIC_AUTH: true,
  PUSH_NOTIFICATIONS: true,
};

// Sync Configuration
export const SYNC_CONFIG = {
  // How often to sync in background (ms)
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  // How many days of jobs to cache locally
  OFFLINE_DAYS_AHEAD: 7,
  OFFLINE_DAYS_BEHIND: 3,
};
