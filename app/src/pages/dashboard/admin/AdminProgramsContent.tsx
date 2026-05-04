import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, ChevronLeft, Save, Eye, RefreshCcw, Megaphone, GraduationCap,
  Filter as FilterIcon, LayoutGrid,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';
import {
  DEFAULT_PROGRAMS, mergeProgramsContent,
  type ProgramsContent, type ProgramItem,
} from '../../../lib/pagesDefaults';
import { HOMEPAGE_ICON_OPTIONS } from '../../../lib/homepageDefaults';
import {
  TextField, TextAreaField, NumberField, SelectField, StringListField,
  SectionCard, ListEditor, SectionTitleEditor, HeroEditor, CtaEditor, PublishBar,
  inputCls, labelCls, newId, useDirty,
} from './_cmsPrimitives';

const NAV = [
  { id: 'sec-hero',     label: 'Héro',     icon: <Home className="w-4 h-4" /> },
  { id: 'sec-marquee',  label: 'Bandeau',  icon: <Megaphone className="w-4 h-4" /> },
  { id: 'sec-filters',  label: 'Filtres',  icon: <FilterIcon className="w-4 h-4" /> },
  { id: 'sec-programs', label: 'Programmes', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'sec-cta',      label: 'Appel à l\'action', icon: <LayoutGrid className="w-4 h-4" /> },
];

