import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Save, Eye, RefreshCcw, Image as ImageIcon,
  Compass, Link2, Share2, FileText, Palette,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';
import {
  DEFAULT_BRANDING, mergeBrandingContent,
  BRANDING_SOCIAL_ICON_OPTIONS,
  type BrandingContent,
  type BrandLink,
  type BrandSocialLink,
} from '../../../lib/brandingDefaults';
import { useBranding } from '../../../contexts/BrandingContext';
import {
  TextField, TextAreaField, SelectField,
  SectionCard, ListEditor, PublishBar,
  newId, useDirty,
} from './_cmsPrimitives';

const NAV = [
  { id: 'sec-brand',    label: 'Identité',     icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'sec-nav',      label: 'Navigation',   icon: <Compass className="w-4 h-4" /> },
  { id: 'sec-quick',    label: 'Liens footer', icon: <Link2 className="w-4 h-4" /> },
  { id: 'sec-social',   label: 'Réseaux',      icon: <Share2 className="w-4 h-4" /> },
  { id: 'sec-misc',     label: 'Textes auth',  icon: <FileText className="w-4 h-4" /> },
];

const AdminBrandingContent: React.FC = () => {
  const navigate = useNavigate();
  const { setBranding: setGlobalBranding } = useBranding();

  const [content, setContent] = useState<BrandingContent>(DEFAULT_BRANDING);
  const [originalContent, setOriginalContent] = useState<BrandingContent>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(API.SETTINGS_BRANDING);
        if (!cancelled && res.data?.success && res.data.data) {
          const merged = mergeBrandingContent(res.data.data);
          setContent(merged);
          setOriginalContent(merged);
        }
      } catch (e) {
        console.error('Erreur chargement branding:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const dirty = useDirty(content, originalContent);

  const handlePublish = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await api.post(API.SETTINGS_BRANDING, content);
      if (res.data?.success) {
        const merged = mergeBrandingContent(res.data.data || content);
        setContent(merged);
        setOriginalContent(merged);
        setGlobalBranding(merged); // ← propagate to every other consumer immediately
        setSaveMessage({ kind: 'success', text: 'Identité publiée avec succès.' });
      } else {
        setSaveMessage({ kind: 'error', text: res.data?.error || 'Erreur lors de la publication.' });
      }
    } catch (e: any) {
      const apiMessage = e?.response?.data?.error;
      setSaveMessage({ kind: 'error', text: apiMessage || (e instanceof Error ? e.message : 'Erreur réseau.') });
    } finally {
      setSaving(false);
      if (saveMessage?.kind !== 'error') setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const handleResetSection = (key: keyof BrandingContent) => {
    if (!confirm('Restaurer cette section aux valeurs par défaut ?')) return;
    setContent({ ...content, [key]: structuredClone(DEFAULT_BRANDING[key]) } as BrandingContent);
  };

  const handleResetAll = () => {
    if (!confirm("Restaurer TOUTE l'identité du site aux valeurs par défaut ? Vos modifications non publiées seront perdues.")) return;
    setContent(structuredClone(DEFAULT_BRANDING));
  };

  const updateBrand = (patch: Partial<BrandingContent['brand']>) => {
    setContent({ ...content, brand: { ...content.brand, ...patch } });
  };

  if (loading) {
    return (
      <div className="section">
        <div className="section-content py-12 flex items-center justify-center">
          <div className="text-[var(--color-text-muted)]">Chargement de l'identité du site…</div>
        </div>
      </div>
    );
  }

  const { brand, navigation, quickLinks, socialLinks, loginNotice, authSubtitle } = content;

  return (
    <div className="section">
      <div className="section-content py-6">
        <button
          onClick={() => navigate('/admin', { state: { scrollTo: 'contenu-site-public' } })}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] border border-[var(--color-primary-gold)]/40 text-sm hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-all mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour au tableau de bord
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight flex items-center gap-3">
              <Palette className="w-8 h-8 text-[var(--color-primary-gold)]" />
              Identité du site
            </h1>
            <p className="text-[var(--color-text-muted)] mt-1">
              Logo, nom, navigation, footer, liens sociaux, textes d'authentification — tout est éditable et s'applique partout instantanément.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a href="/" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-bg-secondary)] transition-colors">
              <Eye className="w-4 h-4" /> Voir le site
            </a>
            <button onClick={handleResetAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-bg-secondary)] transition-colors">
              <RefreshCcw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>

        <PublishBar dirty={dirty} saving={saving} message={saveMessage} onPublish={handlePublish} />

        <div className="grid lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3 hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              {NAV.map((n) => (
                <a key={n.id} href={`#${n.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-primary-navy)] transition-colors">
                  {n.icon}{n.label}
                </a>
              ))}
            </nav>
          </aside>

          <div className="lg:col-span-9 space-y-5">
            {/* Brand identity */}
            <SectionCard
              id="sec-brand"
              icon={<ImageIcon className="w-5 h-5" />}
              title="Identité de l'école"
              description="Logo, nom, coordonnées, textes du footer, en-tête PDF — la source de vérité pour tout le site."
              onReset={() => handleResetSection('brand')}
            >
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <TextField label="Nom de l'école" value={brand.name} onChange={(v) => updateBrand({ name: v })} placeholder="Forum de L'excellence" />
                  <TextField label="Nom court / sous-titre" value={brand.shortName} onChange={(v) => updateBrand({ shortName: v })} placeholder="Collège Privé" />
                  <TextField label="Tagline (sidebar dashboard)" value={brand.tagline} onChange={(v) => updateBrand({ tagline: v })} placeholder="FORUM-EXCELLENCE Dashboard" />
                  <TextField label="URL du logo" value={brand.logoUrl} onChange={(v) => updateBrand({ logoUrl: v })} placeholder="/logo.jpeg" />
                  <TextField label="URL de la bannière des dashboards" value={brand.heroBannerUrl} onChange={(v) => updateBrand({ heroBannerUrl: v })} placeholder="/campus-hero.png" />
                  <TextField label="Année académique" value={brand.year} onChange={(v) => updateBrand({ year: v })} placeholder="2025-2026" />
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 uppercase tracking-wide">Coordonnées</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <TextField label="Téléphone" value={brand.phone} onChange={(v) => updateBrand({ phone: v })} placeholder="+221 775368254" />
                    <TextField label="Email" value={brand.email} onChange={(v) => updateBrand({ email: v })} placeholder="contact@ecole.sn" />
                    <TextField label="Adresse" value={brand.address} onChange={(v) => updateBrand({ address: v })} placeholder="Médinatoul Salam, Mbour, Sénégal" />
                    <TextField label="Site web" value={brand.website} onChange={(v) => updateBrand({ website: v })} placeholder="www.example.sn" />
                    <TextField label="Direction / Principal" value={brand.principal} onChange={(v) => updateBrand({ principal: v })} placeholder="M. et Mme Fall" />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 uppercase tracking-wide">Textes du footer</h4>
                  <div className="space-y-3">
                    <TextAreaField label="Texte 'À propos' (footer)" value={brand.aboutText} onChange={(v) => updateBrand({ aboutText: v })} rows={3} placeholder="Le Forum de L'excellence est un établissement…" />
                    <div className="grid md:grid-cols-2 gap-4">
                      <TextField label="Texte des fondateurs" value={brand.foundersText} onChange={(v) => updateBrand({ foundersText: v })} placeholder="Fondé par M. et Mme Fall" />
                      <TextField label="Copyright (laisser vide pour défaut)" value={brand.copyrightText} onChange={(v) => updateBrand({ copyrightText: v })} placeholder="© 2026 …" />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 uppercase tracking-wide">PDF / exports</h4>
                  <TextField label="Texte de bas de page des PDFs" value={brand.pdfFooterText} onChange={(v) => updateBrand({ pdfFooterText: v })} placeholder="Forum de L'excellence - Système de Gestion Académique" />
                </div>
              </div>
            </SectionCard>

            {/* Navigation */}
            <SectionCard
              id="sec-nav"
              icon={<Compass className="w-5 h-5" />}
              title="Navigation principale (header public)"
              description="Liens du menu visible en haut de chaque page publique."
              onReset={() => handleResetSection('navigation')}
            >
              <ListEditor<BrandLink>
                items={navigation}
                setItems={(next) => setContent({ ...content, navigation: next })}
                newItem={() => ({ id: newId('nav'), name: '', href: '/' })}
                addLabel="Ajouter un lien"
                itemTitle={(it) => it.name || 'Sans libellé'}
                renderItem={(item, u) => (
                  <div className="grid md:grid-cols-2 gap-3">
                    <TextField label="Libellé" value={item.name} onChange={(v) => u({ name: v })} placeholder="Accueil" />
                    <TextField label="Lien (URL ou /chemin)" value={item.href} onChange={(v) => u({ href: v })} placeholder="/" />
                  </div>
                )}
              />
            </SectionCard>

            {/* Quick links footer */}
            <SectionCard
              id="sec-quick"
              icon={<Link2 className="w-5 h-5" />}
              title="Liens rapides (footer public)"
              description="Section 'Liens rapides' du footer."
              onReset={() => handleResetSection('quickLinks')}
            >
              <ListEditor<BrandLink>
                items={quickLinks}
                setItems={(next) => setContent({ ...content, quickLinks: next })}
                newItem={() => ({ id: newId('ql'), name: '', href: '/' })}
                addLabel="Ajouter un lien"
                itemTitle={(it) => it.name || 'Sans libellé'}
                renderItem={(item, u) => (
                  <div className="grid md:grid-cols-2 gap-3">
                    <TextField label="Libellé" value={item.name} onChange={(v) => u({ name: v })} placeholder="Nos Programmes" />
                    <TextField label="Lien" value={item.href} onChange={(v) => u({ href: v })} placeholder="/programs" />
                  </div>
                )}
              />
            </SectionCard>

            {/* Social links */}
            <SectionCard
              id="sec-social"
              icon={<Share2 className="w-5 h-5" />}
              title="Réseaux sociaux (footer public)"
              description="Apparaissent sous le 'À propos' du footer. Laisser vide pour cacher la section."
              onReset={() => handleResetSection('socialLinks')}
            >
              <ListEditor<BrandSocialLink>
                items={socialLinks}
                setItems={(next) => setContent({ ...content, socialLinks: next })}
                newItem={() => ({ id: newId('sl'), label: '', icon: 'Facebook', href: '' })}
                addLabel="Ajouter un réseau social"
                itemTitle={(it) => it.label || 'Nouveau réseau'}
                renderItem={(item, u) => (
                  <div className="grid md:grid-cols-3 gap-3">
                    <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={BRANDING_SOCIAL_ICON_OPTIONS} />
                    <TextField label="Libellé / nom du réseau" value={item.label} onChange={(v) => u({ label: v })} placeholder="Facebook" />
                    <TextField label="URL complète" value={item.href} onChange={(v) => u({ href: v })} placeholder="https://facebook.com/votre-page" />
                  </div>
                )}
              />
            </SectionCard>

            {/* Auth misc */}
            <SectionCard
              id="sec-misc"
              icon={<FileText className="w-5 h-5" />}
              title="Textes des pages d'authentification"
              description="Textes affichés autour du formulaire de connexion."
              onReset={() => {
                if (!confirm('Restaurer ces textes aux valeurs par défaut ?')) return;
                setContent({
                  ...content,
                  loginNotice: DEFAULT_BRANDING.loginNotice,
                  authSubtitle: DEFAULT_BRANDING.authSubtitle,
                });
              }}
            >
              <div className="space-y-4">
                <TextField label="Sous-titre sous le logo (AuthLayout)" value={authSubtitle} onChange={(v) => setContent({ ...content, authSubtitle: v })} placeholder="Collège Privé - M. et Mme Fall" />
                <TextAreaField label="Note en bas du formulaire de connexion" value={loginNotice} onChange={(v) => setContent({ ...content, loginNotice: v })} rows={3} placeholder="Les comptes sont créés uniquement par l'admin…" />
              </div>
            </SectionCard>

            <div className="flex justify-end pt-2">
              <button
                onClick={handlePublish}
                disabled={saving || !dirty}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-primary-gold)] text-[var(--color-primary-navy)] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-primary-gold-dark)] transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Publication…' : 'Publier les modifications'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBrandingContent;
