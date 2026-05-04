import type React from 'react';
import { useState, useEffect } from 'react';
import { Truck, Plus, Edit2, Trash2, AlertCircle, Check } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import UserSelect from '../../../components/forms/UserSelect';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';

interface AuthorizedPickup {
  id: string;
  studentId: string;
  student: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  name: string;
  relationship: string;
  phone: string;
  idNumber: string;
  isActive: boolean;
  authorizedDate: string;
}

interface PickupLog {
  id: string;
  student: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  pickedUpBy: string;
  pickupTime: string;
  notes?: string;
}

const AdminPickup: React.FC = () => {
  const [authorized, setAuthorized] = useState<AuthorizedPickup[]>([]);
  const [logs, setLogs] = useState<PickupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'authorized' | 'logs'>('authorized');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    relationship: '',
    phone: '',
    idNumber: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [authRes, logsRes] = await Promise.all([
        api.get(API.PICKUP_AUTHORIZED),
        api.get(API.PICKUP_LOGS_HISTORY)
      ]);

      setAuthorized(authRes.data?.data || []);
      setLogs(logsRes.data?.data?.logs || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        studentId: formData.studentId,
        name: formData.name,
        relationship: formData.relationship,
        phone: formData.phone,
        idNumber: formData.idNumber
      };

      if (editingId) {
        await api.put(API.PICKUP_AUTHORIZED_ITEM(editingId), payload);
      } else {
        await api.post(API.PICKUP_AUTHORIZED_ADD, payload);
      }

      setFormData({
        studentId: '',
        name: '',
        relationship: '',
        phone: '',
        idNumber: ''
      });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await api.delete(API.PICKUP_AUTHORIZED_ITEM(id));
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      await api.put(API.PICKUP_AUTHORIZED_ITEM(id), { isActive: !currentActive });
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-8 h-8 text-primary-navy" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion du Ramassage</h1>
        </div>
        {activeTab === 'authorized' && (
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter Personne
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('authorized')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'authorized'
              ? 'border-primary-navy text-primary-navy'
              : 'border-transparent text-gray-500'
          }`}
        >
          Personnes Autorisées
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'logs'
              ? 'border-primary-navy text-primary-navy'
              : 'border-transparent text-gray-500'
          }`}
        >
          Historique
        </button>
      </div>

      <Card className="p-6">
        {activeTab === 'authorized' ? (
          <>
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
                      Nom Complet *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relation
                    </label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
                    >
                      <option value="">Sélectionner</option>
                      <option value="PARENT">Parent</option>
                      <option value="GRAND_PARENT">Grand-parent</option>
                      <option value="TUTEUR">Tuteur</option>
                      <option value="FRERE">Frère</option>
                      <option value="SOEUR">Sœur</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro d'Identité
                    </label>
                    <input
                      type="text"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
                    />
                  </div>
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
                          name: '',
                          relationship: '',
                          phone: '',
                          idNumber: ''
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
            ) : authorized.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucune personne autorisée</p>
            ) : (
              <div className="space-y-4">
                {authorized.map((auth) => (
                  <Card key={auth.id} className="p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{auth.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Élève: {auth.student.user.firstName} {auth.student.user.lastName}
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                          <p>Relation: {auth.relationship}</p>
                          <p>Tél: {auth.phone}</p>
                          <p>ID: {auth.idNumber}</p>
                          <p>Autorisé: {auth.isActive ? 'Oui' : 'Non'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => toggleActive(auth.id, auth.isActive)}
                          className={`p-2 rounded-lg transition ${
                            auth.isActive
                              ? 'bg-green-100 hover:bg-green-200'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          <Check className={`w-4 h-4 ${auth.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(auth.id);
                            setFormData({
                              studentId: auth.studentId,
                              name: auth.name,
                              relationship: auth.relationship,
                              phone: auth.phone,
                              idNumber: auth.idNumber
                            });
                            setShowForm(true);
                          }}
                          className="p-2 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(auth.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-navy mx-auto"></div>
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun ramassage enregistré</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Élève</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Personne</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date/Heure</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {log.student.user.firstName} {log.student.user.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {log.pickedUpBy}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(log.pickupTime).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{log.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default AdminPickup;
