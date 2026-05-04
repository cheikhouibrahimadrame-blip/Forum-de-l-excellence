import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, User, MessageSquare, Plus, X, CheckCircle, Send } from 'lucide-react';
import { useScrollReveal } from '../../../hooks/useScrollReveal';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';
import { useLiveRefresh } from '../../../hooks/useLiveRefresh';

type Appointment = {
  id: string;
  title: string;
  person: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  location: string;
  notes?: string;
};

type Teacher = {
  id: string;
  name: string;
  email?: string;
};

const formatAppointmentType = (value: string) => {
  switch (String(value || '').toUpperCase()) {
    case 'ACADEMIC_ADVISING':
      return 'Conseil académique';
    case 'PARENT_CONFERENCE':
      return 'Réunion parent-professeur';
    case 'COUNSELING':
      return 'Orientation';
    case 'ADMINISTRATIVE':
      return 'Administratif';
    case 'TUTORING':
      return 'Tutorat';
    default:
      return String(value || 'Rendez-vous').replace(/_/g, ' ').toLowerCase();
  }
};

const getReadableError = (err: any, fallback: string) => {
  const status = err?.status ?? err?.response?.status;
  const backendMessage = err?.data?.error || err?.data?.message || err?.response?.data?.error || err?.response?.data?.message;
  const message = String(err?.message || '').toLowerCase();
  const code = err?.code;
  const name = err?.name;

  if (name === 'AbortError' || name === 'CanceledError' || code === 'ERR_CANCELED' || message === 'canceled') {
    return '';
  }

  if (status === 401) {
    return 'Session expirée. Veuillez vous reconnecter.';
  }

  if (status === 403) {
    return 'Accès refusé pour cette action.';
  }

  return backendMessage || err?.message || fallback;
};

type AppointmentCardProps = {
  appointment: Appointment;
  animationRef: React.Ref<HTMLDivElement>;
  isVisible: boolean;
  delayClass: string;
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, animationRef, isVisible, delayClass }) => {
  const statusClass =
    appointment.status === 'confirmed'
      ? 'bg-green-100 text-green-800'
      : appointment.status === 'completed'
        ? 'bg-blue-100 text-blue-800'
        : appointment.status === 'cancelled'
          ? 'bg-red-100 text-red-800'
          : 'bg-amber-100 text-amber-800';

  return (
    <div
      ref={animationRef}
      className={`flex items-start gap-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg ${
        isVisible ? 'animate-fade-in-up' : 'opacity-0'
      } ${delayClass}`}
    >
      <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-navy)] flex items-center justify-center flex-shrink-0">
        <Calendar className="w-6 h-6 text-[var(--color-primary-gold)]" />
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">{appointment.title}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] flex items-center gap-1 mt-1">
              <User className="w-4 h-4" />
              {appointment.person}
            </p>
          </div>
          <span className={`badge ${statusClass}`}>
            {appointment.status === 'confirmed'
              ? 'Confirmé'
              : appointment.status === 'completed'
                ? 'Terminé'
                : appointment.status === 'cancelled'
                  ? 'Annulé'
                  : 'En attente'}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {appointment.date} à {appointment.time}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {appointment.location}
          </span>
        </div>
        {appointment.notes && <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{appointment.notes}</p>}
      </div>
    </div>
  );
};

