import type React from 'react';
import { useState } from 'react';
import { Calendar, Clock, User, MessageSquare, Plus, X, CheckCircle, AlertCircle, Users, Phone, Video, MapPin, Baby } from 'lucide-react';

interface Appointment {
  id: number;
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

const ParentAppointments: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const appointments: Appointment[] = [
    {
      id: 1,
      childName: 'Moussa Diallo',
      teacher: 'M. Ndiaye',
      subject: 'Suivi de lecture (CP)',
      date: '2024-01-25',
      time: '15:00',
      duration: '30 min',
      type: 'in-person',
      status: 'scheduled',
      notes: 'Pr�parer les questions sur la lecture � la maison'
    },
    {
      id: 2,
      childName: 'Fatou Diallo',
      teacher: 'Mme Sow',
      subject: 'Progression en math�matiques (CE1)',
      date: '2024-01-22',
      time: '14:00',
      duration: '45 min',
      type: 'phone',
      status: 'completed',
      notes: 'Tr�s bon entretien, progr�s r�guliers'
    },
    {
      id: 3,
      childName: 'Moussa Diallo',
      teacher: 'M. Diallo',
      subject: 'Comportement et concentration (CM1)',
      date: '2024-01-18',
      time: '16:00',
      duration: '20 min',
      type: 'video',
      status: 'completed',
      notes: 'Am�lioration observ�e cette semaine'
    },
    {
      id: 4,
      childName: 'Fatou Diallo',
      teacher: 'Mme Ba',
      subject: 'Rendez-vous de suivi',
      date: '2024-01-30',
      time: '10:00',
      duration: '30 min',
      type: 'in-person',
      status: 'pending',
      notes: ''
    }
  ];

  const children = ['all', 'Moussa Diallo', 'Fatou Diallo'];
  const statuses = ['all', 'scheduled', 'completed', 'cancelled', 'pending'];

  const filteredAppointments = appointments.filter(appointment => {
    const matchesChild = selectedChild === 'all' || appointment.childName === selectedChild;
    const matchesStatus = selectedStatus === 'all' || appointment.status === selectedStatus;
    return matchesChild && matchesStatus;
  });

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

  const handleScheduleAppointment = () => {
    setShowAddModal(false);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programm�';
      case 'completed': return 'Termin�';
      case 'cancelled': return 'Annul�';
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
      case 'in-person': return 'Pr�sentiel';
      case 'phone': return 'T�l�phone';
      case 'video': return 'Vid�o';
      default: return type;
    }
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Rendez-vous</h1>
            <div className="flex gap-4">
              <div className="relative">
                <Baby className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                <select
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="input-field pl-10 appearance-none pr-10"
                >
                  {children.map(child => (
                    <option key={child} value={child}>
                      {child === 'all' ? 'Tous les enfants' : child}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field appearance-none pr-10"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'Tous les statuts' : getStatusText(status)}
                  </option>
                ))}
              </select>
              <button 
                className="btn-primary flex items-center gap-2"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-5 h-5" />
                Nouveau RDV
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Total RDV</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">{appointments.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Programm�s</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                    {appointments.filter(a => a.status === 'scheduled').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Termin�s</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                    {appointments.filter(a => a.status === 'completed').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">En attente</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                    {appointments.filter(a => a.status === 'pending').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Liste des Rendez-vous ({filteredAppointments.length})
              </h2>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="p-6 hover:bg-[var(--color-bg-secondary)] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                          {appointment.subject}
                        </h3>
                        <span className={`badge ${getStatusColor(appointment.status)} flex items-center gap-1`}>
                          {getStatusIcon(appointment.status)}
                          {getStatusText(appointment.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Baby className="w-4 h-4 text-[var(--color-text-muted)]" />
                          <span className="text-[var(--color-text-secondary)]">{appointment.childName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[var(--color-text-muted)]" />
                          <span className="text-[var(--color-text-secondary)]">{appointment.teacher}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                          <span className="text-[var(--color-text-secondary)]">
                            {new Date(appointment.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
                          <span className="text-[var(--color-text-secondary)]">{appointment.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(appointment.type)}
                          <span className="text-[var(--color-text-secondary)]">{getTypeText(appointment.type)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
                          <span className="text-[var(--color-text-secondary)]">{appointment.duration}</span>
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="mt-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            <span className="font-medium">Notes:</span> {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {appointment.status === 'scheduled' && (
                        <button className="p-2 text-[var(--color-text-secondary)] hover:text-green-600 transition-colors">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-navy)] transition-colors">
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Appointment Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="card p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    Nouveau Rendez-vous
                  </h3>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Enfant
                    </label>
                    <select className="input-field w-full">
                      <option>S�lectionner un enfant</option>
                      {children.slice(1).map(child => <option key={child} value={child}>{child}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Enseignant
                    </label>
                    <select className="input-field w-full">
                      <option>S�lectionner un enseignant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Sujet
                    </label>
                    <input type="text" className="input-field w-full" placeholder="Objet du rendez-vous" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Date
                      </label>
                      <input type="date" className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Heure
                      </label>
                      <input type="time" className="input-field w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Type de rendez-vous
                    </label>
                    <select className="input-field w-full">
                      <option value="in-person">Pr�sentiel</option>
                      <option value="phone">T�l�phone</option>
                      <option value="video">Vid�oconf�rence</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={handleScheduleAppointment}
                    className="btn-primary flex-1 hover:opacity-90 transition-opacity">
                    <Calendar className="w-4 h-4 mr-2" />
                    Planifier
                  </button>
                  <button 
                    className="btn-secondary flex-1"
                    onClick={() => setShowAddModal(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
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
