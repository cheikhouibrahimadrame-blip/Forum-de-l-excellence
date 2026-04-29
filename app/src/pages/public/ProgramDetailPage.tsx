import type React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Target,
  Zap,
  ArrowLeft,
  Calendar,
  Phone,
  GraduationCap,
  Sparkles,
  Award
} from 'lucide-react';
import { LivingHero, LivingCTA, Reveal } from '../../components/public/living';

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
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg-primary)]">
      {/* ───────── Cinematic Living Hero ───────── */}
      <LivingHero
        eyebrow={`${program.level} · ${program.department}`}
        title={program.title}
        subtitle={program.description}
        primary={{ label: "Demander des informations", to: "/admissions#contact", icon: <Calendar className="w-5 h-5" /> }}
        secondary={{ label: "Tous les programmes", to: "/programmes", icon: <GraduationCap className="w-5 h-5" /> }}
        trust={[
          { icon: <Clock className="w-4 h-4" />, label: program.duration },
          { icon: <Users className="w-4 h-4" />, label: `${program.credits} élèves max` },
          { icon: <Sparkles className="w-4 h-4" />, label: program.department },
        ]}
        scrollCueTarget="detail"
        minHeight="min(70vh, 640px)"
      />

      {/* Quick navigation row */}
      <div className="border-b" style={{ borderColor: 'color-mix(in oklch, var(--oak-olive) 12%, transparent)', background: 'var(--color-bg-card)' }}>
        <div className="section-content py-4 flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="oak-magnetic-link inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: 'var(--oak-olive)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux programmes
          </button>
          <div className="flex gap-2 items-center">
            {prevProgram && (
              <button
                onClick={() => navigate(`/programmes/${prevProgram.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: 'color-mix(in oklch, var(--oak-olive) 10%, white)',
                  color: 'var(--oak-olive)',
                  border: '1px solid color-mix(in oklch, var(--oak-olive) 22%, transparent)',
                }}
                title={`Précédent : ${prevProgram.title}`}
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>
            )}
            {nextProgram && (
              <button
                onClick={() => navigate(`/programmes/${nextProgram.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white oak-shine"
                style={{ background: 'var(--oak-olive)' }}
                title={`Suivant : ${nextProgram.title}`}
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <section id="detail" className="py-16 section relative overflow-hidden">
        <div className="oak-blob oak-blob-chartreuse absolute opacity-25 -z-0"
          style={{ width: 320, height: 320, top: '-8%', right: '-6%' }} />
        <div className="oak-blob oak-blob-peach absolute opacity-20 -z-0"
          style={{ width: 260, height: 260, bottom: '-6%', left: '-4%' }} />
        <div className="section-content relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Overview */}
              <Reveal><div className="card oak-spotlight mb-8">
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
              </div></Reveal>

              {/* Objectives */}
              <Reveal delay={1}><div className="card oak-spotlight mb-8">
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
              </div></Reveal>

              {/* Curriculum */}
              <Reveal delay={2}><div className="card oak-spotlight">
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
              </div></Reveal>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Key Info */}
              <Reveal delay={1}><div className="card oak-spotlight oak-tilt mb-8 sticky top-20">
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
              </div></Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Living CTA ───────── */}
      <LivingCTA
        eyebrow="Inscriptions 2025–2026 ouvertes"
        title={`Inscrivez votre enfant en ${program.level}`}
        description="Notre équipe est à votre disposition pour répondre à vos questions et organiser une rencontre."
        primary={{ label: "Demander des informations", to: "/admissions#contact", icon: <Calendar className="w-5 h-5" /> }}
        secondary={{ label: "Nous appeler", to: "#", href: "tel:+221775368254", icon: <Phone className="w-5 h-5" /> }}
        badges={[
          { icon: <Award className="w-4 h-4" />, label: "Excellence reconnue" },
          { icon: <BookOpen className="w-4 h-4" />, label: program.curriculum.length + ' matières' },
          { icon: <Users className="w-4 h-4" />, label: `${program.credits} élèves max` },
        ]}
      />
    </div>
  );
};

export default ProgramDetailPage;
