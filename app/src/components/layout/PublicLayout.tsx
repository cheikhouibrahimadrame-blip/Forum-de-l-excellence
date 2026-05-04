import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown, GraduationCap, LogOut, Menu, Moon, Sun, User, X,
  Facebook, Instagram, Twitter, Youtube, Linkedin, MessageCircle,
  Phone, Mail, Globe, Send, MapPin,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBranding } from '../../contexts/BrandingContext';

interface PublicLayoutProps {
  children: React.ReactNode;
}

// Map social-icon names (stored as strings in branding) -> components.
const SOCIAL_ICON_MAP: Record<string, React.ComponentType<any>> = {
  Facebook, Instagram, Twitter, Youtube, Linkedin, MessageCircle,
  Phone, Mail, Globe, Send, MapPin,
};

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const location = useLocation();

  const { brand, navigation, quickLinks, socialLinks } = branding;

  const userMenuRef = useRef<HTMLDivElement>(null);

  // P3-3: close the mobile menu on any route change (back/forward, deep
  // link, programmatic navigate). Previously the menu only closed on
  // Link onClick, so a browser back-button left it stuck open.
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // P3-2: close dropdowns on outside click + Escape (keyboard a11y).
  useEffect(() => {
    if (!userMenuOpen && !mobileMenuOpen) return;

    const onClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [userMenuOpen, mobileMenuOpen]);

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'STUDENT': return '/student';
      case 'PARENT':  return '/parent';
      case 'TEACHER': return '/teacher';
      case 'ADMIN':   return '/admin';
      default:        return '/login';
    }
  };

  const copyright = brand.copyrightText
    || `© ${new Date().getFullYear()} ${brand.name}. Tous droits réservés.`;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] dark:bg-[linear-gradient(135deg,var(--color-bg-primary)_0%,var(--color-bg-secondary)_100%)]">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm dark:border-[#283244] dark:bg-[linear-gradient(180deg,var(--color-bg-card)_0%,var(--color-bg-secondary)_100%)]">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]">
                  {brand.name}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
                  {brand.shortName}
                </span>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navigation.map((item) => (
                <Link
                  key={item.id}
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
                {theme === 'light'
                  ? <Moon className="h-5 w-5 text-[var(--color-text-secondary)]" />
                  : <Sun className="h-5 w-5 text-[var(--color-text-secondary)]" />}
              </button>

              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--color-bg-secondary)] dark:hover:bg-white/8"
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    aria-controls="public-user-menu"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-navy)] dark:bg-[#1f2937]">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="hidden text-sm font-medium text-[var(--color-text-primary)] sm:block dark:text-[var(--color-text-primary)]">
                      {user.firstName}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-[var(--color-text-secondary)] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  {userMenuOpen && (
                    <div
                      id="public-user-menu"
                      role="menu"
                      className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] py-1 shadow-lg dark:border-[#283244] dark:bg-[var(--color-bg-card)]"
                    >
                      <Link
                        to={getDashboardPath()}
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] dark:text-[var(--color-text-primary)] dark:hover:bg-white/8"
                      >
                        <User className="h-4 w-4" aria-hidden="true" />
                        Tableau de bord
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] dark:text-[var(--color-text-primary)] dark:hover:bg-white/8"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-primary px-4 py-2 text-sm">
                    Connexion
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="rounded-lg p-2 transition-colors hover:bg-[var(--color-bg-secondary)] dark:hover:bg-white/8 md:hidden"
                aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="public-mobile-menu"
              >
                {mobileMenuOpen
                  ? <X className="h-6 w-6 text-[var(--color-text-primary)]" aria-hidden="true" />
                  : <Menu className="h-6 w-6 text-[var(--color-text-primary)]" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="public-mobile-menu" className="border-t border-[var(--color-border)] dark:border-[#283244] dark:bg-[var(--color-bg-card)] md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.id}
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
                    {brand.name}
                  </h3>
                  <p className="text-sm text-white/80 dark:text-[var(--color-text-secondary)]">
                    {brand.shortName}
                  </p>
                </div>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-white dark:text-[var(--color-text-secondary)]">
                {brand.aboutText}
              </p>

              {socialLinks.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {socialLinks.map((s) => {
                    const Icon = SOCIAL_ICON_MAP[s.icon] || Globe;
                    return (
                      <a
                        key={s.id}
                        href={s.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        title={s.label}
                        aria-label={s.label}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-colors"
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {quickLinks.length > 0 && (
              <div>
                <h4 className="mb-4 text-lg font-semibold text-[var(--color-primary-gold)]">
                  Liens rapides
                </h4>
                <ul className="space-y-2">
                  {quickLinks.map((q) => (
                    <li key={q.id}>
                      <Link
                        to={q.href}
                        className="text-sm text-white transition-colors hover:text-[var(--color-primary-gold)] dark:text-[var(--color-text-secondary)] dark:hover:text-[var(--color-primary-gold)]"
                      >
                        {q.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="mb-4 text-lg font-semibold text-[var(--color-primary-gold)]">Contact</h4>
              <div className="space-y-2 text-sm text-white dark:text-[var(--color-text-secondary)]">
                {brand.principal && <p>Directeurs : {brand.principal}</p>}
                {brand.email && (
                  <p>
                    Email :{' '}
                    <a href={`mailto:${brand.email}`} className="hover:text-[var(--color-primary-gold)]">
                      {brand.email}
                    </a>
                  </p>
                )}
                {brand.phone && (
                  <p className="break-words">
                    Tél :{' '}
                    <a href={`tel:${brand.phone.replace(/\s+/g, '')}`} className="hover:text-[var(--color-primary-gold)]">
                      {brand.phone}
                    </a>
                  </p>
                )}
                {brand.address && <p>{brand.address}</p>}
                {brand.website && (
                  <p>
                    <a href={`https://${brand.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="hover:text-[var(--color-primary-gold)]">
                      {brand.website}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/20 pt-8 dark:border-[#283244]">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm text-white/70 dark:text-[var(--color-text-secondary)]">
                {copyright}
              </p>
              {brand.foundersText && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-white/70 dark:text-[var(--color-text-secondary)]">
                    {brand.foundersText}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
