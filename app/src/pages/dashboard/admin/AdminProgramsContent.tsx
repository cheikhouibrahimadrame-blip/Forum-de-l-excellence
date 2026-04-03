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
  description?: string;
  curriculum?: string;
  languages?: string;
  activities?: string;
  [key: string]: string | undefined;
}

const AdminProgramsContent: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [hero, setHero] = useState<HeroSection>({
    title: '',
    subtitle: '',
    image: ''
  });

  const [content, setContent] = useState<ContentSection>({
    description: '',
    curriculum: '',
    languages: '',
    activities: ''
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await api.get('/api/pages/programs');
      const result = response.data;
      if (result.success && result.data) {
        setHero(result.data.hero);
        setContent(result.data.content);
      } else {
        setMessage('⚠️ Impossible de charger le contenu');
      }
    } catch (error) {
      console.error('Error fetching programs content:', error);
      setMessage(`❌ Erreur de connexion: ${error instanceof Error ? error.message : 'Failed to fetch'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await api.post('/api/pages/programs', { hero, content });
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
            <h1 className="text-3xl font-bold">Modifier - Page Programmes</h1>
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
                  placeholder="/programs-hero.jpg"
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
                    {key === 'description' ? 'Description générale' :
                     key === 'curriculum' ? 'Curriculum scolaire' :
                     key === 'languages' ? 'Langues enseignées' :
                     key === 'activities' ? 'Activités parascolaires' : key}
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
        </div>
      </div>
    </div>
  );
};

export default AdminProgramsContent;
