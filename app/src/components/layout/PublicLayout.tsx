import type React from 'react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  GraduationCap, 
  User, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import { api } from '../../lib/api';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [collegeInfo, setCollegeInfo] = useState({
    name: 'Forum de L\'excellence',
    address: 'Medinatoul Salam, Mbour, Sénégal',
    phone: '+221 775368254',
    email: 'gsforumexcellence@gmail.com',
    website: 'www.forumexcellence.sn',
    principal: 'M. et Mme Fall',
    year: '2025-2026'
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

  // Charger les infos du collège au montage du composant
  useEffect(() => {
    const loadCollegeInfo = async () => {
      try {
        const response = await api.get('/api/settings');
        const data = response.data;
        
        if (data.success && data.data && data.data.general) {
          setCollegeInfo(data.data.general);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des infos du collège:', error);
      }
    };

    loadCollegeInfo();
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'STUDENT': return '/student';
      case 'PARENT': return '/parent';
      case 'TEACHER': return '/teacher';
      case 'ADMIN': return '/admin';
      default: return '/login';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--color-bg-card)] shadow-sm border-b border-[var(--color-border)]">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/logo.jpeg" 
                alt="Forum de L'excellence" 
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white dark:text-white">Forum de L'excellence</span>
                <span className="text-xs text-white/80 dark:text-white/80">Collège Privé</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
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

            {/* Right side */}
            <div className="flex items-center gap-3">
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

              {/* User menu or login button */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary-navy)] flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium hidden sm:block text-[var(--color-text-primary)]">
                      {user.firstName}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  </button>

                  {/* Dropdown menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[var(--color-bg-card)] rounded-lg shadow-lg border border-[var(--color-border)] py-1 z-50">
                      <Link
                        to={getDashboardPath()}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
                      >
                        <User className="w-4 h-4" />
                        Tableau de bord
                      </Link>
                      <button
                        onClick={logout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Connexion (Admin / Comptes créés)
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-[var(--color-text-primary)]" />
                ) : (
                  <Menu className="w-6 h-6 text-[var(--color-text-primary)]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--color-border)]">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium ${
                    location.pathname === item.href
                      ? 'bg-[var(--color-primary-gold-light)] text-[var(--color-primary-navy)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[var(--color-primary-navy)] text-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* School Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-gold)] flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-[var(--color-primary-navy)]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Forum de L'excellence</h3>
                  <p className="text-sm text-white/80">Collège Privé</p>
                </div>
              </div>
              <p className="text-white text-sm leading-relaxed max-w-md">
                Le Forum de L'excellence est un établissement d'enseignement privé dédié à la formation 
                académique de haute qualité, dirigé par M. et Mme Fall.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-[var(--color-primary-gold)]">Liens Rapides</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/programs" className="text-white hover:text-[var(--color-primary-gold)] transition-colors text-sm">
                    Nos Programmes
                  </Link>
                </li>
                <li>
                  <Link to="/admissions" className="text-white hover:text-[var(--color-primary-gold)] transition-colors text-sm">
                    Admissions
                  </Link>
                </li>
                <li>
                  <Link to="/campus-life" className="text-white hover:text-[var(--color-primary-gold)] transition-colors text-sm">
                    Vie du Campus
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-[var(--color-primary-gold)]">Contact</h4>
              <div className="space-y-2 text-sm text-white">
                <p>Directeurs: {collegeInfo.principal}</p>
                <p>Email: {collegeInfo.email}</p>
                <p className="break-words">Tél: {collegeInfo.phone}</p>
                <p>{collegeInfo.address}</p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-8 border-t border-slate-600">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-400">
                © {new Date().getFullYear()} Forum de L'excellence. Tous droits réservés.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">Fondé par M. et Mme Fall</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;