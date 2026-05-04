import type React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ─────────────────────────────────────────────────────────────────────
// NotFound page (P2-3)
//
// Replaces the silent `<Navigate to="/" replace />` wildcard. Going to
// an unknown URL (typo, stale bookmark, broken link) used to eject an
// admin from their dashboard back to the marketing home page; now we
// stay on a real 404 with helpful navigation:
//   - back: history.back()
//   - dashboard: role-aware target if logged in
//   - home: marketing site
// ─────────────────────────────────────────────────────────────────────

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const dashboardPath = user
    ? `/${user.role.toLowerCase()}`
    : '/login';

  const dashboardLabel = user ? 'Tableau de bord' : 'Se connecter';

  return (
    <main
      role="main"
      className="min-h-screen flex items-center justify-center px-4 py-16 bg-[var(--color-bg-primary)]"
    >
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-bg-card)] shadow-lg">
          <Compass className="h-10 w-10 text-[var(--color-primary-navy)] dark:text-[var(--color-primary-gold)]" aria-hidden="true" />
        </div>

        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-navy)] dark:text-[var(--color-primary-gold)] mb-3">
          Erreur 404
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
          Page introuvable
        </h1>
        <p className="text-base text-[var(--color-text-secondary)] mb-8 leading-relaxed">
          La page que vous recherchez n'existe pas ou a été déplacée. Vérifiez
          l'URL ou utilisez l'un des liens ci-dessous pour reprendre votre navigation.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary inline-flex items-center justify-center gap-2 px-5 py-2.5"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Page précédente
          </button>
          <Link
            to={dashboardPath}
            className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            {dashboardLabel}
          </Link>
        </div>

        <Link
          to="/"
          className="mt-6 inline-block text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline-offset-4 hover:underline"
        >
          Aller au site public
        </Link>
      </div>
    </main>
  );
};

export default NotFoundPage;
