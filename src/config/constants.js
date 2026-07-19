/**
 * Application Configuration Constants
 */

// Base API URL
// Requires VITE_API_BASE_URL environment variable
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

if (!apiBaseUrl && import.meta.env.MODE === 'production') {
    console.error('VITE_API_BASE_URL environment variable is required for API communication');
}

export const API_BASE_URL = apiBaseUrl || 'http://localhost:3001';

// Derived API v1 URL
// Ensure we don't double-append /api/v1 if it's already in the base URL
export const API_V1_URL = API_BASE_URL.endsWith('/api/v1')
    ? API_BASE_URL
    : `${API_BASE_URL.replace(/\/$/, '')}/api/v1`;

export const SOCKET_URL = API_BASE_URL.replace('/api/v1', '').replace(/\/$/, '');
