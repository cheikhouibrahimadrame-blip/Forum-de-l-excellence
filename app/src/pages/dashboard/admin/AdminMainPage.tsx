import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Plus, Trash2, Save, ChevronLeft, ChevronUp, ChevronDown,
  Eye, RefreshCcw, Image as ImageIcon, Layers, Users, MessageSquare,
  Sparkles, Type, AlertCircle, CheckCircle2, Star, Newspaper,
  LayoutGrid, Megaphone,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';
import {
  DEFAULT_HOMEPAGE,
  mergeHomepageContent,
  HOMEPAGE_ICON_OPTIONS,
  PLATFORM_ACCENT_OPTIONS,
  BENTO_SIZE_OPTIONS,
  type HomepageContent,
  type HomepageStat,
  type HomepageFeature,
  type HomepageMarqueeItem,
  type HomepagePlatformItem,
  type HomepageBentoItem,
  type HomepageNewsItem,
  type HomepageTestimonial,
  type HomepageSectionTitle,
} from '../../../lib/homepageDefaults';

// ─────────────────────────────────────────────────────────────────
// Reusable input primitives
// ─────────────────────────────────────────────────────────────────
const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]';
const labelCls = 'block text-sm font-medium mb-1 text-[var(--color-text-primary)]';

const TextField: React.FC<{
  label: string; value: string;
  onChange: (v: string) => void;
  placeholder?: string; required?: boolean;
}> = ({ label, value, onChange, placeholder, required }) => (
  <div>
    <label className={labelCls}>{label}{required && '*'}</label>
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
      placeholder={placeholder}
    />
  </div>
);

const TextAreaField: React.FC<{
  label: string; value: string;
  onChange: (v: string) => void;
  rows?: number; placeholder?: string;
}> = ({ label, value, onChange, rows = 3, placeholder }) => (
  <div>
    <label className={labelCls}>{label}</label>
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
      rows={rows}
      placeholder={placeholder}
    />
  </div>
);

const SelectField: React.FC<{
  label: string; value: string;
  onChange: (v: string) => void;
  options: readonly string[] | string[];
}> = ({ label, value, onChange, options }) => (
  <div>
    <label className={labelCls}>{label}</label>
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <label className={labelCls}>{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-14 cursor-pointer rounded-lg border border-gray-300"
      />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
        placeholder="#aac240"
      />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Section header (anchor + collapse)
// ─────────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  id: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ id, title, icon, description, children, defaultOpen = true }) => (
  <details
    id={id}
    open={defaultOpen}
    className="card border border-[var(--color-border)] rounded-xl overflow-hidden scroll-mt-28"
  >
    <summary className="cursor-pointer select-none p-5 flex items-center gap-3 list-none bg-[var(--color-bg-secondary)]">
      <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] flex-shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] truncate">{title}</h2>
        {description && <p className="text-sm text-[var(--color-text-muted)] truncate">{description}</p>}
      </div>
      <ChevronDown className="w-5 h-5 text-[var(--color-text-muted)] transition-transform group-open:rotate-180" />
    </summary>
    <div className="p-5 md:p-6 border-t border-[var(--color-border)]">
      {children}
    </div>
  </details>
);

