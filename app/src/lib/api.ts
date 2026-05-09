import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearAccessToken, getAccessToken, setAccessToken } from './tokenService';
import { logger } from './logger';
import { API } from './apiRoutes';

// Resolution order:
//   1. Explicit VITE_API_BASE_URL (including "" → use same-origin via Vite proxy)
//   2. Legacy VITE_API_URL
//   3. Dev default → same-origin relative URLs so mobile devices / emulators
//      reaching the Vite dev server on the LAN can hit `/api/...` transparently
//      through Vite's proxy (avoids the trap where `localhost:5001` means the
//      *device's* localhost, not the host PC's).
//   4. Prod default → explicit absolute URL so static builds keep working.
const envBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.VITE_API_URL as string | undefined);

export const API_BASE_URL =
  envBaseUrl !== undefined
    ? envBaseUrl
    : (import.meta.env.DEV ? '' : 'http://localhost:5001');

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
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // Normalize express-validator errors: responses shaped like
    // `{ success: false, errors: [{ msg, param, ... }, ...] }`
    // do not expose a single readable `.error` field, so every catch that
    // reads `err.response?.data?.error` sees `undefined` and falls back
    // to the generic axios message. Synthesize `.error` from the first
    // validator message so the UI can show the real French reason.
    const data: any = error.response?.data;
    if (data && typeof data === 'object' && !data.error && Array.isArray(data.errors) && data.errors.length > 0) {
      const messages = data.errors
        .map((e: any) => e?.msg || e?.message)
        .filter(Boolean);
      if (messages.length > 0) {
        data.error = messages.length === 1 ? messages[0] : messages.join(' • ');
      }
    }

    // If not 401, or already retried, reject
    if (status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    // If refresh endpoint itself failed, don't retry - logout directly
    if (originalRequest?.url?.includes(API.AUTH_REFRESH)) {
      clearAccessToken();
      window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
      console.error('[AUTH] Refresh token endpoint failed - logging out');
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If no refresh in flight, start one
    if (!refreshState.inFlight) {
      logger.log('[AUTH] Starting refresh token flow');
      
      refreshState.inFlight = api
        .post(API.AUTH_REFRESH)
        .then((response) => {
          if (!response.data?.success || !response.data?.data?.accessToken) {
            throw new Error('Invalid refresh response: missing accessToken');
          }
          const newToken = response.data.data.accessToken as string;
          setAccessToken(newToken);
          processPendingRequests(newToken);
          logger.log('[AUTH] Token refreshed successfully');
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
      logger.log('[AUTH] Refresh already in flight, queueing request');
    }

    // Queue this request and replay it once refresh succeeds
    return new Promise((resolve, reject) => {
      refreshState.failedQueue.push({
        resolve: (token: string) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          api(originalRequest).then(resolve).catch(reject);
        },
        reject: (err) => reject(err)
      });
    });
  }
);

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
