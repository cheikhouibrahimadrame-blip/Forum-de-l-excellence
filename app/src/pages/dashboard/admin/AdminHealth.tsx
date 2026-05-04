import type React from 'react';
import { useState, useEffect } from 'react';
import { Heart, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import UserSelect from '../../../components/forms/UserSelect';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';

interface HealthRecord {
  id: string;
  studentId: string;
  student: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  recordedDate?: string;
  height?: number;
  weight?: number;
  bloodType?: string | null;
  allergies?: string[];
  medicalConditions?: string[];
  medications?: string | null;
  emergencyContact?: string | null;
}

const AdminHealth: React.FC = () => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    height: '',
    weight: '',
    bloodType: '',
    allergies: '',
    medicalConditions: '',
    medications: '',
    emergencyContact: ''
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get(API.HEALTH);
      const data = response.data;
      setRecords(data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        bloodType: formData.bloodType || undefined,
        allergies: formData.allergies ? formData.allergies.split(',').map(item => item.trim()).filter(Boolean) : undefined,
        medicalConditions: formData.medicalConditions ? formData.medicalConditions.split(',').map(item => item.trim()).filter(Boolean) : undefined,
        medications: formData.medications || undefined,
        emergencyContact: formData.emergencyContact || undefined
      };

      if (editingId) {
        await api.put(API.HEALTH_RECORD(editingId), payload);
      } else {
        await api.put(API.HEALTH_RECORD(formData.studentId), payload);
      }

      setFormData({
        studentId: '',
        height: '',
        weight: '',
        bloodType: '',
        allergies: '',
        medicalConditions: '',
        medications: '',
        emergencyContact: ''
      });
      setEditingId(null);
      setShowForm(false);
      fetchRecords();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await api.delete(API.HEALTH_RECORD(id));
      fetchRecords();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-8 h-8 text-primary-navy" />
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Dossiers Médicaux</h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter Dossier
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
          <form onSubmit={handleSubmit} className="bg-[var(--color-bg-secondary)] p-6 rounded-lg mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
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
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Groupe Sanguin
                </label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
                >
                  <option value="">Sélectionner</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Taille (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Poids (kg)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Allergies
              </label>
              <textarea
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Conditions Médicales
              </label>
              <textarea
                value={formData.medicalConditions}
                onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Médicaments
              </label>
              <textarea
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Contact d'Urgence
              </label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
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
                    height: '',
                    weight: '',
                    bloodType: '',
                    allergies: '',
                    medicalConditions: '',
                    medications: '',
                    emergencyContact: ''
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
        ) : records.length === 0 ? (
          <p className="text-center text-[var(--color-text-muted)] py-8">Aucun dossier médical</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {records.map((record) => (
              <Card key={record.id} className="p-4 border border-[var(--color-border)]">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-[var(--color-text-primary)]">
                    {record.student.user.firstName} {record.student.user.lastName}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(record.studentId);
                        setFormData({
                          studentId: record.studentId,
                          height: record.height?.toString() || '',
                          weight: record.weight?.toString() || '',
                          bloodType: record.bloodType || '',
                          allergies: record.allergies?.join(', ') || '',
                          medicalConditions: record.medicalConditions?.join(', ') || '',
                          medications: record.medications || '',
                          emergencyContact: record.emergencyContact || ''
                        });
                        setShowForm(true);
                      }}
                      className="p-2 hover:bg-blue-100 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(record.studentId)}
                      className="p-2 hover:bg-red-100 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                  {record.bloodType && <p><span className="font-medium">Groupe sanguin:</span> {record.bloodType}</p>}
                  {record.height && <p><span className="font-medium">Taille:</span> {record.height} cm</p>}
                  {record.weight && <p><span className="font-medium">Poids:</span> {record.weight} kg</p>}
                  {record.allergies && record.allergies.length > 0 && (
                    <p><span className="font-medium">Allergies:</span> {record.allergies.join(', ')}</p>
                  )}
                  {record.medicalConditions && record.medicalConditions.length > 0 && (
                    <p><span className="font-medium">Conditions:</span> {record.medicalConditions.join(', ')}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminHealth;
