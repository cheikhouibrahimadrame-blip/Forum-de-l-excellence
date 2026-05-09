// Reusable admin CMS primitives shared by AdminMainPage, AdminProgramsContent,
// AdminCampusLifeContent, AdminAdmissionsContent.
//
// All controls follow the same visual idiom (rounded inputs with a gold ring,
// outlined cards, dashed "Add" buttons) so the editor experience is consistent
// across every page.

import type React from 'react';
import { useMemo } from 'react';
import { ChevronDown, ChevronUp, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import type { HomepageSectionTitle } from '../../../lib/homepageDefaults';

// ─────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────
export const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]';
export const labelCls = 'block text-sm font-medium mb-1 text-[var(--color-text-primary)]';

// ─────────────────────────────────────────────────────────────────
// Primitive fields
// ─────────────────────────────────────────────────────────────────
export const TextField: React.FC<{
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

export const NumberField: React.FC<{
  label: string; value: number;
  onChange: (v: number) => void;
  min?: number; max?: number; placeholder?: string;
}> = ({ label, value, onChange, min, max, placeholder }) => (
  <div>
    <label className={labelCls}>{label}</label>
    <input
      type="number"
      value={typeof value === 'number' ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
      className={inputCls}
      min={min}
      max={max}
      placeholder={placeholder}
    />
  </div>
);

export const TextAreaField: React.FC<{
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

export const SelectField: React.FC<{
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

export const ColorField: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
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

// String list editor — one item per line. Used for "features" / "details" /
// "requirements" lists that don't justify their own object schema.
export const StringListField: React.FC<{
  label: string; value: string[]; onChange: (v: string[]) => void;
  rows?: number; placeholder?: string;
}> = ({ label, value, onChange, rows = 4, placeholder }) => (
  <div>
    <label className={labelCls}>{label} (un par ligne)</label>
    <textarea
      value={(value || []).join('\n')}
      onChange={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
      className={inputCls}
      rows={rows}
      placeholder={placeholder}
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Section card — collapsible bucket for one editable group
// ─────────────────────────────────────────────────────────────────
export const SectionCard: React.FC<{
  id: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onReset?: () => void;
}> = ({ id, title, icon, description, children, defaultOpen = true, onReset }) => (
  <details
    id={id}
    open={defaultOpen}
    className="group card border border-[var(--color-border)] rounded-xl overflow-hidden scroll-mt-28"
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
      {onReset && (
        <button
          onClick={(e) => { e.preventDefault(); onReset(); }}
          className="mt-4 text-xs text-[var(--color-text-muted)] hover:text-red-500 inline-flex items-center gap-1"
        >
          <RefreshCcw className="w-3 h-3" /> Réinitialiser cette section
        </button>
      )}
    </div>
  </details>
);

// ─────────────────────────────────────────────────────────────────
// Generic CRUD list editor (add / remove / reorder up&down)
// ─────────────────────────────────────────────────────────────────
export function ListEditor<T extends { id: string }>(props: {
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
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] truncate">
              {itemTitle ? itemTitle(it, i) : `#${i + 1}`}
            </div>
            <div className="flex gap-1 flex-shrink-0">
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
// Section title editor (eyebrow + 3-part title + optional desc/CTA)
// ─────────────────────────────────────────────────────────────────
export const SectionTitleEditor: React.FC<{
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
// Hero editor — covers the shared PageHero shape across pages
// ─────────────────────────────────────────────────────────────────
type HeroLike = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  videoSrc: string;
  posterSrc: string;
  trustItems: { id: string; icon: string; label: string }[];
};

export const HeroEditor: React.FC<{
  hero: HeroLike;
  onChange: (h: HeroLike) => void;
  iconOptions: readonly string[];
}> = ({ hero, onChange, iconOptions }) => (
  <div className="space-y-4">
    <TextField label="Eyebrow (badge supérieur)" value={hero.eyebrow} onChange={(v) => onChange({ ...hero, eyebrow: v })} placeholder="Année académique 2025–2026 …" />
    <TextAreaField label="Titre principal" value={hero.title} onChange={(v) => onChange({ ...hero, title: v })} rows={2} />
    <TextAreaField label="Sous-titre" value={hero.subtitle} onChange={(v) => onChange({ ...hero, subtitle: v })} rows={3} />
    <div className="grid md:grid-cols-2 gap-4">
      <TextField label="Bouton principal — texte" value={hero.primaryButtonText} onChange={(v) => onChange({ ...hero, primaryButtonText: v })} />
      <TextField label="Bouton principal — lien" value={hero.primaryButtonLink} onChange={(v) => onChange({ ...hero, primaryButtonLink: v })} placeholder="/admissions" />
      <TextField label="Bouton secondaire — texte" value={hero.secondaryButtonText} onChange={(v) => onChange({ ...hero, secondaryButtonText: v })} />
      <TextField label="Bouton secondaire — lien" value={hero.secondaryButtonLink} onChange={(v) => onChange({ ...hero, secondaryButtonLink: v })} placeholder="/programs" />
      <TextField label="Vidéo (URL)" value={hero.videoSrc} onChange={(v) => onChange({ ...hero, videoSrc: v })} placeholder="/excz.mp4" />
      <TextField label="Image de secours (poster)" value={hero.posterSrc} onChange={(v) => onChange({ ...hero, posterSrc: v })} placeholder="/programs-hero.jpg" />
    </div>
    <div>
      <label className={labelCls}>Lignes de confiance (sous les boutons)</label>
      <ListEditor<HeroLike['trustItems'][number]>
        items={hero.trustItems}
        setItems={(next) => onChange({ ...hero, trustItems: next })}
        newItem={() => ({ id: newId('trust'), icon: 'Sparkles', label: '' })}
        addLabel="Ajouter une ligne"
        itemTitle={(it, i) => it.label || `Ligne ${i + 1}`}
        renderItem={(item, u) => (
          <div className="grid md:grid-cols-2 gap-3">
            <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={iconOptions} />
            <TextField label="Texte" value={item.label} onChange={(v) => u({ label: v })} placeholder="Médinatoul Salam · Mbour" />
          </div>
        )}
      />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// CTA editor — covers the shared PageCTA shape
// ─────────────────────────────────────────────────────────────────
type CtaLike = {
  eyebrow: string;
  title: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  badges: { id: string; icon: string; label: string }[];
};

export const CtaEditor: React.FC<{
  cta: CtaLike;
  onChange: (c: CtaLike) => void;
  iconOptions: readonly string[];
}> = ({ cta, onChange, iconOptions }) => (
  <div className="space-y-4">
    <TextField label="Eyebrow (badge supérieur)" value={cta.eyebrow} onChange={(v) => onChange({ ...cta, eyebrow: v })} placeholder="Inscriptions 2025–2026 ouvertes" />
    <TextAreaField label="Titre" value={cta.title} onChange={(v) => onChange({ ...cta, title: v })} rows={2} />
    <TextAreaField label="Description" value={cta.description} onChange={(v) => onChange({ ...cta, description: v })} rows={3} />
    <div className="grid md:grid-cols-2 gap-4">
      <TextField label="Bouton principal — texte" value={cta.primaryButtonText} onChange={(v) => onChange({ ...cta, primaryButtonText: v })} />
      <TextField label="Bouton principal — lien" value={cta.primaryButtonLink} onChange={(v) => onChange({ ...cta, primaryButtonLink: v })} placeholder="/admissions" />
      <TextField label="Bouton secondaire — texte" value={cta.secondaryButtonText} onChange={(v) => onChange({ ...cta, secondaryButtonText: v })} />
      <TextField label="Bouton secondaire — lien" value={cta.secondaryButtonLink} onChange={(v) => onChange({ ...cta, secondaryButtonLink: v })} placeholder="https://wa.me/221775368254 · tel:+221775368254 · /programs" />
    </div>
    <div>
      <label className={labelCls}>Badges de réassurance (en bas)</label>
      <ListEditor<CtaLike['badges'][number]>
        items={cta.badges}
        setItems={(next) => onChange({ ...cta, badges: next })}
        newItem={() => ({ id: newId('cta-b'), icon: 'Shield', label: '' })}
        addLabel="Ajouter un badge"
        itemTitle={(it) => it.label || 'Nouveau badge'}
        renderItem={(item, u) => (
          <div className="grid md:grid-cols-2 gap-3">
            <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={iconOptions} />
            <TextField label="Texte" value={item.label} onChange={(v) => u({ label: v })} placeholder="Données protégées" />
          </div>
        )}
      />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Sticky publish bar
// ─────────────────────────────────────────────────────────────────
export const PublishBar: React.FC<{
  dirty: boolean;
  saving: boolean;
  message: { kind: 'success' | 'error'; text: string } | null;
  onPublish: () => void;
}> = ({ dirty, saving, message, onPublish }) => {
  return (
    <div className="sticky top-0 z-30 mb-6">
      <div className="rounded-xl border border-[var(--color-border)] bg-white/95 backdrop-blur-sm shadow-sm px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-sm">
          {dirty ? (
            <span className="inline-flex items-center gap-2 text-amber-600 font-medium">
              ● Modifications non publiées
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-[var(--color-text-muted)]">
              ✓ À jour
            </span>
          )}
          {message && (
            <span className={`inline-flex items-center gap-2 font-medium ${message.kind === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </span>
          )}
        </div>
        <button
          onClick={onPublish}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-primary-gold)] text-[var(--color-primary-navy)] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-primary-gold-dark)] transition-colors"
        >
          {saving ? 'Publication…' : 'Publier les modifications'}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// id helper
// ─────────────────────────────────────────────────────────────────
export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

// dirty diff helper
export function useDirty<T>(current: T, original: T) {
  return useMemo(() => JSON.stringify(current) !== JSON.stringify(original), [current, original]);
}
