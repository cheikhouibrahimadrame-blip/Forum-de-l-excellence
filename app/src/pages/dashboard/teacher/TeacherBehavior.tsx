import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ChevronLeft, AlertCircle, Plus } from 'lucide-react';
import { api } from '../../../lib/api';

interface BehaviorItem {
  id: string;
  type: 'POSITIVE' | 'NEGATIVE' | 'INCIDENT';
  category: string;
  description: string;
  points: number;
  date: string;
  student?: { user?: { firstName: string; lastName: string } };
}

const TeacherBehavior: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [behaviors, setBehaviors] = useState<BehaviorItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    type: 'POSITIVE',
    category: 'ACADEMIC',
    description: '',
    points: '0',
    date: ''
  });

  const fetchBehaviors = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/behavior/report');
      const data = res.data;
      setBehaviors(data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBehaviors();
  }, []);

  const logBehavior = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const res = await api.post('/api/behavior/log', {
        ...formData,
        points: parseInt(formData.points, 10),
        date: formData.date || undefined
      });
      const data = res.data;
      if (data?.success === false) throw new Error(data.error || 'Erreur lors de la création');
      setFormData({ studentId: '', type: 'POSITIVE', category: 'ACADEMIC', description: '', points: '0', date: '' });
      setShowForm(false);
      fetchBehaviors();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    }
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/teacher')}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-primary-navy" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Comportement</h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Suivi des incidents et observations</p>
        </div>

        <div className="mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-navy text-white text-sm"
          >
            <Plus className="w-4 h-4" /> Nouveau signalement
          </button>
        </div>

        {showForm && (
          <form onSubmit={logBehavior} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-4 space-y-3">
            <input
              type="text"
              placeholder="ID Élève"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="POSITIVE">Positif</option>
              <option value="NEGATIVE">Négatif</option>
              <option value="INCIDENT">Incident</option>
            </select>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="ACADEMIC">Académique</option>
              <option value="SOCIAL">Social</option>
              <option value="DISCIPLINE">Discipline</option>
              <option value="PARTICIPATION">Participation</option>
              <option value="KINDNESS">Bienveillance</option>
            </select>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              required
            />
            <input
              type="number"
              placeholder="Points"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <button className="px-4 py-2 rounded-lg bg-primary-navy text-white text-sm">Enregistrer</button>
          </form>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : behaviors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucun comportement enregistré</div>
        ) : (
          <div className="space-y-3">
            {behaviors.map((b) => (
              <div key={b.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {b.student?.user?.firstName} {b.student?.user?.lastName}
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">{b.description}</div>
                <div className="text-xs text-gray-400">{b.category} • {b.type} • {new Date(b.date).toLocaleDateString('fr-FR')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherBehavior;
