# 🌙 Dark Mode Fix + OAK Redesign — Unified Plan

## 🔍 Root Cause Analysis

### The Bug
In dark mode, **white text sits on white/light backgrounds**, making it invisible (see screenshot: AdminYears page).

### Why It Happens — TWO competing theming systems

The app has **two conflicting approaches** to dark mode:

#### System A: CSS Custom Properties (index.css)
```css
:root {
  --color-surface-2: #ffffff;  /* light */
  --color-text: #1a1916;       /* dark text */
}
.dark {
  --color-surface-2: #1d1f23;  /* dark */
  --color-text: #e8e6e1;       /* light text */
}
```
Used by: `DashboardLayout`, `AdminDashboard`, `StudentDashboard`, and all components using CSS classes like `.card`, `.topbar`, `.sidebar`

✅ **This system works correctly** — when `.dark` is on `<html>`, variables flip automatically.

#### System B: Hardcoded Tailwind Classes (individual pages)
```tsx
// AdminYears.tsx line 298:
className="bg-white dark:bg-gray-800 rounded-lg border-2 ..."

// AdminYears.tsx line 251:
className="bg-gradient-to-r from-primary-navy to-blue-800 ..."
```
Used by: **25 dashboard sub-pages** (see full list below)

⚠️ **This system has TWO problems:**
1. `bg-white` stays white because Tailwind's `dark:` prefix requires `darkMode: ["class"]` in tailwind.config — **which IS configured**, BUT...
2. Many elements use `bg-white` WITHOUT a corresponding `dark:bg-xxx` variant
3. Some use `bg-gray-50`, `border-red-200`, `bg-red-50` without dark variants
4. Some text uses `text-gray-900` without matching `dark:text-white`
5. Tailwind utility classes like `bg-primary-navy` aren't defined in tailwind config (they don't exist as utility classes)

### The Real Fix
**Replace ALL hardcoded Tailwind color classes with CSS variable-based classes** that auto-adapt to dark mode. This eliminates System B entirely and unifies everything under System A.

---

## 📋 Affected Files (25 dashboard pages)

### Admin Pages (11 files)
| File | Issue Count | Severity |
|------|------------|----------|
| `AdminYears.tsx` | 🔴 **Heavy** — `bg-white`, `text-gray-900`, `bg-gray-50`, `bg-primary-navy` | Critical |
| `AdminUsers.tsx` | 🔴 **Heavy** — same patterns | Critical |
| `AdminSubjects.tsx` | 🔴 **Heavy** | Critical |
| `AdminClasses.tsx` | 🔴 **Heavy** | Critical |
| `AdminReports.tsx` | 🟡 Medium | High |
| `AdminMainPage.tsx` | 🟡 Medium | High |
| `AdminAttendance.tsx` | 🟡 Medium | High |
| `AdminBehavior.tsx` | 🟡 Medium | High |
| `AdminPickup.tsx` | 🟡 Medium | High |
| `AdminDashboard.tsx` | 🟢 Light — mostly uses CSS vars already | Medium |
| `AdminSettings.tsx` | Need to check | Unknown |

### Teacher Pages (5 files)
| File | Issue Count |
|------|------------|
| `TeacherLessons.tsx` | 🔴 **Heavy** — 25+ hardcoded colors |
| `TeacherAttendance.tsx` | 🔴 **Heavy** — 15+ hardcoded colors |
| `TeacherMessages.tsx` | 🟡 Medium |
| `TeacherHomework.tsx` | 🟡 Medium |
| `TeacherBehavior.tsx` | 🟡 Medium |

### Student Pages (6 files)
| File | Issue Count |
|------|------------|
| `StudentSubjects.tsx` | 🔴 **Heavy** |
| `StudentLessons.tsx` | 🟡 Medium |
| `StudentMessages.tsx` | 🟡 Medium |
| `StudentHomework.tsx` | 🟡 Medium |
| `StudentBehavior.tsx` | 🟡 Medium |
| `StudentReportCards.tsx` | 🟡 Medium |

### Parent Pages (6 files)
| File | Issue Count |
|------|------------|
| `ParentAttendance.tsx` | 🟡 Medium |
| `ParentBehavior.tsx` | 🟡 Medium |
| `ParentHealth.tsx` | 🟡 Medium |
| `ParentHomework.tsx` | 🟡 Medium |
| `ParentMessages.tsx` | 🟡 Medium |
| `ParentPickup.tsx` | 🟡 Medium |

---

## 🛠️ The Fix Strategy

### Step 1: Add Global CSS Override Rules (index.css)

Add a **dark mode override layer** at the bottom of `index.css` that catches ALL hardcoded Tailwind white backgrounds and forces them to use CSS variables. This is the "safety net" approach:

