import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ChevronLeft, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';

interface HomeworkItem {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  submissions?: Array<{ id: string; status: string; submittedAt?: string | null }>;
}

const StudentHomework: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([]);

  const fetchHomeworks = async () => {
    try {
      setLoading(true);
      const res = await api.get(API.HOMEWORK);
      const data = res.data;
      setHomeworks(data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeworks();
  }, []);

  const submitHomework = async (homeworkId: string) => {
    try {
      const notes = window.prompt('Notes de soumission (optionnel)') || '';
      await api.post(API.HOMEWORK_SUBMIT(homeworkId), { notes });
      fetchHomeworks();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur lors de la soumission');
    }
  };

  const getStatus = (hw: HomeworkItem) => {
    if (hw.submissions && hw.submissions.length > 0) return 'SOUMIS';
    const due = new Date(hw.dueDate);
    return due < new Date() ? 'EN RETARD' : 'À FAIRE';
  };

  const statusBadge = (status: string) => {
    if (status === 'SOUMIS') return { icon: CheckCircle, color: 'bg-green-100 text-green-800' };
    if (status === 'EN RETARD') return { icon: AlertCircle, color: 'bg-red-100 text-red-800' };
    return { icon: Clock, color: 'bg-yellow-100 text-yellow-800' };
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/student')}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-primary-navy" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Devoirs</h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Liste des devoirs assignés</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : homeworks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucun devoir pour le moment</div>
        ) : (
          <div className="grid gap-4">
            {homeworks.map((hw) => {
              const status = getStatus(hw);
              const badge = statusBadge(status);
              const Icon = badge.icon;
              return (
                <div key={hw.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{hw.title}</h3>
                      <p className="text-sm text-gray-500">{hw.subject}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{hw.description}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                      <Icon className="w-4 h-4" />
                      {status}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span>À rendre le: {new Date(hw.dueDate).toLocaleDateString('fr-FR')}</span>
                    {user?.role === 'STUDENT' && status !== 'SOUMIS' && (
                      <button
                        onClick={() => submitHomework(hw.id)}
                        className="px-3 py-1 rounded-lg bg-primary-navy text-white text-xs hover:opacity-90"
                      >
                        Soumettre
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHomework;
