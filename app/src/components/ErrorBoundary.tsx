import type React from 'react';
import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// ErrorBoundary (P2-1)
//
// Lazy-loaded chunks can fail to load (network, deploy mid-session,
// JS exception in `<StudentGrades>`, etc.). Without a boundary, the
// entire `<Suspense>` tree unmounts and the user sees a blank page.
// This component renders a recoverable error card so:
//   - the user knows something went wrong
//   - they can retry without losing their session
//   - they can navigate back home
// Logs the error to the console in DEV; in production we rely on the
// HTTP error reporter at the API layer (no analytics endpoint yet).
// ─────────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /**
   * Optional render-prop fallback. Receives the error and a reset fn.
   * If unset, a default card is rendered.
   */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return <DefaultErrorFallback error={error} onReset={this.reset} />;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error; onReset: () => void }> = ({ error, onReset }) => {
  const isChunkLoadError =
    error.name === 'ChunkLoadError' ||
    /Loading chunk \d+ failed/i.test(error.message) ||
    /dynamically imported module/i.test(error.message);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6" role="alert">
      <div className="max-w-md w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 shadow-lg text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>

        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
          {isChunkLoadError ? 'Une mise à jour est disponible' : 'Quelque chose s\'est mal passé'}
        </h2>

        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          {isChunkLoadError
            ? 'Une nouvelle version de l\'application a été déployée. Rechargez la page pour récupérer les derniers fichiers.'
            : 'Une erreur inattendue s\'est produite lors du chargement de cette section. Vous pouvez réessayer ou retourner à l\'accueil.'}
        </p>

        {import.meta.env.DEV && error.message && (
          <pre className="mb-6 max-h-40 overflow-auto rounded-lg bg-[var(--color-bg-secondary)] p-3 text-left text-xs text-[var(--color-text-muted)]">
            {error.message}
          </pre>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => {
              if (isChunkLoadError) {
                window.location.reload();
              } else {
                onReset();
              }
            }}
            className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Réessayer
          </button>
          <a
            href="/"
            className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
