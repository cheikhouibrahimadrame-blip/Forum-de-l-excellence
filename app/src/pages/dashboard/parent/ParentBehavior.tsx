import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ChevronLeft, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';

interface LinkedStudent {
  id: string;
  studentId: string;
  student: {
    id: string;
    user: { firstName: string; lastName: string };
  };
}

interface BehaviorItem {
  id: string;
  type: 'POSITIVE' | 'NEGATIVE' | 'INCIDENT';
  category: string;
  description: string;
  points: number;
  date: string;
}

const ParentBehavior: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [behaviors, setBehaviors] = useState<BehaviorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStudents = async () => {
    try {
      const res = await api.get(API.PARENT_STUDENTS_MY);
      const data = res.data;
      setStudents(data.data || []);
      if (data.data?.length > 0) setSelectedStudentId(data.data[0].studentId);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur lors du chargement');
    }
  };

  const fetchBehaviors = async (studentId: string) => {
    try {
      setLoading(true);
      const res = await api.get(API.BEHAVIOR_STUDENT(studentId));
      const data = res.data;
      setBehaviors(data.data?.behaviors || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId) fetchBehaviors(selectedStudentId);
  }, [selectedStudentId]);

  const badge = (type: BehaviorItem['type']) => {
    if (type === 'POSITIVE') return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Positif' };
    if (type === 'NEGATIVE') return { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Négatif' };
    return { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'Incident' };
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/parent')}
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
          <p className="text-gray-600 dark:text-gray-400">Suivi des observations de vos enfants</p>
        </div>

        {students.length > 0 && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Élève</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="ml-3 px-3 py-2 border border-gray-300 rounded-lg"
            >
              {students.map((s) => (
                <option key={s.studentId} value={s.studentId}>
                  {s.student.user.firstName} {s.student.user.lastName}
                </option>
              ))}
            </select>
          </div>
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
            {behaviors.map((b) => {
              const badgeInfo = badge(b.type);
              const Icon = badgeInfo.icon;
              return (
                <div key={b.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badgeInfo.color}`}>
                      <Icon className="w-4 h-4" /> {badgeInfo.label}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(b.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{b.description}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Catégorie: {b.category} • Points: {b.points}
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

export default ParentBehavior;
