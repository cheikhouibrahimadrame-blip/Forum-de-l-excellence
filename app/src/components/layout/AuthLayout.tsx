import type React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-primary-navy)] via-[var(--color-primary-navy)] to-[var(--color-secondary-blue)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full bg-[var(--color-primary-gold)] flex items-center justify-center shadow-lg">
              <GraduationCap className="w-10 h-10 text-[var(--color-primary-navy)]" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Forum de L'excellence</h1>
              <p className="text-sm text-white/80">Collège Privé - M. et Mme Fall</p>
            </div>
          </Link>
        </div>

        {/* Auth Card */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl p-8">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white/70">
            © {new Date().getFullYear()} Forum de L'excellence
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;