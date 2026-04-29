import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, ChevronLeft, Save, Eye, RefreshCcw, Megaphone, Users,
  Calendar, ImageIcon, Building2, Heart, LayoutGrid,
} from 'lucide-react';
import { api } from '../../../lib/api';
import {
  DEFAULT_CAMPUS_LIFE, mergeCampusLifeContent,
  type CampusLifeContent,
  type CampusGalleryItem, type CampusOrganization, type CampusEvent,
  type CampusFacility, type CampusService,
} from '../../../lib/pagesDefaults';
import { HOMEPAGE_ICON_OPTIONS } from '../../../lib/homepageDefaults';
import {
  TextField, TextAreaField, SelectField, StringListField,
  SectionCard, ListEditor, SectionTitleEditor, HeroEditor, CtaEditor, PublishBar,
  newId, useDirty,
} from './_cmsPrimitives';

const NAV = [
  { id: 'sec-hero',          label: 'Héro',         icon: <Home className="w-4 h-4" /> },
  { id: 'sec-marquee',       label: 'Bandeau',      icon: <Megaphone className="w-4 h-4" /> },
  { id: 'sec-gallery',       label: 'Galerie',      icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'sec-organizations', label: 'Clubs',        icon: <Users className="w-4 h-4" /> },
  { id: 'sec-events',        label: 'Événements',   icon: <Calendar className="w-4 h-4" /> },
  { id: 'sec-facilities',    label: 'Installations', icon: <Building2 className="w-4 h-4" /> },
  { id: 'sec-services',      label: 'Services',     icon: <Heart className="w-4 h-4" /> },
  { id: 'sec-cta',           label: 'CTA',          icon: <LayoutGrid className="w-4 h-4" /> },
];

