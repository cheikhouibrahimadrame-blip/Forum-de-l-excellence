import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ChevronLeft, AlertCircle, Save } from 'lucide-react';
import { api } from '../../../lib/api';

interface LinkedStudent {
  studentId: string;
  student: { user: { firstName: string; lastName: string } };
}

interface HealthRecord {
  studentId: string;
  height?: number;
  weight?: number;
  bloodType?: string;
  allergies?: string;
  medicalConditions?: string;
  medications?: string;
  emergencyContact?: string;
}

const ParentHealth: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchStudents = async () => {
    try {
      const res = await api.get('/api/parent-students/my-students');
      const data = res.data;
      setStudents(data.data || []);
      if (data.data?.length > 0) setSelectedStudentId(data.data[0].studentId);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur lors du chargement');
    }
  };

  const fetchRecord = async (studentId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/health/${studentId}`);
      const data = res.data;
      setRecord(data.data || null);
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
    if (selectedStudentId) fetchRecord(selectedStudentId);
  }, [selectedStudentId]);

  const handleSave = async () => {
    if (!selectedStudentId) return;
    try {
      setSaving(true);
      const res = await api.put(`/api/health/${selectedStudentId}`, record || {});
      const data = res.data;
      setRecord(data.data || record);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
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
              <Heart className="w-7 h-7 text-primary-navy" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Santé</h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Dossier médical</p>
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
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Groupe sanguin"
                value={record?.bloodType || ''}
                onChange={(e) => setRecord({ ...(record || { studentId: selectedStudentId }), bloodType: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Taille (cm)"
                value={record?.height || ''}
                onChange={(e) => setRecord({ ...(record || { studentId: selectedStudentId }), height: parseFloat(e.target.value) })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Poids (kg)"
                value={record?.weight || ''}
                onChange={(e) => setRecord({ ...(record || { studentId: selectedStudentId }), weight: parseFloat(e.target.value) })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Contact d'urgence"
                value={record?.emergencyContact || ''}
                onChange={(e) => setRecord({ ...(record || { studentId: selectedStudentId }), emergencyContact: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
            </div>
            <textarea
              placeholder="Allergies"
              value={record?.allergies || ''}
              onChange={(e) => setRecord({ ...(record || { studentId: selectedStudentId }), allergies: e.target.value })}
              className="px-3 py-2 border rounded-lg w-full"
              rows={2}
            />
            <textarea
              placeholder="Conditions médicales"
              value={record?.medicalConditions || ''}
              onChange={(e) => setRecord({ ...(record || { studentId: selectedStudentId }), medicalConditions: e.target.value })}
              className="px-3 py-2 border rounded-lg w-full"
              rows={2}
            />
            <textarea
              placeholder="Médicaments"
              value={record?.medications || ''}
              onChange={(e) => setRecord({ ...(record || { studentId: selectedStudentId }), medications: e.target.value })}
              className="px-3 py-2 border rounded-lg w-full"
              rows={2}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-navy text-white text-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentHealth;
