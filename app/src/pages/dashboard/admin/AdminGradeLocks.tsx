import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Lock, ChevronLeft, ShieldCheck, X } from 'lucide-react';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';

const AdminGradeLocks: React.FC = () => {
  const navigate = useNavigate();
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockData, setLockData] = useState({ period: '', reason: '' });
  const [summary, setSummary] = useState({ completionRate: 0, openPeriods: 0, lockedPeriods: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(API.GRADE_LOCKS_SUMMARY);
      const data = response.data;
      setSummary(data.data || summary);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors du chargement des verrous');
    } finally {
      setLoading(false);
    }
  };

  const lockPeriod = async () => {
    try {
      await api.post(API.GRADE_LOCKS_LOCK, lockData);
      setShowLockModal(false);
      setLockData({ period: '', reason: '' });
      fetchSummary();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors du verrouillage');
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin', { state: { scrollTo: 'notes-verrous' } })}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Notes & Verrous</h1>
              <p className="text-[var(--color-text-secondary)]">
                Suivi des saisies, contrôle des périodes et verrouillages
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Suivi des saisies
            </button>
            <button onClick={() => setShowLockModal(true)} className="btn-secondary flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Verrouiller une période
            </button>
          </div>

          {loading && (
            <div className="text-sm text-[var(--color-text-muted)]">Chargement des verrous...</div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Lock Modal */}
          {showLockModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="card p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Verrouiller une période</h2>
                  <button onClick={() => setShowLockModal(false)} className="p-1 text-[var(--color-text-muted)]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Période à verrouiller</label>
                    <select 
                      value={lockData.period} 
                      onChange={(e) => setLockData({...lockData, period: e.target.value})}
                      className="input-field w-full"
                    >
                      <option value="">Sélectionner une période</option>
                      <option value="q1">1er Trimestre</option>
                      <option value="q2">2e Trimestre</option>
                      <option value="q3">3e Trimestre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Raison</label>
                    <textarea 
                      value={lockData.reason} 
                      onChange={(e) => setLockData({...lockData, reason: e.target.value})}
                      className="input-field w-full"
                      rows={3}
                      placeholder="Raison du verrouillage"
                    />
                  </div>
                  <button onClick={lockPeriod} className="w-full btn-primary">Verrouiller</button>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <FileSpreadsheet className="w-5 h-5 text-[var(--color-primary-navy)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Saisies complètes</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summary.completionRate}%</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Sur l'ensemble des classes</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-5 h-5 text-[var(--color-primary-navy)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Périodes ouvertes</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summary.openPeriods}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Trimestre en cours</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <Lock className="w-5 h-5 text-[var(--color-primary-navy)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Périodes verrouillées</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summary.lockedPeriods}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Historique validé</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGradeLocks;
