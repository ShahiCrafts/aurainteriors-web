/**
 * Application Configuration Constants
 */

// Base API URL
// Looks for VITE_API_BASE_URL first, then VITE_API_URL (legacy), and falls back to localhost
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    const isHttps = protocol === 'https:';

    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:3001`;
    }

    const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';
    if (isHttps && envUrl.startsWith('http:')) {
      return envUrl.replace('http:', 'https:');
    }
    return envUrl;
  }
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

// Derived API v1 URL
// Ensure we don't double-append /api/v1 if it's already in the base URL
export const API_V1_URL = API_BASE_URL.endsWith('/api/v1')
    ? API_BASE_URL
    : `${API_BASE_URL.replace(/\/$/, '')}/api/v1`;

export const SOCKET_URL = API_BASE_URL.replace('/api/v1', '').replace(/\/$/, '');
