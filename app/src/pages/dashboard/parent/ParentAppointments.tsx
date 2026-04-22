import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, User, MessageSquare, Plus, X, CheckCircle, AlertCircle, Users, Phone, Video, MapPin, Baby, Send } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import { getReadableApiError } from '../../../lib/errorUtils';
import { useLiveRefresh } from '../../../hooks/useLiveRefresh';

interface Appointment {
  id: string;
  childName: string;
  teacher: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
  type: 'in-person' | 'phone' | 'video';
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  notes: string;
}

interface ChildOption {
  id: string;
  name: string;
}

interface TeacherOption {
  id: string;
  name: string;
}

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

const ParentAppointments: React.FC = () => {
  const { user } = useAuth();
  const refreshTick = useLiveRefresh(15000);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const [studentsRes, teachersRes, appointmentsRes] = await Promise.all([
          api.get('/api/parent-students/my-students'),
          api.get('/api/users', { params: { role: 'TEACHER', limit: 100 } }),
          api.get('/api/appointments')
        ]);

        const studentsPayload = studentsRes.data?.data?.students || studentsRes.data?.data || [];
        const mappedChildren: ChildOption[] = studentsPayload
          .map((item: any) => {
            const student = item.student || item;
            const userInfo = student.user || item.user || {};
            const id = String(student.id || item.id || '');
            const name = [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' ').trim();
            return id ? { id, name: name || 'Enfant' } : null;
          })
          .filter(Boolean) as ChildOption[];

        const teacherItems = Array.isArray(teachersRes.data?.data?.users) ? teachersRes.data.data.users : [];
        const mappedTeachers: TeacherOption[] = teacherItems.map((teacher: any) => ({
          id: String(teacher.id),
          name: [teacher.firstName, teacher.lastName].filter(Boolean).join(' ').trim() || teacher.email || 'Enseignant'
        }));

        const appointmentItems = Array.isArray(appointmentsRes.data?.data?.appointments) ? appointmentsRes.data.data.appointments : [];
        const mappedAppointments: Appointment[] = appointmentItems.map((item: any) => {
          const requester = [item.requester?.firstName, item.requester?.lastName].filter(Boolean).join(' ').trim() || 'Utilisateur';
          const recipient = [item.recipient?.firstName, item.recipient?.lastName].filter(Boolean).join(' ').trim() || 'Utilisateur';
          const isParentRequester = user?.role === 'PARENT';
          const otherParty = isParentRequester ? recipient : requester;
          const scheduled = item.scheduledDatetime ? new Date(item.scheduledDatetime) : null;
          const type = String(item.appointmentType || 'PARENT_CONFERENCE').toUpperCase();

          return {
            id: String(item.id),
            childName: mappedChildren[0]?.name || 'Enfant',
            teacher: otherParty,
            subject: formatAppointmentType(type),
            date: scheduled ? scheduled.toISOString().split('T')[0] : '-',
            time: scheduled ? scheduled.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-',
            duration: `${item.durationMinutes || 30} min`,
            type: item.location && item.location.toLowerCase().includes('video') ? 'video' : item.location && item.location.toLowerCase().includes('phone') ? 'phone' : 'in-person',
            status: String(item.status || 'PENDING').toLowerCase() as Appointment['status'],
            notes: item.notes || ''
          };
        });

        setChildren(mappedChildren);
        setTeachers(mappedTeachers);
        setAppointments(mappedAppointments);
      } catch (err: any) {
        const message = getReadableApiError(err, 'Erreur lors du chargement des rendez-vous');
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

  const [showAddChild, setShowAddChild] = useState('');
  const [showAddTeacher, setShowAddTeacher] = useState('');
  const [showAddType, setShowAddType] = useState('PARENT_CONFERENCE');
  const [showAddDate, setShowAddDate] = useState('');
  const [showAddTime, setShowAddTime] = useState('');
  const [showAddLocation, setShowAddLocation] = useState('Salle de réunion');
  const [showAddNotes, setShowAddNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled': return <X className="w-4 h-4 text-red-600" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programmé';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'in-person': return <MapPin className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'in-person': return 'Présentiel';
      case 'phone': return 'Téléphone';
      case 'video': return 'Vidéo';
      default: return type;
    }
  };

  const handleScheduleAppointment = async () => {
    try {
      setSaving(true);
      setError('');
      if (!showAddTeacher || !showAddDate || !showAddTime) {
        throw new Error('Veuillez remplir les champs obligatoires');
      }

      await api.post('/api/appointments', {
        recipientId: showAddTeacher,
        appointmentType: showAddType,
        scheduledDatetime: `${showAddDate}T${showAddTime}`,
        durationMinutes: 30,
        location: showAddLocation,
        notes: [showAddNotes, showAddChild ? `Enfant concerné: ${showAddChild}` : ''].filter(Boolean).join(' | ')
      });

      setShowAddModal(false);
      setShowAddChild('');
      setShowAddTeacher('');
      setShowAddType('PARENT_CONFERENCE');
      setShowAddDate('');
      setShowAddTime('');
      setShowAddLocation('Salle de réunion');
      setShowAddNotes('');

      const refreshed = await api.get('/api/appointments');
      const appointmentItems = Array.isArray(refreshed.data?.data?.appointments) ? refreshed.data.data.appointments : [];
      setAppointments(
        appointmentItems.map((item: any) => {
          const requester = [item.requester?.firstName, item.requester?.lastName].filter(Boolean).join(' ').trim() || 'Utilisateur';
          const recipient = [item.recipient?.firstName, item.recipient?.lastName].filter(Boolean).join(' ').trim() || 'Utilisateur';
          const scheduled = item.scheduledDatetime ? new Date(item.scheduledDatetime) : null;
          const type = String(item.appointmentType || 'PARENT_CONFERENCE').toUpperCase();
          return {
            id: String(item.id),
            childName: showAddChild || children[0]?.name || 'Enfant',
            teacher: user?.role === 'PARENT' ? recipient : requester,
            subject: formatAppointmentType(type),
            date: scheduled ? scheduled.toISOString().split('T')[0] : '-',
            time: scheduled ? scheduled.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-',
            duration: `${item.durationMinutes || 30} min`,
            type: item.location && item.location.toLowerCase().includes('video') ? 'video' : item.location && item.location.toLowerCase().includes('phone') ? 'phone' : 'in-person',
            status: String(item.status || 'PENDING').toLowerCase() as Appointment['status'],
            notes: item.notes || ''
          };
        })
      );
    } catch (err: any) {
      const message = getReadableApiError(err, 'Erreur lors de la demande de rendez-vous');
      if (message) setError(message);
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter((a) => a.status === 'scheduled' || a.status === 'pending').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Rendez-vous</h1>
            <div className="flex gap-4">
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="input-field appearance-none pr-10">
                <option value="all">Tous les statuts</option>
                <option value="scheduled">Programmé</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
                <option value="pending">En attente</option>
              </select>
              <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
                <Plus className="w-5 h-5" />
                Nouveau RDV
              </button>
            </div>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-[var(--color-text-secondary)]">Total RDV</p><p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.total}</p></div><div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center"><Calendar className="w-6 h-6 text-blue-600" /></div></div></div>
            <div className="card p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-[var(--color-text-secondary)]">Programmés</p><p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.scheduled}</p></div><div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center"><Clock className="w-6 h-6 text-amber-600" /></div></div></div>
            <div className="card p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-[var(--color-text-secondary)]">Terminés</p><p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.completed}</p></div><div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div></div></div>
            <div className="card p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-[var(--color-text-secondary)]">Annulés</p><p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.cancelled}</p></div><div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center"><Users className="w-6 h-6 text-purple-600" /></div></div></div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Liste des Rendez-vous ({filteredAppointments.length})</h2>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <div className="p-6 text-center text-[var(--color-text-secondary)]">Chargement...</div>
              ) : filteredAppointments.length === 0 ? (
                <div className="p-6 text-center text-[var(--color-text-secondary)]">Aucun rendez-vous trouvé</div>
              ) : (
                filteredAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-6 hover:bg-[var(--color-bg-secondary)] transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{appointment.subject}</h3>
                          <span className={`badge ${getStatusColor(appointment.status)} flex items-center gap-1`}>
                            {getStatusIcon(appointment.status)}
                            {getStatusText(appointment.status)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2"><Baby className="w-4 h-4 text-[var(--color-text-muted)]" /><span className="text-[var(--color-text-secondary)]">{appointment.childName}</span></div>
                          <div className="flex items-center gap-2"><User className="w-4 h-4 text-[var(--color-text-muted)]" /><span className="text-[var(--color-text-secondary)]">{appointment.teacher}</span></div>
                          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[var(--color-text-muted)]" /><span className="text-[var(--color-text-secondary)]">{new Date(appointment.date).toLocaleDateString('fr-FR')}</span></div>
                          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[var(--color-text-muted)]" /><span className="text-[var(--color-text-secondary)]">{appointment.time}</span></div>
                          <div className="flex items-center gap-2">{getTypeIcon(appointment.type)}<span className="text-[var(--color-text-secondary)]">{getTypeText(appointment.type)}</span></div>
                          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[var(--color-text-muted)]" /><span className="text-[var(--color-text-secondary)]">{appointment.duration}</span></div>
                        </div>
                        {appointment.notes && <div className="mt-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg"><p className="text-sm text-[var(--color-text-secondary)]"><span className="font-medium">Notes :</span> {appointment.notes}</p></div>}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {appointment.status === 'scheduled' && <button className="p-2 text-[var(--color-text-secondary)] hover:text-green-600 transition-colors"><CheckCircle className="w-5 h-5" /></button>}
                        <button className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-navy)] transition-colors"><MessageSquare className="w-5 h-5" /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="card p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Nouveau Rendez-vous</h3>
                  <button onClick={() => setShowAddModal(false)} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Enfant</label>
                    <select value={showAddChild} onChange={(e) => setShowAddChild(e.target.value)} className="input-field w-full">
                      <option value="">Sélectionner un enfant</option>
                      {children.map((child) => <option key={child.id} value={child.name}>{child.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Enseignant</label>
                    <select value={showAddTeacher} onChange={(e) => setShowAddTeacher(e.target.value)} className="input-field w-full">
                      <option value="">Sélectionner un enseignant</option>
                      {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Sujet</label>
                    <select value={showAddType} onChange={(e) => setShowAddType(e.target.value)} className="input-field w-full">
                      <option value="PARENT_CONFERENCE">Réunion parent-professeur</option>
                      <option value="ACADEMIC_ADVISING">Conseil académique</option>
                      <option value="COUNSELING">Orientation</option>
                      <option value="ADMINISTRATIVE">Administratif</option>
                      <option value="TUTORING">Tutorat</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Date</label>
                      <input type="date" value={showAddDate} onChange={(e) => setShowAddDate(e.target.value)} className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Heure</label>
                      <input type="time" value={showAddTime} onChange={(e) => setShowAddTime(e.target.value)} className="input-field w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Lieu</label>
                    <input type="text" value={showAddLocation} onChange={(e) => setShowAddLocation(e.target.value)} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Notes</label>
                    <textarea value={showAddNotes} onChange={(e) => setShowAddNotes(e.target.value)} className="input-field w-full min-h-[100px]" />
                  </div>
                  <button onClick={handleScheduleAppointment} className="btn-primary w-full flex items-center justify-center gap-2" disabled={saving}>
                    <Send className="w-4 h-4" />
                    {saving ? 'Envoi...' : 'Créer le rendez-vous'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentAppointments;
