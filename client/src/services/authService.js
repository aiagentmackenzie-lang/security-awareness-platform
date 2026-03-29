/**
 * Auth API Service
 * Handles authentication API calls with token management
 */

const API_BASE_URL = '/api';

/**
 * Get stored access token
 */
export function getAccessToken() {
  return localStorage.getItem('accessToken');
}

/**
 * Get stored refresh token
 */
export function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

/**
 * Get stored user data
 */
export function getUser() {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
}

/**
 * Clear auth data (logout)
 */
export function clearAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getAccessToken();
}

/**
 * Register a new user
 */
export async function register(displayName, email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ displayName, email, password })
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error?.message || 'Registration failed');
  }

  // Store tokens
  localStorage.setItem('accessToken', data.data.tokens.accessToken);
  localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.data.user));

  return data.data;
}

/**
 * Login user
 */
export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error?.message || 'Login failed');
  }

  // Store tokens
  localStorage.setItem('accessToken', data.data.tokens.accessToken);
  localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.data.user));

  return data.data;
}

/**
 * Logout user
 */
export async function logout() {
  const refreshToken = getRefreshToken();
  
  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  clearAuth();
}

/**
 * Refresh access token
 */
export async function refreshToken() {
  const currentRefreshToken = getRefreshToken();
  
  if (!currentRefreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken: currentRefreshToken })
  });

  const data = await response.json();
  
  if (!data.success) {
    clearAuth();
    throw new Error('Session expired');
  }

  // Update tokens
  localStorage.setItem('accessToken', data.data.tokens.accessToken);
  localStorage.setItem('refreshToken', data.data.tokens.refreshToken);

  return data.data.tokens;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const token = getAccessToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  
  if (!data.success) {
    // Try to refresh token if expired
    if (response.status === 401) {
      await refreshToken();
      return getCurrentUser();
    }
    throw new Error(data.error?.message || 'Failed to get user');
  }

  // Update stored user data
  localStorage.setItem('user', JSON.stringify(data.data.user));

  return data.data.user;
}

/**
 * Authenticated fetch wrapper
 */
export async function authFetch(url, options = {}) {
  const token = getAccessToken();
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  // If unauthorized, try refreshing token
  if (response.status === 401) {
    try {
      await refreshToken();
      // Retry with new token
      const newToken = getAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      return fetch(url, {
        ...options,
        headers
      });
    } catch (error) {
      clearAuth();
      window.location.href = '/login';
      throw error;
    }
  }

  return response;
}