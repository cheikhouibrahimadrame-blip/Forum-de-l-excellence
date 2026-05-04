// ─────────────────────────────────────────────────────────────────────
// Safe post-login redirect helper (P2-2)
//
// `ProtectedRoute` stores the path the user tried to reach in
// `location.state.from`. After login we navigate there — but state is
// untrusted (it can come from `<Link state={{ from: '//evil' }}>` or a
// crafted bookmark), so we must validate before redirecting.
//
// Rules:
//   - must be a string
//   - must start with `/`
//   - must not be `//…` or `/\…`  (protocol-relative open redirect)
//   - must not point at an auth page (would re-loop to login or jump
//     into a forced password-change flow)
// Anything that fails falls back to the role's default route.
// ─────────────────────────────────────────────────────────────────────

const AUTH_PREFIXES = [
  '/login',
  '/change-password',
  '/forgot-password',
  '/reset-password',
];

export const isSafeFromPath = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  if (!value.startsWith('/')) return false;
  // protocol-relative URLs: //evil.com or /\evil.com
  if (value.startsWith('//')) return false;
  if (value.startsWith('/\\')) return false;
  return !AUTH_PREFIXES.some((prefix) => value === prefix || value.startsWith(prefix + '/') || value.startsWith(prefix + '?'));
};

export const safeFromPath = (value: unknown, fallback: string): string =>
  isSafeFromPath(value) ? value : fallback;
