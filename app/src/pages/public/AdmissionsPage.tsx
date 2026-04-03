import type React from 'react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { api } from '../../lib/api';
import { 
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  UserPlus,
  ClipboardList,
  CreditCard
} from 'lucide-react';

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};

type CollegeInfo = {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  principal: string;
  year: string;
};

type AdmissionsContent = {
  hero: {
    title: string;
    subtitle: string;
    image?: string;
  };
  content: {
    requirements?: string;
    process?: string;
    timeline?: string;
    contact?: string;
    [key: string]: string | undefined;
  };
};

const AdmissionsPage: React.FC = () => {
  const location = useLocation();
  const [selectedStep, setSelectedStep] = useState(0);
  const [collegeInfo, setCollegeInfo] = useState<CollegeInfo>({
    name: 'Forum de L\'excellence',
    address: 'Medinatoul Salam, Mbour, Sénégal',
    phone: '+221 775368254',
    email: 'gsforumexcellence@gmail.com',
    website: 'www.forumexcellence.sn',
    principal: 'M. et Mme Fall',
    year: '2025-2026'
  });

  const [pageContent, setPageContent] = useState<AdmissionsContent>({
    hero: {
      title: 'Admissions - Forum de L\'excellence',
      subtitle: 'Inscrivez votre enfant dans notre établissement d\'excellence',
      image: '/admissions-hero.jpg'
    },
    content: {
      requirements: '',
      process: '',
      timeline: '',
      contact: ''
    }
  });

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const settingsResponse = await api.get<ApiResponse<{ general?: CollegeInfo }>>('/api/settings');
        const settingsResult = settingsResponse.data;
        if (settingsResult.success && settingsResult.data && settingsResult.data.general) {
          setCollegeInfo(settingsResult.data.general);
        }
      } catch (error: unknown) {
        console.error('Erreur chargement infos collège:', error);
      }

      try {
        const contentResponse = await api.get<ApiResponse<AdmissionsContent>>('/api/pages/admissions');
        const contentResult = contentResponse.data;
        if (contentResult.success && contentResult.data) {
          setPageContent(contentResult.data);
        }
      } catch (error: unknown) {
        console.error('Erreur chargement contenu:', error);
      }
    };

    loadPageData();
  }, []);

  useEffect(() => {
    if (!location.hash) return;
    const targetId = location.hash.replace('#', '');
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const steps = [
    {
      icon: UserPlus,
      title: '1. Démarche de Candidature',
      description: 'Complétez votre dossier de candidature ou rendez visite à notre établissement prestigieux à Medinatoul Salam (Mbour) pour une première rencontre.',
      details: [
        'Formulaire de candidature détaillé',
        'Acte de naissance certifié',
        'Dossier vaccinal complet et à jour',
        'Photographie d\'identité professionnelle',
        'Certificat médical scolaire de conformité'
      ]
    },
    {
      icon: ClipboardList,
      title: '2. Évaluation Pédagogique',
      description: 'Rencontre enrichissante avec notre direction pour évaluer l\'adéquation avec le cursus et connaître la vision pédagogique de notre institution.',
      details: [
        'Accueil personnalisé des familles',
        'Évaluation douce du niveau en lecture et mathématiques',
        'Entretien approfondi sur les aspirations',
        'Visite guidée des installations modernes',
        'Discussion sur l\'orientation pédagogique'
      ]
    },
    {
      icon: CheckCircle,
      title: '3. Acceptation Officielle',
      description: 'Confirmation de l\'admission et remise des documents essentiels pour une rentrée en douceur.',
      details: [
        'Lettre d\'acceptation officielle',
        'Liste exhaustive des fournitures scolaires',
        'Calendrier académique détaillé',
        'Règlement intérieur et politique de l\'école',
        'Informations sur les services additionnels'
      ]
    },
    {
      icon: CreditCard,
      title: '4. Finalisation Administrative',
      description: 'Complétion des démarches administratives et intégration officielle à notre communauté d\'excellence.',
      details: [
        'Formalisation des frais de scolarité',
        'Signature du contrat d\'engagement',
        'Sélection des services (restauration, transport)',
        'Réunion d\'intégration parents-école',
        'Activation du portail parent numérique'
      ]
    }
  ];

  const requirements = [
    { level: 'Maternelle (PS-MS-GS)', requirements: ['Âge 3-5 ans', 'Propreté acquise', 'Carnet de vaccination à jour'] },
    { level: 'Élémentaire (CI-CP)', requirements: ['Âge 6-7 ans', 'Prérequis en langage oral', 'Test de positionnement léger'] },
    { level: 'Élémentaire (CE1-CE2-CM1-CM2)', requirements: ['Âge 8-11 ans', 'Bulletins des 2 dernières années', 'Entretien avec les parents'] }
  ];

  const deadlines = [
    { phase: 'Ouverture des inscriptions', date: '1er Février 2025', status: 'En cours' },
    { phase: 'Clôture des inscriptions', date: '30 Juin 2025', status: 'À venir' },
    { phase: 'Rencontres familles', date: 'Mars - Juillet 2025', status: 'À venir' },
    { phase: 'Rentrée scolaire', date: '06 Octobre 2025', status: 'À venir' }
  ];

  const faqs = [
    {
      question: 'Quels sont les frais de scolarité ?',
      answer: 'Les frais varient selon le niveau (maternelle / élémentaire). Des facilités de paiement et quelques bourses sociales sont proposées.'
    },
    {
      question: 'Y a-t-il un test d\'entrée ?',
      answer: 'Seuls de courts tests de positionnement et un entretien sont prévus pour placer l\'enfant dans le bon niveau.'
    },
    {
      question: 'Proposez-vous le transport scolaire ?',
      answer: 'Oui, un service de transport est disponible sur Medinatoul Salam et les environs de Mbour (sur inscription).'
    },
    {
      question: 'Comment contacter la direction ?',
      answer: 'Téléphone : +221 775368254 — Email : gsforumexcellence@gmail.com — Visite sur rendez-vous.'
    }
  ];

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
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-200">
              <a href="#apply" className="btn-accent text-lg px-8 py-4">
                <UserPlus className="w-5 h-5 mr-2 inline" />
                Débuter le Processus
              </a>
              <a href="#contact" className="btn-secondary text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-[var(--color-primary-navy)]">
                Contactez-nous Aujourd'hui
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 bg-[var(--color-bg-primary)] section" id="process">
        <div className="section-content">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Processus d'Admission
            </h2>
              <p className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto">
                Un parcours clair pour accueillir les enfants de 3 à 11 ans, avec un échange rapproché avec les familles.
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const { ref, isVisible } = useScrollReveal();
              const delayClass = ['', 'animation-delay-100', 'animation-delay-200', 'animation-delay-300'][index];
              return (
                <div
                  key={index}
                  ref={ref}
                  className={`card p-6 cursor-pointer transition-all ${selectedStep === index ? 'ring-2 ring-[var(--color-primary-navy)]' : ''} ${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${delayClass}`}
                  onClick={() => setSelectedStep(index)}
                >
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-primary-navy)] text-white">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] text-center mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[var(--color-text-secondary)] text-center text-sm">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Step Details */}
          <div className="mt-12">
            <div className="card p-8">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
                {steps[selectedStep].title} - Détails
              </h3>
              <ul className="space-y-3">
                {steps[selectedStep].details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[var(--color-success)] flex-shrink-0 mt-0.5" />
                    <span className="text-[var(--color-text-secondary)]">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 bg-[var(--color-bg-secondary)] section" id="requirements">
        <div className="section-content">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Critères d'Admission
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Chaque niveau d'études a des critères spécifiques d'admission.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {requirements.map((req, index) => {
              const { ref, isVisible } = useScrollReveal();
              const delayClass = ['', 'animation-delay-100', 'animation-delay-200'][index];
              return (
              <div key={index} ref={ref} className={`card p-6 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${delayClass}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-gold-light)] flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[var(--color-primary-navy)]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                    {req.level}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {req.requirements.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                      <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* Deadlines Section */}
      <section className="py-20 bg-[var(--color-bg-primary)] section">
        <div className="section-content">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Calendrier des Admissions
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Restez informé des dates importantes du processus d'admission.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="space-y-4">
              {deadlines.map((deadline, index) => {
                const { ref, isVisible } = useScrollReveal();
                return (
                <div key={index} ref={ref} className={`card p-6 flex items-center justify-between ${isVisible ? 'animate-fade-in-up' : 'opacity-0'} animation-delay-${index * 100}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary-navy)] flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-[var(--color-primary-gold)]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--color-text-primary)]">
                        {deadline.phase}
                      </h4>
                      <p className="text-[var(--color-text-muted)]">{deadline.date}</p>
                    </div>
                  </div>
                  <span className={`badge ${
                    deadline.status === 'En cours' 
                      ? 'bg-[var(--color-success)] text-white' 
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                  }`}>
                    {deadline.status}
                  </span>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-[var(--color-bg-secondary)] section" id="contact">
        <div className="section-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-6">
                Contactez-nous
              </h2>
              <p className="text-lg text-[var(--color-text-secondary)] mb-8">
                Notre équipe est à votre disposition pour répondre à toutes vos questions 
                concernant les admissions.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-navy)] flex items-center justify-center">
                    <Phone className="w-6 h-6 text-[var(--color-primary-gold)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--color-text-primary)]">Téléphone</h4>
                    <p className="text-[var(--color-text-secondary)]">{collegeInfo.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-navy)] flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[var(--color-primary-gold)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--color-text-primary)]">Email</h4>
                    <p className="text-[var(--color-text-secondary)]">{collegeInfo.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-navy)] flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-[var(--color-primary-gold)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--color-text-primary)]">Adresse</h4>
                    <p className="text-[var(--color-text-secondary)]">{collegeInfo.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-navy)] flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[var(--color-primary-gold)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--color-text-primary)]">Directeurs</h4>
                    <p className="text-[var(--color-text-secondary)]">{collegeInfo.principal}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
                Questions Fréquentes
              </h3>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <details key={index} className="card p-4 group">
                    <summary className="flex items-center justify-between cursor-pointer font-medium text-[var(--color-text-primary)]">
                      {faq.question}
                      <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-open:rotate-90 transition-transform" />
                    </summary>
                    <p className="mt-3 text-[var(--color-text-secondary)] leading-relaxed">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero text-white section" id="apply">
        <div className="section-content-narrow text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à Rejoindre le Forum de L'excellence ?
          </h2>
              <p className="text-xl text-white/90 mb-8">
            Ne manquez pas l'opportunité de donner à votre enfant une éducation épanouissante. 
            Les inscriptions pour l'année 2025-2026 sont ouvertes !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="btn-accent text-lg px-8 py-4 inline-flex items-center justify-center">
              <UserPlus className="w-5 h-5 mr-2 inline" />
              Connexion (comptes créés par l'admin)
            </Link>
            <a href="tel:+221775368254" className="btn-secondary text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-[var(--color-primary-navy)]">
              <Phone className="w-5 h-5 mr-2 inline" />
              Nous Appeler
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdmissionsPage;