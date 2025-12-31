/**
 * App Configuration
 */

// API Configuration
export const API_CONFIG = {
  // For local development, use your computer's IP address (e.g., http://192.168.1.x:4000)
  // Find your IP: Windows: ipconfig | Mac/Linux: ifconfig
  // Or use localhost if running on same device: http://localhost:4000
  // Your IP: 192.168.0.44
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.44:4000',
  TIMEOUT: 30000, // 30 seconds
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'iWorks',
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
