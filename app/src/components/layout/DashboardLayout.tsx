import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
import { api } from '../../lib/api';
import { API } from '../../lib/apiRoutes';
import { getReadableApiError } from '../../lib/errorUtils';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { pickCurrentPageName } from '../../lib/currentPage';
import {
  Menu,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronDown,
  Home,
  BookOpen,
  Calendar,
  MessageSquare,
  FileText,
  Users,
  Settings,
  ClipboardList,
  Award,
  ClipboardCheck,
  Heart,
  ShieldCheck,
  TrendingUp,
  Mail,
  X,
  Bell,
  GraduationCap,
  Sparkles,
  ScrollText,
  Palette,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

type TopbarNotification = {
  id: string;
  kind: 'message' | 'appointment';
  title: string;
  subtitle: string;
  dateLabel: string;
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [notifications, setNotifications] = useState<TopbarNotification[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [pendingAppointmentCount, setPendingAppointmentCount] = useState(0);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const location = useLocation();
  const navigate = useNavigate();
  const refreshTick = useLiveRefresh(15000);
  const mainRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      const isLarge = window.matchMedia('(min-width: 1024px)').matches;
      setIsLargeScreen(isLarge);
      if (!isLarge) setSidebarOpen(false);
    };
    checkScreenSize();
    const mq = window.matchMedia('(min-width: 1024px)');
    mq.addEventListener('change', checkScreenSize);
    return () => mq.removeEventListener('change', checkScreenSize);
  }, []);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
    setSidebarOpen(false);
    setUserMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    // P3-2: Escape closes any open popover for keyboard users.
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setUserMenuOpen(false);
      setNotificationsOpen(false);
    };
    if (userMenuOpen || notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen, notificationsOpen]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;

      try {
        setNotificationsLoading(true);
        setNotificationsError('');

        const [unreadRes, inboxRes, appointmentsRes] = await Promise.all([
          api.get(API.MESSAGES_UNREAD_COUNT),
          api.get(API.MESSAGES('received'), { params: { unreadOnly: true, limit: 5 } }),
          api.get(API.APPOINTMENTS)
        ]);

        const unreadCount = unreadRes.data?.data?.unreadCount ?? 0;
        const messageItems = Array.isArray(inboxRes.data?.data?.messages) ? inboxRes.data.data.messages : [];
        const appointmentItems = Array.isArray(appointmentsRes.data?.data?.appointments)
          ? appointmentsRes.data.data.appointments
          : [];

        const pendingAppointments = appointmentItems.filter((item: any) => item?.status === 'PENDING');

        const messageNotifications: TopbarNotification[] = messageItems.slice(0, 3).map((item: any) => {
          const sender = [item.sender?.firstName, item.sender?.lastName].filter(Boolean).join(' ').trim() || 'Expediteur';
          return {
            id: `msg-${item.id}`,
            kind: 'message',
            title: `Nouveau message de ${sender}`,
            subtitle: item.subject || 'Message',
            dateLabel: item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : '-'
          };
        });

        const appointmentNotifications: TopbarNotification[] = pendingAppointments.slice(0, 3).map((item: any) => ({
          id: `apt-${item.id}`,
          kind: 'appointment',
          title: 'Rendez-vous en attente',
          subtitle: String(item.appointmentType || 'Rendez-vous').replace(/_/g, ' '),
          dateLabel: item.scheduledDatetime
            ? new Date(item.scheduledDatetime).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
            : '-'
        }));

        setUnreadMessageCount(unreadCount);
        setPendingAppointmentCount(pendingAppointments.length);
        setNotifications([...messageNotifications, ...appointmentNotifications].slice(0, 6));
      } catch (error) {
        console.error('Erreur chargement notifications:', error);
        const message = getReadableApiError(error, 'Impossible de charger les notifications');
        if (message) {
          setNotificationsError(message);
        } else {
          setNotificationsError('');
        }
        setUnreadMessageCount(0);
        setPendingAppointmentCount(0);
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    };

    loadNotifications();
  }, [user, refreshTick]);

  const handleMainClick = () => {
    if (!isLargeScreen && sidebarOpen) setSidebarOpen(false);
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'STUDENT':
        return '/student';
      case 'PARENT':
        return '/parent';
      case 'TEACHER':
        return '/teacher';
      case 'ADMIN':
        return '/admin';
      default:
        return '/';
    }
  };

  const getNavigationItems = () => {
    if (!user) return [];
    const base = [{ name: 'Tableau de bord', href: getDashboardPath(), icon: Home }];

    switch (user.role) {
      case 'STUDENT':
        return [
          ...base,
          { name: 'Mes Notes', href: '/student/grades', icon: Award },
          { name: 'Emploi du Temps', href: '/student/schedule', icon: Calendar },
          { name: 'Devoirs', href: '/student/homework', icon: ClipboardCheck },
          { name: 'Messages', href: '/student/messages', icon: Mail },
          { name: 'Comportement', href: '/student/behavior', icon: TrendingUp },
          { name: 'Rendez-vous', href: '/student/appointments', icon: MessageSquare },
          { name: 'Bulletins', href: '/student/report-cards', icon: FileText },
        ];
      case 'PARENT':
        return [
          ...base,
          { name: 'Mes Enfants', href: '/parent/children', icon: Users },
          { name: 'Présence', href: '/parent/attendance', icon: ClipboardCheck },
          { name: 'Devoirs', href: '/parent/homework', icon: ClipboardList },
          { name: 'Messages', href: '/parent/messages', icon: Mail },
          { name: 'Comportement', href: '/parent/behavior', icon: TrendingUp },
          { name: 'Santé', href: '/parent/health', icon: Heart },
          { name: 'Personnes Autorisées', href: '/parent/pickup', icon: ShieldCheck },
          { name: 'Notes', href: '/parent/grades', icon: Award },
          { name: 'Emplois du Temps', href: '/parent/schedule', icon: Calendar },
          { name: 'Rendez-vous', href: '/parent/appointments', icon: MessageSquare },
        ];
      case 'TEACHER':
        return [
          ...base,
          { name: 'Mes Classes', href: '/teacher/classes', icon: BookOpen },
          { name: 'Mes Élèves', href: '/teacher/students', icon: Users },
          { name: 'Présence', href: '/teacher/attendance', icon: ClipboardCheck },
          { name: 'Devoirs', href: '/teacher/homework', icon: ClipboardList },
          { name: 'Messages', href: '/teacher/messages', icon: Mail },
          { name: 'Comportement', href: '/teacher/behavior', icon: TrendingUp },
          { name: 'Gestion Notes', href: '/teacher/grades', icon: Award },
          { name: 'Emploi du Temps', href: '/teacher/schedule', icon: Calendar },
        ];
      case 'ADMIN':
        return [
          ...base,
          { name: 'Utilisateurs', href: '/admin/users', icon: Users },
          { name: 'Classes', href: '/admin/classes', icon: BookOpen },
          { name: 'Matières', href: '/admin/subjects', icon: ClipboardList },
          { name: 'Années & Trimestres', href: '/admin/years', icon: Calendar },
          { name: 'Emplois du temps', href: '/admin/schedules', icon: Calendar },
          { name: 'Verrous de notes', href: '/admin/grade-locks', icon: FileText },
          { name: 'Parents & Élèves', href: '/admin/parents-students', icon: Users },
          { name: 'Rendez-vous', href: '/admin/appointments', icon: MessageSquare },
          { name: 'Présence', href: '/admin/attendance', icon: ClipboardCheck },
          { name: 'Bulletins Semestriels', href: '/admin/bulletins', icon: FileText },
          { name: 'Santé', href: '/admin/health', icon: Heart },
          { name: 'Ramassage', href: '/admin/pickup', icon: ShieldCheck },
          { name: 'Page Accueil', href: '/admin/mainpage', icon: Home },
          { name: 'Page Programmes', href: '/admin/content/programs', icon: GraduationCap },
          { name: 'Page Vie du Campus', href: '/admin/content/campuslife', icon: Sparkles },
          { name: 'Page Admissions', href: '/admin/content/admissions', icon: ScrollText },
          { name: 'Identité du site', href: '/admin/branding', icon: Palette },
          { name: 'Paramètres', href: '/admin/settings', icon: Settings },
        ];
      default:
        return base;
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'STUDENT':
        return 'bg-lime-500';
      case 'PARENT':
        return 'bg-emerald-500';
      case 'TEACHER':
        return 'bg-amber-500';
      case 'ADMIN':
        return 'bg-stone-700';
      default:
        return 'bg-slate-400';
    }
  };

  const getRoleName = () => {
    switch (user?.role) {
      case 'STUDENT':
        return 'Élève';
      case 'PARENT':
        return 'Parent';
      case 'TEACHER':
        return 'Enseignant';
      case 'ADMIN':
        return 'Administrateur';
      default:
        return '';
    }
  };

  const getRoleBadgeClass = () => {
    switch (user?.role) {
      case 'STUDENT':
        return 'badge badge-student';
      case 'PARENT':
        return 'badge badge-parent';
      case 'TEACHER':
        return 'badge badge-teacher';
      case 'ADMIN':
        return 'badge badge-admin';
      default:
        return 'badge';
    }
  };

  const getMessagesPath = () => {
    switch (user?.role) {
      case 'STUDENT':
        return '/student/messages';
      case 'PARENT':
        return '/parent/messages';
      case 'TEACHER':
        return '/teacher/messages';
      default:
        return getDashboardPath();
    }
  };

  const getAppointmentsPath = () => {
    switch (user?.role) {
      case 'STUDENT':
        return '/student/appointments';
      case 'PARENT':
        return '/parent/appointments';
      case 'ADMIN':
        return '/admin/appointments';
      default:
        return getDashboardPath();
    }
  };

  const totalNotificationCount = unreadMessageCount + pendingAppointmentCount;

  const navigation = getNavigationItems();
  // P2-7: longest-prefix wins so sub-routes (e.g. /admin/users/123) still
  // surface their parent's label instead of falling back to "Tableau de bord".
  const currentPage = pickCurrentPageName(navigation, location.pathname, 'Tableau de bord');

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
      <aside className={`sidebar border-r border-[var(--color-divider)] ${!(sidebarOpen || isLargeScreen) ? 'closed' : ''}`}>
        <div className="flex flex-col h-full">
          <div className="sidebar-logo">
            <img src={branding.brand.logoUrl} alt={branding.brand.name} className="sidebar-logo-img" />
            <div className="flex-1 min-w-0">
              <div className="sidebar-logo-title truncate">{branding.brand.name}</div>
              <div className="sidebar-logo-sub">{branding.brand.tagline}</div>
            </div>
            {!isLargeScreen && (
              <button onClick={() => setSidebarOpen(false)} className="topbar-action" aria-label="Fermer le menu">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <nav className="flex-1 py-3 overflow-y-auto">
            <div className="sidebar-section-label">Navigation</div>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`sidebar-nav-item ${location.pathname === item.href ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-user">
            <div className={`w-9 h-9 rounded-full ${getRoleColor()} flex items-center justify-center flex-shrink-0`}>
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="sidebar-user-name truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="sidebar-user-role">{getRoleName()}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isLargeScreen ? 'ml-64' : 'ml-0'}`}>
        <header className="topbar">
          <div className="flex items-center gap-3">
            {!isLargeScreen && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="topbar-action" aria-label="Ouvrir le menu">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h1 className="topbar-title">{currentPage}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* P2-5: search input removed — it had no handler / no target.
                Reintroduce as a real component when global search is wired. */}

            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                className="topbar-action relative"
                aria-label={`Notifications${totalNotificationCount > 0 ? ` (${totalNotificationCount} non lues)` : ''}`}
                aria-haspopup="menu"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((prev) => !prev)}
              >
                <Bell className="w-4 h-4" aria-hidden="true" />
                {totalNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center font-semibold">
                    {totalNotificationCount > 99 ? '99+' : totalNotificationCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 rounded-2xl border py-2 z-50"
                  style={{
                    background: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <div className="px-4 pb-2 border-b" style={{ borderColor: 'var(--color-divider)' }}>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                        Notifications
                      </p>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        {totalNotificationCount} nouvelle(s)
                      </span>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto py-1">
                    {notificationsLoading ? (
                      <div className="px-4 py-3" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                        Chargement...
                      </div>
                    ) : notificationsError ? (
                      <div className="px-4 py-3 text-red-600" style={{ fontSize: 'var(--text-sm)' }}>
                        {notificationsError}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-3" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                        Aucune notification
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setNotificationsOpen(false);
                            navigate(item.kind === 'message' ? getMessagesPath() : getAppointmentsPath());
                          }}
                          className="w-full text-left px-4 py-3 transition-colors hover:bg-[var(--color-surface-offset)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{item.title}</p>
                              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{item.subtitle}</p>
                            </div>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{item.dateLabel}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="topbar-action"
              aria-label={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-150 hover:bg-[var(--color-surface-offset)]"
                style={{ fontSize: 'var(--text-sm)' }}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label="Menu utilisateur"
              >
                <div className={`w-7 h-7 rounded-full ${getRoleColor()} flex items-center justify-center flex-shrink-0`}>
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-medium hidden sm:block max-w-[120px] truncate" style={{ color: 'var(--color-text)' }}>
                  {user?.firstName}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--color-text-muted)' }}
                />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl border py-1 z-50 animate-fade-in"
                  style={{
                    background: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-divider)' }}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${getRoleColor()} flex items-center justify-center flex-shrink-0`}>
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                          {user?.firstName} {user?.lastName}
                        </p>
                        <span className={getRoleBadgeClass()} style={{ marginTop: '2px' }}>
                          {getRoleName()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/"
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                      style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}
                    >
                      <Home className="w-4 h-4" />
                      Retour au site
                    </Link>

                    <div style={{ height: '1px', background: 'var(--color-divider)', margin: '4px 16px' }} />

                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 transition-colors"
                      style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main ref={mainRef} onClick={handleMainClick} className="dashboard-main flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>

      {sidebarOpen && !isLargeScreen && (
        <div
          className="fixed inset-0 z-30"
          style={{ background: 'rgba(18,22,16,0.36)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