```css
/* ── DARK MODE SAFETY NET ── */
/* Forces all hardcoded bg-white / bg-gray-50 etc. to respect dark mode */
.dark .bg-white,
.dark .bg-gray-50 {
  background-color: var(--color-surface-2) !important;
}

.dark .text-gray-900 {
  color: var(--color-text) !important;
}

.dark .text-gray-600,
.dark .text-gray-500 {
  color: var(--color-text-muted) !important;
}

.dark .text-gray-700,
.dark .text-gray-400,
.dark .text-gray-300 {
  color: var(--color-text-muted) !important;
}

.dark .border-gray-200,
.dark .border-gray-300 {
  border-color: var(--color-border) !important;
}

.dark .border-gray-100 {
  border-color: var(--color-divider) !important;
}

.dark .bg-gray-100,
.dark .bg-gray-200 {
  background-color: var(--color-surface-offset) !important;
}

.dark .bg-red-50 {
  background-color: var(--color-error-bg) !important;
}

.dark .border-red-200 {
  border-color: color-mix(in oklch, var(--color-error) 30%, transparent) !important;
}

.dark .text-red-700 {
  color: var(--color-error) !important;
}

.dark .hover\:bg-gray-50:hover,
.dark .hover\:bg-gray-100:hover {
  background-color: var(--color-surface-offset) !important;
}

.dark .hover\:bg-blue-50:hover {
  background-color: var(--color-info-bg) !important;
}

.dark .hover\:bg-red-50:hover {
  background-color: var(--color-error-bg) !important;
}

/* Fix non-existent Tailwind utilities */
.bg-primary-navy {
  background-color: var(--color-primary);
}
.dark .bg-primary-navy {
  background-color: var(--color-primary);
}
.hover\:bg-primary-navy\/90:hover {
  background-color: var(--color-primary-hover);
}
.text-primary-navy {
  color: var(--color-primary);
}
.from-primary-navy {
  --tw-gradient-from: var(--color-primary);
}
.focus\:ring-primary-navy:focus {
  --tw-ring-color: var(--color-primary);
}
.dark .focus\:ring-primary-gold:focus {
  --tw-ring-color: var(--color-gold);
}
.from-primary-gold {
  --tw-gradient-from: var(--color-gold);
}
```

> [!IMPORTANT]
> This CSS safety net catches 90% of dark mode issues instantly without touching any TSX file. It maps all hardcoded Tailwind grays to our CSS variable system.

### Step 2: Fix the Gradient Banner (AdminYears line 251)

The gradient card `from-primary-navy to-blue-800` doesn't exist as Tailwind utilities. Fix with inline style:

```tsx
// Before:
className="bg-gradient-to-r from-primary-navy to-blue-800 dark:from-primary-gold dark:to-yellow-600 text-white p-6 rounded-lg mb-6"

// After:
className="text-white p-6 rounded-lg mb-6"
style={{ background: 'linear-gradient(to right, var(--color-primary), #3a6fa4)' }}
```

### Step 3: Merge with OAK Redesign

When implementing the OAK redesign from the other plan, ALL new code will use **only CSS variables** — no more `bg-white`, `text-gray-900`, etc. The OAK CSS variables replace the current ones:

```css
:root {
  --color-bg: #F2F5EE;           /* sage-tinted background */
  --color-surface: #FAFAF8;
  --color-surface-2: #FFFFFF;
  --color-primary: #AAC240;       /* OAK olive green */
  --color-gold: #FFE2AD;          /* OAK warm peach */
  /* ... etc */
}
.dark {
  --color-bg: #111214;
  --color-surface-2: #1d1f23;
  --color-primary: #c4d66a;       /* lighter olive for dark mode */
  /* ... etc — ALL colors auto-adapt */
}
```

---

## ⚡ Execution Plan

### Phase 1: CSS Safety Net (IMMEDIATE FIX — 5 minutes)
**Tool**: `replace_file_content` on `index.css`  
**What**: Append the dark mode override rules at the bottom of `index.css`  
**Result**: Fixes ~90% of dark mode issues across all 25 pages instantly

### Phase 2: Fix Non-existent Utilities (IMMEDIATE — 2 minutes)
**Tool**: `replace_file_content` on `index.css`  
**What**: Add `.bg-primary-navy`, `.from-primary-navy` etc. as real CSS classes  
**Result**: Gradient banners and primary-navy buttons start working

### Phase 3: OAK Design System Overhaul (from other plan)
**Tool**: `multi_replace_file_content` on `index.css`  
**What**: Replace all `:root` color tokens with OAK palette  
**Result**: Entire app recolors to OAK olive/sage theme

### Phase 4: Dashboard Page Rewrites (from other plan)
**Tool**: `write_to_file` on 4 dashboard files  
**What**: Rewrite Admin/Student/Teacher/Parent dashboards with OAK visual language  
**Result**: All new code uses CSS vars only — zero hardcoded colors

### Phase 5: Gradual Sub-page Migration (OPTIONAL — can do later)
For each of the 25 sub-pages, replace:
- `bg-white dark:bg-gray-800` → `style={{ background: 'var(--color-surface-2)' }}`
- `text-gray-900 dark:text-white` → `style={{ color: 'var(--color-text)' }}`
- `border-gray-200 dark:border-gray-700` → `style={{ borderColor: 'var(--color-border)' }}`

> [!TIP]
> Phase 5 is optional because Phase 1's CSS safety net already catches these. But migrating to CSS vars makes code cleaner long-term.

---

## 📊 Summary

| Phase | Effort | Impact | Priority |
|-------|--------|--------|----------|
| Phase 1: CSS Safety Net | 5 min | Fixes 90% of dark mode bugs | 🔴 Do first |
| Phase 2: Missing utilities | 2 min | Fixes gradient banners | 🔴 Do first |
| Phase 3: OAK colors | 15 min | New color palette | 🟡 Part of redesign |
| Phase 4: Dashboard rewrites | 2-3 hrs | Full OAK visual | 🟡 Part of redesign |
| Phase 5: Sub-page migration | 2-3 hrs | Code quality | 🟢 Later |

**Phases 1+2 can be done RIGHT NOW and will fix the dark mode bug you're seeing.** Shall I execute?