type NewAppointmentModalProps = {
  teachers: Teacher[];
  onClose: () => void;
  onSubmit: (payload: {
    recipientId: string;
    appointmentType: string;
    scheduledDatetime: string;
    durationMinutes: number;
    location: string;
    notes: string;
  }) => Promise<void>;
  modalRef: React.Ref<HTMLDivElement>;
  modalVisible: boolean;
};

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({ teachers, onClose, onSubmit, modalRef, modalVisible }) => {
  const [formData, setFormData] = useState({
    recipientId: '',
    appointmentType: 'ACADEMIC_ADVISING',
    scheduledDate: '',
    scheduledTime: '',
    durationMinutes: 30,
    location: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      await onSubmit({
        recipientId: formData.recipientId,
        appointmentType: formData.appointmentType,
        scheduledDatetime: `${formData.scheduledDate}T${formData.scheduledTime}`,
        durationMinutes: formData.durationMinutes,
        location: formData.location,
        notes: formData.notes
      });
      onClose();
    } catch (submitError: any) {
      setError(getReadableError(submitError, 'Erreur lors de la demande de rendez-vous'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className={`bg-[var(--color-bg-card)] rounded-xl p-6 max-w-md w-full ${modalVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Nouveau Rendez-vous</h3>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Type de rendez-vous</label>
            <select
              className="input-field"
              value={formData.appointmentType}
              onChange={(e) => setFormData((prev) => ({ ...prev, appointmentType: e.target.value }))}
            >
              <option value="ACADEMIC_ADVISING">Conseil académique</option>
              <option value="PARENT_CONFERENCE">Réunion parent-professeur</option>
              <option value="COUNSELING">Orientation</option>
              <option value="ADMINISTRATIVE">Administratif</option>
              <option value="TUTORING">Tutorat</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Avec qui ?</label>
            <select
              className="input-field"
              value={formData.recipientId}
              onChange={(e) => setFormData((prev) => ({ ...prev, recipientId: e.target.value }))}
              required
            >
              <option value="">Sélectionnez un enseignant</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Date</label>
              <input
                type="date"
                className="input-field"
                value={formData.scheduledDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Heure</label>
              <input
                type="time"
                className="input-field"
                value={formData.scheduledTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, scheduledTime: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Durée (minutes)</label>
            <input
              type="number"
              min={15}
              max={180}
              className="input-field"
              value={formData.durationMinutes}
              onChange={(e) => setFormData((prev) => ({ ...prev, durationMinutes: Number(e.target.value) || 30 }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Lieu</label>
            <input
              type="text"
              className="input-field"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Bureau des professeurs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Notes (optionnel)</label>
            <textarea
              className="input-field min-h-[100px]"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Décrivez le motif du rendez-vous..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary py-2">Annuler</button>
            <button type="submit" className="flex-1 btn-primary py-2 flex items-center justify-center gap-2" disabled={saving}>
              <Send className="w-4 h-4" />
              {saving ? 'Envoi...' : 'Demander'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StudentAppointments: React.FC = () => {
  const { user } = useAuth();
  const refreshTick = useLiveRefresh(15000);
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: listRef, isVisible: listVisible } = useScrollReveal();
  const { ref: modalRef, isVisible: modalVisible } = useScrollReveal();
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | Appointment['status']>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const [appointmentsRes, teachersRes] = await Promise.all([
          api.get(API.APPOINTMENTS),
          api.get(API.USERS, { params: { role: 'TEACHER', limit: 100 } })
        ]);

        const appointmentItems = Array.isArray(appointmentsRes.data?.data?.appointments)
          ? appointmentsRes.data.data.appointments
          : [];

        const mappedAppointments: Appointment[] = appointmentItems.map((item: any) => {
          const requesterName = [item.requester?.firstName, item.requester?.lastName].filter(Boolean).join(' ').trim() || 'Utilisateur';
          const recipientName = [item.recipient?.firstName, item.recipient?.lastName].filter(Boolean).join(' ').trim() || 'Utilisateur';
          const studentIsRequester = user?.role === 'STUDENT';
          const otherParty = studentIsRequester ? recipientName : requesterName;
          const appointmentType = formatAppointmentType(item.appointmentType);
          const status = String(item.status || 'PENDING').toLowerCase() as Appointment['status'];
          const scheduled = item.scheduledDatetime ? new Date(item.scheduledDatetime) : null;

          return {
            id: String(item.id),
            title: appointmentType || 'Rendez-vous',
            person: otherParty,
            date: scheduled ? scheduled.toLocaleDateString('fr-FR') : '-',
            time: scheduled ? scheduled.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-',
            status: status === 'confirmed' || status === 'pending' || status === 'cancelled' || status === 'completed' ? status : 'pending',
            location: item.location || '-',
            notes: item.notes || ''
          };
        });

        const teacherItems = Array.isArray(teachersRes.data?.data?.users) ? teachersRes.data.data.users : [];
        const mappedTeachers: Teacher[] = teacherItems.map((teacher: any) => ({
          id: teacher.id,
          name: [teacher.firstName, teacher.lastName].filter(Boolean).join(' ').trim() || teacher.email || 'Enseignant',
          email: teacher.email
        }));

        setAppointments(mappedAppointments);
        setTeachers(mappedTeachers);
      } catch (err: any) {
        const message = getReadableError(err, 'Erreur lors du chargement des rendez-vous');
        if (message) setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.role, refreshTick]);

  const filteredAppointments = useMemo(
    () => appointments.filter((appointment) => selectedStatus === 'all' || appointment.status === selectedStatus),
    [appointments, selectedStatus]
  );

  const appointmentAnimations = filteredAppointments.map(() => useScrollReveal());
  const appointmentDelays = useMemo(() => ['animation-delay-0', 'animation-delay-100', 'animation-delay-200'], []);

  const handleCreateAppointment = async (payload: {
    recipientId: string;
    appointmentType: string;
    scheduledDatetime: string;
    durationMinutes: number;
    location: string;
    notes: string;
  }) => {
    try {
      await api.post(API.APPOINTMENTS, payload);
      const refreshed = await api.get(API.APPOINTMENTS);
      const appointmentItems = Array.isArray(refreshed.data?.data?.appointments) ? refreshed.data.data.appointments : [];
      setAppointments(
        appointmentItems.map((item: any) => {
          const requesterName = [item.requester?.firstName, item.requester?.lastName].filter(Boolean).join(' ').trim() || 'Utilisateur';
          const recipientName = [item.recipient?.firstName, item.recipient?.lastName].filter(Boolean).join(' ').trim() || 'Utilisateur';
          const appointmentType = formatAppointmentType(item.appointmentType);
          const scheduled = item.scheduledDatetime ? new Date(item.scheduledDatetime) : null;

          return {
            id: String(item.id),
            title: appointmentType || 'Rendez-vous',
            person: user?.role === 'STUDENT' ? recipientName : requesterName,
            date: scheduled ? scheduled.toLocaleDateString('fr-FR') : '-',
            time: scheduled ? scheduled.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-',
            status: String(item.status || 'PENDING').toLowerCase() as Appointment['status'],
            location: item.location || '-',
            notes: item.notes || ''
          };
        })
      );
    } catch (err: any) {
      throw new Error(getReadableError(err, 'Erreur lors de la demande de rendez-vous'));
    }
  };

  const statusCounts = {
    total: appointments.length,
    pending: appointments.filter((appointment) => appointment.status === 'pending').length,
    confirmed: appointments.filter((appointment) => appointment.status === 'confirmed').length,
    completed: appointments.filter((appointment) => appointment.status === 'completed').length
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
          <div ref={headerRef} className={`flex items-center justify-between ${headerVisible ? 'animate-slide-in-left' : 'opacity-0'}`}>
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Mes Rendez-vous</h1>
              <p className="text-[var(--color-text-secondary)]">Demandes et suivis en temps réel</p>
            </div>
            <button onClick={() => setShowNewAppointment(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nouveau Rendez-vous
            </button>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Total RDV</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">{statusCounts.total}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">En attente</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">{statusCounts.pending}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Confirmé(s)</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">{statusCounts.confirmed}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Terminés</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">{statusCounts.completed}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Rendez-vous à venir</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">Synchronisé avec le backend</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-[var(--color-text-secondary)]">Statut</label>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as any)} className="input-field min-w-[180px]">
                  <option value="all">Tous</option>
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
            </div>
          </div>

          <div ref={listRef} className={`card p-6 ${listVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-[var(--color-text-secondary)]">Chargement...</div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-text-secondary)]">Aucun rendez-vous trouvé</div>
              ) : (
                filteredAppointments.map((appointment, index) => {
                  const { ref, isVisible } = appointmentAnimations[index];
                  const delayClass = appointmentDelays[index] || '';
                  return <AppointmentCard key={appointment.id} appointment={appointment} animationRef={ref} isVisible={isVisible} delayClass={delayClass} />;
                })
              )}
            </div>
          </div>

          {showNewAppointment && (
            <NewAppointmentModal
              teachers={teachers}
              onClose={() => setShowNewAppointment(false)}
              onSubmit={handleCreateAppointment}
              modalRef={modalRef}
              modalVisible={modalVisible}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAppointments;
