// Shared CMS schema + defaults for /programs, /campus-life, /admissions.
//
// The backend persists ONE blob (`pages-content.json`) keyed by page id; we
// merge any partial / legacy payload over the full default shape so adding
// new sections later never breaks existing JSON.
//
// Types and defaults exported here are used by:
//   - public pages (rendering, with safe fallbacks)
//   - admin editors (full CRUD)
//   - backend/src/controllers/pagesController.ts (default + merge logic)

import type { HomepageSectionTitle } from './homepageDefaults';

// Re-export for convenience; the same SectionHeader pattern (eyebrow + 3-part
// title + optional description + optional CTA) is reused everywhere.
export type SectionHeading = HomepageSectionTitle;

// ─────────────────────────────────────────────────────────────────
// Common: hero shape shared by Programs / Campus / Admissions
// ─────────────────────────────────────────────────────────────────
export type PageHero = {
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
};

export type PageMarqueeItem = { id: string; icon: string; label: string };

export type PageCTA = {
  eyebrow: string;
  title: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  badges: { id: string; icon: string; label: string }[];
};

// ─────────────────────────────────────────────────────────────────
// Programs page
// ─────────────────────────────────────────────────────────────────
export type ProgramItem = {
  id: string;
  icon: string;
  title: string;
  department: string;
  level: string;
  duration: string;
  description: string;
  features: string[];
  credits: number;
  // ── Detailed fields (used by ProgramDetailPage). Optional so legacy
  //    JSON without them keeps working; defaults fill them in.
  objectives?: string[];
  curriculum?: string[];
  teachingApproach?: string;
  enrollment?: string;
  price?: string;
};

export type ProgramsContent = {
  hero: PageHero;
  marquee: PageMarqueeItem[];
  filters: {
    departments: string[]; // dropdown choices
    levels: string[];
  };
  programsSection: SectionHeading;
  programs: ProgramItem[];
  cta: PageCTA;
};

// ─────────────────────────────────────────────────────────────────
// Campus Life page
// ─────────────────────────────────────────────────────────────────
export type CampusGalleryItem = {
  id: string;
  src: string;
  alt: string;
  type: 'image' | 'video';
};

export type CampusOrganization = {
  id: string;
  icon: string;
  name: string;
  description: string;
  members: string;
};

export type CampusEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
};

export type CampusFacility = {
  id: string;
  name: string;
  description: string;
  features: string[];
};

export type CampusService = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export type CampusLifeContent = {
  hero: PageHero;
  marquee: PageMarqueeItem[];
  gallerySection: SectionHeading;
  gallery: CampusGalleryItem[];
  organizationsSection: SectionHeading;
  organizations: CampusOrganization[];
  eventsSection: SectionHeading;
  events: CampusEvent[];
  facilitiesSection: SectionHeading;
  facilities: CampusFacility[];
  servicesSection: SectionHeading;
  services: CampusService[];
  cta: PageCTA;
};

// ─────────────────────────────────────────────────────────────────
// Admissions page
// ─────────────────────────────────────────────────────────────────
export type AdmissionStep = {
  id: string;
  icon: string;
  title: string;
  description: string;
  details: string[];
};

export type AdmissionRequirement = {
  id: string;
  level: string;
  requirements: string[];
};

export type AdmissionDeadline = {
  id: string;
  phase: string;
  date: string;
  status: string; // free text but typically "En cours" / "À venir" / "Terminé"
};

export type AdmissionFAQ = {
  id: string;
  question: string;
  answer: string;
};

export type AdmissionsContent = {
  hero: PageHero;
  marquee: PageMarqueeItem[];
  stepsSection: SectionHeading;
  steps: AdmissionStep[];
  requirementsSection: SectionHeading;
  requirements: AdmissionRequirement[];
  deadlinesSection: SectionHeading;
  deadlines: AdmissionDeadline[];
  contactSection: {
    eyebrow: string;
    title: string;
    description: string;
    items: { id: string; icon: string; label: string; value: string }[];
  };
  faqSection: SectionHeading;
  faqs: AdmissionFAQ[];
  cta: PageCTA;
};

// ─────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────

