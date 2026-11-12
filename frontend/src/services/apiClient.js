import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_STORAGE_KEY = 'veloop_auth_token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage write errors in restricted privacy modes.
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const reqUrl = error?.config?.url || '';
    const isAuthAttempt = reqUrl.includes('/auth/login') || reqUrl.includes('/auth/register');

    if (status === 401 && !isAuthAttempt) {
      setStoredToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('veloop:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Normalizes backend/network failures into user-safe messages without exposing
 * raw AxiosError or database internals.
 */
export function extractApiError(error, fallbackMessage = 'Unable to process your request. Please try again.') {
  if (error?.response?.data) {
    const data = error.response.data;
    return {
      status: error.response.status,
      code: data.code || 'API_ERROR',
      message: data.message || fallbackMessage,
      details: data.details || null,
      serverTime: data.serverTime || null,
    };
  }

  return {
    status: 0,
    code: 'NETWORK_ERROR',
    message: 'Unable to reach VELoop Rewards server. Please check your connection and try again.',
    details: null,
    serverTime: null,
  };
}

export default apiClient;

