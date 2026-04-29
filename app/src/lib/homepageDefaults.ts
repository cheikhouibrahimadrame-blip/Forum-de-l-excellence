// Shared homepage CMS schema + defaults.
// Used by:
//   - public HomePage (rendering, with safe fallbacks)
//   - AdminMainPage (editor)
//   - backend/src/controllers/homepageController.ts (default + persistence shape)
//
// IMPORTANT: keep this file backwards-compatible. Old persisted JSON may only
// contain { hero, stats, features, news, cta }. The HomePage and Admin must
// fall back to defaults for any missing section.

export type HomepageHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  videoSrc: string;
  posterSrc: string;
  trustItems: { id: string; icon: string; label: string }[];
  floatingCardTitle: string;
  floatingCardSubtitle: string;
  floatingCardCTAText: string;
  floatingCardCTALink: string;
  floatingCardFooterText: string;
};

export type HomepageMarqueeItem = { id: string; icon: string; label: string };

export type HomepageStat = { id: string; value: string; label: string };

export type HomepageFeature = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export type HomepagePlatformItem = {
  id: string;
  role: string;
  tag: string;
  icon: string;
  accent: 'student' | 'parent' | 'teacher' | 'admin';
  items: string[];
  linkLabel: string;
  linkTo: string;
};

export type HomepageBentoItem = {
  id: string;
  src: string;
  type: 'image' | 'video';
  alt: string;
  size: '1x1' | '2x1' | '1x2' | '2x2';
  caption: string;
};

export type HomepageNewsItem = {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  image?: string;
  featured?: boolean;
};

export type HomepageTestimonial = {
  id: string;
  quote: string;
  author: string;
  role: string;
  tint: string;
};

export type HomepageCTA = {
  eyebrow: string;
  title: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  badges: { id: string; icon: string; label: string }[];
};

export type HomepageSectionTitle = {
  eyebrow: string;
  titleLead: string;   // text before the gradient highlight
  titleAccent: string; // the gradient highlight portion
  titleTail: string;   // text after the gradient highlight (optional)
  description: string; // optional supporting paragraph
  ctaText: string;     // optional secondary "see all" link label
  ctaLink: string;
};

export type HomepageContent = {
  hero: HomepageHero;
  marquee: HomepageMarqueeItem[];
  statsSection: HomepageSectionTitle;
  stats: HomepageStat[];
  featuresSection: HomepageSectionTitle;
  features: HomepageFeature[];
  platformSection: HomepageSectionTitle;
  platform: HomepagePlatformItem[];
  bentoSection: HomepageSectionTitle;
  bento: HomepageBentoItem[];
  newsSection: HomepageSectionTitle;
  news: HomepageNewsItem[];
  testimonialsSection: HomepageSectionTitle;
  testimonials: HomepageTestimonial[];
  cta: HomepageCTA;
};

// ─────────────────────────────────────────────────────────────────
// Defaults (full content of the original hard-coded HomePage)
// ─────────────────────────────────────────────────────────────────
const uid = (p: string, i: number) => `${p}-${i + 1}`;