export const DEFAULT_PROGRAMS: ProgramsContent = {
  hero: {
    eyebrow: "Année académique 2025–2026 · Formation complète",
    title: "Nos Programmes pédagogiques",
    subtitle: "Découvrez nos cursus de la maternelle au CM2, conçus pour révéler le potentiel de chaque enfant.",
    primaryButtonText: "Explorer les programmes",
    primaryButtonLink: "#filters",
    secondaryButtonText: "Nous contacter",
    secondaryButtonLink: "/admissions#contact",
    videoSrc: "/excz.mp4",
    posterSrc: "/programs-hero.jpg",
    trustItems: [
      { id: 'pp-trust-1', icon: 'MapPin', label: "Médinatoul Salam · Mbour" },
      { id: 'pp-trust-2', icon: 'Users', label: "Maternelle · CP · CE · CM" },
      { id: 'pp-trust-3', icon: 'Trophy', label: "Excellence académique" },
    ],
  },
  marquee: [
    { id: 'pmq-1', icon: 'GraduationCap', label: "Maternelle 3-5 ans" },
    { id: 'pmq-2', icon: 'BookOpen', label: "Élémentaire 6-11 ans" },
    { id: 'pmq-3', icon: 'Award', label: "Excellence académique" },
    { id: 'pmq-4', icon: 'Users', label: "Petits effectifs" },
    { id: 'pmq-5', icon: 'Lightbulb', label: "Pédagogie innovante" },
    { id: 'pmq-6', icon: 'Sparkles', label: "Forum de l'Excellence" },
  ],
  filters: {
    departments: ['Maternelle', 'Élémentaire', 'Soutien & Enrichissement'],
    levels: ['Maternelle', 'Élémentaire', 'Soutien'],
  },
  programsSection: {
    eyebrow: "Nos formations",
    titleLead: "Programmes",
    titleAccent: "pédagogiques",
    titleTail: "",
    description: "",
    ctaText: "",
    ctaLink: "",
  },
  programs: [
    {
      id: 'prog-1', icon: 'GraduationCap', title: 'Maternelle - Petite et Moyenne Section',
      department: 'Maternelle', level: 'Maternelle', duration: '1 an par section', credits: 20,
      description: "Éveil sensoriel, motricité, langage oral et premiers repères logiques dans un cadre sécurisant.",
      features: ['Ateliers autonomes', 'Parcours motricité', 'Chansons et contes'],
      objectives: [
        "Développer la confiance en soi et l'autonomie",
        "Renforcer la motricité fine et globale",
        "Initier à la communication orale",
        "Découvrir les mathématiques de manière ludique",
      ],
      curriculum: [
        "Langage et communication",
        "Éducation physique et sportive",
        "Découverte du monde",
        "Activités créatives et artistiques",
      ],
      teachingApproach: "Notre approche pédagogique privilégie le jeu comme mode d'apprentissage principal. Les enfants découvrent le monde à travers des expériences sensorielles et des activités collaboratives, dans un environnement bienveillant et stimulant.",
      enrollment: "Les inscriptions se font en septembre. Veuillez contacter le secrétariat pour les modalités d'admission.",
      price: "Consultez notre barème des frais de scolarité",
    },
    {
      id: 'prog-2', icon: 'GraduationCap', title: 'Maternelle - Grande Section',
      department: 'Maternelle', level: 'Maternelle', duration: '1 an', credits: 22,
      description: "Pré-lecture, pré-écriture et premières notions mathématiques pour préparer l'entrée en CP.",
      features: ['Graphisme', 'Phonologie', 'Jeux mathématiques'],
      objectives: [
        "Préparer l'entrée à la lecture et à l'écriture",
        "Consolider les apprentissages mathématiques",
        "Développer l'esprit critique et la curiosité",
        "Renforcer les compétences sociales",
      ],
      curriculum: [
        "Français - Pré-lecture et graphisme",
        "Mathématiques",
        "Éducation physique",
        "Arts plastiques et musique",
      ],
      teachingApproach: "En Grande Section, nous progressons vers des apprentissages plus structurés tout en maintenant une approche ludique. Les enfants commencent à développer des méthodes de travail qui les prépareront à l'école élémentaire.",
      enrollment: "Les inscriptions se font en septembre. Veuillez contacter le secrétariat pour les modalités d'admission.",
      price: "Consultez notre barème des frais de scolarité",
    },
    {
      id: 'prog-3', icon: 'BookOpen', title: 'Cycle 1 : CI - CP',
      department: 'Élémentaire', level: 'Élémentaire', duration: '2 ans', credits: 25,
      description: "Lecture fluide, écriture cursive, construction du nombre et découverte du monde.",
      features: ['Lecture quotidienne', 'Manipulation en maths', 'Découverte du vivant'],
      objectives: [
        "Maîtriser la lecture et l'écriture",
        "Consolider les bases mathématiques",
        "Initier aux sciences et à l'observation",
        "Développer la confiance et l'autonomie",
      ],
      curriculum: [
        "Français",
        "Mathématiques",
        "Découverte du monde",
        "Éducation physique et artistique",
      ],
      teachingApproach: "Nous utilisons une pédagogie progressive et différenciée pour accompagner chaque enfant dans ses apprentissages. L'objectif principal est la maîtrise de la lecture et de l'écriture.",
      enrollment: "Les inscriptions se font en septembre. Veuillez contacter le secrétariat pour les modalités d'admission.",
      price: "Consultez notre barème des frais de scolarité",
    },
    {
      id: 'prog-4', icon: 'BookOpen', title: 'Cycle 2 : CE1 - CE2',
      department: 'Élémentaire', level: 'Élémentaire', duration: '2 ans', credits: 25,
      description: "Renforcement lecture/écriture, résolution de problèmes, projets sciences et culture.",
      features: ["Ateliers d'écriture", 'Projet sciences', 'Clubs lecture'],
      objectives: [
        "Consolider la lecture et la compréhension",
        "Approfondir les mathématiques",
        "Initier à l'histoire et la géographie",
        "Développer l'esprit scientifique",
      ],
      curriculum: [
        "Français et littérature",
        "Mathématiques",
        "Sciences et technologie",
        "Histoire-Géographie",
      ],
      teachingApproach: "Avec le développement cognitif des enfants, nous introduisons progressivement les matières d'éveil. L'apprentissage reste fondé sur l'observation et l'expérience.",
      enrollment: "Les inscriptions se font en septembre. Veuillez contacter le secrétariat pour les modalités d'admission.",
      price: "Consultez notre barème des frais de scolarité",
    },
    {
      id: 'prog-5', icon: 'BookOpen', title: 'Cycle 3 : CM1 - CM2',
      department: 'Élémentaire', level: 'Élémentaire', duration: '2 ans', credits: 25,
      description: "Consolidation des fondamentaux, méthodologie, initiation au numérique et anglais.",
      features: ['Projets interdisciplinaires', 'Anglais oral', 'Initiation au code'],
      objectives: [
        "Maîtriser les compétences essentielles",
        "Développer l'autonomie et la réflexion",
        "Préparer la transition vers le collège",
        "Encourager l'ouverture culturelle",
      ],
      curriculum: [
        "Français",
        "Mathématiques",
        "Histoire-Géographie",
        "Sciences et technologie",
        "Langues vivantes",
      ],
      teachingApproach: "Les enfants développent une véritable autonomie d'apprentissage. Nous utilisons des pédagogies actives et des projets interdisciplinaires pour les engager dans leurs apprentissages.",
      enrollment: "Les inscriptions se font en septembre. Veuillez contacter le secrétariat pour les modalités d'admission.",
      price: "Consultez notre barème des frais de scolarité",
    },
    {
      id: 'prog-6', icon: 'Award', title: 'Soutien & Enrichissement',
      department: 'Soutien & Enrichissement', level: 'Soutien', duration: 'Modules trimestriels', credits: 15,
      description: "Remédiation en français/maths, ateliers artistiques et clubs sciences pour aller plus loin.",
      features: ['Groupes de besoin', 'Clubs thématiques', 'Suivi individualisé'],
      objectives: [
        "Identifier les difficultés d'apprentissage",
        "Mettre en place un suivi personnalisé",
        "Renforcer la confiance et l'estime de soi",
        "Permettre à chaque enfant de progresser à son rythme",
      ],
      curriculum: [
        "Remédiation en lecture et écriture",
        "Soutien en mathématiques",
        "Aide méthodologique",
        "Suivi pédagogique",
      ],
      teachingApproach: "Nous proposons un accompagnement personnalisé basé sur un diagnostic précis des besoins de chaque enfant. Notre objectif est de restaurer la confiance et de favoriser la réussite.",
      enrollment: "Le soutien est proposé sur recommandation de l'équipe pédagogique ou sur demande des parents.",
      price: "Tarif horaire spécifique - Consultez le secrétariat",
    },
  ],
  cta: {
    eyebrow: "Inscriptions 2025–2026 ouvertes",
    title: "Prêt à rejoindre le Forum de l'Excellence ?",
    description: "Découvrez nos programmes et inscrivez votre enfant pour une éducation d'excellence.",
    primaryButtonText: "Commencer l'inscription",
    primaryButtonLink: "/admissions",
    secondaryButtonText: "Nous appeler",
    secondaryButtonLink: "tel:+221775368254",
    badges: [
      { id: 'pcta-b-1', icon: 'Award', label: "Excellence reconnue" },
      { id: 'pcta-b-2', icon: 'Users', label: "Petits effectifs" },
      { id: 'pcta-b-3', icon: 'Star', label: "Suivi personnalisé" },
    ],
  },
};

