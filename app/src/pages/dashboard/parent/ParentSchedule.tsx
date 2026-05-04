import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, BookOpen, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';

interface ScheduleItem {
  id: string;
  childName: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  classroom: string;
  teacher: string;
}

interface LinkedStudent {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

const ParentSchedule: React.FC = () => {
  const navigate = useNavigate();
  const [selectedChild, setSelectedChild] = useState('all');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError('');

        const studentsRes = await api.get(API.PARENT_STUDENTS_MY);
        const studentsData = studentsRes.data;
        const students = Array.isArray(studentsData?.data?.students) ? studentsData.data.students : [];
        setLinkedStudents(students);

        const scheduleItems: ScheduleItem[] = [];

        for (const student of students) {
          let scheduleData: any = null;
          try {
            const scheduleRes = await api.get(API.SCHEDULES_STUDENT(student.id));
            scheduleData = scheduleRes.data;
          } catch (error) {
            continue;
          }
          const weeklySchedule = scheduleData?.data?.weeklySchedule || {};

          Object.entries(weeklySchedule).forEach(([dayName, entries]) => {
            if (!Array.isArray(entries)) return;
            entries.forEach((entry: any) => {
              scheduleItems.push({
                id: entry.scheduleId || `${student.id}-${dayName}-${entry.startTime || ''}`,
                childName: `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.trim() || 'Eleve',
                subject: entry.courseName || 'Cours',
                day: dayName,
                startTime: entry.startTime || '',
                endTime: entry.endTime || '',
                classroom: entry.location || '-',
                teacher: entry.teacher || '-'
              });
            });
          });
        }

        setSchedule(scheduleItems);
      } catch (err) {
        console.error('Error loading parent schedule:', err);
        setError("Erreur lors du chargement de l'emploi du temps.");
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const children = ['all', ...linkedStudents.map(student => `${student.user.firstName} ${student.user.lastName}`)];
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  const filteredSchedule = schedule.filter(item => 
    selectedChild === 'all' || item.childName === selectedChild
  );

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
    return filteredSchedule.filter(item => {
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

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/parent')}
            className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Emploi du Temps</h1>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
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
        </div>
      </div>

      {/* Weekly Schedule Grid */}
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
                          className="p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all bg-blue-50 text-blue-800 border-blue-200"
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <User className="w-3 h-3" />
                            <span className="font-medium text-xs truncate">{item.childName}</span>
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
                          <div className="flex items-center gap-1 text-xs opacity-75">
                            <User className="w-3 h-3" />
                            <span>{item.teacher}</span>
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

      {/* Today's Schedule Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--color-primary-navy)]" />
            Aujourd\'hui
          </h3>
          <div className="space-y-3">
            {filteredSchedule.filter(item => item.day.toLowerCase() === new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase()).length > 0 ? (
              filteredSchedule
                .filter(item => item.day.toLowerCase() === new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase())
                .map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[var(--color-primary-navy)]" />
                        <span className="font-medium text-[var(--color-text-primary)]">{item.childName}</span>
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)]">{item.subject}</p>
                      <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                        <Clock className="w-3 h-3" />
                        <span>{item.startTime} - {item.endTime}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[var(--color-text-secondary)]">{item.classroom}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{item.teacher}</p>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-[var(--color-text-secondary)] text-sm">Aucun cours aujourd\'hui</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--color-primary-navy)]" />
            Résumé Hebdomadaire
          </h3>
          <div className="space-y-4">
            {children.slice(1).map((childName, index) => {
              const childSchedule = filteredSchedule.filter(item => item.childName === childName);
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[var(--color-primary-navy)]" />
                    <span className="font-medium text-[var(--color-text-primary)]">{childName}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--color-text-secondary)]">{childSchedule.length} cours</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {childSchedule.reduce((sum, item) => sum + (parseInt(item.endTime.split(':')[0]) - parseInt(item.startTime.split(':')[0])), 0)}h/semaine
                    </p>
                  </div>
                </div>
              );
            })}
            {children.length === 1 && (
              <p className="text-[var(--color-text-secondary)] text-sm">Aucun enfant associe.</p>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-[var(--color-text-secondary)]">Chargement de l'emploi du temps...</div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
        </div>
      </div>
    </div>
  );
};

export default ParentSchedule;
