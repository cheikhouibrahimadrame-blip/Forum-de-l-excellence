import type React from 'react';
import { useMemo, useState } from 'react';
import { Calendar, Clock, User, MessageSquare, Plus, X, CheckCircle } from 'lucide-react';
import { useScrollReveal } from '../../../hooks/useScrollReveal';

type Appointment = {
  id: number;
  title: string;
  person: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending';
  location: string;
  notes?: string;
};

type Teacher = {
  id: number;
  name: string;
  role: string;
};

type AppointmentCardProps = {
  appointment: Appointment;
  animationRef: React.Ref<HTMLDivElement>;
  isVisible: boolean;
  delayClass: string;
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  animationRef,
  isVisible,
  delayClass,
}) => {
  const statusClass =
    appointment.status === 'confirmed'
      ? 'bg-green-100 text-green-800'
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
            {appointment.status === 'confirmed' ? 'Confirmé' : 'En attente'}
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
        {appointment.notes && (
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{appointment.notes}</p>
        )}
        <div className="flex gap-2 mt-4">
          {appointment.status === 'pending' && (
            <button className="text-sm btn-secondary px-4 py-2">Confirmer</button>
          )}
          <button className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
            <X className="w-4 h-4" />
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

type NewAppointmentModalProps = {
  teachers: Teacher[];
  onClose: () => void;
  modalRef: React.Ref<HTMLDivElement>;
  modalVisible: boolean;
};

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  teachers,
  onClose,
  modalRef,
  modalVisible,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div
      ref={modalRef}
      className={`bg-[var(--color-bg-card)] rounded-xl p-6 max-w-md w-full ${
        modalVisible ? 'animate-fade-in-up' : 'opacity-0'
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Nouveau Rendez-vous
        </h3>
        <button
          onClick={onClose}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            Type de rendez-vous
          </label>
          <select className="input-field">
            <option value="">Sélectionnez un type</option>
            <option value="academic">Conseil académique</option>
            <option value="support">Soutien pédagogique</option>
            <option value="orientation">Orientation</option>
            <option value="administrative">Administratif</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            Avec qui ?
          </label>
          <select className="input-field">
            <option value="">Sélectionnez une personne</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Date
            </label>
            <input type="date" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Heure
            </label>
            <input type="time" className="input-field" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            Notes (optionnel)
          </label>
          <textarea
            className="input-field min-h-[100px]"
            placeholder="Décrivez le motif du rendez-vous..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="flex-1 btn-secondary py-2">
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 btn-primary py-2 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Demander
          </button>
        </div>
      </form>
    </div>
  </div>
);

const StudentAppointments: React.FC = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: listRef, isVisible: listVisible } = useScrollReveal();
  const { ref: modalRef, isVisible: modalVisible } = useScrollReveal();
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  
  const appointments: Appointment[] = [
    {
      id: 1,
      title: 'Rencontre avec M. Fall',
      person: 'M. Fall - Directeur',
      date: '2024-01-26',
      time: '15h00',
      status: 'confirmed',
      location: 'Bureau de la Direction',
      notes: 'Discussion sur mes objectifs académiques'
    },
    {
      id: 2,
      title: 'Soutien Mathématiques',
      person: 'M. Diallo - Professeur',
      date: '2024-01-30',
      time: '14h00',
      status: 'pending',
      location: 'Salle des Professeurs',
      notes: 'Aide pour le chapitre sur les dérivées'
    },
    {
      id: 3,
      title: 'Orientation Université',
      person: 'Mme Ndiaye - Conseillère',
      date: '2024-02-05',
      time: '10h00',
      status: 'confirmed',
      location: 'Bureau d\'Orientation',
      notes: 'Discussion sur les choix d\'études supérieures'
    }
  ];

  const appointmentAnimations = appointments.map(() => useScrollReveal());

  const teachers: Teacher[] = [
    { id: 1, name: 'M. Fall - Directeur', role: 'Directeur' },
    { id: 2, name: 'M. Diallo - Mathématiques', role: 'Professeur' },
    { id: 3, name: 'Mme Ndiaye - Conseillère', role: 'Conseillère' },
    { id: 4, name: 'Mme Sow - Physique', role: 'Professeur' }
  ];

  const appointmentDelays = useMemo(
    () => ['animation-delay-0', 'animation-delay-100', 'animation-delay-200'],
    [],
  );

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
          <div
            ref={headerRef}
            className={`flex items-center justify-between ${
              headerVisible ? 'animate-slide-in-left' : 'opacity-0'
            }`}
          >
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
              Mes Rendez-vous
            </h1>
            <button
              onClick={() => setShowNewAppointment(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nouveau Rendez-vous
            </button>
          </div>

          {/* Upcoming Appointments */}
          <div
            ref={listRef}
            className={`card p-6 ${listVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
          >
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
              Rendez-vous à Venir
            </h2>
            <div className="space-y-4">
              {appointments.map((appointment, index) => {
                const { ref, isVisible } = appointmentAnimations[index];
                const delayClass = appointmentDelays[index] || '';

                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    animationRef={ref}
                    isVisible={isVisible}
                    delayClass={delayClass}
                  />
                );
              })}
            </div>
          </div>

          {/* New Appointment Modal */}
          {showNewAppointment && (
            <NewAppointmentModal
              teachers={teachers}
              onClose={() => setShowNewAppointment(false)}
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