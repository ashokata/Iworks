/**
 * Color Constants
 * Matches the Tailwind config for use in native components
 */

export const Colors = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Semantic colors
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
  },
  
  // Neutral colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Background colors
  background: {
    light: '#ffffff',
    dark: '#111827',
  },
  
  // Text colors
  text: {
    light: {
      primary: '#111827',
      secondary: '#6b7280',
      muted: '#9ca3af',
    },
    dark: {
      primary: '#ffffff',
      secondary: '#9ca3af',
      muted: '#6b7280',
    },
  },
};

// Job status colors
export const JobStatusColors: Record<string, { bg: string; text: string }> = {
  UNSCHEDULED: { bg: '#f3f4f6', text: '#6b7280' },
  SCHEDULED: { bg: '#dbeafe', text: '#1d4ed8' },
  DISPATCHED: { bg: '#e0e7ff', text: '#4338ca' },
  EN_ROUTE: { bg: '#fef3c7', text: '#d97706' },
  IN_PROGRESS: { bg: '#d1fae5', text: '#059669' },
  ON_HOLD: { bg: '#fee2e2', text: '#dc2626' },
  COMPLETED: { bg: '#ecfdf5', text: '#10b981' },
  INVOICED: { bg: '#e0e7ff', text: '#4338ca' },
  PAID: { bg: '#d1fae5', text: '#059669' },
  CANCELLED: { bg: '#f3f4f6', text: '#6b7280' },
};

