/**
 * API Service Layer
 * Security Awareness Platform
 * 
 * Handles all HTTP requests to the backend API
 * with authentication, error handling, and retries.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Token storage
let accessToken = localStorage.getItem('access_token') || null;
let refreshToken = localStorage.getItem('refresh_token') || null;

/**
 * Set authentication tokens
 */
export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

/**
 * Clear authentication tokens
 */
export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

/**
 * Get current access token
 */
export function getAccessToken() {
  return accessToken;
}

/**
 * Get stored user data from localStorage
 */
export function getUser() {
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
}

/**
 * Check if user is authenticated and token is not expired
 */
export function isAuthenticated() {
  if (!accessToken) return false;
  try {
    // Parse JWT payload
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    // Check if token is expired (exp is in seconds, Date.now() in milliseconds)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      // Token expired, clear it
      clearTokens();
      return false;
    }
    // Also validate token has required fields
    if (!payload.userId) {
      clearTokens();
      return false;
    }
    return true;
  } catch {
    // Invalid token format
    clearTokens();
    return false;
  }
}

const REQUEST_TIMEOUT_MS = 30000; // 30 second timeout

/**
 * Base fetch function with auth headers and timeout
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle 401 - try to refresh token
    if (response.status === 401 && refreshToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${accessToken}`;
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), REQUEST_TIMEOUT_MS);
        const retryResponse = await fetch(url, {
          ...options,
          headers,
          signal: retryController.signal
        });
        clearTimeout(retryTimeoutId);
        return handleResponse(retryResponse);
      }
    }
    
    return await handleResponse(response);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: The server took too long to respond');
    }
    throw new Error(`Network error: ${error.message}`);
  }
}

/**
 * Handle API response
 */
async function handleResponse(response) {
  const data = await response.json();
  
  if (!response.ok) {
    const error = new Error(data.error?.message || 'Request failed');
    error.code = data.error?.code || 'UNKNOWN_ERROR';
    error.status = response.status;
    error.details = data.error?.details;
    throw error;
  }
  
  return data;
}

/**
 * Refresh access token
 */
async function refreshAccessToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
      return true;
    }
  } catch (err) {
    console.error('Token refresh failed:', err);
  }
  
  clearTokens();
  return false;
}

// HTTP methods
export const api = {
  get: (endpoint) => apiFetch(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) => apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => apiFetch(endpoint, { method: 'DELETE' })
};

export default api;