const AdminProgramsContent: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<ProgramsContent>(DEFAULT_PROGRAMS);
  const [originalContent, setOriginalContent] = useState<ProgramsContent>(DEFAULT_PROGRAMS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(API.PAGES('programs'));
        if (!cancelled && res.data?.success && res.data.data) {
          const merged = mergeProgramsContent(res.data.data);
          setContent(merged);
          setOriginalContent(merged);
        }
      } catch (e) {
        console.error('Erreur chargement programmes:', e);
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
      const res = await api.post(API.PAGES('programs'), content);
      if (res.data?.success) {
        const merged = mergeProgramsContent(res.data.data || content);
        setContent(merged);
        setOriginalContent(merged);
        setSaveMessage({ kind: 'success', text: 'Modifications publiées avec succès.' });
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

  const handleResetSection = (key: keyof ProgramsContent) => {
    if (!confirm('Restaurer cette section aux valeurs par défaut ?')) return;
    setContent({ ...content, [key]: structuredClone(DEFAULT_PROGRAMS[key]) } as ProgramsContent);
  };
  const handleResetAll = () => {
    if (!confirm("Restaurer TOUTE la page Programmes aux valeurs par défaut ? Vos modifications non publiées seront perdues.")) return;
    setContent(structuredClone(DEFAULT_PROGRAMS));
  };

  const update = <K extends keyof ProgramsContent>(key: K, value: ProgramsContent[K]) => {
    setContent({ ...content, [key]: value });
  };

  if (loading) {
    return (
      <div className="section">
        <div className="section-content py-12 flex items-center justify-center">
          <div className="text-[var(--color-text-muted)]">Chargement de la page Programmes…</div>
        </div>
      </div>
    );
  }

  const { hero, marquee, filters, programsSection, programs, cta } = content;

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
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
              Gestion de la page Programmes
            </h1>
            <p className="text-[var(--color-text-muted)] mt-1">
              Modifiez chaque section : ajoutez, supprimez ou réorganisez le contenu librement.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a href="/programs" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-bg-secondary)] transition-colors">
              <Eye className="w-4 h-4" /> Voir la page
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
            {/* Hero */}
            <SectionCard
              id="sec-hero"
              icon={<Home className="w-5 h-5" />}
              title="Section Héro (bannière principale)"
              description="Vidéo, titres, badges et lignes de confiance."
              onReset={() => handleResetSection('hero')}
            >
              <HeroEditor hero={hero} onChange={(h) => update('hero', h)} iconOptions={HOMEPAGE_ICON_OPTIONS} />
            </SectionCard>

            {/* Marquee */}
            <SectionCard
              id="sec-marquee"
              icon={<Megaphone className="w-5 h-5" />}
              title="Bandeau défilant"
              description="Liste qui défile sous le héro."
              onReset={() => handleResetSection('marquee')}
            >
              <ListEditor<typeof marquee[number]>
                items={marquee}
                setItems={(next) => update('marquee', next)}
                newItem={() => ({ id: newId('pmq'), icon: 'Sparkles', label: '' })}
                addLabel="Ajouter un élément"
                itemTitle={(it) => it.label || 'Sans libellé'}
                renderItem={(item, u) => (
                  <div className="grid md:grid-cols-2 gap-3">
                    <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={HOMEPAGE_ICON_OPTIONS} />
                    <TextField label="Libellé" value={item.label} onChange={(v) => u({ label: v })} placeholder="Maternelle 3-5 ans" />
                  </div>
                )}
              />
            </SectionCard>

            {/* Filters */}
            <SectionCard
              id="sec-filters"
              icon={<FilterIcon className="w-5 h-5" />}
              title="Filtres (sections et cycles)"
              description="Liste des sections et cycles affichés dans les menus déroulants."
              onReset={() => handleResetSection('filters')}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <StringListField
                  label="Sections / Départements"
                  value={filters.departments}
                  onChange={(v) => update('filters', { ...filters, departments: v })}
                  rows={6}
                  placeholder={'Maternelle\nÉlémentaire\nSoutien & Enrichissement'}
                />
                <StringListField
                  label="Cycles / Niveaux"
                  value={filters.levels}
                  onChange={(v) => update('filters', { ...filters, levels: v })}
                  rows={6}
                  placeholder={'Maternelle\nÉlémentaire\nSoutien'}
                />
              </div>
            </SectionCard>

            {/* Programs */}
            <SectionCard
              id="sec-programs"
              icon={<GraduationCap className="w-5 h-5" />}
              title="Programmes pédagogiques"
              description="Toutes les cartes de programme (cycles, niveaux, durée, élèves max…)."
              onReset={() => handleResetSection('programs')}
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={programsSection} onChange={(v) => update('programsSection', v)} />
                </div>
                <ListEditor<ProgramItem>
                  items={programs}
                  setItems={(next) => update('programs', next)}
                  newItem={() => ({ id: newId('prog'), icon: 'BookOpen', title: '', department: filters.departments[0] || '', level: filters.levels[0] || '', duration: '', description: '', features: [], credits: 0, objectives: [], curriculum: [], teachingApproach: '', enrollment: '', price: '' })}
                  addLabel="Ajouter un programme"
                  itemTitle={(it) => it.title || 'Nouveau programme'}
                  renderItem={(item, u) => (
                    <div className="space-y-5">
                      {/* ── Carte (page liste) ─────────────────────────────── */}
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 uppercase tracking-wide">
                          Carte (page Programmes)
                        </h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={HOMEPAGE_ICON_OPTIONS} />
                          <TextField label="Titre" value={item.title} onChange={(v) => u({ title: v })} placeholder="Cycle 2 : CE1 - CE2" />
                          <div>
                            <label className={labelCls}>Section / Département</label>
                            <select
                              value={item.department}
                              onChange={(e) => u({ department: e.target.value })}
                              className={inputCls}
                            >
                              <option value="">— Aucune —</option>
                              {filters.departments.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Cycle / Niveau</label>
                            <select
                              value={item.level}
                              onChange={(e) => u({ level: e.target.value })}
                              className={inputCls}
                            >
                              <option value="">— Aucun —</option>
                              {filters.levels.map((l) => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                          <TextField label="Durée" value={item.duration} onChange={(v) => u({ duration: v })} placeholder="2 ans" />
                          <NumberField label="Élèves max" value={item.credits} onChange={(v) => u({ credits: v })} min={0} max={500} />
                          <div className="md:col-span-2">
                            <TextAreaField label="Description (résumé)" value={item.description} onChange={(v) => u({ description: v })} rows={3} />
                          </div>
                          <div className="md:col-span-2">
                            <StringListField
                              label="Tags / caractéristiques"
                              value={item.features}
                              onChange={(v) => u({ features: v })}
                              rows={3}
                              placeholder={'Ateliers d\'écriture\nProjet sciences\nClubs lecture'}
                            />
                          </div>
                        </div>
                      </div>

                      {/* ── Page détail (/programmes/:id) ─────────────────── */}
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1 uppercase tracking-wide">
                          Page détail
                        </h4>
                        <p className="text-xs text-[var(--color-text-muted)] mb-3">
                          Contenu affiché sur <code className="text-[var(--color-text-secondary)]">/programmes/{item.id}</code> quand un visiteur clique sur "Voir les détails".
                        </p>
                        <div className="grid md:grid-cols-1 gap-3">
                          <TextAreaField
                            label="Approche pédagogique"
                            value={item.teachingApproach || ''}
                            onChange={(v) => u({ teachingApproach: v })}
                            rows={4}
                            placeholder="Notre approche pédagogique privilégie le jeu comme mode d'apprentissage principal…"
                          />
                          <StringListField
                            label="Objectifs pédagogiques (un par ligne)"
                            value={item.objectives || []}
                            onChange={(v) => u({ objectives: v })}
                            rows={5}
                            placeholder={"Maîtriser la lecture et l'écriture\nConsolider les bases mathématiques\nInitier aux sciences et à l'observation"}
                          />
                          <StringListField
                            label="Programme d'études / matières (une par ligne)"
                            value={item.curriculum || []}
                            onChange={(v) => u({ curriculum: v })}
                            rows={5}
                            placeholder={"Français\nMathématiques\nDécouverte du monde\nÉducation physique et artistique"}
                          />
                          <div className="grid md:grid-cols-2 gap-3">
                            <TextAreaField
                              label="Modalités d'inscription"
                              value={item.enrollment || ''}
                              onChange={(v) => u({ enrollment: v })}
                              rows={3}
                              placeholder="Les inscriptions se font en septembre…"
                            />
                            <TextAreaField
                              label="Frais de scolarité"
                              value={item.price || ''}
                              onChange={(v) => u({ price: v })}
                              rows={3}
                              placeholder="Consultez notre barème des frais de scolarité"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
            </SectionCard>

            {/* CTA */}
            <SectionCard
              id="sec-cta"
              icon={<LayoutGrid className="w-5 h-5" />}
              title="Section appel à l'action (CTA finale)"
              description="Bandeau de conversion en bas de page."
              onReset={() => handleResetSection('cta')}
            >
              <CtaEditor cta={cta} onChange={(c) => update('cta', c)} iconOptions={HOMEPAGE_ICON_OPTIONS} />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProgramsContent;
