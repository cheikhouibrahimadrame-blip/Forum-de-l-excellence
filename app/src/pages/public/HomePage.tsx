import type React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Award, 
  Calendar,
  ArrowRight,
  ChevronRight,
  Star,
  Heart,
  Shield
} from 'lucide-react';

// Icon mapping
const iconMap: { [key: string]: React.ComponentType<any> } = {
  GraduationCap,
  Users,
  BookOpen,
  Award,
  Calendar,
  Star,
  Heart,
  Shield
};

interface HeroContent {
  title: string;
  subtitle: string;
  primaryButtonText: string;
  secondaryButtonText: string;
}

interface Stat {
  id?: string;
  value: string;
  label: string;
}

interface Feature {
  id?: string;
  icon: string;
  title: string;
  description: string;
}

interface NewsItem {
  id?: string;
  title: string;
  date: string;
  excerpt: string;
}

interface CTAContent {
  title: string;
  description: string;
  primaryButtonText: string;
  secondaryButtonText: string;
}

const HomePage: React.FC = () => {
  const [heroContent, setHeroContent] = useState<HeroContent>({
    title: "Bienvenue au Forum de L'Excellence - Excellence Académique & Humaniste",
    subtitle: "Découvrez un établissement d'enseignement primaire d'exception, où l'excellence académique rencontre la bienveillance humaine. Situé au cœur de Medinatoul Salam à Mbour, nous créons un environnement inspirant pour forger les citoyens de demain.",
    primaryButtonText: "Commencer l'Aventure",
    secondaryButtonText: "Explorez nos Programmes"
  });

  const [stats, setStats] = useState<Stat[]>([
    { value: '600+', label: 'Élèves Inspirés' },
    { value: '95%', label: 'Taux de Réussite Exceptionnelle' },
    { value: '35', label: 'Éducateurs Passionnés' },
    { value: '12', label: 'Ans au Service de l\'Excellence' }
  ]);

  const [features, setFeatures] = useState<Feature[]>([
    { icon: 'GraduationCap', title: 'Pédagogie Distinquée', description: 'Un cursus primaire fondé sur l\'excellence, développant la maîtrise parfaite de la lecture, l\'écriture, les mathématiques et l\'apprentissage scientifique.' },
    { icon: 'Users', title: 'Corps Enseignant d\'Élite', description: 'Des pédagogues certifiés et expérimentés, dédiés à l\'épanouissement personnel et académique de chaque enfant.' },
    { icon: 'BookOpen', title: 'Apprentissage par l\'Expérience', description: 'Ateliers créatifs, projets captivants et activités enrichissantes, où chaque enfant apprend en s\'épanouissant.' },
    { icon: 'Award', title: 'Sanctuaire Sécurisé et Inspirant', description: 'Espaces lumineux et modernes, bibliothèque exhaustive, installations sportives complètes et environnement verdoyant.' }
  ]);

  const [news, setNews] = useState<NewsItem[]>([
    { title: 'Kermesse solidaire 2025', date: '15 Mai 2025', excerpt: 'Les classes de CP à CM2 ont collecté des livres pour la bibliothèque de quartier.' },
    { title: 'Nouvel espace de jeux', date: '20 Avril 2025', excerpt: 'Ouverture d une aire de jeux ombragée pour la maternelle et le cycle élémentaire.' }
  ]);

  const [ctaContent, setCTAContent] = useState<CTAContent>({
    title: "Façonnez l'Avenir de Votre Enfant - Rejoignez Notre Communauté d'Excellence",
    description: "Les inscriptions sont ouvertes pour l'année académique 2025-2026. Offrez à votre enfant une formation d'exception, dans un environnement bienveillant, stimulant et sécurisé.",
    primaryButtonText: "Débuter l'Inscription",
    secondaryButtonText: "Consultez nos Programmes Prestigieux"
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomepageContent();
  }, []);

  const fetchHomepageContent = async () => {
    try {
      const response = await api.get('/api/homepage');
      const result = response.data;
      
      if (result.success && result.data) {
        setHeroContent(result.data.hero);
        setStats(result.data.stats);
        setFeatures(result.data.features);
        setNews(result.data.news);
        setCTAContent(result.data.cta);
      }
    } catch (error) {
      console.error('Error fetching homepage content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-slide-in-left">
              {heroContent.title}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed animate-slide-in-right animation-delay-100">
              {heroContent.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-200">
              <Link to="/admissions" className="btn-accent text-lg px-8 py-4">
                <Calendar className="w-5 h-5 mr-2 inline" />
                {heroContent.primaryButtonText}
              </Link>
              <Link to="/programs" className="btn-secondary text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-[var(--color-primary-navy)]">
                {heroContent.secondaryButtonText}
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[var(--color-bg-primary)] to-transparent"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[var(--color-bg-primary)] section">
        <div className="section-content">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.id || index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[var(--color-primary-navy)] mb-2">
                  {stat.value}
                </div>
                <div className="text-[var(--color-text-secondary)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[var(--color-bg-secondary)] section">
        <div className="section-content">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Pourquoi choisir notre école primaire ?
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Sous la direction de M. et Mme Fall, nous cultivons la curiosité, l\'autonomie et la joie d\'apprendre dès la maternelle jusqu\'au CM2.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = iconMap[feature.icon] || GraduationCap;
              const delayClass = ['', 'animation-delay-100', 'animation-delay-200', 'animation-delay-300'][index % 4];
              return (
                <div key={feature.id || index} className={`card p-8 text-center group animate-fade-in-up ${delayClass}`}>
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-primary-gold-light)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-[var(--color-primary-navy)]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-20 bg-[var(--color-bg-primary)] section">
        <div className="section-content">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">
              Actualités Récentes
            </h2>
            <Link to="/campus-life" className="flex items-center gap-2 text-[var(--color-primary-navy)] hover:underline">
              Voir toutes les actualités
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((item, index) => (
              <div key={item.id || index} className="card overflow-hidden group cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-3">
                    <Calendar className="w-4 h-4" />
                    {item.date}
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3 group-hover:text-[var(--color-primary-navy)] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
                    {item.excerpt}
                  </p>
                  <span className="inline-flex items-center text-[var(--color-primary-navy)] font-medium group-hover:gap-3 transition-all">
                    Lire plus
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero text-white section">
        <div className="section-content-narrow text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {ctaContent.title}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {ctaContent.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/admissions" className="btn-accent text-lg px-8 py-4">
              <Calendar className="w-5 h-5 mr-2 inline" />
              {ctaContent.primaryButtonText}
            </Link>
            <Link to="/programs" className="btn-secondary text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-[var(--color-primary-navy)]">
              {ctaContent.secondaryButtonText}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
