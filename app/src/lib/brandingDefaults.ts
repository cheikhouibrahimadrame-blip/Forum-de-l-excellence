// ─────────────────────────────────────────────────────────────────
// Branding — site-wide identity (logo, navigation, footer, socials)
// served by GET /api/settings/branding (public).
//
// This is the *single source of truth* consumed by:
// - PublicLayout (header + footer)
// - AuthLayout (logo + tagline + login notice)
// - DashboardLayout (sidebar logo + tagline)
// - All four dashboard hero banners
// - PDF exports (footer text)
// ─────────────────────────────────────────────────────────────────

export interface BrandLink {
  id: string;
  name: string;
  href: string;
}

export interface BrandSocialLink {
  id: string;
  label: string;   // "Facebook" / "Instagram" / "WhatsApp" …
  icon: string;    // lucide icon name (Facebook, Instagram, …)
  href: string;
}

export interface BrandIdentity {
  name: string;
  shortName: string;
  tagline: string;
  logoUrl: string;
  heroBannerUrl: string;
  aboutText: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  principal: string;
  year: string;
  foundersText: string;
  copyrightText: string;
  pdfFooterText: string;
}

export interface BrandingContent {
  brand: BrandIdentity;
  navigation: BrandLink[];
  quickLinks: BrandLink[];
  socialLinks: BrandSocialLink[];
  loginNotice: string;
  authSubtitle: string;
}

export const DEFAULT_BRANDING: BrandingContent = {
  brand: {
    name: "Forum de L'excellence",
    shortName: "Collège Privé",
    tagline: "FORUM-EXCELLENCE Dashboard",
    logoUrl: "/logo.jpeg",
    heroBannerUrl: "/campus-hero.png",
    aboutText:
      "Le Forum de L'excellence est un établissement d'enseignement privé dédié à la formation académique de haute qualité, dirigé par M. et Mme Fall.",
    address: "Médinatoul Salam, Mbour, Sénégal",
    phone: "+221 775368254",
    email: "gsforumexcellence@gmail.com",
    website: "www.forumexcellence.sn",
    principal: "M. et Mme Fall",
    year: "2025-2026",
    foundersText: "Fondé par M. et Mme Fall",
    copyrightText: "",
    pdfFooterText: "Forum de L'excellence - Système de Gestion Académique",
  },
  navigation: [
    { id: 'nav-1', name: 'Accueil',       href: '/' },
    { id: 'nav-2', name: 'Programmes',    href: '/programs' },
    { id: 'nav-3', name: 'Admissions',    href: '/admissions' },
    { id: 'nav-4', name: 'Vie du Campus', href: '/campus-life' },
  ],
  quickLinks: [
    { id: 'ql-1', name: 'Nos Programmes', href: '/programs' },
    { id: 'ql-2', name: 'Admissions',     href: '/admissions' },
    { id: 'ql-3', name: 'Vie du Campus',  href: '/campus-life' },
  ],
  socialLinks: [],
  loginNotice:
    "Les comptes sont créés uniquement par l'admin. Contactez l'administration si vous n'avez pas reçu vos accès.",
  authSubtitle: "Collège Privé - M. et Mme Fall",
};

export function mergeBrandingContent(
  payload: Partial<BrandingContent> | null | undefined,
): BrandingContent {
  const safe: any = payload && typeof payload === 'object' ? payload : {};
  return {
    brand: { ...DEFAULT_BRANDING.brand, ...(safe.brand || {}) },
    navigation: Array.isArray(safe.navigation) && safe.navigation.length > 0
      ? safe.navigation
      : DEFAULT_BRANDING.navigation,
    quickLinks: Array.isArray(safe.quickLinks)
      ? safe.quickLinks
      : DEFAULT_BRANDING.quickLinks,
    socialLinks: Array.isArray(safe.socialLinks)
      ? safe.socialLinks
      : DEFAULT_BRANDING.socialLinks,
    loginNotice: typeof safe.loginNotice === 'string' && safe.loginNotice
      ? safe.loginNotice
      : DEFAULT_BRANDING.loginNotice,
    authSubtitle: typeof safe.authSubtitle === 'string' && safe.authSubtitle
      ? safe.authSubtitle
      : DEFAULT_BRANDING.authSubtitle,
  };
}

// Icon options proposed in the admin editor for nav/quickLinks/social-links.
export const BRANDING_SOCIAL_ICON_OPTIONS = [
  'Facebook', 'Instagram', 'Twitter', 'Youtube', 'Linkedin',
  'MessageCircle', 'Phone', 'Mail', 'Globe', 'Send', 'MapPin',
];
