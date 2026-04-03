import type React from 'react';
import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Users, BookOpen, Plus, X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';

interface ScheduleItem {
  id: string;
  className: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  classroom: string;
  students: number;
  type: 'lecture' | 'tutorial' | 'lab' | 'exam';
}

const TeacherSchedule: React.FC = () => {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.teacher?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await api.get(`/api/schedules/teacher/${user.teacher.id}`);
        const result = response.data;
        const teachingSchedule = result?.data?.teachingSchedule || {};
        const items: ScheduleItem[] = Object.entries(teachingSchedule).flatMap(([dayName, schedules]) => {
          if (!Array.isArray(schedules)) return [];
          return schedules.map((entry: any) => ({
            id: entry.scheduleId || `${dayName}-${entry.courseId || 'course'}-${entry.startTime || ''}`,
            className: entry.courseName || entry.courseCode || 'Cours',
            subject: entry.courseCode || entry.courseName || 'Cours',
            day: dayName,
            startTime: entry.startTime || '',
            endTime: entry.endTime || '',
            classroom: entry.location || '-',
            students: entry.enrolledStudents || 0,
            type: 'lecture'
          }));
        });

        setSchedule(items);
      } catch (err) {
        console.error('Error loading teacher schedule:', err);
        setError('Erreur lors du chargement de votre emploi du temps.');
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [user?.teacher?.id]);

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tutorial': return 'bg-green-100 text-green-800 border-green-200';
      case 'lab': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'exam': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lecture': return <BookOpen className="w-4 h-4" />;
      case 'tutorial': return <Users className="w-4 h-4" />;
      case 'lab': return <CheckCircle className="w-4 h-4" />;
      case 'exam': return <Calendar className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    return days.map((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return {
        day,
        date: date.getDate(),
        month: date.toLocaleDateString('fr-FR', { month: 'short' })
      };
    });
  };

  const weekDates = getWeekDates();

  const getScheduleForDayAndHour = (day: string, hour: string) => {
    return schedule.filter(item => {
      if (item.day !== day) return false;
      const itemStart = parseInt(item.startTime.split(':')[0]);
      const itemEnd = parseInt(item.endTime.split(':')[0]);
      const checkHour = parseInt(hour.split(':')[0]);
      return checkHour >= itemStart && checkHour < itemEnd;
    });
  };

  const navigateWeek = (direction: number) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  const upcomingClasses = schedule.filter(item => {
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
    const currentHour = new Date().getHours();
    const itemHour = parseInt(item.startTime.split(':')[0]);
    
    const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const todayIndex = dayOrder.indexOf(today);
    const itemIndex = dayOrder.indexOf(item.day.toLowerCase());
    
    return itemIndex > todayIndex || (itemIndex === todayIndex && itemHour > currentHour);
  }).slice(0, 3);

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Mon Emploi du Temps</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigateWeek(-1)}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-medium text-[var(--color-text-primary)] min-w-[200px] text-center">
              Semaine du {weekDates[0].date} {weekDates[0].month}
            </span>
            <button 
              onClick={() => navigateWeek(1)}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-5 h-5" />
            Nouveau Cours
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Weekly Schedule */}
        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
              <div className="p-4 border-r border-[var(--color-border)]">
                <div className="text-sm text-[var(--color-text-muted)]">Heure</div>
              </div>
              {weekDates.map((day, index) => (
                <div key={index} className="p-4 border-r border-[var(--color-border)] text-center">
                  <div className="text-sm font-medium text-[var(--color-text-primary)]">{day.day}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{day.date} {day.month}</div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {hours.map((hour, hourIndex) => (
                  <div key={hourIndex} className="grid grid-cols-7 border-b border-[var(--color-border)]">
                    <div className="p-4 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                      <div className="text-sm text-[var(--color-text-secondary)]">{hour}</div>
                    </div>
                    {days.map((day, dayIndex) => {
                      const items = getScheduleForDayAndHour(day, hour);
                      return (
                        <div key={dayIndex} className="p-2 border-r border-[var(--color-border)] min-h-[80px]">
                          {items.map((item, itemIndex) => (
                            <div 
                              key={itemIndex}
                              className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${getTypeColor(item.type)}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {getTypeIcon(item.type)}
                                <span className="font-medium text-sm truncate">{item.className}</span>
                              </div>
                              <p className="text-sm font-medium mb-1">{item.subject}</p>
                              <div className="flex items-center gap-1 text-xs opacity-75">
                                <Clock className="w-3 h-3" />
                                <span>{item.startTime} - {item.endTime}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs opacity-75">
                                <MapPin className="w-3 h-3" />
                                <span>{item.classroom}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Today's Schedule */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--color-primary-navy)]" />
              Aujourd\'hui
            </h3>
            <div className="space-y-3">
              {schedule.filter(item => item.day.toLowerCase() === new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase()).length > 0 ? (
                schedule
                  .filter(item => item.day.toLowerCase() === new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase())
                  .map((item, index) => (
                    <div key={index} className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-[var(--color-primary-navy)]" />
                        <span className="font-medium text-sm">{item.startTime} - {item.endTime}</span>
                      </div>
                      <p className="font-medium text-[var(--color-text-primary)]">{item.className}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">{item.subject}</p>
                      <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{item.classroom}</span>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-[var(--color-text-secondary)] text-sm">Aucun cours aujourd\'hui</p>
              )}
            </div>
          </div>

          {/* Upcoming Classes */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--color-primary-navy)]" />
              Prochains Cours
            </h3>
            <div className="space-y-3">
              {upcomingClasses.map((item, index) => (
                <div key={index} className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.day}</span>
                    <span className="text-sm text-[var(--color-text-secondary)]">{item.startTime}</span>
                  </div>
                  <p className="font-medium text-[var(--color-text-primary)]">{item.className}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{item.subject}</p>
                </div>
              ))}
              {upcomingClasses.length === 0 && (
                <p className="text-[var(--color-text-secondary)] text-sm">Aucun cours a venir</p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              Statistiques
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-secondary)]">Heures/semaine</span>
                <span className="font-medium text-[var(--color-text-primary)]">
                  {schedule.reduce((sum, item) => {
                    const start = parseInt(item.startTime.split(':')[0]) || 0;
                    const end = parseInt(item.endTime.split(':')[0]) || 0;
                    return sum + Math.max(end - start, 0);
                  }, 0)}h
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-secondary)]">Cours actifs</span>
                <span className="font-medium text-[var(--color-text-primary)]">{schedule.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-secondary)]">Élèves total</span>
                <span className="font-medium text-[var(--color-text-primary)]">{schedule.reduce((sum, item) => sum + item.students, 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-[var(--color-text-secondary)]">Chargement de l'emploi du temps...</div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Ajouter un Cours
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
                  Classe
                </label>
                <input type="text" className="input-field w-full" placeholder="Nom de la classe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Matière
                </label>
                <input type="text" className="input-field w-full" placeholder="Nom de la matière" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Jour
                  </label>
                  <select className="input-field w-full">
                    {days.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Type
                  </label>
                  <select className="input-field w-full">
                    <option value="lecture">Cours magistral</option>
                    <option value="tutorial">Travaux dirigés</option>
                    <option value="lab">Travaux pratiques</option>
                    <option value="exam">Examen</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Heure de début
                  </label>
                  <input type="time" className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Heure de fin
                  </label>
                  <input type="time" className="input-field w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Salle
                </label>
                <input type="text" className="input-field w-full" placeholder="Numéro de salle" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                className="btn-primary flex-1"
                onClick={() => setShowAddModal(false)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
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

export default TeacherSchedule;
