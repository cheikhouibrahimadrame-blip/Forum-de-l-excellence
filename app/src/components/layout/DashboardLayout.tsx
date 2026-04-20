import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
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
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const handleMainClick = () => {
    if (!isLargeScreen && sidebarOpen) setSidebarOpen(false);
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'STUDENT': return '/student';
      case 'PARENT':  return '/parent';
      case 'TEACHER': return '/teacher';
      case 'ADMIN':   return '/admin';
      default:        return '/';
    }
  };

  const getNavigationItems = () => {
    if (!user) return [];
    const base = [{ name: 'Tableau de bord', href: getDashboardPath(), icon: Home }];

    switch (user.role) {
      case 'STUDENT':
        return [
          ...base,
          { name: 'Mes Notes',         href: '/student/grades',       icon: Award },
          { name: 'Emploi du Temps',   href: '/student/schedule',     icon: Calendar },
          { name: 'Devoirs',           href: '/student/homework',     icon: ClipboardCheck },
          { name: 'Messages',          href: '/student/messages',     icon: Mail },
          { name: 'Comportement',      href: '/student/behavior',     icon: TrendingUp },
          { name: 'Rendez-vous',       href: '/student/appointments', icon: MessageSquare },
          { name: 'Bulletins',         href: '/student/report-cards', icon: FileText },
        ];
      case 'PARENT':
        return [
          ...base,
          { name: 'Mes Enfants',          href: '/parent/children',     icon: Users },
          { name: 'Présence',             href: '/parent/attendance',   icon: ClipboardCheck },
          { name: 'Devoirs',              href: '/parent/homework',     icon: ClipboardList },
          { name: 'Messages',             href: '/parent/messages',     icon: Mail },
          { name: 'Comportement',         href: '/parent/behavior',     icon: TrendingUp },
          { name: 'Santé',                href: '/parent/health',       icon: Heart },
          { name: 'Personnes Autorisées', href: '/parent/pickup',       icon: ShieldCheck },
          { name: 'Notes',                href: '/parent/grades',       icon: Award },
          { name: 'Emplois du Temps',     href: '/parent/schedule',     icon: Calendar },
          { name: 'Rendez-vous',          href: '/parent/appointments', icon: MessageSquare },
        ];
      case 'TEACHER':
        return [
          ...base,
          { name: 'Mes Classes',     href: '/teacher/classes',     icon: BookOpen },
          { name: 'Mes Élèves',      href: '/teacher/students',    icon: Users },
          { name: 'Présence',        href: '/teacher/attendance',  icon: ClipboardCheck },
          { name: 'Devoirs',         href: '/teacher/homework',    icon: ClipboardList },
          { name: 'Messages',        href: '/teacher/messages',    icon: Mail },
          { name: 'Comportement',    href: '/teacher/behavior',    icon: TrendingUp },
          { name: 'Gestion Notes',   href: '/teacher/grades',      icon: Award },
          { name: 'Emploi du Temps', href: '/teacher/schedule',    icon: Calendar },
        ];
      case 'ADMIN':
        return [
          ...base,
          { name: 'Utilisateurs',        href: '/admin/users',            icon: Users },
          { name: 'Classes',             href: '/admin/classes',          icon: BookOpen },
          { name: 'Matières',            href: '/admin/subjects',         icon: ClipboardList },
          { name: 'Années & Trimestres', href: '/admin/years',            icon: Calendar },
          { name: 'Emplois du temps',    href: '/admin/schedules',        icon: Calendar },
          { name: 'Verrous de notes',    href: '/admin/grade-locks',      icon: FileText },
          { name: 'Parents & Élèves',   href: '/admin/parents-students', icon: Users },
          { name: 'Rendez-vous',         href: '/admin/appointments',     icon: MessageSquare },
          { name: 'Présence',            href: '/admin/attendance',       icon: ClipboardCheck },
          { name: 'Comportement',        href: '/admin/behavior',         icon: TrendingUp },
          { name: 'Santé',               href: '/admin/health',           icon: Heart },
          { name: 'Ramassage',           href: '/admin/pickup',           icon: ShieldCheck },
          { name: 'Page Accueil',        href: '/admin/mainpage',         icon: Home },
          { name: 'Paramètres',          href: '/admin/settings',         icon: Settings },
        ];
      default:
        return base;
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'STUDENT': return 'bg-blue-500';
      case 'PARENT':  return 'bg-emerald-500';
      case 'TEACHER': return 'bg-violet-500';
      case 'ADMIN':   return 'bg-amber-500';
      default:        return 'bg-slate-400';
    }
  };

  const getRoleName = () => {
    switch (user?.role) {
      case 'STUDENT': return 'Élève';
      case 'PARENT':  return 'Parent';
      case 'TEACHER': return 'Enseignant';
      case 'ADMIN':   return 'Administrateur';
      default:        return '';
    }
  };

  const getRoleBadgeClass = () => {
    switch (user?.role) {
      case 'STUDENT': return 'badge badge-student';
      case 'PARENT':  return 'badge badge-parent';
      case 'TEACHER': return 'badge badge-teacher';
      case 'ADMIN':   return 'badge badge-admin';
      default:        return 'badge';
    }
  };

  const navigation = getNavigationItems();
  const currentPage = navigation.find(item => item.href === location.pathname)?.name ?? 'Tableau de bord';

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* SIDEBAR */}
      <aside className={`sidebar ${!(sidebarOpen || isLargeScreen) ? 'closed' : ''}`}>
        <div className="flex flex-col h-full">

          {/* Logo */}
          <div className="sidebar-logo">
            <img
              src="/logo.jpeg"
              alt="Forum de L'excellence"
              className="sidebar-logo-img"
            />
            <div className="flex-1 min-w-0">
              <div className="sidebar-logo-title truncate">Forum de L'excellence</div>
              <div className="sidebar-logo-sub">Espace numérique</div>
            </div>
            {!isLargeScreen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="topbar-action"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                aria-label="Fermer le menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Nav */}
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

          {/* User footer */}
          <div className="sidebar-user">
            <div className={`w-9 h-9 rounded-full ${getRoleColor()} flex items-center justify-center flex-shrink-0`}>
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="sidebar-user-name truncate">{user?.firstName} {user?.lastName}</div>
              <div className="sidebar-user-role">{getRoleName()}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isLargeScreen ? 'ml-64' : 'ml-0'}`}>

        {/* Topbar */}
        <header className="topbar">
          <div className="flex items-center gap-3">
            {!isLargeScreen && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="topbar-action"
                aria-label="Ouvrir le menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h1 className="topbar-title">{currentPage}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="topbar-action"
              aria-label={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <div style={{ width: '1px', height: '24px', background: 'var(--color-divider)', margin: '0 4px' }} />

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-150 hover:bg-[var(--color-surface-offset)]"
                style={{ fontSize: 'var(--text-sm)' }}
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
                  className="absolute right-0 mt-2 w-56 rounded-xl border py-1 z-50 animate-fade-in"
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
                        <span className={getRoleBadgeClass()} style={{ marginTop: '2px' }}>{getRoleName()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/"
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                      style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface-offset)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--color-text)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
                      }}
                    >
                      <Home className="w-4 h-4" />
                      Retour au site
                    </Link>

                    <div style={{ height: '1px', background: 'var(--color-divider)', margin: '4px 16px' }} />

                    <button
                      onClick={() => { logout(); navigate('/'); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 transition-colors"
                      style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-error-bg)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
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

        {/* Page content */}
        <main ref={mainRef} onClick={handleMainClick} className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && !isLargeScreen && (
        <div
          className="fixed inset-0 z-30"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
