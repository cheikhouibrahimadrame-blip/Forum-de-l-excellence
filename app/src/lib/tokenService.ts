// ─────────────────────────────────────────────────────────────────────
// Token service (P2-11)
//
// Stores the short-lived access token. Previously the value lived only
// in this module's closure → it was lost on every tab reload, forcing
// `/api/auth/refresh` before the first render. The result was a brief
// "logged out" flash and an avoidable round-trip on every page load.
//
// Trade-off chosen: sessionStorage (per-tab, cleared on tab close).
//   - Safer than localStorage (won't outlive the tab; no cross-tab leak).
//   - Restored synchronously on module init so the very first request
//     made by the app already carries the token.
//   - Refresh token still lives in an httpOnly cookie — XSS can NOT
//     escalate to a long-lived session.
// ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'fe.accessToken';

const safeReadStorage = (): string => {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return '';
    return window.sessionStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const safeWriteStorage = (token: string) => {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    if (token) {
      window.sessionStorage.setItem(STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Quota / private-mode failures are non-fatal — we keep working
    // off the in-memory copy.
  }
};

let accessToken = safeReadStorage();

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string) => {
  accessToken = token;
  safeWriteStorage(token);
};

export const clearAccessToken = () => {
  accessToken = '';
  safeWriteStorage('');
};
