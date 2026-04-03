import type React from 'react';
import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, BookOpen } from 'lucide-react';
import { useScrollReveal } from '../../../hooks/useScrollReveal';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';

type ScheduleEntry = {
  time: string;
  course: string;
  teacher: string;
  room: string;
};

const StudentSchedule: React.FC = () => {
  const { user } = useAuth();
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: weekRef, isVisible: weekVisible } = useScrollReveal();
  const { ref: todayRef, isVisible: todayVisible } = useScrollReveal();
  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal();
  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const [schedule, setSchedule] = useState<Record<string, ScheduleEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendanceStats, setAttendanceStats] = useState({ presence: '-', late: '-', absences: '-' });
  const todayKey = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.student?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await api.get(`/api/schedules/student/${user.student.id}`);
        const result = response.data;
        const weeklySchedule = result?.data?.weeklySchedule || {};
        const mapped: Record<string, ScheduleEntry[]> = {};

        Object.entries(weeklySchedule).forEach(([dayName, entries]) => {
          if (!Array.isArray(entries)) return;
          mapped[dayName.toLowerCase()] = entries.map((entry: any) => ({
            time: entry.startTime && entry.endTime ? `${entry.startTime} - ${entry.endTime}` : '',
            course: entry.courseName || 'Cours',
            teacher: entry.teacher || '-',
            room: entry.location || '-'
          }));
        });

        setSchedule(mapped);
      } catch (err) {
        console.error('Error loading student schedule:', err);
        setError("Erreur lors du chargement de l'emploi du temps.");
        setSchedule({});
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [user?.student?.id]);

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
      <div
        ref={headerRef}
        className={`flex items-center justify-between ${headerVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
      >
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Mon Emploi du Temps</h1>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Calendar className="w-4 h-4" />
          Semaine du {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>

      {/* Weekly Schedule */}
      <div
        ref={weekRef}
        className={`card overflow-hidden ${weekVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
      >
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-6 divide-x divide-[var(--color-border)]">
              {weekDays.map((day) => (
                <div key={day} className="p-4">
                  <h3 className="font-semibold text-[var(--color-text-primary)] text-center mb-4">
                    {day}
                  </h3>
                  <div className="space-y-3">
                    {schedule[day.toLowerCase() as keyof typeof schedule]?.map((item, index) => (
                      <div key={index} className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                        <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] mb-1">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </div>
                        <h4 className="font-medium text-[var(--color-text-primary)] text-sm">
                          {item.course}
                        </h4>
                        <p className="text-xs text-[var(--color-text-muted)]">{item.teacher}</p>
                        <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] mt-1">
                          <MapPin className="w-3 h-3" />
                          {item.room}
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-sm text-[var(--color-text-muted)] p-4">
                        Pas de cours
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div
          ref={todayRef}
          className={`card p-6 ${todayVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
        >
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--color-primary-navy)]" />
            Aujourd'hui
          </h2>
          <div className="space-y-4">
            {(schedule[todayKey] || []).map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-navy)] flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-[var(--color-primary-gold)]" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-[var(--color-text-primary)]">{item.course}</h4>
                    <span className="text-sm font-medium text-[var(--color-primary-navy)]">{item.time}</span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">{item.teacher}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">{item.room}</p>
                </div>
              </div>
            ))}
            {(schedule[todayKey] || []).length === 0 && (
              <div className="text-sm text-[var(--color-text-muted)]">Aucun cours aujourd'hui</div>
            )}
          </div>
        </div>

        <div
          ref={statsRef}
          className={`card p-6 ${statsVisible ? 'animate-slide-in-right' : 'opacity-0'}`}
        >
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
            Statistiques de Présence
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--color-text-secondary)]">Présence</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{attendanceStats.presence}</span>
              </div>
              <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--color-text-secondary)]">Retards</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{attendanceStats.late}</span>
              </div>
              <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--color-text-secondary)]">Absences</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{attendanceStats.absences}</span>
              </div>
              <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '0%' }}></div>
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
        </div>
      </div>
    </div>
  );
};

export default StudentSchedule;