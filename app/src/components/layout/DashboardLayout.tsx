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
  Mail
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

  // Detect if this is a large screen (not affected by zoom)
  useEffect(() => {
    const checkScreenSize = () => {
      const isLarge = window.matchMedia('(min-width: 1024px)').matches;
      setIsLargeScreen(isLarge);
      if (!isLarge) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    mediaQuery.addEventListener('change', checkScreenSize);

    return () => mediaQuery.removeEventListener('change', checkScreenSize);
  }, []);

  // Scroll to top when location changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on resize (especially on zoom)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMainClick = () => {
    if (!isLargeScreen && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'STUDENT': return '/student';
      case 'PARENT': return '/parent';
      case 'TEACHER': return '/teacher';
      case 'ADMIN': return '/admin';
      default: return '/';
    }
  };

  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = [
      { name: 'Tableau de bord', href: getDashboardPath(), icon: Home },
    ];

    switch (user.role) {
      case 'STUDENT':
        return [
          ...baseItems,
          { name: 'Mes Notes', href: '/student/grades', icon: Award },
          { name: 'Mon Emploi du Temps', href: '/student/schedule', icon: Calendar },
          { name: 'Mes Devoirs', href: '/student/homework', icon: ClipboardCheck },
          { name: 'Mes Messages', href: '/student/messages', icon: Mail },
          { name: 'Mon Comportement', href: '/student/behavior', icon: TrendingUp },
          { name: 'Mes Rendez-vous', href: '/student/appointments', icon: MessageSquare },
          { name: 'Mes Bulletins', href: '/student/report-cards', icon: FileText },
        ];

      case 'PARENT':
        return [
          ...baseItems,
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
          ...baseItems,
          { name: 'Mes Classes', href: '/teacher/classes', icon: BookOpen },
          { name: 'Mes Élèves', href: '/teacher/students', icon: Users },
          { name: 'Présence', href: '/teacher/attendance', icon: ClipboardCheck },
          { name: 'Devoirs', href: '/teacher/homework', icon: ClipboardList },
          { name: 'Messages', href: '/teacher/messages', icon: Mail },
          { name: 'Comportement', href: '/teacher/behavior', icon: TrendingUp },
          { name: 'Gestion des Notes', href: '/teacher/grades', icon: Award },
          { name: 'Mon Emploi du Temps', href: '/teacher/schedule', icon: Calendar },
        ];

      case 'ADMIN':
        return [
          ...baseItems,
          { name: 'Utilisateurs', href: '/admin/users', icon: Users },
          { name: 'Classes', href: '/admin/classes', icon: BookOpen },
          { name: 'Matières', href: '/admin/subjects', icon: ClipboardList },
          { name: 'Années & Trimestres', href: '/admin/years', icon: Calendar },
          { name: 'Emplois du temps', href: '/admin/schedules', icon: Calendar },
          { name: 'Verrous de notes', href: '/admin/grade-locks', icon: FileText },
          { name: 'Parents & Élèves', href: '/admin/parents-students', icon: Users },
          { name: 'Rendez-vous', href: '/admin/appointments', icon: MessageSquare },
          { name: 'Présence', href: '/admin/attendance', icon: ClipboardCheck },
          { name: 'Comportement', href: '/admin/behavior', icon: TrendingUp },
          { name: 'Santé', href: '/admin/health', icon: Heart },
          { name: 'Ramassage', href: '/admin/pickup', icon: ShieldCheck },
          { name: 'Page Accueil', href: '/admin/mainpage', icon: Home },
          { name: 'Paramètres', href: '/admin/settings', icon: Settings },
        ];

      default:
        return baseItems;
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'STUDENT': return 'bg-blue-500';
      case 'PARENT': return 'bg-green-500';
      case 'TEACHER': return 'bg-purple-500';
      case 'ADMIN': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleName = () => {
    switch (user?.role) {
      case 'STUDENT': return 'Élève';
      case 'PARENT': return 'Parent';
      case 'TEACHER': return 'Enseignant';
      case 'ADMIN': return 'Administrateur';
      default: return '';
    }
  };

  const navigation = getNavigationItems();

  return (
    <div className="flex h-screen w-screen bg-[var(--color-bg-secondary)] overflow-hidden">
      {/* Sidebar */}
      <div
        className={`sidebar ${
          !(sidebarOpen || isLargeScreen) ? 'closed' : ''
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-slate-600">
            <img 
              src="/logo.jpeg" 
              alt="Forum de L'excellence" 
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm">Forum de L'excellence</span>
              <span className="text-slate-300 text-xs">Tableau de bord</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`sidebar-nav-item ${location.pathname === item.href ? 'active' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info at bottom */}
          <div className="p-4 border-t border-slate-600">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${getRoleColor()} flex items-center justify-center`}>
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-slate-300 text-xs">{getRoleName()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        isLargeScreen ? 'ml-64' : 'ml-0'
      }`}>
        {/* Top bar */}
        <header className="bg-[var(--color-bg-card)] shadow-sm border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isLargeScreen && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  <Menu className="w-6 h-6 text-[var(--color-text-primary)]" />
                </button>
              )}
              <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
                {navigation.find(item => item.href === location.pathname)?.name || 'Tableau de bord'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                ) : (
                  <Sun className="w-5 h-5 text-[var(--color-text-secondary)]" />
                )}
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full ${getRoleColor()} flex items-center justify-center`}>
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--color-bg-card)] rounded-lg shadow-lg border border-[var(--color-border)] py-1 z-50">
                    <div className="px-4 py-2 border-b border-[var(--color-border)]">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">{getRoleName()}</p>
                    </div>
                    <Link
                      to="/"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
                    >
                      <Home className="w-4 h-4" />
                      Retour au site
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main ref={mainRef} onClick={handleMainClick} className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && !isLargeScreen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
