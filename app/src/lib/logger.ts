// ─────────────────────────────────────────────────────────────────────
// Dev-only logger (P2-9)
//
// 60+ raw console.log calls across the frontend leak admin-side debug
// info into production browsers and bloat third-party log forwarders.
// Wrap them in this lightweight gate so:
//   - DEV (vite serve)  → calls flow through to the browser console
//   - PROD (vite build) → all calls become no-ops at the source
//
// Note: errors still go through console.error in production so users
// can capture them via DevTools or a future Sentry integration.
// ─────────────────────────────────────────────────────────────────────

const isDev = import.meta.env.DEV;

const noop = () => {};

export const logger = {
  debug: isDev ? console.debug.bind(console) : noop,
  log: isDev ? console.log.bind(console) : noop,
  info: isDev ? console.info.bind(console) : noop,
  warn: isDev ? console.warn.bind(console) : noop,
  // Errors are kept on in production: they help users diagnose problems
  // via the browser DevTools and are essential for support tickets.
  error: console.error.bind(console),
};

export default logger;
