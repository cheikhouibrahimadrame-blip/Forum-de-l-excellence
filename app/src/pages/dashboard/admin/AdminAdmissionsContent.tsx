import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, ChevronLeft, Save, Eye, RefreshCcw, Megaphone, Layers,
  ListChecks, Calendar, Phone, HelpCircle, LayoutGrid,
} from 'lucide-react';
import { api } from '../../../lib/api';
import {
  DEFAULT_ADMISSIONS, mergeAdmissionsContent,
  type AdmissionsContent,
  type AdmissionStep, type AdmissionRequirement,
  type AdmissionDeadline, type AdmissionFAQ,
} from '../../../lib/pagesDefaults';
import { HOMEPAGE_ICON_OPTIONS } from '../../../lib/homepageDefaults';
import {
  TextField, TextAreaField, SelectField, StringListField,
  SectionCard, ListEditor, SectionTitleEditor, HeroEditor, CtaEditor, PublishBar,
  newId, useDirty, labelCls,
} from './_cmsPrimitives';

const STATUS_OPTIONS = ['En cours', 'À venir', 'Terminé'];

const NAV = [
  { id: 'sec-hero',         label: 'Héro',         icon: <Home className="w-4 h-4" /> },
  { id: 'sec-marquee',      label: 'Bandeau',      icon: <Megaphone className="w-4 h-4" /> },
  { id: 'sec-steps',        label: 'Étapes',       icon: <Layers className="w-4 h-4" /> },
  { id: 'sec-requirements', label: 'Prérequis',    icon: <ListChecks className="w-4 h-4" /> },
  { id: 'sec-deadlines',    label: 'Calendrier',   icon: <Calendar className="w-4 h-4" /> },
  { id: 'sec-contact',      label: 'Contact',      icon: <Phone className="w-4 h-4" /> },
  { id: 'sec-faqs',         label: 'FAQ',          icon: <HelpCircle className="w-4 h-4" /> },
  { id: 'sec-cta',          label: 'CTA',          icon: <LayoutGrid className="w-4 h-4" /> },
];