const AdminCampusLifeContent: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<CampusLifeContent>(DEFAULT_CAMPUS_LIFE);
  const [originalContent, setOriginalContent] = useState<CampusLifeContent>(DEFAULT_CAMPUS_LIFE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/pages/campusLife');
        if (!cancelled && res.data?.success && res.data.data) {
          const merged = mergeCampusLifeContent(res.data.data);
          setContent(merged);
          setOriginalContent(merged);
        }
      } catch (e) {
        console.error('Erreur chargement vie du campus:', e);
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
      const res = await api.post('/api/pages/campusLife', content);
      if (res.data?.success) {
        const merged = mergeCampusLifeContent(res.data.data || content);
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

  const handleResetSection = (key: keyof CampusLifeContent) => {
    if (!confirm('Restaurer cette section aux valeurs par défaut ?')) return;
    setContent({ ...content, [key]: structuredClone(DEFAULT_CAMPUS_LIFE[key]) } as CampusLifeContent);
  };
  const handleResetAll = () => {
    if (!confirm("Restaurer TOUTE la page Vie du Campus aux valeurs par défaut ? Vos modifications non publiées seront perdues.")) return;
    setContent(structuredClone(DEFAULT_CAMPUS_LIFE));
  };

  const update = <K extends keyof CampusLifeContent>(key: K, value: CampusLifeContent[K]) => {
    setContent({ ...content, [key]: value });
  };

  // Multi-file upload to API → append to gallery
  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setSaveMessage(null);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      const res = await api.post('/api/uploads/campus-life', formData);
      const result = res.data;
      if (result.success && Array.isArray(result.data)) {
        const newItems: CampusGalleryItem[] = result.data.map((item: { url: string; alt?: string; type: 'image' | 'video' }) => ({
          id: newId('gal'),
          src: item.url,
          alt: item.alt || '',
          type: item.type,
        }));
        update('gallery', [...content.gallery, ...newItems]);
        setSaveMessage({ kind: 'success', text: `${newItems.length} média(s) ajouté(s) à la galerie.` });
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        setSaveMessage({ kind: 'error', text: 'Réponse invalide du serveur.' });
      }
    } catch (e: any) {
      const apiMessage = e?.response?.data?.error;
      setSaveMessage({ kind: 'error', text: apiMessage || (e instanceof Error ? e.message : 'Erreur réseau.') });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="section">
        <div className="section-content py-12 flex items-center justify-center">
          <div className="text-[var(--color-text-muted)]">Chargement de la page Vie du Campus…</div>
        </div>
      </div>
    );
  }

  const {
    hero, marquee,
    gallerySection, gallery,
    organizationsSection, organizations,
    eventsSection, events,
    facilitiesSection, facilities,
    servicesSection, services,
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
              Gestion de la page Vie du Campus
            </h1>
            <p className="text-[var(--color-text-muted)] mt-1">
              Galerie, clubs, événements, installations, services et CTA — tout est éditable.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a href="/campus-life" target="_blank" rel="noreferrer"
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
                newItem={() => ({ id: newId('cmq'), icon: 'Sparkles', label: '' })}
                addLabel="Ajouter un élément"
                itemTitle={(it) => it.label || 'Sans libellé'}
                renderItem={(item, u) => (
                  <div className="grid md:grid-cols-2 gap-3">
                    <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={HOMEPAGE_ICON_OPTIONS} />
                    <TextField label="Libellé" value={item.label} onChange={(v) => u({ label: v })} placeholder="Galerie photos & vidéos" />
                  </div>
                )}
              />
            </SectionCard>

            {/* Gallery */}
            <SectionCard
              id="sec-gallery"
              icon={<ImageIcon className="w-5 h-5" />}
              title="Galerie photos & vidéos"
              description="Médias affichés dans le carrousel principal."
              onReset={() => handleResetSection('gallery')}
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={gallerySection} onChange={(v) => update('gallerySection', v)} />
                </div>

                {/* Upload */}
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    id="campus-gallery-upload"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => { handleUploadFiles(e.target.files); e.target.value = ''; }}
                    className="hidden"
                  />
                  <label htmlFor="campus-gallery-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] border border-[var(--color-primary-gold)]/40 text-sm font-medium cursor-pointer hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-all"
                    aria-disabled={uploading}>
                    {uploading ? 'Upload en cours…' : 'Uploader des médias'}
                  </label>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Formats supportés : images & vidéos (max 50 MB / fichier).
                  </span>
                </div>

                <ListEditor<CampusGalleryItem>
                  items={gallery}
                  setItems={(next) => update('gallery', next)}
                  newItem={() => ({ id: newId('gal'), src: '', alt: '', type: 'image' })}
                  addLabel="Ajouter un média"
                  itemTitle={(it, i) => it.alt || `Média ${i + 1}`}
                  renderItem={(item, u) => (
                    <div className="grid md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-2">
                        <SelectField label="Type" value={item.type} onChange={(v) => u({ type: v as 'image' | 'video' })} options={['image', 'video']} />
                      </div>
                      <div className="md:col-span-5">
                        <TextField label="URL" value={item.src} onChange={(v) => u({ src: v })} placeholder="/forum/photo.jpg" />
                      </div>
                      <div className="md:col-span-5">
                        <TextField label="Texte alternatif" value={item.alt} onChange={(v) => u({ alt: v })} placeholder="Vie au Forum" />
                      </div>
                      {item.src && (
                        <div className="md:col-span-12">
                          {item.type === 'image' ? (
                            <img src={item.src} alt={item.alt} className="rounded-lg border max-h-32 object-cover" />
                          ) : (
                            <video src={item.src} muted controls className="rounded-lg border max-h-32 w-full" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
            </SectionCard>

            {/* Organizations */}
            <SectionCard
              id="sec-organizations"
              icon={<Users className="w-5 h-5" />}
              title="Clubs & Associations"
              onReset={() => handleResetSection('organizations')}
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={organizationsSection} onChange={(v) => update('organizationsSection', v)} />
                </div>
                <ListEditor<CampusOrganization>
                  items={organizations}
                  setItems={(next) => update('organizations', next)}
                  newItem={() => ({ id: newId('org'), icon: 'Users', name: '', description: '', members: '' })}
                  addLabel="Ajouter un club"
                  itemTitle={(it) => it.name || 'Nouveau club'}
                  renderItem={(item, u) => (
                    <div className="grid md:grid-cols-2 gap-3">
                      <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={HOMEPAGE_ICON_OPTIONS} />
                      <TextField label="Nom" value={item.name} onChange={(v) => u({ name: v })} placeholder="Club Sport & Jeux" />
                      <TextField label="Effectif" value={item.members} onChange={(v) => u({ members: v })} placeholder="180 membres" />
                      <div className="md:col-span-2">
                        <TextAreaField label="Description" value={item.description} onChange={(v) => u({ description: v })} rows={2} />
                      </div>
                    </div>
                  )}
                />
              </div>
            </SectionCard>

            {/* Events */}
            <SectionCard
              id="sec-events"
              icon={<Calendar className="w-5 h-5" />}
              title="Événements à venir"
              onReset={() => handleResetSection('events')}
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={eventsSection} onChange={(v) => update('eventsSection', v)} />
                </div>
                <ListEditor<CampusEvent>
                  items={events}
                  setItems={(next) => update('events', next)}
                  newItem={() => ({ id: newId('evt'), title: '', date: '', time: '', location: '', description: '' })}
                  addLabel="Ajouter un événement"
                  itemTitle={(it) => it.title || 'Nouvel événement'}
                  renderItem={(item, u) => (
                    <div className="grid md:grid-cols-2 gap-3">
                      <TextField label="Titre" value={item.title} onChange={(v) => u({ title: v })} placeholder="Portes ouvertes" />
                      <TextField label="Date" value={item.date} onChange={(v) => u({ date: v })} placeholder="15 Mars 2025" />
                      <TextField label="Heure" value={item.time} onChange={(v) => u({ time: v })} placeholder="9h00 - 16h00" />
                      <TextField label="Lieu" value={item.location} onChange={(v) => u({ location: v })} placeholder="Campus Medinatoul Salam" />
                      <div className="md:col-span-2">
                        <TextAreaField label="Description" value={item.description} onChange={(v) => u({ description: v })} rows={3} />
                      </div>
                    </div>
                  )}
                />
              </div>
            </SectionCard>

            {/* Facilities */}
            <SectionCard
              id="sec-facilities"
              icon={<Building2 className="w-5 h-5" />}
              title="Installations / Équipements"
              onReset={() => handleResetSection('facilities')}
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={facilitiesSection} onChange={(v) => update('facilitiesSection', v)} />
                </div>
                <ListEditor<CampusFacility>
                  items={facilities}
                  setItems={(next) => update('facilities', next)}
                  newItem={() => ({ id: newId('fac'), name: '', description: '', features: [] })}
                  addLabel="Ajouter une installation"
                  itemTitle={(it) => it.name || 'Nouvelle installation'}
                  renderItem={(item, u) => (
                    <div className="grid md:grid-cols-2 gap-3">
                      <TextField label="Nom" value={item.name} onChange={(v) => u({ name: v })} placeholder="Bibliothèque jeunesse" />
                      <TextField label="Description courte" value={item.description} onChange={(v) => u({ description: v })} placeholder="Albums, premiers romans…" />
                      <div className="md:col-span-2">
                        <StringListField
                          label="Caractéristiques"
                          value={item.features}
                          onChange={(v) => u({ features: v })}
                          rows={3}
                          placeholder={'Heure du conte\nEspace calme\nRallye-lecture'}
                        />
                      </div>
                    </div>
                  )}
                />
              </div>
            </SectionCard>

            {/* Services */}
            <SectionCard
              id="sec-services"
              icon={<Heart className="w-5 h-5" />}
              title="Services aux élèves"
              onReset={() => handleResetSection('services')}
            >
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <SectionTitleEditor value={servicesSection} onChange={(v) => update('servicesSection', v)} />
                </div>
                <ListEditor<CampusService>
                  items={services}
                  setItems={(next) => update('services', next)}
                  newItem={() => ({ id: newId('svc'), icon: 'Heart', title: '', description: '' })}
                  addLabel="Ajouter un service"
                  itemTitle={(it) => it.title || 'Nouveau service'}
                  renderItem={(item, u) => (
                    <div className="grid md:grid-cols-2 gap-3">
                      <SelectField label="Icône" value={item.icon} onChange={(v) => u({ icon: v })} options={HOMEPAGE_ICON_OPTIONS} />
                      <TextField label="Titre" value={item.title} onChange={(v) => u({ title: v })} placeholder="Suivi pédagogique" />
                      <div className="md:col-span-2">
                        <TextAreaField label="Description" value={item.description} onChange={(v) => u({ description: v })} rows={2} />
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

export default AdminCampusLifeContent;
