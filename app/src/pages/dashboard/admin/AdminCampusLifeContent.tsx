import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { api } from '../../../lib/api';

interface HeroSection {
  title: string;
  subtitle: string;
  image?: string;
}

interface ContentSection {
  clubs?: string;
  sports?: string;
  cultural?: string;
  social?: string;
  [key: string]: string | undefined;
}

interface GalleryItem {
  src: string;
  alt: string;
  type: 'image' | 'video';
}


const AdminCampusLifeContent: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const [hero, setHero] = useState<HeroSection>({
    title: '',
    subtitle: '',
    image: ''
  });

  const [content, setContent] = useState<ContentSection>({
    clubs: '',
    sports: '',
    cultural: '',
    social: ''
  });

  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await api.get('/api/pages/campusLife');
      const result = response.data;
      if (result.success && result.data) {
        setHero(result.data.hero);
        setContent(result.data.content);
        setGallery(Array.isArray(result.data.gallery) ? result.data.gallery : []);
      } else {
        setMessage('⚠️ Impossible de charger le contenu');
      }
    } catch (error) {
      console.error('Error fetching campus life content:', error);
      setMessage(`❌ Erreur de connexion: ${error instanceof Error ? error.message : 'Failed to fetch'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await api.post('/api/pages/campusLife', { hero, content, gallery });
      const result = response.data;

      if (result.success) {
        setMessage('✅ Modifications sauvegardées avec succès !');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ ${result.error || 'Erreur lors de la sauvegarde'}`);
      }
    } catch (error: any) {
      console.error('Error saving content:', error);
      const apiMessage = error?.response?.data?.error;
      setMessage(`❌ Erreur de connexion: ${apiMessage || (error instanceof Error ? error.message : 'Network error')}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post('/api/uploads/campus-life', formData);
      const result = response.data;
      if (result.success && Array.isArray(result.data)) {
        setGallery(prev => [
          ...prev,
          ...result.data.map((item: { url: string; alt?: string; type: 'image' | 'video' }) => ({
            src: item.url,
            alt: item.alt || '',
            type: item.type
          }))
        ]);
        setMessage('✅ Médias ajoutés à la galerie.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Réponse invalide du serveur');
      }
    } catch (error: any) {
      console.error('Error uploading files:', error);
      const apiMessage = error?.response?.data?.error;
      setMessage(`❌ Erreur de connexion: ${apiMessage || (error instanceof Error ? error.message : 'Network error')}`);
    } finally {
      setUploading(false);
    }
  };

  const onUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUploadFiles(e.target.files);
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy"></div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/admin', { state: { scrollTo: 'contenu-site-public' } })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] border border-[var(--color-primary-gold)]/40 hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <h1 className="text-3xl font-bold">Modifier - Page Vie du Campus</h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>

          {/* Message */}
          {message && (
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
              {message}
            </div>
          )}

          {/* Hero Section */}
          <div className="card p-8">
            <h2 className="text-2xl font-bold mb-6">Section Héro</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Titre</label>
                <input
                  type="text"
                  value={hero.title}
                  onChange={(e) => setHero({ ...hero, title: e.target.value })}
                  className="input-field w-full"
                  placeholder="Titre principal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sous-titre</label>
                <textarea
                  value={hero.subtitle}
                  onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                  className="input-field w-full"
                  rows={3}
                  placeholder="Sous-titre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL de l'image</label>
                <input
                  type="text"
                  value={hero.image || ''}
                  onChange={(e) => setHero({ ...hero, image: e.target.value })}
                  className="input-field w-full"
                  placeholder="/campuslife-hero.jpg"
                />
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="card p-8">
            <h2 className="text-2xl font-bold mb-6">Contenu</h2>
            <div className="space-y-6">
              {Object.entries(content).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-2 capitalize">
                    {key === 'clubs' ? 'Club et associations' :
                     key === 'sports' ? 'Activités sportives' :
                     key === 'cultural' ? 'Événements culturels' :
                     key === 'social' ? 'Vie sociale' : key}
                  </label>
                  <textarea
                    value={value || ''}
                    onChange={(e) =>
                      setContent({ ...content, [key]: e.target.value })
                    }
                    className="input-field w-full"
                    rows={4}
                    placeholder={`Entrez le contenu pour ${key}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Gallery Section */}
          <div className="card p-8">
            <h2 className="text-2xl font-bold mb-2">Galerie (Photos/Vidéos)</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Ajoutez des URLs publiques (images ou vidéos) qui s\'afficheront dans le carrousel.
            </p>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <input
                id="campus-gallery-upload"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={onUploadChange}
                className="hidden"
              />
              <label
                htmlFor="campus-gallery-upload"
                className="btn-secondary cursor-pointer"
                aria-disabled={uploading}
              >
                {uploading ? 'Upload en cours...' : 'Uploader des médias'}
              </label>
              <span className="text-sm text-[var(--color-text-secondary)]">
                Formats supportés: images et vidéos (max 50MB/fichier)
              </span>
            </div>
            <div className="space-y-4">
              {gallery.map((item, index) => (
                <div key={`${item.src}-${index}`} className="border border-[var(--color-border)] rounded-lg p-4">
                  <div className="grid gap-4 md:grid-cols-12 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Type</label>
                      <select
                        value={item.type}
                        onChange={(e) => {
                          const next = [...gallery];
                          next[index] = { ...next[index], type: e.target.value as 'image' | 'video' };
                          setGallery(next);
                        }}
                        className="input-field w-full"
                      >
                        <option value="image">Image</option>
                        <option value="video">Vidéo</option>
                      </select>
                    </div>
                    <div className="md:col-span-5">
                      <label className="block text-sm font-medium mb-2">URL</label>
                      <input
                        type="text"
                        value={item.src}
                        onChange={(e) => {
                          const next = [...gallery];
                          next[index] = { ...next[index], src: e.target.value };
                          setGallery(next);
                        }}
                        className="input-field w-full"
                        placeholder="/forum/ma-video.mp4 ou /forum/ma-photo.jpg"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-sm font-medium mb-2">Texte alternatif</label>
                      <input
                        type="text"
                        value={item.alt}
                        onChange={(e) => {
                          const next = [...gallery];
                          next[index] = { ...next[index], alt: e.target.value };
                          setGallery(next);
                        }}
                        className="input-field w-full"
                        placeholder="Description de l\'image/vidéo"
                      />
                    </div>
                    <div className="md:col-span-1 flex md:justify-end">
                      <button
                        type="button"
                        onClick={() => setGallery(gallery.filter((_, i) => i !== index))}
                        className="btn-secondary w-full md:w-auto"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setGallery([...gallery, { src: '', alt: '', type: 'image' }])}
                className="btn-secondary"
              >
                Ajouter un média
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCampusLifeContent;
