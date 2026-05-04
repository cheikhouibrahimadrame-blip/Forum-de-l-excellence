import type React from 'react';
import { Link } from 'react-router-dom';
import { useBranding } from '../../contexts/BrandingContext';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { branding } = useBranding();
  const { brand, authSubtitle } = branding;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,var(--color-bg-primary)_0%,var(--color-bg-secondary)_55%,var(--color-bg-card)_100%)] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <img src={brand.logoUrl} alt={brand.name} className="h-20 w-20 rounded-full object-cover shadow-lg" />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{brand.name}</h1>
              {authSubtitle && (
                <p className="text-sm text-[var(--color-text-secondary)]">{authSubtitle}</p>
              )}
            </div>
          </Link>
        </div>

        {/* Auth Card */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl p-8">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            © {new Date().getFullYear()} {brand.name}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;