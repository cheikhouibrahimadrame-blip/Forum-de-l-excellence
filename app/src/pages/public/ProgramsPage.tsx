import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { api } from '../../lib/api';
import { 
  BookOpen, 
  Clock, 
  Users,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};

type ProgramsContent = {
  hero: {
    title: string;
    subtitle: string;
    image?: string;
  };
  content: {
    description?: string;
    curriculum?: string;
    languages?: string;
    activities?: string;
    [key: string]: string | undefined;
  };
};

const ProgramsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [pageContent, setPageContent] = useState({
    hero: {
      title: 'Nos Programmes - Forum de L\'excellence',
      subtitle: 'Découvrez nos cursus pédagogiques',
      image: '/programs-hero.jpg'
    },
    content: {
      description: '',
      curriculum: '',
      languages: '',
      activities: ''
    }
  });

  // Charger le contenu depuis l'API
  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await api.get<ApiResponse<ProgramsContent>>('/api/pages/programs');
        const result = response.data;
        if (result.success && result.data) {
          const data = result.data;
          setPageContent((prev) => ({
            ...prev,
            hero: {
              ...prev.hero,
              ...data.hero,
              image: data.hero?.image || prev.hero.image
            },
            content: {
              ...prev.content,
              ...data.content
            }
          }));
        }
      } catch (error: unknown) {
        console.error('Erreur chargement contenu:', error);
      }
    };

    loadContent();
  }, []);

  // Scroll vers la carte du programme après le retour
  useEffect(() => {
    if (location.state?.fromProgramId) {
      const element = document.getElementById(`program-${location.state.fromProgramId}`);
      console.log('Program ID from state:', location.state.fromProgramId);
      console.log('Element found:', element);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-[var(--color-primary-gold)]', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-[var(--color-primary-gold)]', 'ring-offset-2');
            // Nettoyer l'état APRÈS la surbrillance
            window.history.replaceState({}, document.title);
          }, 2000);
        }, 100);
      } else {
        // Nettoyer si l'élément n'existe pas
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state]);

  const departments = [
    'Maternelle',
    'Élémentaire',
    'Soutien & Enrichissement'
  ];

  const levels = ['Maternelle', 'Élémentaire', 'Soutien'];

  const programs = [
    {
      id: 1,
      title: 'Maternelle - Petite et Moyenne Section',
      department: 'Maternelle',
      level: 'Maternelle',
      duration: '1 an par section',
      description: 'Éveil sensoriel, motricité, langage oral et premiers repères logiques dans un cadre sécurisant.',
      features: ['Ateliers autonomes', 'Parcours motricité', 'Chansons et contes'],
      credits: 20
    },
    {
      id: 2,
      title: 'Maternelle - Grande Section',
      department: 'Maternelle',
      level: 'Maternelle',
      duration: '1 an',
      description: 'Pré-lecture, pré-écriture et premières notions mathématiques pour préparer l’entrée en CP.',
      features: ['Graphisme', 'Phonologie', 'Jeux mathématiques'],
      credits: 22
    },
    {
      id: 3,
      title: 'Cycle 1 : CI - CP',
      department: 'Élémentaire',
      level: 'Élémentaire',
      duration: '2 ans',
      description: 'Lecture fluide, écriture cursive, construction du nombre et découverte du monde.',
      features: ['Lecture quotidienne', 'Manipulation en maths', 'Découverte du vivant'],
      credits: 25
    },
    {
      id: 4,
      title: 'Cycle 2 : CE1 - CE2',
      department: 'Élémentaire',
      level: 'Élémentaire',
      duration: '2 ans',
      description: 'Renforcement lecture/écriture, résolution de problèmes, projets sciences et culture.',
      features: ['Ateliers d\'écriture', 'Projet sciences', 'Clubs lecture'],
      credits: 25
    },
    {
      id: 5,
      title: 'Cycle 3 : CM1 - CM2',
      department: 'Élémentaire',
      level: 'Élémentaire',
      duration: '2 ans',
      description: 'Consolidation des fondamentaux, méthodologie, initiation au numérique et anglais.',
      features: ['Projets interdisciplinaires', 'Anglais oral', 'Initiation au code'],
      credits: 25
    },
    {
      id: 6,
      title: 'Soutien & Enrichissement',
      department: 'Soutien & Enrichissement',
      level: 'Soutien',
      duration: 'Modules trimestriels',
      description: 'Remédiation en français/maths, ateliers artistiques et clubs sciences pour aller plus loin.',
      features: ['Groupes de besoin', 'Clubs thématiques', 'Suivi individualisé'],
      credits: 15
    }
  ];

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || program.department === selectedDepartment;
    const matchesLevel = selectedLevel === 'all' || program.level === selectedLevel;
    return matchesSearch && matchesDepartment && matchesLevel;
  });

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
        <div className="relative section-content py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-slide-in-left">
              {pageContent.hero.title}
            </h1>
            <p className="text-lg text-white/90 max-w-3xl mx-auto animate-slide-in-right animation-delay-100">
              {pageContent.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-[var(--color-bg-card)] border-b border-[var(--color-border)] section">
        <div className="section-content">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Rechercher un programme..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="input-field pl-10 appearance-none bg-no-repeat bg-left"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5rem' }}
              >
                <option value="all">Toutes les sections</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div className="relative">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="input-field appearance-none bg-no-repeat bg-right"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5rem' }}
              >
                <option value="all">Tous les cycles</option>
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-16 bg-[var(--color-bg-primary)] section">
        <div className="section-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrograms.map((program, index) => {
              const { ref, isVisible } = useScrollReveal();
              const delayClass = ['', 'animation-delay-100', 'animation-delay-200', 'animation-delay-100', 'animation-delay-200', 'animation-delay-300'][index % 6];
              const nextProgram = filteredPrograms[index + 1];
              const handleCardClick = () => {
                navigate(`/programmes/${program.id}`, { state: { fromProgramId: program.id } });
              };
              return (
              <div 
                key={program.id} 
                id={`program-${program.id}`}
                ref={ref} 
                className={`card overflow-hidden group ${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${delayClass} transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-105`}
                onClick={handleCardClick}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-navy)] flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-[var(--color-primary-gold)]" />
                    </div>
                    <span className="badge bg-[var(--color-primary-gold-light)] text-[var(--color-primary-navy)]">
                      {program.level}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-primary-navy)] transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] mb-3">
                    {program.department}
                  </p>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
                    {program.description}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)] mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {program.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {program.credits} élèves maximum / classe
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {program.features.map((feature, idx) => (
                      <span key={idx} className="badge bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/programmes/${program.id}`, { state: { fromProgramId: program.id } });
                      }}
                      className="btn-secondary flex items-center justify-center gap-2 group/btn"
                    >
                      Voir les details
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/admissions#contact');
                        }}
                        className="flex-1 btn-primary flex items-center justify-center"
                      >
                        Demander des informations
                      </button>
                      {nextProgram ? (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            navigate(`/programmes/${nextProgram.id}`, { state: { fromProgramId: nextProgram.id } });
                            setTimeout(() => {
                              const nextElement = document.getElementById(`program-${nextProgram.id}`);
                              if (nextElement) {
                                nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 100);
                          }} 
                          className="px-4 btn-secondary flex items-center justify-center group/btn hover:bg-[var(--color-primary-navy)]" 
                          title={`Aller à ${nextProgram.title}`}
                        >
                          <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>

          {filteredPrograms.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center">
                <Search className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                Aucun programme trouvé
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                Essayez de modifier vos filtres de recherche.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProgramsPage;