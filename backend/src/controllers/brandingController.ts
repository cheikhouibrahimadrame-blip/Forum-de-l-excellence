import { Request, Response } from 'express';
import logger from '../utils/logger';
import { loadJsonStore, saveJsonStore } from '../lib/jsonStore';

const BRANDING_FILE = 'branding-settings.json';

// ─────────────────────────────────────────────────────────────────
// Branding schema — single source of truth for site-wide identity:
// - layout-level (logo, navigation, footer, social links)
// - school info (name, address, principal, …)
// - hero banners shared by all dashboards
// - PDF / email branding text
// All editable via the admin "Identité du site" page.
// ─────────────────────────────────────────────────────────────────
export interface BrandingContent {
  brand: {
    name: string;             // "Forum de L'excellence"
    shortName: string;        // header sub-line e.g. "College Privé"
    tagline: string;          // sidebar subtitle
    logoUrl: string;          // /logo.jpeg
    heroBannerUrl: string;    // /campus-hero.png — 4 dashboards
    aboutText: string;        // footer About paragraph
    address: string;
    phone: string;
    email: string;
    website: string;
    principal: string;
    year: string;             // "2025-2026"
    foundersText: string;     // "Fondé par M. et Mme Fall"
    copyrightText: string;    // overrides default "© {year} {name}…"
    pdfFooterText: string;    // "Forum de L'excellence - Système de Gestion Académique"
  };
  navigation: { id: string; name: string; href: string }[];   // header nav (public)
  quickLinks: { id: string; name: string; href: string }[];   // footer quick-links
  socialLinks: {
    id: string;
    label: string;            // "Facebook", "Instagram", …
    icon: string;             // lucide icon name
    href: string;             // full URL
  }[];
  loginNotice: string;        // text shown below the login form
  authSubtitle: string;       // text under the AuthLayout logo
}

const defaultBranding: BrandingContent = {
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
  socialLinks: [
    // Empty by default — admin fills these in via the editor.
    // Examples: { id: 'sl-1', label: 'Facebook', icon: 'Facebook', href: 'https://facebook.com/…' }
  ],
  loginNotice:
    "Les comptes sont créés uniquement par l'admin. Contactez l'administration si vous n'avez pas reçu vos accès.",
  authSubtitle: "Collège Privé - M. et Mme Fall",
};

// Deep-merge persisted JSON over defaults so adding new fields later never
// breaks an existing file.
function mergeBranding(persisted: any): BrandingContent {
  const out: BrandingContent = JSON.parse(JSON.stringify(defaultBranding));
  if (!persisted || typeof persisted !== 'object') return out;

  if (persisted.brand && typeof persisted.brand === 'object') {
    out.brand = { ...out.brand, ...persisted.brand };
  }
  if (Array.isArray(persisted.navigation)) {
    out.navigation = persisted.navigation.filter((x: any) => x && typeof x === 'object');
  }
  if (Array.isArray(persisted.quickLinks)) {
    out.quickLinks = persisted.quickLinks.filter((x: any) => x && typeof x === 'object');
  }
  if (Array.isArray(persisted.socialLinks)) {
    out.socialLinks = persisted.socialLinks.filter((x: any) => x && typeof x === 'object');
  }
  if (typeof persisted.loginNotice === 'string') out.loginNotice = persisted.loginNotice;
  if (typeof persisted.authSubtitle === 'string') out.authSubtitle = persisted.authSubtitle;

  return out;
}

let brandingContent: BrandingContent = mergeBranding(
  loadJsonStore<any>(BRANDING_FILE, defaultBranding),
);

const persistBrandingContent = () => {
  saveJsonStore(BRANDING_FILE, brandingContent);
};

// ── GET /api/settings/branding (public) ────────────────────────
export const getBrandingContent = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, data: brandingContent });
  } catch (error) {
    logger.error({ error }, 'Error fetching branding content:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ── POST /api/settings/branding (admin only) ───────────────────
export const updateBrandingContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const content = req.body;
    if (!content || typeof content !== 'object') {
      res.status(400).json({ success: false, error: 'Contenu invalide.' });
      return;
    }

    brandingContent = mergeBranding(content);
    persistBrandingContent();

    res.json({
      success: true,
      message: 'Identité du site mise à jour avec succès',
      data: brandingContent,
    });
  } catch (error) {
    logger.error({ error }, 'Error updating branding content:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ── Internal helpers used by other modules (P1-2 single-source) ─────
//
// Branding is the canonical source for identity fields shared with the
// "Informations Générales" tab (name, address, phone, …). These helpers
// let `/api/settings/general` and `/api/settings/appearance` read/write
// the same JSON store without going through HTTP.
export const getBrandingState = (): BrandingContent => brandingContent;

export const patchBrandingBrand = (
  patch: Partial<BrandingContent['brand']>
): BrandingContent => {
  brandingContent = {
    ...brandingContent,
    brand: { ...brandingContent.brand, ...patch }
  };
  persistBrandingContent();
  return brandingContent;
};
