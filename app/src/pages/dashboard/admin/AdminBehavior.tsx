import type React from 'react';
import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import UserSelect from '../../../components/forms/UserSelect';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';

interface BehaviorLog {
  id: string;
  studentId: string;
  student: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  teacher: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  type: 'POSITIVE' | 'NEGATIVE' | 'INCIDENT';
  category: string;
  description: string;
  points: number;
  date: string;
}

const AdminBehavior: React.FC = () => {
  const [behaviors, setBehaviors] = useState<BehaviorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    type: 'POSITIVE',
    category: 'ACADEMIC',
    description: '',
    points: '0',
    date: new Date().toISOString().split('T')[0]
  });

  const categoryOptions = [
    { value: 'ACADEMIC', label: 'Academique' },
    { value: 'SOCIAL', label: 'Social' },
    { value: 'DISCIPLINE', label: 'Discipline' },
    { value: 'PARTICIPATION', label: 'Participation' },
    { value: 'KINDNESS', label: 'Bienveillance' }
  ];

  const fetchBehaviors = async () => {
    try {
      setLoading(true);
      const response = await api.get(API.BEHAVIOR_REPORT);
      const data = response.data;
      setBehaviors(data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBehaviors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        studentId: formData.studentId,
        type: formData.type,
        category: formData.category,
        description: formData.description,
        points: parseInt(formData.points, 10),
        date: formData.date
      };

      if (editingId) {
        await api.put(API.BEHAVIOR_ITEM(editingId), payload);
      } else {
        await api.post(API.BEHAVIOR_LOG, payload);
      }

      setFormData({
        studentId: '',
        type: 'POSITIVE',
        category: 'ACADEMIC',
        description: '',
        points: '0',
        date: new Date().toISOString().split('T')[0]
      });
      setEditingId(null);
      setShowForm(false);
      fetchBehaviors();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await api.delete(API.BEHAVIOR_ITEM(id));
      fetchBehaviors();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      POSITIVE: 'bg-green-100 text-green-800',
      NEGATIVE: 'bg-red-100 text-red-800',
      INCIDENT: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      POSITIVE: 'Positif',
      NEGATIVE: 'Négatif',
      INCIDENT: 'Incident'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-8 h-8 text-primary-navy" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Comportements</h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <Card className="p-6">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Élève *
                </label>
                <UserSelect
                  role="STUDENT"
                  valueKind="studentId"
                  value={formData.studentId}
                  onChange={(id) => setFormData({ ...formData, studentId: id })}
                  placeholder="Sélectionner un élève"
                  emptyHint="Aucun élève disponible"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
                >
                  <option value="POSITIVE">Positif</option>
                  <option value="NEGATIVE">Négatif</option>
                  <option value="INCIDENT">Incident</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points
                </label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit">Enregistrer</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    studentId: '',
                    type: 'POSITIVE',
                    category: '',
                    description: '',
                    points: '0',
                    date: new Date().toISOString().split('T')[0]
                  });
                }}
              >
                Annuler
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-navy mx-auto"></div>
          </div>
        ) : behaviors.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Aucun comportement enregistré</p>
        ) : (
          <div className="space-y-4">
            {behaviors.map((behavior) => (
              <Card key={behavior.id} className="p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {behavior.student.user.firstName} {behavior.student.user.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Enseignant: {behavior.teacher.user.firstName} {behavior.teacher.user.lastName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(behavior.type)}`}>
                      {getTypeLabel(behavior.type)}
                    </span>
                    <button
                      onClick={() => {
                        setEditingId(behavior.id);
                        setFormData({
                          studentId: behavior.studentId,
                          type: behavior.type,
                          category: behavior.category,
                          description: behavior.description,
                          points: behavior.points.toString(),
                          date: behavior.date ? behavior.date.split('T')[0] : new Date().toISOString().split('T')[0]
                        });
                        setShowForm(true);
                      }}
                      className="p-2 hover:bg-blue-100 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(behavior.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{behavior.description}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{behavior.category}</span>
                  <span>Points: {behavior.points}</span>
                  <span>{new Date(behavior.date).toLocaleDateString('fr-FR')}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminBehavior;
