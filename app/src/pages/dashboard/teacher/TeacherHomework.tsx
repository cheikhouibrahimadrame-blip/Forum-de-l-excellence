import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ChevronLeft, AlertCircle, Plus } from 'lucide-react';
import { api } from '../../../lib/api';

interface HomeworkItem {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
}

const TeacherHomework: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    description: '',
    dueDate: ''
  });

  const fetchHomeworks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/homework');
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

  const createHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await api.post('/api/homework/create', formData);
      setFormData({ subject: '', title: '', description: '', dueDate: '' });
      setShowForm(false);
      fetchHomeworks();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur lors de la création');
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
              <ClipboardList className="w-7 h-7 text-primary-navy" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Devoirs</h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Créer et consulter les devoirs</p>
        </div>

        <div className="mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-navy text-white text-sm"
          >
            <Plus className="w-4 h-4" /> Nouveau devoir
          </button>
        </div>

        {showForm && (
          <form onSubmit={createHomework} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-4 space-y-3">
            <input
              type="text"
              placeholder="Matière"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Titre"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              required
            />
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <button className="px-4 py-2 rounded-lg bg-primary-navy text-white text-sm">Créer</button>
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
        ) : homeworks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucun devoir</div>
        ) : (
          <div className="grid gap-4">
            {homeworks.map((hw) => (
              <div key={hw.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{hw.title}</h3>
                <p className="text-sm text-gray-500">{hw.subject}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{hw.description}</p>
                <div className="mt-4 text-sm text-gray-500">
                  Date limite: {new Date(hw.dueDate).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherHomework;