// ─────────────────────────────────────────────────────────────────
// Generic list editor (CRUD + reorder)
// ─────────────────────────────────────────────────────────────────
function ListEditor<T extends { id: string }>(props: {
  items: T[];
  setItems: (next: T[]) => void;
  renderItem: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode;
  newItem: () => T;
  addLabel?: string;
  itemTitle?: (item: T, index: number) => React.ReactNode;
  emptyLabel?: string;
}) {
  const { items, setItems, renderItem, newItem, addLabel = 'Ajouter', itemTitle, emptyLabel = 'Aucun élément.' } = props;

  const update = (id: string, patch: Partial<T>) => {
    setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const remove = (id: string) => {
    if (confirm('Supprimer cet élément ?')) setItems(items.filter((it) => it.id !== id));
  };
  const move = (id: string, direction: -1 | 1) => {
    const idx = items.findIndex((it) => it.id === id);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    setItems(next);
  };
  const add = () => setItems([...items, newItem()]);

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="text-sm text-[var(--color-text-muted)] italic px-3 py-6 text-center border border-dashed rounded-lg">
          {emptyLabel}
        </div>
      )}
      {items.map((it, i) => (
        <div key={it.id} className="border border-[var(--color-border)] rounded-lg p-4 bg-white/40">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              {itemTitle ? itemTitle(it, i) : `#${i + 1}`}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(it.id, -1)}
                disabled={i === 0}
                title="Monter"
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => move(it.id, 1)}
                disabled={i === items.length - 1}
                title="Descendre"
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(it.id)}
                title="Supprimer"
                className="p-1.5 rounded hover:bg-red-50 text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {renderItem(it, (patch) => update(it.id, patch))}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-[var(--color-primary-gold)]/40 text-[var(--color-primary-gold)] hover:bg-[var(--color-primary-gold)]/5 font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        {addLabel}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Section title sub-editor (eyebrow + split title + desc + cta)
