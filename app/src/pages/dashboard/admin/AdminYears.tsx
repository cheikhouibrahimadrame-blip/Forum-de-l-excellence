import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar,
  X,
  Check,
  Clock,
  ChevronLeft
} from 'lucide-react';
import { api } from '../../../lib/api';

interface Trimester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  trimesters: Trimester[];
}

const AdminYears: React.FC = () => {
  const navigate = useNavigate();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showYearModal, setShowYearModal] = useState(false);
  const [showTrimesterModal, setShowTrimesterModal] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [editingTrimester, setEditingTrimester] = useState<{ yearId: string; trimester: Trimester | null }>({ yearId: '', trimester: null });

  const [yearForm, setYearForm] = useState({
    year: '',
    startDate: '',
    endDate: ''
  });

  const [trimesterForm, setTrimesterForm] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });

  const handleAddYear = () => {
    setEditingYear(null);
    setYearForm({ year: '', startDate: '', endDate: '' });
    setShowYearModal(true);
  };

  const handleEditYear = (year: AcademicYear) => {
    setEditingYear(year);
    setYearForm({
      year: year.year,
      startDate: year.startDate,
      endDate: year.endDate
    });
    setShowYearModal(true);
  };

  const handleDeleteYear = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette année scolaire ? Toutes les données associées seront perdues.')) {
      deleteYear(id);
    }
  };

  const handleActivateYear = (id: string) => {
    const target = academicYears.find(y => y.id === id);
    if (target) {
      updateYear(id, { ...target, isActive: true });
    }
  };

  const handleYearSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingYear) {
      updateYear(editingYear.id, { ...editingYear, ...yearForm });
    } else {
      const newYear: AcademicYear = {
        id: '',
        ...yearForm,
        isActive: false,
        trimesters: []
      };
      createYear(newYear);
    }

    setShowYearModal(false);
  };

  const handleAddTrimester = (yearId: string) => {
    setEditingTrimester({ yearId, trimester: null });
    setTrimesterForm({ name: '', startDate: '', endDate: '' });
    setShowTrimesterModal(true);
  };

  const handleEditTrimester = (yearId: string, trimester: Trimester) => {
    setEditingTrimester({ yearId, trimester });
    setTrimesterForm({
      name: trimester.name,
      startDate: trimester.startDate,
      endDate: trimester.endDate
    });
    setShowTrimesterModal(true);
  };

  const handleDeleteTrimester = (yearId: string, trimesterId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce trimestre ?')) {
      const target = academicYears.find(y => y.id === yearId);
      if (target) {
        updateYear(yearId, {
          ...target,
          trimesters: target.trimesters.filter(t => t.id !== trimesterId)
        });
      }
    }
  };

  const handleActivateTrimester = (yearId: string, trimesterId: string) => {
    const target = academicYears.find(y => y.id === yearId);
    if (target) {
      updateYear(yearId, {
        ...target,
        trimesters: target.trimesters.map(t => ({
          ...t,
          isActive: t.id === trimesterId
        }))
      });
    }
  };

  const handleTrimesterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const target = academicYears.find(y => y.id === editingTrimester.yearId);
    if (target) {
      const updatedTrimesters = editingTrimester.trimester
        ? target.trimesters.map(t =>
            t.id === editingTrimester.trimester!.id ? { ...t, ...trimesterForm } : t
          )
        : [
            ...target.trimesters,
            {
              id: '',
              ...trimesterForm,
              isActive: false
            }
          ];

      updateYear(editingTrimester.yearId, {
        ...target,
        trimesters: updatedTrimesters
      });
    }

    setShowTrimesterModal(false);
  };

  const activeYear = academicYears.find(y => y.isActive);
  const activeTrimester = activeYear?.trimesters.find(t => t.isActive);

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/academic-years');
      const data = response.data;
      const payload = Array.isArray(data) ? data : data.data || [];
      setAcademicYears(payload);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors du chargement des années');
    } finally {
      setLoading(false);
    }
  };

  const createYear = async (payload: AcademicYear) => {
    try {
      await api.post('/api/academic-years', payload);
      await fetchAcademicYears();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de la creation');
    }
  };

  const updateYear = async (id: string, payload: AcademicYear) => {
    try {
      await api.put(`/api/academic-years/${id}`, payload);
      await fetchAcademicYears();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de la mise a jour');
    }
  };

  const deleteYear = async (id: string) => {
    try {
      await api.delete(`/api/academic-years/${id}`);
      await fetchAcademicYears();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de la suppression');
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  return (
    <div className="section">
      <div className="section-content">
        {/* Header */}
        <div className="mb-6">
        <button
          onClick={() => navigate('/admin', { state: { scrollTo: 'annees-academiques' } })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] border border-[var(--color-primary-gold)]/40 shadow-sm hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-all mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gestion des Années Scolaires
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez les années scolaires et trimesters
        </p>
      </div>

      {loading && (
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">Chargement des annees scolaires...</div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Active Year/Trimester Card */}
      <div className="bg-gradient-to-r from-primary-navy to-blue-800 dark:from-primary-gold dark:to-yellow-600 text-white p-6 rounded-lg mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Calendar size={32} />
          <div>
            <h2 className="text-2xl font-bold">
              {activeYear?.year || 'Aucune année active'}
            </h2>
            <p className="text-white/80">
              {activeYear ? `${new Date(activeYear.startDate).toLocaleDateString('fr-FR')} - ${new Date(activeYear.endDate).toLocaleDateString('fr-FR')}` : 'Activez une année scolaire'}
            </p>
          </div>
        </div>
        {activeTrimester && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Trimestre actif</p>
                <p className="text-lg font-semibold">{activeTrimester.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/80">Période</p>
                <p className="text-sm">
                  {new Date(activeTrimester.startDate).toLocaleDateString('fr-FR')} - {new Date(activeTrimester.endDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Year Button */}
      <div className="mb-6">
        <button
          onClick={handleAddYear}
          className="flex items-center gap-2 px-4 py-2 bg-primary-navy hover:bg-primary-navy/90 
                   text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Ajouter une année scolaire
        </button>
      </div>

      {/* Academic Years List */}
      <div className="space-y-4">
        {academicYears.map((year) => (
          <div 
            key={year.id} 
            className={`bg-white dark:bg-gray-800 rounded-lg border-2 transition-all ${
              year.isActive 
                ? 'border-green-500 dark:border-green-400' 
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Year Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="text-gray-600 dark:text-gray-400" size={24} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {year.year}
                      </h3>
                      {year.isActive && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(year.startDate).toLocaleDateString('fr-FR')} - {new Date(year.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!year.isActive && (
                    <button
                      onClick={() => handleActivateYear(year.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 
                               dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300 
                               rounded-lg transition-colors"
                    >
                      <Check size={16} />
                      Activer
                    </button>
                  )}
                  <button
                    onClick={() => handleEditYear(year)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteYear(year.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Supprimer"
                    disabled={year.isActive}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Trimesters */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Trimesters ({year.trimesters.length})
                </h4>
                <button
                  onClick={() => handleAddTrimester(year.id)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + Ajouter un trimestre
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {year.trimesters.map((trimester) => (
                  <div 
                    key={trimester.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      trimester.isActive
                        ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className={trimester.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} size={16} />
                        <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {trimester.name}
                        </h5>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditTrimester(year.id, trimester)}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTrimester(year.id, trimester.id)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Supprimer"
                          disabled={trimester.isActive}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {new Date(trimester.startDate).toLocaleDateString('fr-FR')} - {new Date(trimester.endDate).toLocaleDateString('fr-FR')}
                    </p>

                    {!trimester.isActive && year.isActive && (
                      <button
                        onClick={() => handleActivateTrimester(year.id, trimester.id)}
                        className="w-full text-xs px-2 py-1 bg-green-100 hover:bg-green-200 
                                 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300 
                                 rounded transition-colors"
                      >
                        Activer
                      </button>
                    )}

                    {trimester.isActive && (
                      <div className="text-xs text-center text-green-600 dark:text-green-400 font-semibold">
                        ✓ Actif
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {academicYears.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 dark:text-gray-400">Aucune année scolaire</p>
        </div>
      )}

      {/* Year Modal */}
      {showYearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingYear ? 'Modifier l\'année scolaire' : 'Ajouter une année scolaire'}
              </h2>
              <button
                onClick={() => setShowYearModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleYearSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Année scolaire *
                </label>
                <input
                  type="text"
                  value={yearForm.year}
                  onChange={(e) => setYearForm({ ...yearForm, year: e.target.value })}
                  placeholder="Ex: 2025-2026"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de début *
                </label>
                <input
                  type="date"
                  value={yearForm.startDate}
                  onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de fin *
                </label>
                <input
                  type="date"
                  value={yearForm.endDate}
                  onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowYearModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 
                           text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 
                           dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-navy hover:bg-primary-navy/90 
                           text-white rounded-lg transition-colors"
                >
                  {editingYear ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trimester Modal */}
      {showTrimesterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingTrimester.trimester ? 'Modifier le trimestre' : 'Ajouter un trimestre'}
              </h2>
              <button
                onClick={() => setShowTrimesterModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleTrimesterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du trimestre *
                </label>
                <input
                  type="text"
                  value={trimesterForm.name}
                  onChange={(e) => setTrimesterForm({ ...trimesterForm, name: e.target.value })}
                  placeholder="Ex: Trimestre 1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de début *
                </label>
                <input
                  type="date"
                  value={trimesterForm.startDate}
                  onChange={(e) => setTrimesterForm({ ...trimesterForm, startDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de fin *
                </label>
                <input
                  type="date"
                  value={trimesterForm.endDate}
                  onChange={(e) => setTrimesterForm({ ...trimesterForm, endDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTrimesterModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 
                           text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 
                           dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-navy hover:bg-primary-navy/90 
                           text-white rounded-lg transition-colors"
                >
                  {editingTrimester.trimester ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminYears;
