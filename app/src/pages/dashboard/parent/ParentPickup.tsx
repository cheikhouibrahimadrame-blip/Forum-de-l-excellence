import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ChevronLeft, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { api } from '../../../lib/api';

interface LinkedStudent {
  studentId: string;
  student: { user: { firstName: string; lastName: string } };
}

interface AuthorizedPickup {
  id: string;
  personName: string;
  relationship: string;
  phoneNumber?: string;
  idNumber?: string;
  isActive: boolean;
}

interface PickupLog {
  id: string;
  pickupTime: string;
  notes?: string;
  authorizedPickup: {
    personName: string;
    student: { user: { firstName: string; lastName: string } };
  };
}

const ParentPickup: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'authorized' | 'logs'>('authorized');
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [authorized, setAuthorized] = useState<AuthorizedPickup[]>([]);
  const [logs, setLogs] = useState<PickupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ personName: '', relationship: '', phoneNumber: '', idNumber: '' });

  const fetchStudents = async () => {
    let hasStudents = false;
    try {
      setLoading(true);
      const res = await api.get('/api/parent-students/my-students');
      const data = res.data;
      const items = data.data || [];
      setStudents(items);
      if (items.length > 0) {
        hasStudents = true;
        setSelectedStudentId(items[0].studentId);
      } else {
        setAuthorized([]);
        setLogs([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur lors du chargement');
    } finally {
      if (!hasStudents) {
        setLoading(false);
      }
    }
  };

  const fetchAuthorized = async (studentId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/pickup/${studentId}`);
      const data = res.data;
      setAuthorized(data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/api/pickup/logs/history');
      const data = res.data;
      setLogs(data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur lors du chargement');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId) fetchAuthorized(selectedStudentId);
  }, [selectedStudentId]);

  useEffect(() => {
    if (tab === 'logs') fetchLogs();
  }, [tab]);

  const addAuthorized = async () => {
    try {
      await api.post('/api/pickup/authorized/add', { ...formData, studentId: selectedStudentId });
      setFormData({ personName: '', relationship: '', phoneNumber: '', idNumber: '' });
      setShowForm(false);
      fetchAuthorized(selectedStudentId);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur lors de l\'ajout');
    }
  };

  const deleteAuthorized = async (id: string) => {
    try {
      await api.delete(`/api/pickup/authorized/${id}`);
      fetchAuthorized(selectedStudentId);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur lors de la suppression');
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
              <ShieldCheck className="w-7 h-7 text-primary-navy" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Personnes Autorisées</h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Gestion du ramassage</p>
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

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('authorized')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'authorized' ? 'bg-primary-navy text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            Autorisés
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'logs' ? 'bg-primary-navy text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            Historique
          </button>
          {tab === 'authorized' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-navy text-white text-sm"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {showForm && tab === 'authorized' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nom complet"
              value={formData.personName}
              onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Relation"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Téléphone"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="ID"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <button
              onClick={addAuthorized}
              className="col-span-1 md:col-span-2 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-navy text-white text-sm"
            >
              Enregistrer
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : tab === 'authorized' ? (
          authorized.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Aucune personne autorisée</div>
          ) : (
            <div className="space-y-3">
              {authorized.map((a) => (
                <div key={a.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{a.personName}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{a.relationship} • {a.phoneNumber || '-'} • {a.idNumber || '-'}</div>
                  </div>
                  <button
                    onClick={() => deleteAuthorized(a.id)}
                    className="p-2 hover:bg-red-100 rounded-lg"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Aucun ramassage enregistré</div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {log.authorizedPickup.student.user.firstName} {log.authorizedPickup.student.user.lastName}
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">{log.authorizedPickup.personName}</div>
                  <div className="text-xs text-gray-400">{new Date(log.pickupTime).toLocaleString('fr-FR')}</div>
                  {log.notes && <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{log.notes}</div>}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ParentPickup;
