import type React from 'react';
import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { api } from '../../../lib/api';

interface Attendance {
  id: string;
  studentId: string;
  student: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

const AdminAttendance: React.FC = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStudentId, setFilterStudentId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<{
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    status: 'PRESENT',
    remarks: ''
  });

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      setError('');
      if (!filterStudentId) {
        setAttendances([]);
        setAttendanceStats(null);
        setLoading(false);
        return;
      }

      const response = await api.get(`/api/attendance/student/${filterStudentId}`, {
        params: { startDate: selectedDate, endDate: selectedDate }
      });
      const data = response.data;
      setAttendances(data.data?.attendance || []);
      setAttendanceStats(data.data?.stats || null);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Erreur lors du chargement');
      setAttendances([]);
      setAttendanceStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        studentId: formData.studentId,
        status: formData.status,
        remarks: formData.remarks,
        date: selectedDate
      };

      if (editingId) {
        await api.put(`/api/attendance/${editingId}`, payload);
      } else {
        await api.post('/api/attendance/mark', payload);
      }

      setFormData({ studentId: '', status: 'PRESENT', remarks: '' });
      setEditingId(null);
      setShowForm(false);
      fetchAttendances();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await api.delete(`/api/attendance/${id}`);
      fetchAttendances();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PRESENT: 'bg-green-100 text-green-800',
      ABSENT: 'bg-red-100 text-red-800',
      LATE: 'bg-yellow-100 text-yellow-800',
      EXCUSED: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'PRESENT') return <Check className="w-4 h-4" />;
    if (status === 'ABSENT') return <X className="w-4 h-4" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-8 h-8 text-primary-navy" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestion de la Présence</h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter Présence
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <Card className="p-6">
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
          />
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              ID élève (filtre)
            </label>
            <input
              type="text"
              value={filterStudentId}
              onChange={(e) => setFilterStudentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
              placeholder="ID élève"
            />
          </div>
        </div>

        {attendanceStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
              <p className="text-xs text-[var(--color-text-secondary)]">Total</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{attendanceStats.total}</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
              <p className="text-xs text-[var(--color-text-secondary)]">Presence</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{attendanceStats.present}</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
              <p className="text-xs text-[var(--color-text-secondary)]">Absences</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{attendanceStats.absent}</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
              <p className="text-xs text-[var(--color-text-secondary)]">Retards</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{attendanceStats.late}</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
              <p className="text-xs text-[var(--color-text-secondary)]">Excuses</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{attendanceStats.excused}</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
              <p className="text-xs text-[var(--color-text-secondary)]">Presence %</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{attendanceStats.percentage}%</p>
            </div>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Élève
              </label>
              <input
                type="text"
                placeholder="ID élève"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="PRESENT">Présent</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Retard</option>
                <option value="EXCUSED">Excusé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Remarques
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                rows={3}
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
                  setFormData({ studentId: '', status: 'PRESENT', remarks: '' });
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
        ) : !filterStudentId ? (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            Saisissez un ID élève pour afficher les présences.
          </p>
        ) : attendances.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">Aucune présence enregistrée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Élève</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Statut</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Remarques</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {attendances.map((att) => (
                  <tr key={att.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {att.student.user.firstName} {att.student.user.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(att.status)}`}>
                        {getStatusIcon(att.status)}
                        {att.status === 'PRESENT' ? 'Présent' : att.status === 'ABSENT' ? 'Absent' : att.status === 'LATE' ? 'Retard' : 'Excusé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{att.remarks || '-'}</td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(att.id);
                          setFormData({
                            studentId: att.studentId,
                            status: att.status,
                            remarks: att.remarks || ''
                          });
                          setShowForm(true);
                        }}
                        className="p-2 hover:bg-blue-100 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(att.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminAttendance;
