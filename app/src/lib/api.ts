import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearAccessToken, getAccessToken, setAccessToken } from './tokenService';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5001';

export const AUTH_LOGOUT_EVENT = 'auth:logout';

type PendingRequest = {
  resolve: (token: string) => void;
  reject: (error: any) => void;
};

type RefreshState = {
  inFlight: Promise<string> | null;
  failedQueue: PendingRequest[];
};

const refreshState: RefreshState = {
  inFlight: null,
  failedQueue: []
};

/**
 * Process all failed requests in queue after successful refresh
 */
const processPendingRequests = (token: string) => {
  refreshState.failedQueue.forEach(prom => prom.resolve(token));
  refreshState.failedQueue = [];
};

/**
 * Reject all pending requests on refresh failure
 */
const rejectPendingRequests = (error: any) => {
  refreshState.failedQueue.forEach(prom => prom.reject(error));
  refreshState.failedQueue = [];
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  validateStatus: () => true, // Don't throw on any status
});

/**
 * Request Interceptor: Attach access token
 */
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response Interceptor: Handle 401, refresh tokens, retry request
 */
api.interceptors.response.use(
  (response) => {
    // Only return successful responses
    if (response.status < 400) {
      return response;
    }
    throw response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // If not 401, or already retried, reject
    if (status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    // If refresh endpoint itself failed, don't retry - logout directly
    if (originalRequest?.url?.includes('/api/auth/refresh')) {
      clearAccessToken();
      window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
      console.error('[AUTH] Refresh token endpoint failed - logging out');
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If no refresh in flight, start one
    if (!refreshState.inFlight) {
      console.log('[AUTH] Starting refresh token flow');
      
      refreshState.inFlight = api
        .post('/api/auth/refresh')
        .then((response) => {
          if (!response.data?.success || !response.data?.data?.accessToken) {
            throw new Error('Invalid refresh response: missing accessToken');
          }
          const newToken = response.data.data.accessToken as string;
          setAccessToken(newToken);
          processPendingRequests(newToken);
          console.log('[AUTH] Token refreshed successfully');
          return newToken;
        })
        .catch((refreshError) => {
          rejectPendingRequests(refreshError);
          clearAccessToken();
          console.error('[AUTH] Token refresh failed:', refreshError?.response?.status);
          window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
          throw refreshError;
        })
        .finally(() => {
          refreshState.inFlight = null;
        });
    } else {
      console.log('[AUTH] Refresh already in flight, queueing request');
    }

    // Queue this request or replay if refresh completes
    return new Promise((resolve, reject) => {
      refreshState.failedQueue.push({
        resolve: (token: string) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          api(originalRequest).then(resolve).catch(reject);
        },
        reject: (err) => reject(err)
      });

      // Wait for refresh to complete, then process queue
      refreshState.inFlight?.then(() => {
        const token = getAccessToken();
        if (token) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          api(originalRequest).then(resolve).catch(reject);
        } else {
          reject(new Error('No token available after refresh'));
        }
      }).catch(reject);
    });
  }
);

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