// ─────────────────────────────────────────────────────────────────
const SectionTitleEditor: React.FC<{
  value: HomepageSectionTitle;
  onChange: (v: HomepageSectionTitle) => void;
  withCta?: boolean;
}> = ({ value, onChange, withCta = false }) => {
  const u = (patch: Partial<HomepageSectionTitle>) => onChange({ ...value, ...patch });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <TextField label="Sous-titre (eyebrow)" value={value.eyebrow} onChange={(v) => u({ eyebrow: v })} placeholder="· Notre communauté ·" />
      <TextAreaField label="Description (optionnel)" value={value.description} onChange={(v) => u({ description: v })} rows={2} />
      <TextField label="Titre — partie avant" value={value.titleLead} onChange={(v) => u({ titleLead: v })} placeholder="Une école qui éveille," />
      <TextField label="Titre — partie en gradient" value={value.titleAccent} onChange={(v) => u({ titleAccent: v })} placeholder="une plateforme qui accompagne." />
      <TextField label="Titre — partie après" value={value.titleTail} onChange={(v) => u({ titleTail: v })} placeholder="" />
      {withCta && (
        <>
          <TextField label="CTA (optionnel) — texte" value={value.ctaText} onChange={(v) => u({ ctaText: v })} placeholder="Tout voir" />
          <TextField label="CTA (optionnel) — lien" value={value.ctaLink} onChange={(v) => u({ ctaLink: v })} placeholder="/campus-life" />
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// id helper
// ─────────────────────────────────────────────────────────────────
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

// ─────────────────────────────────────────────────────────────────
// Sidebar nav
// ─────────────────────────────────────────────────────────────────
const NAV: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: 'sec-hero',         label: 'Héro',         icon: <Home className="w-4 h-4" /> },
  { id: 'sec-marquee',      label: 'Bandeau défilant', icon: <Megaphone className="w-4 h-4" /> },
  { id: 'sec-stats',        label: 'Statistiques', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'sec-features',     label: 'Atouts',       icon: <Star className="w-4 h-4" /> },
  { id: 'sec-platform',     label: 'Plateforme',   icon: <Users className="w-4 h-4" /> },
  { id: 'sec-bento',        label: 'Galerie',      icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'sec-news',         label: 'Actualités',   icon: <Newspaper className="w-4 h-4" /> },
  { id: 'sec-testimonials', label: 'Témoignages',  icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'sec-cta',          label: 'Appel à l\'action', icon: <LayoutGrid className="w-4 h-4" /> },
];

// ─────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────
const AdminMainPage: React.FC = () => {
  const navigate = useNavigate();

  const [content, setContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE);
  const [originalContent, setOriginalContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(API.HOMEPAGE);
        const data = res.data;
        if (!cancelled && data?.success && data.data) {
          const merged = mergeHomepageContent(data.data);
          setContent(merged);
          setOriginalContent(merged);
        }
      } catch (e) {
        console.error('Error loading homepage:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const dirty = useMemo(
    () => JSON.stringify(content) !== JSON.stringify(originalContent),
    [content, originalContent],
  );

  const handlePublish = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await api.post(API.ADMIN_HOMEPAGE, content);
      const data = res.data;
      if (data?.success) {
        const merged = mergeHomepageContent(data.data || content);
        setContent(merged);
        setOriginalContent(merged);
        setSaveMessage({ kind: 'success', text: 'Modifications publiées avec succès.' });
      } else {
        setSaveMessage({ kind: 'error', text: data?.error || 'Erreur lors de la publication.' });
      }
    } catch (e: any) {
      const apiMessage = e?.response?.data?.error;
      setSaveMessage({ kind: 'error', text: apiMessage || (e instanceof Error ? e.message : 'Erreur réseau.') });
    } finally {
      setSaving(false);
      if (saveMessage?.kind !== 'error') setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const handleResetSection = (key: keyof HomepageContent) => {
    if (!confirm('Restaurer cette section aux valeurs par défaut ?')) return;
    setContent({ ...content, [key]: structuredClone(DEFAULT_HOMEPAGE[key]) } as HomepageContent);
  };

  const handleResetAll = () => {
    if (!confirm('Restaurer TOUTE la page d\'accueil aux valeurs par défaut ? Vos modifications non publiées seront perdues.')) return;
    setContent(structuredClone(DEFAULT_HOMEPAGE));
  };

  const update = <K extends keyof HomepageContent>(key: K, value: HomepageContent[K]) => {
    setContent({ ...content, [key]: value });
  };

  if (loading) {
    return (
      <div className="section">
        <div className="section-content py-12 flex items-center justify-center">
          <div className="text-[var(--color-text-muted)]">Chargement de la page d'accueil…</div>
        </div>
      </div>
    );
  }

  const { hero, marquee, statsSection, stats, featuresSection, features, platformSection, platform, bentoSection, bento, newsSection, news, testimonialsSection, testimonials, cta } = content;

  return (
    <div className="section">
      <div className="section-content py-6">
        {/* Top bar */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] border border-[var(--color-primary-gold)]/40 text-sm hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-all mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour au tableau de bord
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
              Gestion de la page d'accueil
            </h1>
            <p className="text-[var(--color-text-muted)] mt-1">
              Modifiez chaque section : ajoutez, supprimez ou réorganisez le contenu librement.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <Eye className="w-4 h-4" />
              Voir la page
            </a>
            <button
              onClick={handleResetAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Sticky publish bar */}
        <div className="sticky top-0 z-30 -mx-4 md:mx-0 mb-6">
          <div className="mx-4 md:mx-0 rounded-xl border border-[var(--color-border)] bg-white/95 backdrop-blur-sm shadow-sm px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-sm">
              {dirty ? (
                <span className="inline-flex items-center gap-2 text-amber-600 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Modifications non publiées
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-[var(--color-text-muted)]">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  À jour
                </span>
              )}
              {saveMessage && (
                <span className={`inline-flex items-center gap-2 font-medium ${saveMessage.kind === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMessage.kind === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {saveMessage.text}
                </span>
              )}
            </div>
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

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Side nav */}
          <aside className="lg:col-span-3 hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              {NAV.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-primary-navy)] transition-colors"
                >
                  {n.icon}
                  {n.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Editor */}
          <div className="lg:col-span-9 space-y-5">
            {/* HERO ─────────────────────────────────────────── */}
            <SectionCard
              id="sec-hero"
              icon={<Home className="w-5 h-5" />}
              title="Section Héro (bannière principale)"
              description="Vidéo, titres, badges et carte flottante de droite."
            >
              <div className="space-y-4">
                <TextField label="Eyebrow (badge supérieur)" value={hero.eyebrow} onChange={(v) => update('hero', { ...hero, eyebrow: v })} placeholder="Année académique 2025–2026 · Inscriptions ouvertes" />
                <TextAreaField label="Titre principal" value={hero.title} onChange={(v) => update('hero', { ...hero, title: v })} rows={2} />
                <TextAreaField label="Sous-titre" value={hero.subtitle} onChange={(v) => update('hero', { ...hero, subtitle: v })} rows={3} />
                <div className="grid md:grid-cols-2 gap-4">
                  <TextField label="Bouton principal — texte" value={hero.primaryButtonText} onChange={(v) => update('hero', { ...hero, primaryButtonText: v })} />
                  <TextField label="Bouton principal — lien" value={hero.primaryButtonLink} onChange={(v) => update('hero', { ...hero, primaryButtonLink: v })} placeholder="/admissions" />
                  <TextField label="Bouton secondaire — texte" value={hero.secondaryButtonText} onChange={(v) => update('hero', { ...hero, secondaryButtonText: v })} />
                  <TextField label="Bouton secondaire — lien" value={hero.secondaryButtonLink} onChange={(v) => update('hero', { ...hero, secondaryButtonLink: v })} placeholder="/programs" />
                  <TextField label="Vidéo (URL)" value={hero.videoSrc} onChange={(v) => update('hero', { ...hero, videoSrc: v })} placeholder="/excz.mp4" />
                  <TextField label="Image de secours (poster)" value={hero.posterSrc} onChange={(v) => update('hero', { ...hero, posterSrc: v })} placeholder="/campus-hero.png" />
                </div>

                <div>
                  <label className={labelCls}>Lignes de confiance (sous les boutons)</label>
                  <ListEditor<typeof hero.trustItems[number]>
                    items={hero.trustItems}
                    setItems={(next) => update('hero', { ...hero, trustItems: next })}
                    newItem={() => ({ id: newId('trust'), icon: 'Sparkles', label: '' })}
                    addLabel="Ajouter une ligne"
                    itemTitle={(_, i) => `Ligne ${i + 1}`}
                    renderItem={(item, u) => (
                      <div className="grid md:grid-cols-2 gap-3">
                        <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={HOMEPAGE_ICON_OPTIONS} />
                        <TextField label="Texte" value={item.label} onChange={(v) => u({ label: v })} placeholder="Médinatoul Salam · Mbour" />
                      </div>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 border-t pt-4">
                  <h3 className="md:col-span-2 font-semibold text-[var(--color-text-primary)]">Carte flottante (à droite du héro)</h3>
                  <TextField label="Titre de la carte" value={hero.floatingCardTitle} onChange={(v) => update('hero', { ...hero, floatingCardTitle: v })} />
                  <TextField label="Sous-titre de la carte" value={hero.floatingCardSubtitle} onChange={(v) => update('hero', { ...hero, floatingCardSubtitle: v })} />
                  <TextField label="CTA — texte" value={hero.floatingCardCTAText} onChange={(v) => update('hero', { ...hero, floatingCardCTAText: v })} />
                  <TextField label="CTA — lien" value={hero.floatingCardCTALink} onChange={(v) => update('hero', { ...hero, floatingCardCTALink: v })} />
                  <TextAreaField label="Texte de bas de carte" value={hero.floatingCardFooterText} onChange={(v) => update('hero', { ...hero, floatingCardFooterText: v })} rows={2} />
                </div>
              </div>
            </SectionCard>

            {/* MARQUEE ────────────────────────────────────────── */}
            <SectionCard
              id="sec-marquee"
              icon={<Megaphone className="w-5 h-5" />}
              title="Bandeau défilant"
              description="Liste qui défile sous le héro."
            >
              <ListEditor<HomepageMarqueeItem>
                items={marquee}
                setItems={(next) => update('marquee', next)}
                newItem={() => ({ id: newId('mq'), icon: 'Sparkles', label: '' })}
                addLabel="Ajouter un élément"
                itemTitle={(it) => it.label || 'Sans libellé'}
                renderItem={(item, u) => (
                  <div className="grid md:grid-cols-2 gap-3">
                    <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={HOMEPAGE_ICON_OPTIONS} />
                    <TextField label="Libellé" value={item.label} onChange={(v) => u({ label: v })} placeholder="Excellence Académique" />
                  </div>
                )}
              />
              <button onClick={() => handleResetSection('marquee')} className="mt-3 text-xs text-[var(--color-text-muted)] hover:text-red-500 inline-flex items-center gap-1">
                <RefreshCcw className="w-3 h-3" /> Réinitialiser cette section
              </button>
            </SectionCard>

            {/* STATS ──────────────────────────────────────────── */}
            <SectionCard
              id="sec-stats"
              icon={<Sparkles className="w-5 h-5" />}
              title="Statistiques"
              description="Compteurs animés (4 idéalement)."
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={statsSection} onChange={(v) => update('statsSection', v)} />
                </div>
                <ListEditor<HomepageStat>
                  items={stats}
                  setItems={(next) => update('stats', next)}
                  newItem={() => ({ id: newId('stat'), value: '', label: '' })}
                  addLabel="Ajouter une statistique"
                  itemTitle={(it) => it.value || 'Nouvelle stat'}
                  renderItem={(item, u) => (
                    <div className="grid md:grid-cols-2 gap-3">
                      <TextField label="Valeur" value={item.value} onChange={(v) => u({ value: v })} placeholder="600+" />
                      <TextField label="Libellé" value={item.label} onChange={(v) => u({ label: v })} placeholder="Élèves Inspirés" />
                    </div>
                  )}
                />
              </div>
            </SectionCard>

            {/* FEATURES ───────────────────────────────────────── */}
            <SectionCard
              id="sec-features"
              icon={<Star className="w-5 h-5" />}
              title="Atouts / Pourquoi nous choisir"
              description="Cartes avec icône, titre et description."
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={featuresSection} onChange={(v) => update('featuresSection', v)} />
                </div>
                <ListEditor<HomepageFeature>
                  items={features}
                  setItems={(next) => update('features', next)}
                  newItem={() => ({ id: newId('feat'), icon: 'GraduationCap', title: '', description: '' })}
                  addLabel="Ajouter un atout"
                  itemTitle={(it) => it.title || 'Nouvel atout'}
                  renderItem={(item, u) => (
                    <div className="grid md:grid-cols-2 gap-3">
                      <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={HOMEPAGE_ICON_OPTIONS} />
                      <TextField label="Titre" value={item.title} onChange={(v) => u({ title: v })} />
                      <div className="md:col-span-2">
                        <TextAreaField label="Description" value={item.description} onChange={(v) => u({ description: v })} rows={3} />
                      </div>
                    </div>
                  )}
                />
              </div>
            </SectionCard>

            {/* PLATFORM ───────────────────────────────────────── */}
            <SectionCard
              id="sec-platform"
              icon={<Users className="w-5 h-5" />}
              title="Plateforme — espaces utilisateurs"
              description="Les 4 cartes : Élèves / Parents / Enseignants / Direction."
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={platformSection} onChange={(v) => update('platformSection', v)} />
                </div>
                <ListEditor<HomepagePlatformItem>
                  items={platform}
                  setItems={(next) => update('platform', next)}
                  newItem={() => ({ id: newId('plat'), role: '', tag: '', icon: 'Sparkles', accent: 'student', items: [], linkLabel: 'Se connecter', linkTo: '/login' })}
                  addLabel="Ajouter une carte"
                  itemTitle={(it) => it.role || 'Nouvelle carte'}
                  renderItem={(item, u) => (
                    <div className="grid md:grid-cols-2 gap-3">
                      <TextField label="Rôle" value={item.role} onChange={(v) => u({ role: v })} placeholder="Élèves" />
                      <TextField label="Tag (en majuscules)" value={item.tag} onChange={(v) => u({ tag: v })} placeholder="STUDENT" />
                      <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={HOMEPAGE_ICON_OPTIONS} />
                      <SelectField label="Couleur (accent)" value={item.accent} onChange={(v) => u({ accent: v as HomepagePlatformItem['accent'] })} options={PLATFORM_ACCENT_OPTIONS as unknown as string[]} />
                      <TextField label="CTA — texte" value={item.linkLabel} onChange={(v) => u({ linkLabel: v })} />
                      <TextField label="CTA — lien" value={item.linkTo} onChange={(v) => u({ linkTo: v })} placeholder="/login" />
                      <div className="md:col-span-2">
                        <label className={labelCls}>Liste de fonctionnalités (une par ligne)</label>
                        <textarea
                          value={item.items.join('\n')}
                          onChange={(e) => u({ items: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                          className={inputCls}
                          rows={4}
                          placeholder="Notes & bulletins\nEmploi du temps\n…"
                        />
                      </div>
                    </div>
                  )}
                />
              </div>
            </SectionCard>

            {/* BENTO ──────────────────────────────────────────── */}
            <SectionCard
              id="sec-bento"
              icon={<ImageIcon className="w-5 h-5" />}
              title="Galerie « La vie au Forum » (bento)"
              description="Photos / vidéos en grille. Tailles : 1×1, 2×1, 1×2, 2×2."
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={bentoSection} onChange={(v) => update('bentoSection', v)} withCta />
                </div>
                <ListEditor<HomepageBentoItem>
                  items={bento}
                  setItems={(next) => update('bento', next)}
                  newItem={() => ({ id: newId('bento'), src: '', type: 'image', alt: '', size: '1x1', caption: '' })}
                  addLabel="Ajouter une photo / vidéo"
                  itemTitle={(it) => it.caption || it.alt || 'Nouveau média'}
                  renderItem={(item, u) => (
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <TextField label="URL du média" value={item.src} onChange={(v) => u({ src: v })} placeholder="/forum/photo.jpg" />
                      </div>
                      <SelectField label="Type" value={item.type} onChange={(v) => u({ type: v as 'image' | 'video' })} options={['image', 'video']} />
                      <SelectField label="Taille" value={item.size} onChange={(v) => u({ size: v as HomepageBentoItem['size'] })} options={BENTO_SIZE_OPTIONS as unknown as string[]} />
                      <TextField label="Texte alternatif (alt)" value={item.alt} onChange={(v) => u({ alt: v })} placeholder="Vie au Forum" />
                      <TextField label="Légende" value={item.caption} onChange={(v) => u({ caption: v })} placeholder="Cérémonie d'excellence" />
                      {item.src && (
                        <div className="md:col-span-2">
                          {item.type === 'image' ? (
                            <img src={item.src} alt={item.alt} className="rounded-lg border max-h-40 object-cover" />
                          ) : (
                            <video src={item.src} muted controls className="rounded-lg border max-h-40 w-full" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
            </SectionCard>

            {/* NEWS ───────────────────────────────────────────── */}
            <SectionCard
              id="sec-news"
              icon={<Newspaper className="w-5 h-5" />}
              title="Actualités"
              description="La 1re actualité est mise en avant (À la une)."
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={newsSection} onChange={(v) => update('newsSection', v)} withCta />
                </div>
                <ListEditor<HomepageNewsItem>
                  items={news}
                  setItems={(next) => update('news', next)}
                  newItem={() => ({ id: newId('news'), title: '', date: '', excerpt: '' })}
                  addLabel="Ajouter une actualité"
                  itemTitle={(it, i) => (
                    <span className="inline-flex items-center gap-2">
                      {i === 0 && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--color-primary-gold)]/20 text-[var(--color-primary-gold)]">À la une</span>}
                      {it.title || 'Nouvelle actualité'}
                    </span>
                  )}
                  renderItem={(item, u) => (
                    <div className="grid md:grid-cols-2 gap-3">
                      <TextField label="Titre" value={item.title} onChange={(v) => u({ title: v })} />
                      <TextField label="Date" value={item.date} onChange={(v) => u({ date: v })} placeholder="15 Mai 2025" />
                      <div className="md:col-span-2">
                        <TextAreaField label="Extrait" value={item.excerpt} onChange={(v) => u({ excerpt: v })} rows={3} />
                      </div>
                      <div className="md:col-span-2">
                        <TextField label="Image (optionnelle, utilisée pour la 1re actualité)" value={item.image || ''} onChange={(v) => u({ image: v })} placeholder="/forum/photo.jpg" />
                      </div>
                    </div>
                  )}
                />
              </div>
            </SectionCard>

            {/* TESTIMONIALS ───────────────────────────────────── */}
            <SectionCard
              id="sec-testimonials"
              icon={<MessageSquare className="w-5 h-5" />}
              title="Témoignages"
              description="Citations de parents, d'élèves, d'enseignants."
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={testimonialsSection} onChange={(v) => update('testimonialsSection', v)} />
                </div>
                <ListEditor<HomepageTestimonial>
                  items={testimonials}
                  setItems={(next) => update('testimonials', next)}
                  newItem={() => ({ id: newId('test'), quote: '', author: '', role: '', tint: '#aac240' })}
                  addLabel="Ajouter un témoignage"
                  itemTitle={(it) => it.author || 'Nouveau témoignage'}
                  renderItem={(item, u) => (
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <TextAreaField label="Citation" value={item.quote} onChange={(v) => u({ quote: v })} rows={3} placeholder="Mon enfant rentre chaque jour avec des étoiles dans les yeux…" />
                      </div>
                      <TextField label="Auteur" value={item.author} onChange={(v) => u({ author: v })} placeholder="Aïssatou Diallo" />
                      <TextField label="Rôle" value={item.role} onChange={(v) => u({ role: v })} placeholder="Maman de Mariama, CE2" />
                      <ColorField label="Couleur d'accent" value={item.tint} onChange={(v) => u({ tint: v })} />
                    </div>
                  )}
                />
              </div>
            </SectionCard>

            {/* CTA ────────────────────────────────────────────── */}
            <SectionCard
              id="sec-cta"
              icon={<LayoutGrid className="w-5 h-5" />}
              title="Section appel à l'action (CTA finale)"
              description="Bandeau de conversion en bas de page."
            >
              <div className="space-y-4">
                <TextField label="Eyebrow (badge supérieur)" value={cta.eyebrow} onChange={(v) => update('cta', { ...cta, eyebrow: v })} placeholder="Inscriptions 2025–2026 ouvertes" />
                <TextAreaField label="Titre" value={cta.title} onChange={(v) => update('cta', { ...cta, title: v })} rows={2} />
                <TextAreaField label="Description" value={cta.description} onChange={(v) => update('cta', { ...cta, description: v })} rows={3} />
                <div className="grid md:grid-cols-2 gap-4">
                  <TextField label="Bouton principal — texte" value={cta.primaryButtonText} onChange={(v) => update('cta', { ...cta, primaryButtonText: v })} />
                  <TextField label="Bouton principal — lien" value={cta.primaryButtonLink} onChange={(v) => update('cta', { ...cta, primaryButtonLink: v })} placeholder="/admissions" />
                  <TextField label="Bouton secondaire — texte" value={cta.secondaryButtonText} onChange={(v) => update('cta', { ...cta, secondaryButtonText: v })} />
                  <TextField label="Bouton secondaire — lien" value={cta.secondaryButtonLink} onChange={(v) => update('cta', { ...cta, secondaryButtonLink: v })} placeholder="/programs" />
                </div>

                <div>
                  <label className={labelCls}>Badges de réassurance (en bas)</label>
                  <ListEditor<typeof cta.badges[number]>
                    items={cta.badges}
                    setItems={(next) => update('cta', { ...cta, badges: next })}
                    newItem={() => ({ id: newId('cta-b'), icon: 'Shield', label: '' })}
                    addLabel="Ajouter un badge"
                    itemTitle={(it) => it.label || 'Nouveau badge'}
                    renderItem={(item, u) => (
                      <div className="grid md:grid-cols-2 gap-3">
                        <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={HOMEPAGE_ICON_OPTIONS} />
                        <TextField label="Texte" value={item.label} onChange={(v) => u({ label: v })} placeholder="Données protégées" />
                      </div>
                    )}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Bottom publish CTA */}
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

            {/* helper */}
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] pt-4 pb-8">
              <Type className="w-3 h-3" />
              Astuce : le titre des sections accepte une « partie en gradient » pour mettre des mots en valeur. Laissez les champs vides si une partie n'est pas nécessaire.
              <Layers className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMainPage;
