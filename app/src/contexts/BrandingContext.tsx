import type React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { API } from '../lib/apiRoutes';
import {
  DEFAULT_BRANDING,
  mergeBrandingContent,
  type BrandingContent,
} from '../lib/brandingDefaults';

// ─────────────────────────────────────────────────────────────────
// BrandingContext — single global fetch of /api/settings/branding,
// exposed to every component (layouts, pages, PDFs).
//
// `branding` is *always* defined (defaults are returned during the
// initial loading window), so consumers never need to handle null.
// ─────────────────────────────────────────────────────────────────

interface BrandingContextValue {
  branding: BrandingContent;
  loading: boolean;
  refresh: () => Promise<void>;
  /**
   * Optimistically replace the cached branding (used by the admin editor
   * after a successful POST so the rest of the UI updates immediately).
   */
  setBranding: (next: BrandingContent) => void;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

export const BrandingProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingContent>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get(API.SETTINGS_BRANDING);
      if (res.data?.success && res.data.data) {
        setBranding(mergeBrandingContent(res.data.data));
      }
    } catch (e) {
      // Silent fail — defaults are already in state, so the UI keeps working.
      console.error('Erreur chargement branding:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <BrandingContext.Provider value={{ branding, loading, refresh, setBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    // Fallback path: if a component is rendered outside the provider (unit
    // tests, error boundaries…), return defaults instead of throwing.
    return {
      branding: DEFAULT_BRANDING,
      loading: false,
      refresh: async () => {},
      setBranding: () => {},
    };
  }
  return ctx;
}