export const DEFAULT_HOMEPAGE: HomepageContent = {
  hero: {
    eyebrow: "Année académique 2025–2026 · Inscriptions ouvertes",
    title: "Forum de L'Excellence — là où l'enfance prend de la hauteur.",
    subtitle:
      "Un établissement primaire d'exception au cœur de Médinatoul Salam à Mbour. Excellence académique, bienveillance et plateforme numérique au service de chaque élève, parent et enseignant.",
    primaryButtonText: "Commencer l'Aventure",
    primaryButtonLink: "/admissions",
    secondaryButtonText: "Explorer nos Programmes",
    secondaryButtonLink: "/programs",
    videoSrc: "/excz.mp4",
    posterSrc: "/campus-hero.png",
    trustItems: [
      { id: 'trust-1', icon: 'MapPin', label: "Médinatoul Salam · Mbour" },
      { id: 'trust-2', icon: 'Clock', label: "Maternelle · CP · CE · CM" },
      { id: 'trust-3', icon: 'Trophy', label: "Direction M. & Mme Fall" },
    ],
    floatingCardTitle: "Forum de l'Excellence",
    floatingCardSubtitle: "École · Communauté · Plateforme",
    floatingCardCTAText: "Inscrire",
    floatingCardCTALink: "/admissions",
    floatingCardFooterText: "Rejoignez 600+ familles qui nous font confiance.",
  },

  marquee: [
    { id: 'mq-1', icon: 'Sparkles', label: "Excellence Académique" },
    { id: 'mq-2', icon: 'Heart', label: "Bienveillance & Discipline" },
    { id: 'mq-3', icon: 'Trophy', label: "95% de réussite au CFEE" },
    { id: 'mq-4', icon: 'Lightbulb', label: "Innovation pédagogique" },
    { id: 'mq-5', icon: 'Users', label: "Communauté Forum de l'Excellence" },
    { id: 'mq-6', icon: 'Compass', label: "Médinatoul Salam · Mbour" },
    { id: 'mq-7', icon: 'Star', label: "Depuis 2013" },
    { id: 'mq-8', icon: 'BookOpen', label: "Suivi numérique des élèves" },
  ],

  statsSection: {
    eyebrow: "· Notre Communauté en chiffres ·",
    titleLead: "",
    titleAccent: "Des chiffres qui racontent",
    titleTail: " une école vivante.",
    description: "",
    ctaText: "",
    ctaLink: "",
  },
  stats: [
    { id: 'stat-1', value: '600+', label: 'Élèves Inspirés' },
    { id: 'stat-2', value: '95%', label: 'Taux de Réussite' },
    { id: 'stat-3', value: '35', label: 'Éducateurs Passionnés' },
    { id: 'stat-4', value: '12', label: "Ans d'Excellence" },
  ],

  featuresSection: {
    eyebrow: "· Pourquoi nous choisir ·",
    titleLead: "Une école qui éveille,",
    titleAccent: "une plateforme qui accompagne.",
    titleTail: "",
    description:
      "Sous la direction de M. et Mme Fall, nous cultivons curiosité, autonomie et joie d'apprendre — de la maternelle au CM2 — soutenus par une plateforme numérique pour parents, élèves et enseignants.",
    ctaText: "",
    ctaLink: "",
  },
  features: [
    {
      id: 'feat-1', icon: 'GraduationCap', title: 'Pédagogie Distinguée',
      description: "Un cursus primaire fondé sur l'excellence : maîtrise de la lecture, écriture, mathématiques et éveil scientifique.",
    },
    {
      id: 'feat-2', icon: 'Users', title: "Corps Enseignant d'Élite",
      description: "Pédagogues certifiés et expérimentés, dédiés à l'épanouissement personnel et académique de chaque enfant.",
    },
    {
      id: 'feat-3', icon: 'BookOpen', title: "Apprendre par l'Expérience",
      description: "Ateliers créatifs, projets captivants et activités enrichissantes — chaque enfant grandit en s'épanouissant.",
    },
    {
      id: 'feat-4', icon: 'Shield', title: 'Sanctuaire Sécurisé',
      description: "Espaces lumineux, bibliothèque exhaustive, installations sportives complètes, environnement verdoyant et sûr.",
    },
  ],

  platformSection: {
    eyebrow: "· La plateforme ·",
    titleLead: "Un écosystème",
    titleAccent: "vivant",
    titleTail: " pour toute la communauté.",
    description:
      "Notes, devoirs, emplois du temps, comportement, rendez-vous, santé : chacun accède à son espace dédié. Une seule plateforme, quatre expériences sur mesure.",
    ctaText: "",
    ctaLink: "",
  },
  platform: [
    {
      id: 'plat-1', role: 'Élèves', tag: 'STUDENT', icon: 'Sparkles', accent: 'student',
      items: ['Notes & bulletins', 'Emploi du temps', 'Devoirs en ligne', 'Messagerie'],
      linkLabel: 'Se connecter', linkTo: '/login',
    },
    {
      id: 'plat-2', role: 'Parents', tag: 'PARENT', icon: 'Heart', accent: 'parent',
      items: ['Suivi quotidien', 'Présences', 'Rendez-vous', 'Santé & pickup'],
      linkLabel: 'Se connecter', linkTo: '/login',
    },
    {
      id: 'plat-3', role: 'Enseignants', tag: 'TEACHER', icon: 'BookOpen', accent: 'teacher',
      items: ['Saisie des notes', 'Cahier de textes', 'Présences', 'Messagerie classe'],
      linkLabel: 'Se connecter', linkTo: '/login',
    },
    {
      id: 'plat-4', role: 'Direction', tag: 'ADMIN', icon: 'Shield', accent: 'admin',
      items: ['Pilotage global', 'Inscriptions', 'Rapports', 'Paramétrage'],
      linkLabel: 'Se connecter', linkTo: '/login',
    },
  ],

  bentoSection: {
    eyebrow: "· La vie au Forum ·",
    titleLead: "Des journées",
    titleAccent: "qui débordent",
    titleTail: " de vie.",
    description: "",
    ctaText: "Tout voir",
    ctaLink: "/campus-life",
  },
  bento: [
    { id: 'bento-1', src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.33.jpeg', type: 'image', alt: 'Vie au Forum 1', size: '2x2', caption: "Cérémonie d'excellence" },
    { id: 'bento-2', src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.50.jpeg', type: 'image', alt: 'Vie au Forum 2', size: '1x1', caption: 'En classe' },
    { id: 'bento-3', src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.51.jpeg', type: 'image', alt: 'Vie au Forum 3', size: '1x1', caption: 'Activité collective' },
    { id: 'bento-4', src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.54.jpeg', type: 'image', alt: 'Vie au Forum 4', size: '2x1', caption: 'Moments forts' },
    { id: 'bento-5', src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.55.jpeg', type: 'image', alt: 'Vie au Forum 5', size: '1x1', caption: 'Réussites' },
    { id: 'bento-6', src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.55%20(1).jpeg', type: 'image', alt: 'Vie au Forum 6', size: '1x1', caption: 'Engagement' },
  ],

  newsSection: {
    eyebrow: "· Actualités ·",
    titleLead: "Ce qui",
    titleAccent: "se passe",
    titleTail: " chez nous.",
    description: "",
    ctaText: "Voir toutes les actualités",
    ctaLink: "/campus-life",
  },
  news: [
    {
      id: 'news-1', title: 'Kermesse solidaire 2025', date: '15 Mai 2025',
      excerpt: 'Les classes de CP à CM2 ont collecté des livres pour la bibliothèque de quartier — un élan de générosité partagé.',
      image: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.50.jpeg',
      featured: true,
    },
    {
      id: 'news-2', title: 'Nouvel espace de jeux', date: '20 Avril 2025',
      excerpt: "Ouverture d'une aire de jeux ombragée pour la maternelle et le cycle élémentaire, pensée pour la motricité.",
    },
    {
      id: 'news-3', title: 'Club Sciences en éveil', date: '02 Avril 2025',
      excerpt: "Lancement d'un nouveau club hebdomadaire mêlant expériences pratiques, robotique et curiosité scientifique.",
    },
  ],

  testimonialsSection: {
    eyebrow: "· Voix de la communauté ·",
    titleLead: "",
    titleAccent: "Ce qu'ils disent",
    titleTail: " du Forum.",
    description: "",
    ctaText: "",
    ctaLink: "",
  },
  testimonials: [
    {
      id: 'test-1',
      quote: "Mon enfant rentre chaque jour avec des étoiles dans les yeux. Le Forum a transformé son rapport à l'apprentissage.",
      author: "Aïssatou Diallo", role: "Maman de Mariama, CE2", tint: '#aac240',
    },
    {
      id: 'test-2',
      quote: "Une équipe à l'écoute, une plateforme qui me permet de suivre les progrès de mon fils en temps réel. Bravo !",
      author: "Moussa Sow", role: "Papa d'Ibrahima, CM1", tint: '#b8860c',
    },
    {
      id: 'test-3',
      quote: "L'outil enseignant fait gagner un temps précieux. On se concentre enfin sur la pédagogie, pas la paperasse.",
      author: "Mme Ndiaye", role: "Institutrice CP", tint: '#5d7d2e',
    },
  ],

  cta: {
    eyebrow: "Inscriptions 2025–2026 ouvertes",
    title: "Façonnez l'avenir de votre enfant",
    description:
      "Inscriptions ouvertes pour 2025-2026. Offrez à votre enfant une éducation d'exception, dans un environnement bienveillant, stimulant et sécurisé.",
    primaryButtonText: "Débuter l'Inscription",
    primaryButtonLink: "/admissions",
    secondaryButtonText: "Consulter nos Programmes",
    secondaryButtonLink: "/programs",
    badges: [
      { id: 'cta-b-1', icon: 'Shield', label: "Données protégées" },
      { id: 'cta-b-2', icon: 'Heart', label: "Suivi personnalisé" },
      { id: 'cta-b-3', icon: 'Award', label: "Excellence reconnue" },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────
// Merge helper: deep-merge a (possibly partial / legacy-shaped)
// payload from the API into the full DEFAULT shape so the UI can
// rely on every field always existing.
// ─────────────────────────────────────────────────────────────────
export function mergeHomepageContent(
  partial: Partial<HomepageContent> | null | undefined,
): HomepageContent {
  const safe: any = partial && typeof partial === 'object' ? partial : {};
  const merged: HomepageContent = {
    hero: { ...DEFAULT_HOMEPAGE.hero, ...(safe.hero || {}),
      trustItems: ensureArrayWithIds(safe.hero?.trustItems, DEFAULT_HOMEPAGE.hero.trustItems, 'trust'),
    },
    marquee: ensureArrayWithIds(safe.marquee, DEFAULT_HOMEPAGE.marquee, 'mq'),
    statsSection: { ...DEFAULT_HOMEPAGE.statsSection, ...(safe.statsSection || {}) },
    stats: ensureArrayWithIds(safe.stats, DEFAULT_HOMEPAGE.stats, 'stat'),
    featuresSection: { ...DEFAULT_HOMEPAGE.featuresSection, ...(safe.featuresSection || {}) },
    features: ensureArrayWithIds(safe.features, DEFAULT_HOMEPAGE.features, 'feat'),
    platformSection: { ...DEFAULT_HOMEPAGE.platformSection, ...(safe.platformSection || {}) },
    platform: ensureArrayWithIds(safe.platform, DEFAULT_HOMEPAGE.platform, 'plat'),
    bentoSection: { ...DEFAULT_HOMEPAGE.bentoSection, ...(safe.bentoSection || {}) },
    bento: ensureArrayWithIds(safe.bento, DEFAULT_HOMEPAGE.bento, 'bento'),
    newsSection: { ...DEFAULT_HOMEPAGE.newsSection, ...(safe.newsSection || {}) },
    news: ensureArrayWithIds(safe.news, DEFAULT_HOMEPAGE.news, 'news'),
    testimonialsSection: { ...DEFAULT_HOMEPAGE.testimonialsSection, ...(safe.testimonialsSection || {}) },
    testimonials: ensureArrayWithIds(safe.testimonials, DEFAULT_HOMEPAGE.testimonials, 'test'),
    cta: { ...DEFAULT_HOMEPAGE.cta, ...(safe.cta || {}),
      badges: ensureArrayWithIds(safe.cta?.badges, DEFAULT_HOMEPAGE.cta.badges, 'cta-b'),
    },
  };
  return merged;
}

function ensureArrayWithIds<T extends { id?: string }>(
  value: any,
  fallback: T[],
  prefix: string,
): T[] {
  if (!Array.isArray(value)) return fallback;
  return value.map((item, i) => ({
    ...item,
    id: item?.id || uid(prefix, i),
  })) as T[];
}

// Curated icon list for selectors (lucide-react names only)
export const HOMEPAGE_ICON_OPTIONS = [
  'GraduationCap', 'Users', 'BookOpen', 'Award', 'Shield', 'Heart', 'Sparkles',
  'Lightbulb', 'Trophy', 'Star', 'Calendar', 'Clock', 'MapPin', 'Compass',
  'PlayCircle', 'ArrowRight', 'ChevronRight', 'Quote', 'GalleryHorizontalEnd',
  'Phone', 'Mail', 'School', 'Leaf', 'Music', 'Palette', 'Camera', 'Bus',
  'ShieldCheck', 'CheckCircle', 'Target', 'Zap', 'UserPlus', 'FileText',
];

export const PLATFORM_ACCENT_OPTIONS: HomepagePlatformItem['accent'][] = [
  'student', 'parent', 'teacher', 'admin',
];

export const BENTO_SIZE_OPTIONS: HomepageBentoItem['size'][] = [
  '1x1', '2x1', '1x2', '2x2',
];