const AdminAdmissionsContent: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<AdmissionsContent>(DEFAULT_ADMISSIONS);
  const [originalContent, setOriginalContent] = useState<AdmissionsContent>(DEFAULT_ADMISSIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/pages/admissions');
        if (!cancelled && res.data?.success && res.data.data) {
          const merged = mergeAdmissionsContent(res.data.data);
          setContent(merged);
          setOriginalContent(merged);
        }
      } catch (e) {
        console.error('Erreur chargement admissions:', e);
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
      const res = await api.post('/api/pages/admissions', content);
      if (res.data?.success) {
        const merged = mergeAdmissionsContent(res.data.data || content);
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

  const handleResetSection = (key: keyof AdmissionsContent) => {
    if (!confirm('Restaurer cette section aux valeurs par défaut ?')) return;
    setContent({ ...content, [key]: structuredClone(DEFAULT_ADMISSIONS[key]) } as AdmissionsContent);
  };
  const handleResetAll = () => {
    if (!confirm("Restaurer TOUTE la page Admissions aux valeurs par défaut ? Vos modifications non publiées seront perdues.")) return;
    setContent(structuredClone(DEFAULT_ADMISSIONS));
  };

  const update = <K extends keyof AdmissionsContent>(key: K, value: AdmissionsContent[K]) => {
    setContent({ ...content, [key]: value });
  };

  if (loading) {
    return (
      <div className="section">
        <div className="section-content py-12 flex items-center justify-center">
          <div className="text-[var(--color-text-muted)]">Chargement de la page Admissions…</div>
        </div>
      </div>
    );
  }

  const {
    hero, marquee,
    stepsSection, steps,
    requirementsSection, requirements,
    deadlinesSection, deadlines,
    contactSection,
    faqSection, faqs,
    cta,
  } = content;

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
              Gestion de la page Admissions
            </h1>
            <p className="text-[var(--color-text-muted)] mt-1">
              Étapes du processus, prérequis, calendrier, contact, FAQ et CTA — tout est éditable.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a href="/admissions" target="_blank" rel="noreferrer"
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
              title="Section Héro"
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
              onReset={() => handleResetSection('marquee')}
            >
              <ListEditor<typeof marquee[number]>
                items={marquee}
                setItems={(next) => update('marquee', next)}
                newItem={() => ({ id: newId('amq'), icon: 'Sparkles', label: '' })}
                addLabel="Ajouter un élément"
                itemTitle={(it) => it.label || 'Sans libellé'}
                renderItem={(item, u) => (
                  <div className="grid md:grid-cols-2 gap-3">
                    <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={HOMEPAGE_ICON_OPTIONS} />
                    <TextField label="Libellé" value={item.label} onChange={(v) => u({ label: v })} placeholder="Excellence académique" />
                  </div>
                )}
              />
            </SectionCard>

            {/* Steps */}
            <SectionCard
              id="sec-steps"
              icon={<Layers className="w-5 h-5" />}
              title="Étapes du processus d'admission"
              description="Chaque carte affiche un titre, une icône et une liste de détails."
              onReset={() => handleResetSection('steps')}
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={stepsSection} onChange={(v) => update('stepsSection', v)} />
                </div>
                <ListEditor<AdmissionStep>
                  items={steps}
                  setItems={(next) => update('steps', next)}
                  newItem={() => ({ id: newId('stp'), icon: 'UserPlus', title: '', description: '', details: [] })}
                  addLabel="Ajouter une étape"
                  itemTitle={(it) => it.title || 'Nouvelle étape'}
                  renderItem={(item, u) => (
                    <div className="grid md:grid-cols-2 gap-3">
                      <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={HOMEPAGE_ICON_OPTIONS} />
                      <TextField label="Titre" value={item.title} onChange={(v) => u({ title: v })} placeholder="1. Démarche de Candidature" />
                      <div className="md:col-span-2">
                        <TextAreaField label="Description courte" value={item.description} onChange={(v) => u({ description: v })} rows={2} />
                      </div>
                      <div className="md:col-span-2">
                        <StringListField
                          label="Détails / sous-étapes"
                          value={item.details}
                          onChange={(v) => u({ details: v })}
                          rows={5}
                          placeholder={'Formulaire de candidature détaillé\nActe de naissance certifié\nDossier vaccinal complet'}
                        />
                      </div>
                    </div>
                  )}
                />
              </div>
            </SectionCard>

            {/* Requirements */}
            <SectionCard
              id="sec-requirements"
              icon={<ListChecks className="w-5 h-5" />}
              title="Prérequis par niveau"
              onReset={() => handleResetSection('requirements')}
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={requirementsSection} onChange={(v) => update('requirementsSection', v)} />
                </div>
                <ListEditor<AdmissionRequirement>
                  items={requirements}
                  setItems={(next) => update('requirements', next)}
                  newItem={() => ({ id: newId('req'), level: '', requirements: [] })}
                  addLabel="Ajouter un niveau"
                  itemTitle={(it) => it.level || 'Nouveau niveau'}
                  renderItem={(item, u) => (
                    <div className="grid md:grid-cols-1 gap-3">
                      <TextField label="Niveau" value={item.level} onChange={(v) => u({ level: v })} placeholder="Maternelle (PS-MS-GS)" />
                      <StringListField
                        label="Critères / prérequis"
                        value={item.requirements}
                        onChange={(v) => u({ requirements: v })}
                        rows={4}
                        placeholder={'Âge 3-5 ans\nPropreté acquise\nCarnet de vaccination à jour'}
                      />
                    </div>
                  )}
                />
              </div>
            </SectionCard>

            {/* Deadlines */}
            <SectionCard
              id="sec-deadlines"
              icon={<Calendar className="w-5 h-5" />}
              title="Calendrier des admissions"
              onReset={() => handleResetSection('deadlines')}
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={deadlinesSection} onChange={(v) => update('deadlinesSection', v)} />
                </div>
                <ListEditor<AdmissionDeadline>
                  items={deadlines}
                  setItems={(next) => update('deadlines', next)}
                  newItem={() => ({ id: newId('dl'), phase: '', date: '', status: 'À venir' })}
                  addLabel="Ajouter une date clé"
                  itemTitle={(it) => it.phase || 'Nouvelle date'}
                  renderItem={(item, u) => (
                    <div className="grid md:grid-cols-3 gap-3">
                      <TextField label="Phase" value={item.phase} onChange={(v) => u({ phase: v })} placeholder="Ouverture des inscriptions" />
                      <TextField label="Date" value={item.date} onChange={(v) => u({ date: v })} placeholder="1er Février 2025" />
                      <SelectField label="Statut" value={item.status} onChange={(v) => u({ status: v })} options={STATUS_OPTIONS} />
                    </div>
                  )}
                />
              </div>
            </SectionCard>

            {/* Contact */}
            <SectionCard
              id="sec-contact"
              icon={<Phone className="w-5 h-5" />}
              title="Bloc Contact"
              description="Eyebrow, titre, description + liste d'éléments (téléphone, email, adresse…)."
              onReset={() => handleResetSection('contactSection')}
            >
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <TextField label="Eyebrow" value={contactSection.eyebrow} onChange={(v) => update('contactSection', { ...contactSection, eyebrow: v })} placeholder="Contact" />
                  <TextField label="Titre" value={contactSection.title} onChange={(v) => update('contactSection', { ...contactSection, title: v })} placeholder="Parlons de votre enfant" />
                  <div className="md:col-span-2">
                    <TextAreaField label="Description" value={contactSection.description} onChange={(v) => update('contactSection', { ...contactSection, description: v })} rows={2} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Coordonnées (téléphone, email, adresse, direction…)</label>
                  <ListEditor<typeof contactSection.items[number]>
                    items={contactSection.items}
                    setItems={(next) => update('contactSection', { ...contactSection, items: next })}
                    newItem={() => ({ id: newId('ci'), icon: 'Phone', label: '', value: '' })}
                    addLabel="Ajouter une coordonnée"
                    itemTitle={(it) => it.label || 'Nouvelle coordonnée'}
                    renderItem={(item, u) => (
                      <div className="grid md:grid-cols-3 gap-3">
                        <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={HOMEPAGE_ICON_OPTIONS} />
                        <TextField label="Libellé" value={item.label} onChange={(v) => u({ label: v })} placeholder="Téléphone" />
                        <TextField label="Valeur" value={item.value} onChange={(v) => u({ value: v })} placeholder="+221 775368254" />
                      </div>
                    )}
                  />
                </div>
              </div>
            </SectionCard>

            {/* FAQ */}
            <SectionCard
              id="sec-faqs"
              icon={<HelpCircle className="w-5 h-5" />}
              title="Questions fréquentes (FAQ)"
              onReset={() => handleResetSection('faqs')}
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={faqSection} onChange={(v) => update('faqSection', v)} />
                </div>
                <ListEditor<AdmissionFAQ>
                  items={faqs}
                  setItems={(next) => update('faqs', next)}
                  newItem={() => ({ id: newId('faq'), question: '', answer: '' })}
                  addLabel="Ajouter une question"
                  itemTitle={(it) => it.question || 'Nouvelle question'}
                  renderItem={(item, u) => (
                    <div className="grid md:grid-cols-1 gap-3">
                      <TextField label="Question" value={item.question} onChange={(v) => u({ question: v })} />
                      <TextAreaField label="Réponse" value={item.answer} onChange={(v) => u({ answer: v })} rows={3} />
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
              onReset={() => handleResetSection('cta')}
            >
              <CtaEditor cta={cta} onChange={(c) => update('cta', c)} iconOptions={HOMEPAGE_ICON_OPTIONS} />
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

export default AdminAdmissionsContent;
