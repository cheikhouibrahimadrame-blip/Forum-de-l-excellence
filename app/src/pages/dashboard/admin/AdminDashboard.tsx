import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  MailCheck,
  ClipboardList,
  BookOpen,
  CalendarClock,
  LayoutTemplate,
  FileSpreadsheet,
  Settings,
  Link as LinkIcon,
  BellRing,
  Lock,
  Globe
} from 'lucide-react';

type SectionLink = {
  label: string;
  to: string;
  scrollTo?: string;
};

type Section = {
  title: string;
  icon: React.ElementType;
  links: SectionLink[];
  badges: string[];
};

type LocationState = {
  scrollTo?: string;
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [academicYears, setAcademicYears] = useState<Array<{ year: string; isActive: boolean }>>([]);
  const [userCounts, setUserCounts] = useState({ active: 0, mustChangePassword: 0, disabled: 0 });
  const [allowedDomainsCount, setAllowedDomainsCount] = useState<number | null>(null);
  const [classSummary, setClassSummary] = useState({ classes: 0, subjects: 0, teachers: 0, yearsClosed: 0 });
  const [appointmentSummary, setAppointmentSummary] = useState({ pending: 0, confirmed: 0, cancelled: 0 });
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    const scrollTargets: { [key: string]: string } = {
      'contenu-site-public': 'admin-card-contenu-site-public',
      'utilisateurs-acces': 'admin-card-utilisateurs-acces',
      'classes-matieres': 'admin-card-classes-matieres',
      'annees-academiques': 'admin-card-annees-academiques',
      'parents-eleves': 'admin-card-parents-eleves',
      'emplois-du-temps': 'admin-card-emplois-du-temps',
      'notes-verrous': 'admin-card-notes-verrous',
      'rendez-vous': 'admin-card-rendez-vous',
      'parametres-securite': 'admin-card-parametres-securite'
    };

    const locationState = location.state as LocationState | null;
    const targetKey = locationState?.scrollTo;
    if (targetKey && scrollTargets[targetKey]) {
      const element = document.getElementById(scrollTargets[targetKey]);
      if (element) {
        element.scrollIntoView({ behavior: 'auto', block: 'center' });
        element.classList.add('ring-2', 'ring-[var(--color-primary-gold)]', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-[var(--color-primary-gold)]', 'ring-offset-2');
        }, 2000);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setStatsError('');
        const [
          activeRes,
          mustChangeRes,
          disabledRes,
          teachersRes,
          settingsRes,
          yearsRes,
          classesRes,
          subjectsRes,
          appointmentsRes
        ] = await Promise.all([
          api.get('/api/users', { params: { status: 'active', limit: 1 } }),
          api.get('/api/users', { params: { status: 'mustChangePassword', limit: 1 } }),
          api.get('/api/users', { params: { status: 'disabled', limit: 1 } }),
          api.get('/api/users', { params: { role: 'TEACHER', limit: 1 } }),
          api.get('/api/settings'),
          api.get('/api/academic-years'),
          api.get('/api/classes'),
          api.get('/api/subjects'),
          api.get('/api/appointments')
        ]);

        const activeTotal = activeRes.data?.data?.pagination?.total ?? 0;
        const mustChangeTotal = mustChangeRes.data?.data?.pagination?.total ?? 0;
        const disabledTotal = disabledRes.data?.data?.pagination?.total ?? 0;

        setUserCounts({ active: activeTotal, mustChangePassword: mustChangeTotal, disabled: disabledTotal });

        const teacherTotal = teachersRes.data?.data?.pagination?.total ?? 0;

        const settings = settingsRes.data;
        const email = settings?.data?.general?.email || '';
        const domain = email.includes('@') ? email.split('@')[1] : '';
        setAllowedDomainsCount(domain ? 1 : 0);

        const yearsResult = yearsRes.data;
        const years = Array.isArray(yearsResult?.data)
          ? yearsResult.data
              .map((item: { year?: string; isActive?: boolean }) => ({
                year: item.year || '',
                isActive: Boolean(item.isActive)
              }))
              .filter((item: { year: string }) => item.year)
          : [];
        setAcademicYears(years);
        setClassSummary((prev) => ({
          ...prev,
          yearsClosed: years.filter((item: { isActive: boolean }) => !item.isActive).length
        }));

        const classesCount = classesRes.data?.data?.length ?? 0;
        const subjectsCount = subjectsRes.data?.data?.length ?? 0;

        setClassSummary((prev) => ({
          ...prev,
          classes: classesCount,
          subjects: subjectsCount,
          teachers: teacherTotal
        }));

        const appointmentsResult = appointmentsRes.data;
        const items = Array.isArray(appointmentsResult?.data?.appointments)
          ? appointmentsResult.data.appointments
          : [];
        setAppointmentSummary({
          pending: items.filter((item: { status?: string }) => item.status === 'PENDING').length,
          confirmed: items.filter((item: { status?: string }) => item.status === 'CONFIRMED').length,
          cancelled: items.filter((item: { status?: string }) => item.status === 'CANCELLED').length
        });
      } catch (error) {
        console.error('Error loading admin dashboard:', error);
        setStatsError('Erreur lors du chargement des statistiques.');
      }
    };

    fetchDashboardData();
  }, []);

  const quickStats = [
    { label: 'Comptes actifs', value: userCounts.active.toLocaleString('fr-FR'), icon: Users, tone: 'bg-blue-100 text-blue-700' },
    { label: 'En attente (must change pw)', value: userCounts.mustChangePassword.toLocaleString('fr-FR'), icon: ShieldCheck, tone: 'bg-amber-100 text-amber-700' },
    { label: 'Comptes désactivés', value: userCounts.disabled.toLocaleString('fr-FR'), icon: UserX, tone: 'bg-rose-100 text-rose-700' },
    { label: 'Domaines autorisés', value: allowedDomainsCount === null ? '-' : allowedDomainsCount.toString(), icon: MailCheck, tone: 'bg-emerald-100 text-emerald-700' }
  ];

  const sections: Section[] = [
    {
      title: 'Contenu du Site Public',
      icon: Globe,
      links: [
        { label: "Éditer page d'accueil", to: '/admin/mainpage', scrollTo: 'contenu-site-public' },
        { label: 'Éditer page Admissions', to: '/admin/content/admissions', scrollTo: 'contenu-site-public' },
        { label: 'Éditer page Niveaux', to: '/admin/content/programs', scrollTo: 'contenu-site-public' },
        { label: 'Éditer page Vie scolaire', to: '/admin/content/campuslife', scrollTo: 'contenu-site-public' }
      ],
      badges: ['Contenu public', 'En temps réel', 'Admin uniquement']
    },
    {
      title: 'Utilisateurs & Accès',
      icon: Users,
      links: [
        { label: 'Créer un utilisateur', to: '/admin/users', scrollTo: 'utilisateurs-acces' },
        { label: 'Activer / désactiver', to: '/admin/users', scrollTo: 'utilisateurs-acces' },
        { label: 'Forcer mot de passe', to: '/admin/users', scrollTo: 'utilisateurs-acces' }
      ],
      badges: ['Admin-only creation', 'Email institutionnel', 'mustChangePassword']
    },
    {
      title: 'Classes & Matières',
      icon: ClipboardList,
      links: [
        { label: 'Gérer les classes (CI-CM2)', to: '/admin/classes', scrollTo: 'classes-matieres' },
        { label: 'Gérer les matières', to: '/admin/subjects', scrollTo: 'classes-matieres' },
        { label: 'Assigner enseignants', to: '/admin/classes', scrollTo: 'classes-matieres' }
      ],
      badges: ['École primaire', 'Matières dynamiques']
    },
    {
      title: 'Années académiques',
      icon: CalendarClock,
      links: [
        { label: 'Gérer les années', to: '/admin/years', scrollTo: 'annees-academiques' },
        { label: 'Gérer les trimestres', to: '/admin/years', scrollTo: 'annees-academiques' },
        { label: 'Activer année/trimestre', to: '/admin/years', scrollTo: 'annees-academiques' }
      ],
      badges: ['Verrou par trimestre']
    },
    {
      title: 'Parents & Élèves',
      icon: LinkIcon,
      links: [
        { label: 'Lier parents & élèves', to: '/admin/parents-students', scrollTo: 'parents-eleves' },
        { label: 'Voir élèves liés', to: '/admin/parents-students', scrollTo: 'parents-eleves' }
      ],
      badges: ['Multi-élèves par parent']
    },
    {
      title: 'Emplois du temps',
      icon: LayoutTemplate,
      links: [
        { label: 'Publier un horaire', to: '/admin/schedules', scrollTo: 'emplois-du-temps' },
        { label: 'Par classe', to: '/admin/schedules', scrollTo: 'emplois-du-temps' }
      ],
      badges: ['Version publiée']
    },
    {
      title: 'Notes & Verrous',
      icon: FileSpreadsheet,
      links: [
        { label: 'Suivi des saisies', to: '/admin/grade-locks', scrollTo: 'notes-verrous' },
        { label: 'Verrouiller une période', to: '/admin/grade-locks', scrollTo: 'notes-verrous' }
      ],
      badges: ['Droits enseignants']
    },
    {
      title: 'Rendez-vous',
      icon: BellRing,
      links: [
        { label: 'Requêtes en attente', to: '/admin/appointments', scrollTo: 'rendez-vous' },
        { label: 'Réassigner ou annuler', to: '/admin/appointments', scrollTo: 'rendez-vous' }
      ],
      badges: ['Contrôle admin']
    },
    {
      title: 'Paramètres & Sécurité',
      icon: Settings,
      links: [
        { label: 'Domaine email', to: '/admin/settings', scrollTo: 'parametres-securite' },
        { label: 'Politique mot de passe', to: '/admin/settings', scrollTo: 'parametres-securite' },
        { label: 'CORS / Origines', to: '/admin/settings', scrollTo: 'parametres-securite' }
      ],
      badges: ['Pas de signup public', 'Taux limites auth']
    }
  ];

  const activity: Array<{ who: string; what: string; detail: string; status: string }> = [];

  const cardIdByTitle: Record<string, string> = {
    'Contenu du Site Public': 'admin-card-contenu-site-public',
    'Utilisateurs & Accès': 'admin-card-utilisateurs-acces',
    'Classes & Matières': 'admin-card-classes-matieres',
    'Années académiques': 'admin-card-annees-academiques',
    'Parents & Élèves': 'admin-card-parents-eleves',
    'Emplois du temps': 'admin-card-emplois-du-temps',
    'Notes & Verrous': 'admin-card-notes-verrous',
    'Rendez-vous': 'admin-card-rendez-vous',
    'Paramètres & Sécurité': 'admin-card-parametres-securite'
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
          <div className="gradient-card rounded-2xl p-8 text-white flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Console d'administration</h1>
              <p className="text-white/80 text-lg">Gestion centralisée des accès, classes, emplois du temps et sécurité</p>
              <p className="text-white/70 text-sm">Connecté en tant que {user?.firstName} {user?.lastName}</p>
            </div>
            <div className="flex flex-col md:items-end gap-3">
              <label className="text-sm text-white/80">Année académique</label>
              <select className="bg-white/10 border border-white/30 rounded-lg px-4 py-2 text-white">
                {academicYears.length === 0 && (
                  <option value="" className="text-black">Aucune année</option>
                )}
                {academicYears.map((year) => (
                  <option key={year.year} value={year.year} className="text-black">{year.year}</option>
                ))}
              </select>
              <Link to="/admin/users" className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-semibold shadow border border-white/20 hover:bg-white/20 transition-all">
                <Users className="w-4 h-4" /> Créer un utilisateur
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {quickStats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="card p-4 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${stat.tone}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">{stat.label}</div>
                    <div className="text-xl font-bold text-[var(--color-text-primary)]">{stat.value}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {statsError && (
            <div className="text-sm text-red-600">{statsError}</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              const cardId = cardIdByTitle[section.title];
              return (
                <div
                  key={idx}
                  id={cardId}
                  className="card p-5 flex flex-col gap-4 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[var(--color-primary-navy)]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{section.title}</h3>
                        <p className="text-sm text-[var(--color-text-muted)]">Accès réservé Administrateur</p>
                      </div>
                    </div>
                    <Lock className="w-4 h-4 text-[var(--color-text-muted)]" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {section.badges.map((badge) => (
                      <span key={badge} className="text-xs px-2 py-1 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                        {badge}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {section.links.map((link) => (
                      <Link
                        key={link.label}
                        to={link.to}
                        state={link.scrollTo ? { scrollTo: link.scrollTo } : undefined}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                      >
                        <span>{link.label}</span>
                        <ShieldCheck className="w-4 h-4 text-[var(--color-primary-navy)]" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[var(--color-primary-navy)]" /> Flux comptes récents
                </h3>
                <Link to="/admin/users" className="text-sm text-[var(--color-primary-navy)] hover:underline">Gérer</Link>
              </div>
              <div className="space-y-3">
                {activity.map((row, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                    <div className="flex items-center justify-between text-sm text-[var(--color-text-primary)]">
                      <span className="font-medium">{row.what}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">{row.status}</span>
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">{row.detail}</div>
                  </div>
                ))}
                {activity.length === 0 && (
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    Aucune activite recente.
                  </div>
                )}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[var(--color-primary-navy)]" /> Classes & matières (résumé)
              </h3>
              <ul className="space-y-2 text-sm text-[var(--color-text-primary)]">
                <li className="flex justify-between"><span>Classes actives</span><span className="font-semibold">{classSummary.classes}</span></li>
                <li className="flex justify-between"><span>Matières</span><span className="font-semibold">{classSummary.subjects}</span></li>
                <li className="flex justify-between"><span>Enseignants assignés</span><span className="font-semibold">{classSummary.teachers}</span></li>
                <li className="flex justify-between"><span>Années clôturées</span><span className="font-semibold">{classSummary.yearsClosed}</span></li>
              </ul>
            </div>

            <div className="card p-5">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-[var(--color-primary-navy)]" /> Rendez-vous et demandes
              </h3>
              <ul className="space-y-2 text-sm text-[var(--color-text-primary)]">
                <li className="flex justify-between"><span>Requêtes en attente</span><span className="font-semibold">{appointmentSummary.pending}</span></li>
                <li className="flex justify-between"><span>Validées</span><span className="font-semibold">{appointmentSummary.confirmed}</span></li>
                <li className="flex justify-between"><span>Annulées</span><span className="font-semibold">{appointmentSummary.cancelled}</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
