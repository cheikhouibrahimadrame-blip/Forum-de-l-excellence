// ─────────────────────────────────────────────────────────────────────
// Topbar title matcher (P2-7)
//
// Picks the navigation item whose href best matches `pathname`. Used to
// keep `/admin/users/123` showing "Utilisateurs" instead of falling
// back to the dashboard label.
//
// Rules:
//   1. Exact match always wins.
//   2. Otherwise prefer the longest prefix that matches a full path
//      segment (`/admin/users` matches `/admin/users/42` but NEVER
//      `/admin/users-archive` — the trailing `/` is required).
//   3. If nothing matches, return `fallback` (typically the dashboard
//      title).
// ─────────────────────────────────────────────────────────────────────

export interface PageNavItem {
  name: string;
  href: string;
}

export const pickCurrentPageName = (
  items: ReadonlyArray<PageNavItem>,
  pathname: string,
  fallback: string,
): string => {
  let best: { name: string; len: number } | null = null;
  for (const item of items) {
    const isExact = item.href === pathname;
    const isSegmentPrefix = pathname.startsWith(item.href + '/');
    if (!isExact && !isSegmentPrefix) continue;
    if (!best || item.href.length > best.len) {
      best = { name: item.name, len: item.href.length };
    }
  }
  return best?.name ?? fallback;
};
