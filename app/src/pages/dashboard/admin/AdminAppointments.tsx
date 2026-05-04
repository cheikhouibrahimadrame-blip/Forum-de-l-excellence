import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, ChevronLeft, X, Check, XCircle, RefreshCw, AlertCircle, Clock, MessageSquare } from 'lucide-react';
import UserSelect from '../../../components/forms/UserSelect';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';
import { getReadableApiError } from '../../../lib/errorUtils';

interface AppointmentUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  email?: string;
}

interface AppointmentItem {
  id: string;
  requester?: AppointmentUser;
  recipient?: AppointmentUser;
  appointmentType?: string;
  scheduledDatetime?: string;
  durationMinutes?: number;
  location?: string;
  notes?: string;
  status?: string;
}

const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  ACADEMIC_ADVISING: 'Conseil académique',
  PARENT_CONFERENCE: 'Conférence parent-enseignant',
  COUNSELING: 'Orientation et conseil',
  ADMINISTRATIVE: 'Rendez-vous administratif',
  TUTORING: 'Séance de tutorat'
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  CANCELLED: 'Annulé',
  COMPLETED: 'Terminé'
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
};

const AdminAppointments: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    recipientId: '',
    appointmentType: 'ADMINISTRATIVE',
    scheduledDatetime: '',
    durationMinutes: '30',
    location: '',
    notes: ''
  });

  // Filter
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(API.APPOINTMENTS);
      const result = response.data;
      const items = Array.isArray(result?.data?.appointments)
        ? result.data.appointments
        : [];
      setAppointments(items);
    } catch (err: any) {
      const message = getReadableApiError(err, 'Erreur lors du chargement des rendez-vous.');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const formatUserName = (user?: AppointmentUser) => {
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
    return fullName || 'Utilisateur inconnu';
  };

  const formatUserRole = (role?: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Admin',
      TEACHER: 'Enseignant',
      STUDENT: 'Élève',
      PARENT: 'Parent'
    };
    return labels[role || ''] || role || '';
  };

  const formatDate = (value?: string) => {
    if (!value) return 'Date inconnue';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Date inconnue';
    return parsed.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (value?: string) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Create appointment
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.recipientId) {
      setError('Veuillez sélectionner un destinataire.');
      return;
    }
    try {
      setCreateLoading(true);
      setError('');
      const payload = {
        recipientId: createForm.recipientId,
        appointmentType: createForm.appointmentType,
        scheduledDatetime: createForm.scheduledDatetime
          ? new Date(createForm.scheduledDatetime).toISOString()
          : '',
        durationMinutes: parseInt(createForm.durationMinutes, 10) || 30,
        location: createForm.location || undefined,
        notes: createForm.notes || undefined
      };
      await api.post(API.APPOINTMENTS, payload);
      setSuccess('Rendez-vous créé avec succès.');
      setShowCreateModal(false);
      setCreateForm({
        recipientId: '',
        appointmentType: 'ADMINISTRATIVE',
        scheduledDatetime: '',
        durationMinutes: '30',
        location: '',
        notes: ''
      });
      fetchAppointments();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.errors?.[0]?.msg || err.message || 'Erreur lors de la création');
    } finally {
      setCreateLoading(false);
    }
  };

  // Approve (confirm)
  const handleConfirm = async (id: string) => {
    try {
      setError('');
      await api.patch(`${API.APPOINTMENT(id)}/confirm`);
      setSuccess('Rendez-vous approuvé.');
      fetchAppointments();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Erreur lors de la confirmation');
    }
  };

  // Refuse (cancel)
  const handleCancel = async (id: string) => {
    if (!window.confirm('Confirmer le refus de ce rendez-vous ?')) return;
    try {
      setError('');
      await api.delete(API.APPOINTMENT(id));
      setSuccess('Rendez-vous refusé.');
      fetchAppointments();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Erreur lors du refus');
    }
  };

  const filteredAppointments = filterStatus === 'ALL'
    ? appointments
    : appointments.filter(a => a.status === filterStatus);

  const pendingCount = appointments.filter(a => a.status === 'PENDING').length;
  const confirmedCount = appointments.filter(a => a.status === 'CONFIRMED').length;
  const cancelledCount = appointments.filter(a => a.status === 'CANCELLED').length;

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin', { state: { scrollTo: 'rendez-vous' } })}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Rendez-vous</h1>
              <p className="text-[var(--color-text-secondary)]">
                Gérer les demandes, validations et créations de rendez-vous
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouveau rendez-vous
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              <button onClick={() => setError('')} className="ml-auto p-1">
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 px-4 py-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">En attente</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{pendingCount}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Demandes non traitées</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <Check className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Confirmés</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{confirmedCount}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Ce trimestre</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Annulés</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{cancelledCount}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Actions admin</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Filtrer par statut :</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field px-3 py-2 rounded-lg text-sm"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="CONFIRMED">Confirmés</option>
              <option value="CANCELLED">Annulés</option>
            </select>
            <button
              onClick={fetchAppointments}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Appointments List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-navy)] mx-auto mb-2"></div>
              <p className="text-sm text-[var(--color-text-secondary)]">Chargement des rendez-vous...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3" />
              <p className="text-[var(--color-text-secondary)]">Aucun rendez-vous trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="card p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[appointment.status || ''] || 'bg-gray-100 text-gray-800'}`}>
                          {STATUS_LABELS[appointment.status || ''] || appointment.status}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {APPOINTMENT_TYPE_LABELS[appointment.appointmentType || ''] || appointment.appointmentType}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-text-primary)] font-medium">
                        <span className="text-[var(--color-text-secondary)]">De :</span>{' '}
                        {formatUserName(appointment.requester)}
                        <span className="text-xs text-[var(--color-text-muted)] ml-1">
                          ({formatUserRole(appointment.requester?.role)})
                        </span>
                      </p>
                      <p className="text-sm text-[var(--color-text-primary)] font-medium">
                        <span className="text-[var(--color-text-secondary)]">À :</span>{' '}
                        {formatUserName(appointment.recipient)}
                        <span className="text-xs text-[var(--color-text-muted)] ml-1">
                          ({formatUserRole(appointment.recipient?.role)})
                        </span>
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        <Calendar className="w-3.5 h-3.5 inline mr-1" />
                        {formatDate(appointment.scheduledDatetime)}
                        {formatTime(appointment.scheduledDatetime) && (
                          <span className="ml-2">
                            <Clock className="w-3.5 h-3.5 inline mr-1" />
                            {formatTime(appointment.scheduledDatetime)}
                          </span>
                        )}
                        {appointment.durationMinutes && (
                          <span className="ml-2 text-xs">({appointment.durationMinutes} min)</span>
                        )}
                      </p>
                      {appointment.notes && (
                        <p className="text-sm text-[var(--color-text-muted)] mt-1 italic flex items-start gap-1">
                          <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          {appointment.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions for pending appointments */}
                    {appointment.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfirm(appointment.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Approuver
                        </button>
                        <button
                          onClick={() => handleCancel(appointment.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-[var(--color-bg-primary)] rounded-xl max-w-lg w-full p-6 shadow-xl border border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Nouveau rendez-vous</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1.5 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                  </button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Destinataire *
                    </label>
                    <UserSelect
                      role={['TEACHER', 'STUDENT', 'PARENT', 'ADMIN']}
                      valueKind="userId"
                      value={createForm.recipientId}
                      onChange={(id) => setCreateForm({ ...createForm, recipientId: id })}
                      placeholder="Sélectionner une personne (enseignant, élève, parent...)"
                      emptyHint="Aucun utilisateur disponible"
                      showEmail
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Type de rendez-vous *
                    </label>
                    <select
                      value={createForm.appointmentType}
                      onChange={(e) => setCreateForm({ ...createForm, appointmentType: e.target.value })}
                      className="input-field w-full"
                      required
                    >
                      {Object.entries(APPOINTMENT_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Date et heure *
                      </label>
                      <input
                        type="datetime-local"
                        value={createForm.scheduledDatetime}
                        onChange={(e) => setCreateForm({ ...createForm, scheduledDatetime: e.target.value })}
                        className="input-field w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Durée (minutes) *
                      </label>
                      <select
                        value={createForm.durationMinutes}
                        onChange={(e) => setCreateForm({ ...createForm, durationMinutes: e.target.value })}
                        className="input-field w-full"
                        required
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">1 heure</option>
                        <option value="90">1h30</option>
                        <option value="120">2 heures</option>
                        <option value="180">3 heures</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Lieu
                    </label>
                    <input
                      type="text"
                      value={createForm.location}
                      onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                      placeholder="Salle de réunion, bureau du directeur..."
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Motif / Notes
                    </label>
                    <textarea
                      value={createForm.notes}
                      onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                      placeholder="Décrivez le motif du rendez-vous..."
                      className="input-field w-full"
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {createForm.notes.length}/500 caractères
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 btn-secondary"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="flex-1 btn-primary disabled:opacity-60"
                    >
                      {createLoading ? 'Création...' : 'Créer le rendez-vous'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAppointments;
