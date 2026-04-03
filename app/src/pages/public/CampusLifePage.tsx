import type React from 'react';
import { useState, useEffect } from 'react';
import { 
  Users,
  Calendar,
  Trophy,
  Music,
  Palette,
  BookOpen,
  Heart,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock
} from 'lucide-react';
import { apiUrl } from '../../lib/api';

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};

type GalleryItem = {
  src: string;
  alt: string;
  type: 'image' | 'video';
};

type CampusLifeContent = {
  hero: {
    title: string;
    subtitle: string;
    image?: string;
  };
  gallery: GalleryItem[];
  content: {
    clubs?: string;
    sports?: string;
    cultural?: string;
    social?: string;
    [key: string]: string | undefined;
  };
};

const CampusLifePage: React.FC = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const defaultGallery: GalleryItem[] = [
    { src: '/forum/WhatsApp%20Video%202026-01-26%20at%2020.19.01.mp4', alt: 'Forum de l\'Excellence - Vidéo 1', type: 'video' },
    { src: '/forum/WhatsApp%20Video%202026-01-26%20at%2020.19.29.mp4', alt: 'Forum de l\'Excellence - Vidéo 2', type: 'video' },
    { src: '/forum/WhatsApp%20Video%202026-01-26%20at%2020.19.29%20(1).mp4', alt: 'Forum de l\'Excellence - Vidéo 3', type: 'video' },
    { src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.33.jpeg', alt: 'Forum de l\'Excellence - Activité 1', type: 'image' },
    { src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.50.jpeg', alt: 'Forum de l\'Excellence - Activité 2', type: 'image' },
    { src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.51.jpeg', alt: 'Forum de l\'Excellence - Activité 3', type: 'image' },
    { src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.54.jpeg', alt: 'Forum de l\'Excellence - Activité 4', type: 'image' },
    { src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.55.jpeg', alt: 'Forum de l\'Excellence - Activité 5', type: 'image' },
    { src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.55%20(1).jpeg', alt: 'Forum de l\'Excellence - Activité 6', type: 'image' },
    { src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.55%20(2).jpeg', alt: 'Forum de l\'Excellence - Activité 7', type: 'image' }
  ];
  const [pageContent, setPageContent] = useState({
    hero: {
      title: 'Vie du Campus - Forum de L\'excellence',
      subtitle: 'Expériences et activités de nos élèves',
      image: '/campus-hero.jpg'
    },
    gallery: defaultGallery,
    content: {
      clubs: '',
      sports: '',
      cultural: '',
      social: ''
    }
  });

  // Charger le contenu depuis l'API
  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(apiUrl('/api/pages/campusLife'));
        const result: ApiResponse<CampusLifeContent> = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          setPageContent((prev) => ({
            ...prev,
            ...data,
            hero: {
              ...prev.hero,
              ...data.hero,
              image: data.hero.image || prev.hero.image
            },
            content: {
              ...prev.content,
              ...data.content
            },
            gallery: Array.isArray(data.gallery) && data.gallery.length > 0
              ? data.gallery
              : defaultGallery
          }));
        }
      } catch (error: unknown) {
        console.error('Erreur chargement contenu:', error);
      }
    };

    loadContent();
  }, []);

  const campusImages = Array.isArray(pageContent.gallery) && pageContent.gallery.length > 0
    ? pageContent.gallery
    : defaultGallery;

  useEffect(() => {
    if (currentImageIndex >= campusImages.length && campusImages.length > 0) {
      setCurrentImageIndex(0);
    }
  }, [campusImages.length, currentImageIndex]);

  const organizations = [
    {
      icon: Users,
      name: 'Conseil des élèves (CM1-CM2)',
      description: 'Petits délégués qui apprennent la coopération et l\'entraide',
      members: '30 membres'
    },
    {
      icon: Trophy,
      name: 'Club Sport & Jeux',
      description: 'Football, relais, jeux coopératifs et mini-athlétisme',
      members: '180 membres'
    },
    {
      icon: Music,
      name: 'Chorale & Percussions',
      description: 'Chants, percussions africaines et éveil musical',
      members: '90 membres'
    },
    {
      icon: Palette,
      name: 'Atelier Arts & Création',
      description: 'Dessin, peinture, bricolage et théâtre',
      members: '70 membres'
    },
    {
      icon: BookOpen,
      name: 'Club Lecture & Contes',
      description: 'Heures du conte, écriture de petites histoires, rallye-lecture',
      members: '50 membres'
    },
    {
      icon: Heart,
      name: 'Eco-citoyens',
      description: 'Potager, recyclage créatif et gestes pour la planète',
      members: '60 membres'
    }
  ];

  const events = [
    {
      title: 'Portes ouvertes des familles',
      date: '15 Mars 2025',
      time: '9h00 - 16h00',
      location: 'Campus Medinatoul Salam',
      description: 'Visite des classes, échanges avec l\'équipe et ateliers découverte pour les enfants.'
    },
    {
      title: 'Kermesse de printemps',
      date: '5 Avril 2025',
      time: '10h00 - 18h00',
      location: 'Cour de l\'école',
      description: 'Jeux, stands solidaires et spectacle des élèves.'
    },
    {
      title: 'Semaine du livre jeunesse',
      date: '20-24 Mai 2025',
      time: 'Toute la journée',
      location: 'Bibliothèque',
      description: 'Lectures contées, échanges d\'albums et rallye-lecture.'
    },
    {
      title: 'Fête de fin d\'année',
      date: '28 Juin 2025',
      time: '17h00',
      location: 'Espace scénique',
      description: 'Chants, théâtre et remise des livrets aux familles.'
    }
  ];

  const facilities = [
    {
      name: 'Accueil & Administration',
      description: 'Espace parents, secrétariat et orientation',
      features: ['Accueil familles', 'Salle de réunion', 'Espace informations']
    },
    {
      name: 'Salles de classe',
      description: 'Classes adaptées à chaque cycle avec matériel pédagogique',
      features: ['Coins lecture', 'Manipulation mathématiques', 'Tableaux interactifs']
    },
    {
      name: 'Bibliothèque jeunesse',
      description: 'Albums, premiers romans et documentaires adaptés au primaire',
      features: ['Heure du conte', 'Espace calme', 'Rallye-lecture']
    },
    {
      name: 'Aires de jeux',
      description: 'Espaces sécurisés pour la récréation et la motricité',
      features: ['Jeux extérieurs', 'Parcours motricité', 'Zone ombragée']
    },
    {
      name: 'Espace sportif',
      description: 'Installations pour le sport scolaire',
      features: ['Terrain polyvalent', 'Mini-gymnase', 'Pistes d\'agilité']
    },
    {
      name: 'Infirmerie',
      description: 'Suivi santé et premiers soins',
      features: ['Infirmière scolaire', 'Espace repos', 'Suivi des soins']
    }
  ];

  const nextImage = () => {
    if (campusImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % campusImages.length);
  };

  const prevImage = () => {
    if (campusImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + campusImages.length) % campusImages.length);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Page Header */}
      <section className="text-white relative overflow-hidden section">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/excz.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative section-content py-24 md:py-32">
          <div className="text-center section-content-narrow">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-slide-in-left">
              {pageContent.hero.title}
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed animate-slide-in-right animation-delay-100">
              {pageContent.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Campus Gallery */}
      <section className="py-20 bg-[var(--color-bg-primary)] section">
        <div className="section-content">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Notre Campus
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Un environnement d'apprentissage moderne et accueillant
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto px-4 md:px-6">
            {campusImages.length > 0 && campusImages[currentImageIndex] ? (
              <>
                <div className="aspect-video w-full max-h-[420px] md:max-h-[520px] rounded-2xl overflow-hidden bg-[var(--color-bg-secondary)]">
                  {campusImages[currentImageIndex].type === 'video' ? (
                    <video 
                      key={campusImages[currentImageIndex].src}
                      src={campusImages[currentImageIndex].src} 
                      controls
                      autoPlay
                      muted
                      loop
                      className="w-full h-full object-cover"
                    >
                      Votre navigateur ne supporte pas la vidéo.
                    </video>
                  ) : (
                    <img 
                      src={campusImages[currentImageIndex].src} 
                      alt={campusImages[currentImageIndex].alt}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Erreur chargement image:', campusImages[currentImageIndex].src);
                        e.currentTarget.src = '/placeholder-campus.jpg';
                      }}
                    />
                  )}
                  
                  {/* Navigation arrows */}
                  {campusImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6 text-[var(--color-text-primary)]" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
                      >
                        <ChevronRight className="w-6 h-6 text-[var(--color-text-primary)]" />
                      </button>
                    </>
                  )}
                </div>

                {/* Image indicators */}
                {campusImages.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {campusImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === currentImageIndex 
                            ? 'bg-[var(--color-primary-navy)]' 
                            : 'bg-[var(--color-border)] hover:bg-[var(--color-border-hover)]'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-video rounded-2xl overflow-hidden bg-[var(--color-bg-secondary)] flex items-center justify-center">
                <p className="text-[var(--color-text-secondary)]">Aucune image disponible</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Organizations Section */}
      <section className="py-20 bg-[var(--color-bg-secondary)] section">
        <div className="section-content">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Clubs et Associations
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Nos élèves peuvent rejoindre divers clubs pour enrichir leur expérience scolaire
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {organizations.map((org, index) => {
              const Icon = org.icon;
              return (
                <div key={index} className="card p-6 group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-navy)] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-[var(--color-primary-gold)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        {org.name}
                      </h3>
                      <span className="text-sm text-[var(--color-text-muted)]">{org.members}</span>
                    </div>
                  </div>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    {org.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-20 bg-[var(--color-bg-primary)] section">
        <div className="section-content">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Événements à Venir
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Ne manquez pas nos événements marquants tout au long de l'année scolaire
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((event, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-gold-light)] flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-[var(--color-primary-navy)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)] mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {event.date} - {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </span>
                    </div>
                    <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities Section */}
      <section className="py-20 bg-[var(--color-bg-secondary)] section">
        <div className="section-content">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Nos Installations
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Des équipements modernes pour un apprentissage optimal
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilities.map((facility, index) => (
              <div key={index} className="card p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                  {facility.name}
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                  {facility.description}
                </p>
                <ul className="space-y-2">
                  {facility.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-gold)]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-[var(--color-bg-primary)] section">
        <div className="section-content">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Services aux élèves
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Un accompagnement complet pour la réussite et le bien-être des enfants
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Suivi pédagogique',
                description: 'Évaluations régulières et échanges familles-enseignants',
                icon: Users
              },
              {
                title: 'Bien-être & écoute',
                description: 'Prévention, médiation et apprentissage des émotions',
                icon: Heart
              },
              {
                title: 'Soutien & ateliers',
                description: 'Groupes de besoin en français/maths et ateliers lecture',
                icon: BookOpen
              },
              {
                title: 'Transport scolaire',
                description: 'Bus sécurisés sur Medinatoul Salam et environs',
                icon: Calendar
              }
            ].map((service, index) => {
              const Icon = service.icon;
              return (
                <div key={index} className="card p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-primary-navy)] flex items-center justify-center">
                    <Icon className="w-8 h-8 text-[var(--color-primary-gold)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                    {service.title}
                  </h3>
                  <p className="text-[var(--color-text-secondary)] text-sm">
                    {service.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CampusLifePage;