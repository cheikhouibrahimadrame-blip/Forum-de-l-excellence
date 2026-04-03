import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Plus, Edit, Trash2, X, Save, ChevronLeft } from 'lucide-react';
import { api } from '../../../lib/api';

interface HeroSection {
  title: string;
  subtitle: string;
  primaryButtonText: string;
  secondaryButtonText: string;
}

interface Stat {
  id: string;
  value: string;
  label: string;
}

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface NewsItem {
  id: string;
  title: string;
  date: string;
  excerpt: string;
}

interface CTASection {
  title: string;
  description: string;
  primaryButtonText: string;
  secondaryButtonText: string;
}

const AdminMainPage: React.FC = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Hero Section
  const [heroSection, setHeroSection] = useState<HeroSection>({
    title: '',
    subtitle: '',
    primaryButtonText: '',
    secondaryButtonText: ''
  });

  // Stats Section
  const [stats, setStats] = useState<Stat[]>([]);

  // Features Section
  const [features, setFeatures] = useState<Feature[]>([]);

  // News Section
  const [news, setNews] = useState<NewsItem[]>([]);

  // CTA Section
  const [ctaSection, setCTASection] = useState<CTASection>({
    title: '',
    description: '',
    primaryButtonText: '',
    secondaryButtonText: ''
  });

  // Load content from backend on mount
  useEffect(() => {
    fetchHomepageContent();
  }, []);

  const fetchHomepageContent = async () => {
    try {
      const response = await api.get('/api/homepage');
      const result = response.data;
      if (result.success && result.data) {
        setHeroSection(result.data.hero);
        setStats(result.data.stats);
        setFeatures(result.data.features);
        setNews(result.data.news);
        setCTASection(result.data.cta);
      }
    } catch (error) {
      console.error('Error fetching homepage content:', error);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    setSaveMessage('');
    
    try {
      const response = await api.post('/api/admin/homepage', {
        hero: heroSection,
        stats,
        features,
        news,
        cta: ctaSection
      });
      const result = response.data;
      
      if (result.success) {
        setSaveMessage('✅ Modifications publiées avec succès !');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage(`❌ ${result.error || 'Erreur lors de la publication'}`);
      }
    } catch (error: any) {
      console.error('Error publishing content:', error);
      const apiMessage = error?.response?.data?.error;
      setSaveMessage(`❌ Erreur de connexion: ${apiMessage || (error instanceof Error ? error.message : 'Network error')}`);
    } finally {
      setSaving(false);
    }
  };

  // Modal states
  const [showStatModal, setShowStatModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [editingStatId, setEditingStatId] = useState<string | null>(null);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);

  // Form data
  const [statFormData, setStatFormData] = useState({ value: '', label: '' });
  const [featureFormData, setFeatureFormData] = useState({ title: '', description: '', icon: 'GraduationCap' });
  const [newsFormData, setNewsFormData] = useState({ title: '', date: '', excerpt: '' });

  const iconOptions = ['GraduationCap', 'Users', 'BookOpen', 'Award', 'Calendar', 'Star', 'Heart', 'Shield'];

  // Handler functions for Stats
  const handleOpenStatModal = (stat?: Stat) => {
    if (stat) {
      setEditingStatId(stat.id);
      setStatFormData({ value: stat.value, label: stat.label });
    } else {
      setEditingStatId(null);
      setStatFormData({ value: '', label: '' });
    }
    setShowStatModal(true);
  };

  const handleSubmitStat = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStatId) {
      setStats(stats.map(s => s.id === editingStatId ? { ...s, ...statFormData } : s));
    } else {
      setStats([...stats, { id: Date.now().toString(), ...statFormData }]);
    }
    setShowStatModal(false);
  };

  const handleDeleteStat = (id: string) => {
    if (confirm('Supprimer cette statistique ?')) {
      setStats(stats.filter(s => s.id !== id));
    }
  };

  // Handler functions for Features
  const handleOpenFeatureModal = (feature?: Feature) => {
    if (feature) {
      setEditingFeatureId(feature.id);
      setFeatureFormData({ title: feature.title, description: feature.description, icon: feature.icon });
    } else {
      setEditingFeatureId(null);
      setFeatureFormData({ title: '', description: '', icon: 'GraduationCap' });
    }
    setShowFeatureModal(true);
  };

  const handleSubmitFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFeatureId) {
      setFeatures(features.map(f => f.id === editingFeatureId ? { ...f, ...featureFormData } : f));
    } else {
      setFeatures([...features, { id: Date.now().toString(), ...featureFormData }]);
    }
    setShowFeatureModal(false);
  };

  const handleDeleteFeature = (id: string) => {
    if (confirm('Supprimer cette fonctionnalité ?')) {
      setFeatures(features.filter(f => f.id !== id));
    }
  };

  // Handler functions for News
  const handleOpenNewsModal = (newsItem?: NewsItem) => {
    if (newsItem) {
      setEditingNewsId(newsItem.id);
      setNewsFormData({ title: newsItem.title, date: newsItem.date, excerpt: newsItem.excerpt });
    } else {
      setEditingNewsId(null);
      setNewsFormData({ title: '', date: '', excerpt: '' });
    }
    setShowNewsModal(true);
  };

  const handleSubmitNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNewsId) {
      setNews(news.map(n => n.id === editingNewsId ? { ...n, ...newsFormData } : n));
    } else {
      setNews([...news, { id: Date.now().toString(), ...newsFormData }]);
    }
    setShowNewsModal(false);
  };

  const handleDeleteNews = (id: string) => {
    if (confirm('Supprimer cette actualité ?')) {
      setNews(news.filter(n => n.id !== id));
    }
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] border border-[var(--color-primary-gold)]/40 shadow-sm hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
        Retour
      </button>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
          Gestion de la Page d'Accueil
        </h1>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-sm font-medium">{saveMessage}</span>
          )}
          <button 
            onClick={handlePublish}
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Publication...' : 'Publier les modifications'}
          </button>
        </div>
      </div>

      {/* Hero Section Editor */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Home className="w-6 h-6 text-[var(--color-primary-gold)]" />
          Section Héro (Bannière principale)
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">Titre principal*</label>
            <input
              type="text"
              value={heroSection.title}
              onChange={(e) => setHeroSection({ ...heroSection, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">Sous-titre*</label>
            <textarea
              value={heroSection.subtitle}
              onChange={(e) => setHeroSection({ ...heroSection, subtitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">Bouton principal*</label>
              <input
                type="text"
                value={heroSection.primaryButtonText}
                onChange={(e) => setHeroSection({ ...heroSection, primaryButtonText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">Bouton secondaire*</label>
              <input
                type="text"
                value={heroSection.secondaryButtonText}
                onChange={(e) => setHeroSection({ ...heroSection, secondaryButtonText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Statistiques</h2>
          <button onClick={() => handleOpenStatModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.id} className="border border-gray-200 rounded-lg p-4 relative group">
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenStatModal(stat)} className="p-1 hover:bg-gray-100 rounded">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteStat(stat.id)} className="p-1 hover:bg-red-100 rounded">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
              <div className="text-3xl font-bold text-[var(--color-primary-navy)] mb-1">{stat.value}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Fonctionnalités / Avantages</h2>
          <button onClick={() => handleOpenFeatureModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <div key={feature.id} className="border border-gray-200 rounded-lg p-4 relative group">
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenFeatureModal(feature)} className="p-1 hover:bg-gray-100 rounded">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteFeature(feature.id)} className="p-1 hover:bg-red-100 rounded">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-gold-light)] flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">{feature.icon}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">{feature.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Actualités</h2>
          <button onClick={() => handleOpenNewsModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </div>
        <div className="space-y-4">
          {news.map((newsItem) => (
            <div key={newsItem.id} className="border border-gray-200 rounded-lg p-4 relative group">
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenNewsModal(newsItem)} className="p-1 hover:bg-gray-100 rounded">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteNews(newsItem.id)} className="p-1 hover:bg-red-100 rounded">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
              <div className="text-sm text-[var(--color-text-muted)] mb-2">{newsItem.date}</div>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">{newsItem.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{newsItem.excerpt}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section Editor */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-4">Section Appel à l'Action (CTA)</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">Titre*</label>
            <input
              type="text"
              value={ctaSection.title}
              onChange={(e) => setCTASection({ ...ctaSection, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">Description*</label>
            <textarea
              value={ctaSection.description}
              onChange={(e) => setCTASection({ ...ctaSection, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">Bouton principal*</label>
              <input
                type="text"
                value={ctaSection.primaryButtonText}
                onChange={(e) => setCTASection({ ...ctaSection, primaryButtonText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">Bouton secondaire*</label>
              <input
                type="text"
                value={ctaSection.secondaryButtonText}
                onChange={(e) => setCTASection({ ...ctaSection, secondaryButtonText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stat Modal */}
      {showStatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingStatId ? 'Modifier' : 'Ajouter'} une statistique</h2>
              <button onClick={() => setShowStatModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitStat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Valeur*</label>
                <input
                  type="text"
                  required
                  value={statFormData.value}
                  onChange={(e) => setStatFormData({ ...statFormData, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
                  placeholder="Ex: 600+"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Libellé*</label>
                <input
                  type="text"
                  required
                  value={statFormData.label}
                  onChange={(e) => setStatFormData({ ...statFormData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
                  placeholder="Ex: Élèves"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowStatModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 bg-[var(--color-primary-gold)] text-[var(--color-primary-navy)] font-medium rounded hover:bg-opacity-90">
                  {editingStatId ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature Modal */}
      {showFeatureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingFeatureId ? 'Modifier' : 'Ajouter'} une fonctionnalité</h2>
              <button onClick={() => setShowFeatureModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitFeature} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Titre*</label>
                <input
                  type="text"
                  required
                  value={featureFormData.title}
                  onChange={(e) => setFeatureFormData({ ...featureFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
                  placeholder="Ex: Excellence en primaire"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Description*</label>
                <textarea
                  required
                  value={featureFormData.description}
                  onChange={(e) => setFeatureFormData({ ...featureFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
                  rows={3}
                  placeholder="Description de la fonctionnalité"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Icône*</label>
                <select
                  value={featureFormData.icon}
                  onChange={(e) => setFeatureFormData({ ...featureFormData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
                >
                  {iconOptions.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowFeatureModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 bg-[var(--color-primary-gold)] text-[var(--color-primary-navy)] font-medium rounded hover:bg-opacity-90">
                  {editingFeatureId ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* News Modal */}
      {showNewsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingNewsId ? 'Modifier' : 'Ajouter'} une actualité</h2>
              <button onClick={() => setShowNewsModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitNews} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Titre*</label>
                <input
                  type="text"
                  required
                  value={newsFormData.title}
                  onChange={(e) => setNewsFormData({ ...newsFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
                  placeholder="Ex: Kermesse solidaire 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Date*</label>
                <input
                  type="text"
                  required
                  value={newsFormData.date}
                  onChange={(e) => setNewsFormData({ ...newsFormData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
                  placeholder="Ex: 15 Mai 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Extrait*</label>
                <textarea
                  required
                  value={newsFormData.excerpt}
                  onChange={(e) => setNewsFormData({ ...newsFormData, excerpt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]"
                  rows={3}
                  placeholder="Résumé de l'actualité"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowNewsModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 bg-[var(--color-primary-gold)] text-[var(--color-primary-navy)] font-medium rounded hover:bg-opacity-90">
                  {editingNewsId ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default AdminMainPage;
