/**
 * Shared Utility Functions for API Schema Transformations
 */

/**
 * Generic transformer that handles OData responses
 * Extracts the 'value' array from OData response or returns data as-is
 */
export const extractODataResponse = <T>(response: any): T[] => {
  if (Array.isArray(response)) {
    return response;
  }
  
  if (response && typeof response === 'object') {
    if (Array.isArray(response.value)) {
      return response.value;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response.results)) {
      return response.results;
    }
  }
  
  return [];
};

/**
 * Safe date transformer
 * Handles various date formats and null values
 */
export const transformDate = (dateValue: any): string => {
  if (!dateValue) return new Date().toISOString();
  
  try {
    return new Date(dateValue).toISOString();
  } catch {
    return new Date().toISOString();
  }
};

/**
 * Safe number transformer
 * Handles null/undefined and parses strings
 */
export const transformNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue;
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Safe string transformer
 * Handles null/undefined
 */
export const transformString = (value: any, defaultValue: string = ''): string => {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
};
