import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Calendar, ChevronLeft, Plus, Upload, X } from 'lucide-react';
import { api } from '../../../lib/api';

interface ClassItem {
  id: string;
  name: string;
}

const AdminSchedules: React.FC = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({ className: '', startDate: '', endDate: '' });
  const [summary, setSummary] = useState({ published: 0, classesCovered: 0, pending: 0 });
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    try {
      const response = await api.get('/api/schedules/summary');
      const data = response.data;
      setSummary(data.data || summary);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors du chargement du resume');
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/api/classes');
      const data = response.data;
      const payload = Array.isArray(data) ? data : data.data || [];
      setClasses(payload);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors du chargement des classes');
    }
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([fetchSummary(), fetchClasses()]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin', { state: { scrollTo: 'emplois-du-temps' } })}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Emplois du temps</h1>
              <p className="text-[var(--color-text-secondary)]">
                Publier, organiser et suivre les emplois du temps par classe
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Créer un horaire
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Importer un fichier
            </button>
          </div>

          {loading && (
            <div className="text-sm text-[var(--color-text-muted)]">Chargement des donnees...</div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Create Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="card p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Créer un nouvel horaire</h2>
                  <button onClick={() => setShowCreateModal(false)} className="p-1 text-[var(--color-text-muted)]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Classe</label>
                    <select 
                      value={scheduleData.className} 
                      onChange={(e) => setScheduleData({...scheduleData, className: e.target.value})}
                      className="input-field w-full"
                    >
                      <option value="">Sélectionner une classe</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.name}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Date début</label>
                    <input 
                      type="date" 
                      value={scheduleData.startDate} 
                      onChange={(e) => setScheduleData({...scheduleData, startDate: e.target.value})}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Date fin</label>
                    <input 
                      type="date" 
                      value={scheduleData.endDate} 
                      onChange={(e) => setScheduleData({...scheduleData, endDate: e.target.value})}
                      className="input-field w-full"
                    />
                  </div>
                  <button onClick={() => {alert(`Horaire créé pour ${scheduleData.className}`); setShowCreateModal(false);}} className="w-full btn-primary">Créer</button>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <LayoutTemplate className="w-5 h-5 text-[var(--color-primary-navy)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Horaires publiés</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summary.published}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Dernière mise à jour aujourd'hui</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-[var(--color-primary-navy)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Classes couvertes</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summary.classesCovered}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">CI à CM2</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <LayoutTemplate className="w-5 h-5 text-[var(--color-primary-navy)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">En attente</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summary.pending}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Horaires à valider</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSchedules;