export const DEFAULT_CAMPUS_LIFE: CampusLifeContent = {
  hero: {
    eyebrow: "La vie au Forum · Communauté vibrante",
    title: "Vie du Campus",
    subtitle: "Expériences, activités et moments forts qui rythment l'année de nos élèves.",
    primaryButtonText: "Explorer la galerie",
    primaryButtonLink: "#gallery",
    secondaryButtonText: "Voir les événements",
    secondaryButtonLink: "#events",
    videoSrc: "/excz.mp4",
    posterSrc: "/campus-hero.jpg",
    trustItems: [
      { id: 'cl-trust-1', icon: 'MapPin', label: "Médinatoul Salam · Mbour" },
      { id: 'cl-trust-2', icon: 'Heart', label: "Environnement bienveillant" },
      { id: 'cl-trust-3', icon: 'Sparkles', label: "Activités enrichissantes" },
    ],
  },
  marquee: [
    { id: 'cmq-1', icon: 'Camera', label: "Galerie photos & vidéos" },
    { id: 'cmq-2', icon: 'Music', label: "Chorale & percussions" },
    { id: 'cmq-3', icon: 'Trophy', label: "Sport scolaire" },
    { id: 'cmq-4', icon: 'BookOpen', label: "Club lecture" },
    { id: 'cmq-5', icon: 'Heart', label: "Eco-citoyens" },
    { id: 'cmq-6', icon: 'Sparkles', label: "Vie associative" },
  ],
  gallerySection: {
    eyebrow: "Galerie", titleLead: "Notre", titleAccent: "Campus", titleTail: " en images",
    description: "Un environnement d'apprentissage moderne et accueillant",
    ctaText: "", ctaLink: "",
  },
  gallery: [
    { id: 'gal-1', src: '/forum/WhatsApp%20Video%202026-01-26%20at%2020.19.01.mp4', alt: "Forum de l'Excellence - Vidéo 1", type: 'video' },
    { id: 'gal-2', src: '/forum/WhatsApp%20Video%202026-01-26%20at%2020.19.29.mp4', alt: "Forum de l'Excellence - Vidéo 2", type: 'video' },
    { id: 'gal-3', src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.33.jpeg', alt: "Forum de l'Excellence - Activité 1", type: 'image' },
    { id: 'gal-4', src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.50.jpeg', alt: "Forum de l'Excellence - Activité 2", type: 'image' },
    { id: 'gal-5', src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.51.jpeg', alt: "Forum de l'Excellence - Activité 3", type: 'image' },
    { id: 'gal-6', src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.54.jpeg', alt: "Forum de l'Excellence - Activité 4", type: 'image' },
    { id: 'gal-7', src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.55.jpeg', alt: "Forum de l'Excellence - Activité 5", type: 'image' },
  ],
  organizationsSection: {
    eyebrow: "Clubs & Associations", titleLead: "Vie", titleAccent: "associative", titleTail: "",
    description: "Nos élèves peuvent rejoindre divers clubs pour enrichir leur expérience scolaire",
    ctaText: "", ctaLink: "",
  },
  organizations: [
    { id: 'org-1', icon: 'Users', name: "Conseil des élèves (CM1-CM2)", description: "Petits délégués qui apprennent la coopération et l'entraide", members: "30 membres" },
    { id: 'org-2', icon: 'Trophy', name: "Club Sport & Jeux", description: "Football, relais, jeux coopératifs et mini-athlétisme", members: "180 membres" },
    { id: 'org-3', icon: 'Music', name: "Chorale & Percussions", description: "Chants, percussions africaines et éveil musical", members: "90 membres" },
    { id: 'org-4', icon: 'Palette', name: "Atelier Arts & Création", description: "Dessin, peinture, bricolage et théâtre", members: "70 membres" },
    { id: 'org-5', icon: 'BookOpen', name: "Club Lecture & Contes", description: "Heures du conte, écriture de petites histoires, rallye-lecture", members: "50 membres" },
    { id: 'org-6', icon: 'Heart', name: "Eco-citoyens", description: "Potager, recyclage créatif et gestes pour la planète", members: "60 membres" },
  ],
  eventsSection: {
    eyebrow: "Agenda", titleLead: "Événements à", titleAccent: "venir", titleTail: "",
    description: "Ne manquez pas nos événements marquants tout au long de l'année scolaire",
    ctaText: "", ctaLink: "",
  },
  events: [
    { id: 'evt-1', title: "Portes ouvertes des familles", date: "15 Mars 2025", time: "9h00 - 16h00", location: "Campus Medinatoul Salam", description: "Visite des classes, échanges avec l'équipe et ateliers découverte pour les enfants." },
    { id: 'evt-2', title: "Kermesse de printemps", date: "5 Avril 2025", time: "10h00 - 18h00", location: "Cour de l'école", description: "Jeux, stands solidaires et spectacle des élèves." },
    { id: 'evt-3', title: "Semaine du livre jeunesse", date: "20-24 Mai 2025", time: "Toute la journée", location: "Bibliothèque", description: "Lectures contées, échanges d'albums et rallye-lecture." },
    { id: 'evt-4', title: "Fête de fin d'année", date: "28 Juin 2025", time: "17h00", location: "Espace scénique", description: "Chants, théâtre et remise des livrets aux familles." },
  ],
  facilitiesSection: {
    eyebrow: "Installations", titleLead: "Nos", titleAccent: "équipements", titleTail: "",
    description: "Des espaces modernes pour un apprentissage optimal",
    ctaText: "", ctaLink: "",
  },
  facilities: [
    { id: 'fac-1', name: "Accueil & Administration", description: "Espace parents, secrétariat et orientation", features: ['Accueil familles', 'Salle de réunion', 'Espace informations'] },
    { id: 'fac-2', name: "Salles de classe", description: "Classes adaptées à chaque cycle avec matériel pédagogique", features: ['Coins lecture', 'Manipulation mathématiques', 'Tableaux interactifs'] },
    { id: 'fac-3', name: "Bibliothèque jeunesse", description: "Albums, premiers romans et documentaires adaptés au primaire", features: ['Heure du conte', 'Espace calme', 'Rallye-lecture'] },
    { id: 'fac-4', name: "Aires de jeux", description: "Espaces sécurisés pour la récréation et la motricité", features: ['Jeux extérieurs', 'Parcours motricité', 'Zone ombragée'] },
    { id: 'fac-5', name: "Espace sportif", description: "Installations pour le sport scolaire", features: ['Terrain polyvalent', 'Mini-gymnase', "Pistes d'agilité"] },
    { id: 'fac-6', name: "Infirmerie", description: "Suivi santé et premiers soins", features: ['Infirmière scolaire', 'Espace repos', 'Suivi des soins'] },
  ],
  servicesSection: {
    eyebrow: "Accompagnement", titleLead: "Services aux", titleAccent: "élèves", titleTail: "",
    description: "Un accompagnement complet pour la réussite et le bien-être des enfants",
    ctaText: "", ctaLink: "",
  },
  services: [
    { id: 'svc-1', icon: 'Users', title: "Suivi pédagogique", description: "Évaluations régulières et échanges familles-enseignants" },
    { id: 'svc-2', icon: 'Heart', title: "Bien-être & écoute", description: "Prévention, médiation et apprentissage des émotions" },
    { id: 'svc-3', icon: 'BookOpen', title: "Soutien & ateliers", description: "Groupes de besoin en français/maths et ateliers lecture" },
    { id: 'svc-4', icon: 'Bus', title: "Transport scolaire", description: "Bus sécurisés sur Medinatoul Salam et environs" },
  ],
  cta: {
    eyebrow: "Rejoignez-nous",
    title: "Venez découvrir notre campus",
    description: "Les portes ouvertes sont l'occasion idéale de visiter nos installations et de rencontrer notre équipe pédagogique.",
    primaryButtonText: "Réserver une visite",
    primaryButtonLink: "/admissions#contact",
    secondaryButtonText: "Nous appeler",
    secondaryButtonLink: "tel:+221775368254",
    badges: [
      { id: 'cl-cta-b-1', icon: 'Heart', label: "Environnement bienveillant" },
      { id: 'cl-cta-b-2', icon: 'Sparkles', label: "Vie associative riche" },
      { id: 'cl-cta-b-3', icon: 'Award', label: "Excellence académique" },
    ],
  },
};

export const DEFAULT_ADMISSIONS: AdmissionsContent = {
  hero: {
    eyebrow: "Admissions 2025–2026 · Inscriptions ouvertes",
    title: "Admissions Forum de L'Excellence",
    subtitle: "Inscrivez votre enfant dans notre établissement d'excellence, au cœur de Médinatoul Salam.",
    primaryButtonText: "Commencer l'inscription",
    primaryButtonLink: "#process",
    secondaryButtonText: "Nous contacter",
    secondaryButtonLink: "#contact",
    videoSrc: "/excz.mp4",
    posterSrc: "/admissions-hero.jpg",
    trustItems: [
      { id: 'ad-trust-1', icon: 'MapPin', label: "Médinatoul Salam · Mbour" },
      { id: 'ad-trust-2', icon: 'Phone', label: "+221 775368254" },
      { id: 'ad-trust-3', icon: 'Calendar', label: "Année 2025-2026" },
    ],
  },
  marquee: [
    { id: 'amq-1', icon: 'Heart', label: "Accompagnement personnalisé" },
    { id: 'amq-2', icon: 'Shield', label: "Environnement sécurisé" },
    { id: 'amq-3', icon: 'Trophy', label: "Excellence académique" },
    { id: 'amq-4', icon: 'Users', label: "Petits effectifs" },
    { id: 'amq-5', icon: 'Lightbulb', label: "Pédagogie innovante" },
    { id: 'amq-6', icon: 'Sparkles', label: "Forum de l'Excellence" },
  ],
  stepsSection: {
    eyebrow: "Processus simplifié",
    titleLead: "Votre parcours d'", titleAccent: "admission", titleTail: "",
    description: "Un parcours clair pour accueillir les enfants de 3 à 11 ans, avec un échange rapproché avec les familles.",
    ctaText: "", ctaLink: "",
  },
  steps: [
    { id: 'stp-1', icon: 'UserPlus', title: "1. Démarche de Candidature", description: "Complétez votre dossier de candidature ou rendez visite à notre établissement à Medinatoul Salam pour une première rencontre.", details: ['Formulaire de candidature détaillé', 'Acte de naissance certifié', 'Dossier vaccinal complet et à jour', "Photographie d'identité", 'Certificat médical scolaire'] },
    { id: 'stp-2', icon: 'FileText', title: "2. Évaluation Pédagogique", description: "Rencontre enrichissante avec notre direction pour évaluer l'adéquation avec le cursus.", details: ['Accueil personnalisé des familles', 'Évaluation douce du niveau en lecture/maths', 'Entretien sur les aspirations', 'Visite guidée des installations', "Discussion sur l'orientation pédagogique"] },
    { id: 'stp-3', icon: 'CheckCircle', title: "3. Acceptation Officielle", description: "Confirmation de l'admission et remise des documents essentiels pour une rentrée en douceur.", details: ["Lettre d'acceptation officielle", 'Liste des fournitures scolaires', 'Calendrier académique détaillé', 'Règlement intérieur', 'Informations sur les services'] },
    { id: 'stp-4', icon: 'CreditCard', title: "4. Finalisation Administrative", description: "Complétion des démarches et intégration officielle à notre communauté.", details: ['Formalisation des frais de scolarité', "Signature du contrat d'engagement", 'Sélection des services (cantine, transport)', "Réunion d'intégration parents-école", 'Activation du portail parent numérique'] },
  ],
  requirementsSection: {
    eyebrow: "Critères d'admission",
    titleLead: "Prérequis par", titleAccent: "niveau", titleTail: "",
    description: "Chaque niveau d'études a des critères spécifiques adaptés à l'âge et au développement de l'enfant.",
    ctaText: "", ctaLink: "",
  },
  requirements: [
    { id: 'req-1', level: "Maternelle (PS-MS-GS)", requirements: ['Âge 3-5 ans', 'Propreté acquise', 'Carnet de vaccination à jour'] },
    { id: 'req-2', level: "Élémentaire (CI-CP)", requirements: ['Âge 6-7 ans', 'Prérequis en langage oral', 'Test de positionnement léger'] },
    { id: 'req-3', level: "Élémentaire (CE1-CE2-CM1-CM2)", requirements: ['Âge 8-11 ans', 'Bulletins des 2 dernières années', 'Entretien avec les parents'] },
  ],
  deadlinesSection: {
    eyebrow: "Calendrier",
    titleLead: "Dates importantes", titleAccent: "2025-2026", titleTail: "",
    description: "Restez informé des dates clés du processus d'admission.",
    ctaText: "", ctaLink: "",
  },
  deadlines: [
    { id: 'dl-1', phase: "Ouverture des inscriptions", date: "1er Février 2025", status: "En cours" },
    { id: 'dl-2', phase: "Clôture des inscriptions", date: "30 Juin 2025", status: "À venir" },
    { id: 'dl-3', phase: "Rencontres familles", date: "Mars - Juillet 2025", status: "À venir" },
    { id: 'dl-4', phase: "Rentrée scolaire", date: "06 Octobre 2025", status: "À venir" },
  ],
  contactSection: {
    eyebrow: "Contact",
    title: "Parlons de votre enfant",
    description: "Notre équipe est à votre disposition pour répondre à toutes vos questions concernant les admissions.",
    items: [
      { id: 'ci-1', icon: 'Phone', label: "Téléphone", value: "+221 775368254" },
      { id: 'ci-2', icon: 'Mail', label: "Email", value: "gsforumexcellence@gmail.com" },
      { id: 'ci-3', icon: 'MapPin', label: "Adresse", value: "Medinatoul Salam, Mbour, Sénégal" },
      { id: 'ci-4', icon: 'Clock', label: "Direction", value: "M. et Mme Fall" },
    ],
  },
  faqSection: {
    eyebrow: "FAQ",
    titleLead: "Questions", titleAccent: "fréquentes", titleTail: "",
    description: "",
    ctaText: "", ctaLink: "",
  },
  faqs: [
    { id: 'faq-1', question: "Quels sont les frais de scolarité ?", answer: "Les frais varient selon le niveau (maternelle / élémentaire). Des facilités de paiement et quelques bourses sociales sont proposées." },
    { id: 'faq-2', question: "Y a-t-il un test d'entrée ?", answer: "Seuls de courts tests de positionnement et un entretien sont prévus pour placer l'enfant dans le bon niveau." },
    { id: 'faq-3', question: "Proposez-vous le transport scolaire ?", answer: "Oui, un service de transport est disponible sur Medinatoul Salam et les environs de Mbour (sur inscription)." },
    { id: 'faq-4', question: "Comment contacter la direction ?", answer: "Téléphone : +221 775368254 — Email : gsforumexcellence@gmail.com — Visite sur rendez-vous." },
  ],
  cta: {
    eyebrow: "Inscriptions 2025–2026 ouvertes",
    title: "Prêt à rejoindre le Forum de l'Excellence ?",
    description: "Ne manquez pas l'opportunité de donner à votre enfant une éducation épanouissante. Les inscriptions pour l'année 2025-2026 sont ouvertes !",
    primaryButtonText: "Commencer l'inscription",
    primaryButtonLink: "/login",
    secondaryButtonText: "Nous appeler",
    secondaryButtonLink: "tel:+221775368254",
    badges: [
      { id: 'ad-cta-b-1', icon: 'Shield', label: "Données protégées" },
      { id: 'ad-cta-b-2', icon: 'Heart', label: "Suivi personnalisé" },
      { id: 'ad-cta-b-3', icon: 'Award', label: "Excellence reconnue" },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────
// Merge helpers (deep merge a partial/legacy payload over defaults)
// ─────────────────────────────────────────────────────────────────
const uid = (p: string, i: number) => `${p}-${i + 1}`;

function ensureArrayWithIds<T extends { id?: string }>(value: any, fallback: T[], prefix: string): T[] {
  if (!Array.isArray(value)) return fallback;
  return value.map((item, i) => ({ ...item, id: item?.id || uid(prefix, i) })) as T[];
}

function mergeObject<T extends object>(value: any, fallback: T): T {
  if (!value || typeof value !== 'object') return fallback;
  return { ...fallback, ...value };
}

export function mergeProgramsContent(p: Partial<ProgramsContent> | null | undefined): ProgramsContent {
  const safe: any = p && typeof p === 'object' ? p : {};
  return {
    hero: { ...mergeObject(safe.hero, DEFAULT_PROGRAMS.hero),
      trustItems: ensureArrayWithIds(safe.hero?.trustItems, DEFAULT_PROGRAMS.hero.trustItems, 'pp-trust') },
    marquee: ensureArrayWithIds(safe.marquee, DEFAULT_PROGRAMS.marquee, 'pmq'),
    filters: {
      departments: Array.isArray(safe.filters?.departments) ? safe.filters.departments : DEFAULT_PROGRAMS.filters.departments,
      levels: Array.isArray(safe.filters?.levels) ? safe.filters.levels : DEFAULT_PROGRAMS.filters.levels,
    },
    programsSection: mergeObject(safe.programsSection, DEFAULT_PROGRAMS.programsSection),
    programs: ensureArrayWithIds(safe.programs, DEFAULT_PROGRAMS.programs, 'prog'),
    cta: { ...mergeObject(safe.cta, DEFAULT_PROGRAMS.cta),
      badges: ensureArrayWithIds(safe.cta?.badges, DEFAULT_PROGRAMS.cta.badges, 'pcta-b') },
  };
}

export function mergeCampusLifeContent(p: Partial<CampusLifeContent> | null | undefined): CampusLifeContent {
  const safe: any = p && typeof p === 'object' ? p : {};
  return {
    hero: { ...mergeObject(safe.hero, DEFAULT_CAMPUS_LIFE.hero),
      trustItems: ensureArrayWithIds(safe.hero?.trustItems, DEFAULT_CAMPUS_LIFE.hero.trustItems, 'cl-trust') },
    marquee: ensureArrayWithIds(safe.marquee, DEFAULT_CAMPUS_LIFE.marquee, 'cmq'),
    gallerySection: mergeObject(safe.gallerySection, DEFAULT_CAMPUS_LIFE.gallerySection),
    gallery: ensureArrayWithIds(safe.gallery, DEFAULT_CAMPUS_LIFE.gallery, 'gal'),
    organizationsSection: mergeObject(safe.organizationsSection, DEFAULT_CAMPUS_LIFE.organizationsSection),
    organizations: ensureArrayWithIds(safe.organizations, DEFAULT_CAMPUS_LIFE.organizations, 'org'),
    eventsSection: mergeObject(safe.eventsSection, DEFAULT_CAMPUS_LIFE.eventsSection),
    events: ensureArrayWithIds(safe.events, DEFAULT_CAMPUS_LIFE.events, 'evt'),
    facilitiesSection: mergeObject(safe.facilitiesSection, DEFAULT_CAMPUS_LIFE.facilitiesSection),
    facilities: ensureArrayWithIds(safe.facilities, DEFAULT_CAMPUS_LIFE.facilities, 'fac'),
    servicesSection: mergeObject(safe.servicesSection, DEFAULT_CAMPUS_LIFE.servicesSection),
    services: ensureArrayWithIds(safe.services, DEFAULT_CAMPUS_LIFE.services, 'svc'),
    cta: { ...mergeObject(safe.cta, DEFAULT_CAMPUS_LIFE.cta),
      badges: ensureArrayWithIds(safe.cta?.badges, DEFAULT_CAMPUS_LIFE.cta.badges, 'cl-cta-b') },
  };
}

export function mergeAdmissionsContent(p: Partial<AdmissionsContent> | null | undefined): AdmissionsContent {
  const safe: any = p && typeof p === 'object' ? p : {};
  return {
    hero: { ...mergeObject(safe.hero, DEFAULT_ADMISSIONS.hero),
      trustItems: ensureArrayWithIds(safe.hero?.trustItems, DEFAULT_ADMISSIONS.hero.trustItems, 'ad-trust') },
    marquee: ensureArrayWithIds(safe.marquee, DEFAULT_ADMISSIONS.marquee, 'amq'),
    stepsSection: mergeObject(safe.stepsSection, DEFAULT_ADMISSIONS.stepsSection),
    steps: ensureArrayWithIds(safe.steps, DEFAULT_ADMISSIONS.steps, 'stp'),
    requirementsSection: mergeObject(safe.requirementsSection, DEFAULT_ADMISSIONS.requirementsSection),
    requirements: ensureArrayWithIds(safe.requirements, DEFAULT_ADMISSIONS.requirements, 'req'),
    deadlinesSection: mergeObject(safe.deadlinesSection, DEFAULT_ADMISSIONS.deadlinesSection),
    deadlines: ensureArrayWithIds(safe.deadlines, DEFAULT_ADMISSIONS.deadlines, 'dl'),
    contactSection: { ...mergeObject(safe.contactSection, DEFAULT_ADMISSIONS.contactSection),
      items: ensureArrayWithIds(safe.contactSection?.items, DEFAULT_ADMISSIONS.contactSection.items, 'ci') },
    faqSection: mergeObject(safe.faqSection, DEFAULT_ADMISSIONS.faqSection),
    faqs: ensureArrayWithIds(safe.faqs, DEFAULT_ADMISSIONS.faqs, 'faq'),
    cta: { ...mergeObject(safe.cta, DEFAULT_ADMISSIONS.cta),
      badges: ensureArrayWithIds(safe.cta?.badges, DEFAULT_ADMISSIONS.cta.badges, 'ad-cta-b') },
  };
}
