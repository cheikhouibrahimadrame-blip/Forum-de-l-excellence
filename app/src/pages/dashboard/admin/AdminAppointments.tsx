import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, ChevronLeft, Calendar, MessageSquare, X } from 'lucide-react';
import { api } from '../../../lib/api';
import { getReadableApiError } from '../../../lib/errorUtils';

interface AppointmentUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface AppointmentItem {
  id: string;
  requester?: AppointmentUser;
  recipient?: AppointmentUser;
  appointmentType?: string;
  scheduledDatetime?: string;
  status?: string;
}

interface TeacherItem {
  id: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

const AdminAppointments: React.FC = () => {
  const navigate = useNavigate();
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [appointmentsResponse, usersResponse] = await Promise.all([
          api.get('/api/appointments'),
          api.get('/api/users')
        ]);

        const appointmentsResult = appointmentsResponse.data;
        const appointmentItems = Array.isArray(appointmentsResult?.data?.appointments)
          ? appointmentsResult.data.appointments
          : [];
        setAppointments(appointmentItems);

        const usersResult = usersResponse.data;
        const userItems = Array.isArray(usersResult?.data?.users) ? usersResult.data.users : [];
        setTeachers(userItems.filter((user: TeacherItem) => user.role === 'TEACHER'));
      } catch (err: any) {
        console.error('Error fetching appointments:', err);
        const message = getReadableApiError(err, 'Erreur lors du chargement des rendez-vous.');
        if (message) setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatUserName = (user?: AppointmentUser) => {
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
    return fullName || 'Utilisateur inconnu';
  };

  const formatDate = (value?: string) => {
    if (!value) return 'Date inconnue';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Date inconnue';
    return parsed.toLocaleDateString('fr-FR');
  };

  const pendingRequests = appointments.filter((appointment) => appointment.status === 'PENDING');
  const confirmedCount = appointments.filter((appointment) => appointment.status === 'CONFIRMED').length;
  const cancelledCount = appointments.filter((appointment) => appointment.status === 'CANCELLED').length;

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin', { state: { scrollTo: 'rendez-vous' } })}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Rendez-vous</h1>
              <p className="text-[var(--color-text-secondary)]">
                Gérer les demandes, validations et annulations
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowApproveModal(true)} className="btn-primary flex items-center gap-2">
              <BellRing className="w-4 h-4" />
              Voir les requêtes
            </button>
            <button onClick={() => setShowReassignModal(true)} className="btn-secondary flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Réassigner
            </button>
          </div>

          {loading && (
            <div className="text-sm text-[var(--color-text-secondary)]">Chargement des rendez-vous...</div>
          )}
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          {/* Approve Modal */}
          {showApproveModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="card p-6 w-full max-w-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Requetes en attente</h2>
                  <button onClick={() => setShowApproveModal(false)} className="p-1 text-[var(--color-text-muted)]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {pendingRequests.length === 0 && (
                    <div className="text-sm text-[var(--color-text-secondary)]">Aucune requete en attente.</div>
                  )}
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="border border-[var(--color-border)] p-3 rounded-lg">
                      <p className="text-sm text-[var(--color-text-primary)] mb-2">
                        <strong>{formatUserName(req.requester)}</strong> → {formatUserName(req.recipient)}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] mb-2">{formatDate(req.scheduledDatetime)}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            alert(`Requete ${req.id} approuvee`);
                            setShowApproveModal(false);
                          }}
                          className="flex-1 btn-primary text-sm py-1"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => alert(`Requete ${req.id} refusee`)}
                          className="flex-1 btn-secondary text-sm py-1"
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reassign Modal */}
          {showReassignModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="card p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Réassigner un rendez-vous</h2>
                  <button onClick={() => setShowReassignModal(false)} className="p-1 text-[var(--color-text-muted)]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Rendez-vous</label>
                    <select 
                      value={selectedRequest} 
                      onChange={(e) => setSelectedRequest(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">Sélectionner un rendez-vous</option>
                      {appointments.map((appointment) => (
                        <option key={appointment.id} value={appointment.id}>
                          {formatUserName(appointment.requester)} - {formatUserName(appointment.recipient)} - {formatDate(appointment.scheduledDatetime)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Nouvel enseignant</label>
                    <select
                      value={selectedTeacher}
                      onChange={(e) => setSelectedTeacher(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">Sélectionner un enseignant</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {formatUserName(teacher)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      if (!selectedRequest || !selectedTeacher) {
                        alert('Veuillez selectionner un rendez-vous et un enseignant.');
                        return;
                      }
                      alert('Rendez-vous reassigne');
                      setShowReassignModal(false);
                    }}
                    className="w-full btn-primary"
                  >
                    Réassigner
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-[var(--color-primary-navy)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">En attente</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{pendingRequests.length}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Demandes non traitées</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-[var(--color-primary-navy)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Validées</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{confirmedCount}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Ce trimestre</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-[var(--color-primary-navy)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Annulées</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{cancelledCount}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Actions admin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAppointments;
