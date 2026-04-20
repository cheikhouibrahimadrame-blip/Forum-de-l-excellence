import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  GraduationCap,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../lib/api';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [collegeInfo, setCollegeInfo] = useState({
    name: "Forum de L'excellence",
    address: 'Medinatoul Salam, Mbour, Senegal',
    phone: '+221 775368254',
    email: 'gsforumexcellence@gmail.com',
    website: 'www.forumexcellence.sn',
    principal: 'M. et Mme Fall',
    year: '2025-2026',
  });

  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Accueil', href: '/' },
    { name: 'Programmes', href: '/programs' },
    { name: 'Admissions', href: '/admissions' },
    { name: 'Vie du Campus', href: '/campus-life' },
  ];

  useEffect(() => {
    const loadCollegeInfo = async () => {
      try {
        const response = await api.get('/api/settings');
        const data = response.data;

        if (data.success && data.data && data.data.general) {
          setCollegeInfo(data.data.general);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des infos du college:", error);
      }
    };

    loadCollegeInfo();
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
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
        return '/login';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] dark:bg-[linear-gradient(135deg,var(--color-bg-primary)_0%,var(--color-bg-secondary)_100%)]">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm dark:border-[#283244] dark:bg-[linear-gradient(180deg,var(--color-bg-card)_0%,var(--color-bg-secondary)_100%)]">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/logo.jpeg"
                alt="Forum de L'excellence"
                className="h-10 w-10 rounded-lg object-cover"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]">
                  Forum de L'excellence
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
                  College Prive
                </span>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link ${location.pathname === item.href ? 'active' : ''}`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="rounded-lg p-2 transition-colors hover:bg-[var(--color-bg-secondary)] dark:hover:bg-white/8"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5 text-[var(--color-text-secondary)]" />
                ) : (
                  <Sun className="h-5 w-5 text-[var(--color-text-secondary)]" />
                )}
              </button>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--color-bg-secondary)] dark:hover:bg-white/8"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-navy)] dark:bg-[#1f2937]">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="hidden text-sm font-medium text-[var(--color-text-primary)] sm:block dark:text-[var(--color-text-primary)]">
                      {user.firstName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] py-1 shadow-lg dark:border-[#283244] dark:bg-[var(--color-bg-card)]">
                      <Link
                        to={getDashboardPath()}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] dark:text-[var(--color-text-primary)] dark:hover:bg-white/8"
                      >
                        <User className="h-4 w-4" />
                        Tableau de bord
                      </Link>
                      <button
                        onClick={logout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] dark:text-[var(--color-text-primary)] dark:hover:bg-white/8"
                      >
                        <LogOut className="h-4 w-4" />
                        Deconnexion
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-primary px-4 py-2 text-sm">
                    Connexion (Admin / Comptes crees)
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="rounded-lg p-2 transition-colors hover:bg-[var(--color-bg-secondary)] dark:hover:bg-white/8 md:hidden"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-[var(--color-text-primary)]" />
                ) : (
                  <Menu className="h-6 w-6 text-[var(--color-text-primary)]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[var(--color-border)] dark:border-[#283244] dark:bg-[var(--color-bg-card)] md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-base font-medium ${
                    location.pathname === item.href
                      ? 'bg-[var(--color-primary-gold-light)] text-[var(--color-primary-navy)] dark:bg-[var(--color-primary-gold-light)] dark:text-[var(--color-primary-navy)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] dark:text-[var(--color-text-secondary)] dark:hover:bg-white/8 dark:hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-[var(--color-primary-navy)] text-white dark:bg-[linear-gradient(180deg,var(--color-bg-card)_0%,var(--color-bg-secondary)_100%)] dark:text-[var(--color-text-primary)]">
        <div className="w-full px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-primary-gold)]">
                  <GraduationCap className="h-7 w-7 text-[var(--color-primary-navy)]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white dark:text-[var(--color-text-primary)]">
                    Forum de L'excellence
                  </h3>
                  <p className="text-sm text-white/80 dark:text-[var(--color-text-secondary)]">College Prive</p>
                </div>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-white dark:text-[var(--color-text-secondary)]">
                Le Forum de L'excellence est un etablissement d'enseignement prive dedie a la formation
                academique de haute qualite, dirige par M. et Mme Fall.
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-lg font-semibold text-[var(--color-primary-gold)]">Liens Rapides</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/programs"
                    className="text-sm text-white transition-colors hover:text-[var(--color-primary-gold)] dark:text-[var(--color-text-secondary)] dark:hover:text-[var(--color-primary-gold)]"
                  >
                    Nos Programmes
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admissions"
                    className="text-sm text-white transition-colors hover:text-[var(--color-primary-gold)] dark:text-[var(--color-text-secondary)] dark:hover:text-[var(--color-primary-gold)]"
                  >
                    Admissions
                  </Link>
                </li>
                <li>
                  <Link
                    to="/campus-life"
                    className="text-sm text-white transition-colors hover:text-[var(--color-primary-gold)] dark:text-[var(--color-text-secondary)] dark:hover:text-[var(--color-primary-gold)]"
                  >
                    Vie du Campus
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-lg font-semibold text-[var(--color-primary-gold)]">Contact</h4>
              <div className="space-y-2 text-sm text-white dark:text-[var(--color-text-secondary)]">
                <p>Directeurs: {collegeInfo.principal}</p>
                <p>Email: {collegeInfo.email}</p>
                <p className="break-words">Tel: {collegeInfo.phone}</p>
                <p>{collegeInfo.address}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/20 pt-8 dark:border-[#283244]">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm text-white/70 dark:text-[var(--color-text-secondary)]">
                © {new Date().getFullYear()} Forum de L'excellence. Tous droits reserves.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-sm text-white/70 dark:text-[var(--color-text-secondary)]">Fonde par M. et Mme Fall</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
