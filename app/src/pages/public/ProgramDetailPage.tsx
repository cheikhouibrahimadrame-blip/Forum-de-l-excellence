import type React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  Target,
  Zap
} from 'lucide-react';

const ProgramDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Program data - same as in ProgramsPage but more detailed
  const programsData = [
    {
      id: 1,
      title: 'Maternelle - Petite et Moyenne Section',
      department: 'Maternelle',
      level: 'Maternelle',
      duration: '1 an par section',
      description: 'Éveil sensoriel, motricité, langage oral et premiers repères logiques dans un cadre sécurisant.',
      features: ['Ateliers autonomes', 'Parcours motricité', 'Chansons et contes'],
      credits: 20,
      objectives: [
        'Développer la confiance en soi et l\'autonomie',
        'Renforcer la motricité fine et globale',
        'Initier à la communication orale',
        'Découvrir les mathématiques de manière ludique'
      ],
      curriculum: [
        'Langage et communication',
        'Éducation physique et sportive',
        'Découverte du monde',
        'Activités créatives et artistiques'
      ],
      teachingApproach: 'Notre approche pédagogique privilégie le jeu comme mode d\'apprentissage principal. Les enfants découvrent le monde à travers des expériences sensorielles et des activités collaboratives, dans un environnement bienveillant et stimulant.',
      enrollment: 'Les inscriptions se font en septembre. Veuillez contacter le secrétariat pour les modalités d\'admission.',
      price: 'Consultez notre barème des frais de scolarité'
    },
    {
      id: 2,
      title: 'Maternelle - Grande Section',
      department: 'Maternelle',
      level: 'Maternelle',
      duration: '1 an',
      description: 'Pré-lecture, pré-écriture et premières notions mathématiques pour préparer l\'entrée en CP.',
      features: ['Graphisme', 'Phonologie', 'Jeux mathématiques'],
      credits: 22,
      objectives: [
        'Préparer l\'entrée à la lecture et à l\'écriture',
        'Consolider les apprentissages mathématiques',
        'Développer l\'esprit critique et la curiosité',
        'Renforcer les compétences sociales'
      ],
      curriculum: [
        'Français - Pré-lecture et graphisme',
        'Mathématiques',
        'Éducation physique',
        'Arts plastiques et musique'
      ],
      teachingApproach: 'En Grande Section, nous progressons vers des apprentissages plus structurés tout en maintenant une approche ludique. Les enfants commencent à développer des méthodes de travail qui les prépareront à l\'école élémentaire.',
      enrollment: 'Les inscriptions se font en septembre. Veuillez contacter le secrétariat pour les modalités d\'admission.',
      price: 'Consultez notre barème des frais de scolarité'
    },
    {
      id: 3,
      title: 'Cycle 1 : CI - CP',
      department: 'Élémentaire',
      level: 'Élémentaire',
      duration: '2 ans',
      description: 'Acquisition de la lecture, écriture et mathématiques fondamentales avec initiation aux matières d\'éveil.',
      features: ['Lecture et écriture', 'Mathématiques fondamentales', 'Sciences'],
      credits: 24,
      objectives: [
        'Maîtriser la lecture et l\'écriture',
        'Consolider les bases mathématiques',
        'Initier aux sciences et à l\'observation',
        'Développer la confiance et l\'autonomie'
      ],
      curriculum: [
        'Français',
        'Mathématiques',
        'Découverte du monde',
        'Éducation physique et artistique'
      ],
      teachingApproach: 'Nous utilisons une pédagogie progressive et différenciée pour accompagner chaque enfant dans ses apprentissages. L\'objectif principal est la maîtrise de la lecture et de l\'écriture.',
      enrollment: 'Les inscriptions se font en septembre. Veuillez contacter le secrétariat pour les modalités d\'admission.',
      price: 'Consultez notre barème des frais de scolarité'
    },
    {
      id: 4,
      title: 'Cycle 2 : CE1 - CE2',
      department: 'Élémentaire',
      level: 'Élémentaire',
      duration: '2 ans',
      description: 'Consolidation des apprentissages avec introduction à l\'histoire, la géographie et les sciences expérimentales.',
      features: ['Consolidation', 'Sciences', 'Géographie'],
      credits: 26,
      objectives: [
        'Consolider la lecture et la compréhension',
        'Approfondir les mathématiques',
        'Initier à l\'histoire et la géographie',
        'Développer l\'esprit scientifique'
      ],
      curriculum: [
        'Français et littérature',
        'Mathématiques',
        'Sciences et technologie',
        'Histoire-Géographie'
      ],
      teachingApproach: 'Avec le développement cognitif des enfants, nous introduisons progressivement les matières d\'éveil. L\'apprentissage reste fondé sur l\'observation et l\'expérience.',
      enrollment: 'Les inscriptions se font en septembre. Veuillez contacter le secrétariat pour les modalités d\'admission.',
      price: 'Consultez notre barème des frais de scolarité'
    },
    {
      id: 5,
      title: 'Cycle 3 : CM1 - CM2',
      department: 'Élémentaire',
      level: 'Élémentaire',
      duration: '2 ans',
      description: 'Approfondissement des apprentissages et préparation à l\'entrée en sixième avec une approche pluridisciplinaire.',
      features: ['Approfondissement', 'Préparation 6ème', 'Pluridisciplinaire'],
      credits: 28,
      objectives: [
        'Maîtriser les compétences essentielles',
        'Développer l\'autonomie et la réflexion',
        'Préparer la transition vers le collège',
        'Encourager l\'ouverture culturelle'
      ],
      curriculum: [
        'Français',
        'Mathématiques',
        'Histoire-Géographie',
        'Sciences et technologie',
        'Langues vivantes'
      ],
      teachingApproach: 'Les enfants développent une véritable autonomie d\'apprentissage. Nous utilisons des pédagogies actives et des projets interdisciplinaires pour les engager dans leurs apprentissages.',
      enrollment: 'Les inscriptions se font en septembre. Veuillez contacter le secrétariat pour les modalités d\'admission.',
      price: 'Consultez notre barème des frais de scolarité'
    },
    {
      id: 6,
      title: 'Soutien Personnalisé',
      department: 'Soutien & Enrichissement',
      level: 'Soutien',
      duration: 'À la carte',
      description: 'Accompagnement individualisé pour les élèves rencontrant des difficultés spécifiques.',
      features: ['Suivi individuel', 'Diagnostic', 'Accompagnement'],
      credits: 15,
      objectives: [
        'Identifier les difficultés d\'apprentissage',
        'Mettre en place un suivi personnalisé',
        'Renforcer la confiance et l\'estime de soi',
        'Permettre à chaque enfant de progresser à son rythme'
      ],
      curriculum: [
        'Remédiation en lecture et écriture',
        'Soutien en mathématiques',
        'Aide méthodologique',
        'Suivi pédagogique'
      ],
      teachingApproach: 'Nous proposons un accompagnement personnalisé basé sur un diagnostic précis des besoins de chaque enfant. Notre objectif est de restaurer la confiance et de favoriser la réussite.',
      enrollment: 'Le soutien est proposé sur recommandation de l\'équipe pédagogique ou sur demande des parents.',
      price: 'Tarif horaire spécifique - Consultez le secrétariat'
    },
    {
      id: 7,
      title: 'Ateliers d\'Enrichissement',
      department: 'Soutien & Enrichissement',
      level: 'Soutien',
      duration: 'Selon les ateliers',
      description: 'Activités variées pour stimuler la créativité et approfondir des intérêts spécifiques.',
      features: ['Créativité', 'Exploration', 'Passion'],
      credits: 20,
      objectives: [
        'Développer la créativité et l\'imagination',
        'Explorer de nouveaux domaines',
        'Renforcer la confiance en soi',
        'Cultiver les passions et les talents'
      ],
      curriculum: [
        'Arts plastiques avancés',
        'Musique et théâtre',
        'Robotique et codage',
        'Ateliers scientifiques'
      ],
      teachingApproach: 'Nos ateliers d\'enrichissement permettent aux enfants d\'explorer des domaines qui les passionnent. Une pédagogie ludique et créative favorise l\'épanouissement personnel.',
      enrollment: 'Les ateliers se déroulent l\'après-midi et le mercredi. Plusieurs créneaux sont proposés.',
      price: 'Tarif par atelier - Consultez notre catalogue'
    }
  ];

  const program = programsData.find(p => p.id === parseInt(id || '0'));
  const currentIndex = programsData.findIndex(p => p.id === parseInt(id || '0'));
  const prevProgram = currentIndex > 0 ? programsData[currentIndex - 1] : undefined;
  const nextProgram = currentIndex < programsData.length - 1 ? programsData[currentIndex + 1] : undefined;

  if (!program) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
            Programme non trouvé
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="btn-primary"
          >
            Retour aux programmes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <section className="bg-gradient-to-r from-[var(--color-primary-navy)] to-[var(--color-primary-navy-dark)] py-12 section">
        <div className="section-content">
          <div className="flex gap-3 items-center mb-6">
            {prevProgram && (
              <button
                onClick={() => navigate(`/programmes/${prevProgram.id}`)}
                className="w-10 h-10 rounded-lg bg-[var(--color-primary-gold)] hover:bg-white flex items-center justify-center transition-colors duration-300"
                title={`Retour à ${prevProgram.title}`}
              >
                <ChevronLeft className="w-5 h-5 text-[var(--color-primary-navy)]" />
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[var(--color-primary-gold)] hover:text-white transition-colors"
            >
              <Circle className="w-5 h-5 fill-current" />
              Retour aux programmes
            </button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="inline-block mb-4 animate-slide-in-left">
                <span className="badge bg-[var(--color-primary-gold)] text-[var(--color-primary-navy)]">
                  {program.level}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-slide-in-left animation-delay-100">
                {program.title}
              </h1>
              <p className="text-lg text-[var(--color-primary-gold-light)] animate-slide-in-left animation-delay-200">
                {program.department}
              </p>
            </div>
            <div className="flex gap-3 items-center flex-shrink-0">
              <div className="w-16 h-16 rounded-lg bg-[var(--color-primary-gold)] flex items-center justify-center animate-slide-in-right animation-delay-150">
                <BookOpen className="w-8 h-8 text-[var(--color-primary-navy)]" />
              </div>
              {nextProgram && (
                <button
                  onClick={() => navigate(`/programmes/${nextProgram.id}`)}
                  className="w-12 h-12 rounded-lg bg-[var(--color-primary-gold)] hover:bg-white flex items-center justify-center transition-colors duration-300"
                  title={`Aller à ${nextProgram.title}`}
                >
                  <ChevronRight className="w-6 h-6 text-[var(--color-primary-navy)]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 section">
        <div className="section-content">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Overview */}
              <div className="card mb-8">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
                    À propos de ce programme
                  </h2>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
                    {program.description}
                  </p>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    {program.teachingApproach}
                  </p>
                </div>
              </div>

              {/* Objectives */}
              <div className="card mb-8">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-3">
                    <Target className="w-6 h-6 text-[var(--color-primary-navy)]" />
                    Objectifs pédagogiques
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {program.objectives.map((objective, idx) => (
                      <div key={idx} className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-[var(--color-primary-gold)] flex-shrink-0 mt-0.5" />
                        <span className="text-[var(--color-text-secondary)]">{objective}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Curriculum */}
              <div className="card">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-3">
                    <Zap className="w-6 h-6 text-[var(--color-primary-navy)]" />
                    Programme d'études
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {program.curriculum.map((subject, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-primary-navy)] mt-2 flex-shrink-0" />
                        <span className="text-[var(--color-text-secondary)]">{subject}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Key Info */}
              <div className="card mb-8 sticky top-20">
                <div className="p-8">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-6">
                    Informations clés
                  </h3>

                  <div className="space-y-6">
                    {/* Duration */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-[var(--color-primary-navy)]" />
                        <span className="font-medium text-[var(--color-text-primary)]">Durée</span>
                      </div>
                      <p className="text-[var(--color-text-secondary)] ml-8">
                        {program.duration}
                      </p>
                    </div>

                    {/* Capacity */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-[var(--color-primary-navy)]" />
                        <span className="font-medium text-[var(--color-text-primary)]">Capacité</span>
                      </div>
                      <p className="text-[var(--color-text-secondary)] ml-8">
                        {program.credits} élèves par classe
                      </p>
                    </div>

                    {/* Features */}
                    <div>
                      <span className="font-medium text-[var(--color-text-primary)] block mb-3">
                        Caractéristiques
                      </span>
                      <div className="space-y-2 ml-8">
                        {program.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="inline-block badge bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
                          >
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--color-border)] pt-6 mt-6">
                    <p className="text-xs text-[var(--color-text-muted)] mb-4">
                      {program.enrollment}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {program.price}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => navigate('/admissions#contact')}
                className="w-full btn-primary py-3 text-lg font-medium"
              >
                Demander des informations
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProgramDetailPage;
