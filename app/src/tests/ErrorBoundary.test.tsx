// Batch C / P2-1 — ErrorBoundary
//
// Lazy-loaded chunks that fail to load (deploy mid-session, network
// blip, runtime exception inside `<StudentGrades>`) used to crash the
// whole app to a blank page. The boundary must render a recoverable
// fallback and expose a way to retry without losing the session.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

const Boom: React.FC<{ message?: string }> = ({ message = 'kaboom' }) => {
  throw new Error(message);
};

describe('ErrorBoundary (P2-1)', () => {
  // React logs a noisy stack to console.error when a child throws.
  // Silence it so test output stays readable.
  let errSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    errSpy.mockRestore();
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>healthy content</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('healthy content')).toBeInTheDocument();
  });

  it('renders the default fallback card when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    // Default fallback uses role="alert" and a "Réessayer" button.
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Réessayer/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Retour à l'accueil/i })).toBeInTheDocument();
  });

  it('detects chunk-load errors and offers a reload-aware message', () => {
    const ChunkBoom: React.FC = () => {
      throw new Error('Loading chunk 42 failed.');
    };
    render(
      <ErrorBoundary>
        <ChunkBoom />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Une mise à jour est disponible/i)).toBeInTheDocument();
  });

  it('uses a custom fallback render-prop when supplied and exposes reset()', () => {
    const fallback = vi.fn((error: Error, reset: () => void) => (
      <div>
        <p>caught: {error.message}</p>
        <button onClick={reset}>do-reset</button>
      </div>
    ));

    render(
      <ErrorBoundary fallback={fallback}>
        <Boom message="explicit-msg" />
      </ErrorBoundary>,
    );

    expect(fallback).toHaveBeenCalled();
    expect(screen.getByText('caught: explicit-msg')).toBeInTheDocument();
    // The reset handler should at least be wired up and callable —
    // we don't assert recovery here because re-rendering the same
    // throwing child would just throw again.
    fireEvent.click(screen.getByText('do-reset'));
  });
});
