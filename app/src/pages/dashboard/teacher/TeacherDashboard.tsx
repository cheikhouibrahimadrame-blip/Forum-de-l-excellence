import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useScrollReveal } from '../../../hooks/useScrollReveal';
import { api } from '../../../lib/api';
import { 
  BookOpen,
  Users,
  ClipboardList,
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';

type ScheduleItem = {
  courseId: string;
  courseName: string;
  startTime: string;
  endTime: string;
  dayName: string;
  enrolledStudents?: number;
};

type ClassCard = {
  id: string;
  name: string;
  students: number | null;
  nextClass: string;
  avgGrade: string;
};

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [classCards, setClassCards] = useState<ClassCard[]>([]);
  const [stats, setStats] = useState([
    { label: 'Ma Classe', value: '-', icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Élèves', value: '-', icon: Users, color: 'bg-green-500' },
    { label: 'Cahiers à Corriger', value: '-', icon: ClipboardList, color: 'bg-amber-500' },
    { label: 'Heures/Semaine', value: '-', icon: Clock, color: 'bg-purple-500' }
  ]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: actionsRef, isVisible: actionsVisible } = useScrollReveal();
  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal();
  const { ref: classesRef, isVisible: classesVisible } = useScrollReveal();
  const { ref: tasksRef, isVisible: tasksVisible } = useScrollReveal();
  const { ref: activityRef, isVisible: activityVisible } = useScrollReveal();

  useEffect(() => {
    const scrollTargets: { [key: string]: string } = {
      'teacher-classes': 'teacher-card-classes',
      'teacher-students': 'teacher-card-students',
      'teacher-grades': 'teacher-card-grades',
      'teacher-schedule': 'teacher-card-schedule'
    };

    const targetKey = location.state?.scrollTo;
    if (targetKey && scrollTargets[targetKey]) {
      const element = document.getElementById(scrollTargets[targetKey]);
      if (element) {
        element.scrollIntoView({ behavior: 'auto', block: 'center' });
        element.classList.add('ring-2', 'ring-[var(--color-primary-gold)]', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-[var(--color-primary-gold)]', 'ring-offset-2');
        }, 2000);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.teacher?.id) {
        setLoadingData(false);
        return;
      }

      try {
        setLoadError('');
        setLoadingData(true);
        const response = await api.get(`/api/schedules/teacher/${user.teacher.id}`);
        const result = response.data;
        const teachingSchedule = result?.data?.teachingSchedule || {};

        const dayOrder: Record<string, number> = {
          Lundi: 1,
          Mardi: 2,
          Mercredi: 3,
          Jeudi: 4,
          Vendredi: 5,
          Samedi: 6,
          Dimanche: 7
        };

        const items: ScheduleItem[] = Object.entries(teachingSchedule).flatMap(([dayName, schedules]) => {
          if (!Array.isArray(schedules)) return [];
          return schedules.map((schedule: any) => ({
            courseId: schedule.courseId,
            courseName: schedule.courseName,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            dayName,
            enrolledStudents: schedule.enrolledStudents
          }));
        });

        items.sort((a, b) => {
          const dayDiff = (dayOrder[a.dayName] || 99) - (dayOrder[b.dayName] || 99);
          if (dayDiff !== 0) return dayDiff;
          return a.startTime.localeCompare(b.startTime);
        });

        const classMap = new Map<string, ClassCard>();
        items.forEach((item) => {
          if (!classMap.has(item.courseId)) {
            classMap.set(item.courseId, {
              id: item.courseId,
              name: item.courseName,
              students: typeof item.enrolledStudents === 'number' ? item.enrolledStudents : null,
              nextClass: `${item.dayName} ${item.startTime}`,
              avgGrade: '-'
            });
          }
        });

        const classList = Array.from(classMap.values()).slice(0, 3);
        setClassCards(classList);

        const totalStudents = items.reduce((sum, item) => sum + (item.enrolledStudents || 0), 0);

        const timeToMinutes = (timeValue: string) => {
          const [hours, minutes] = timeValue.split(':').map(Number);
          if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
          return hours * 60 + minutes;
        };

        const totalMinutes = items.reduce((sum, item) => {
          if (!item.startTime || !item.endTime) return sum;
          const start = timeToMinutes(item.startTime);
          const end = timeToMinutes(item.endTime);
          const duration = Math.max(0, end - start);
          return sum + duration;
        }, 0);

        const hoursPerWeek = totalMinutes > 0 ? `${(totalMinutes / 60).toFixed(1)}h` : '-';
        const primaryClassName = classList[0]?.name || 'Aucune classe';
        const studentValue = totalStudents > 0 ? totalStudents.toString() : '-';

        setStats([
          { label: 'Ma Classe', value: primaryClassName, icon: BookOpen, color: 'bg-blue-500' },
          { label: 'Élèves', value: studentValue, icon: Users, color: 'bg-green-500' },
          { label: 'Cahiers à Corriger', value: '-', icon: ClipboardList, color: 'bg-amber-500' },
          { label: 'Heures/Semaine', value: hoursPerWeek, icon: Clock, color: 'bg-purple-500' }
        ]);
      } catch (error) {
        console.error('Error loading teacher dashboard:', error);
        setLoadError('Erreur lors du chargement du tableau de bord.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [user?.teacher?.id]);


  const quickActions = [
    { name: 'Mes Classes', href: '/teacher/classes', icon: BookOpen, color: 'text-blue-600' },
    { name: 'Mes Élèves', href: '/teacher/students', icon: Users, color: 'text-green-600' },
    { name: 'Gestion des Notes', href: '/teacher/grades', icon: ClipboardList, color: 'text-purple-600' },
    { name: 'Mon Emploi du Temps', href: '/teacher/schedule', icon: Calendar, color: 'text-amber-600' }
  ];

  const pendingTasks: Array<{ task: string; deadline: string; urgent: boolean }> = [];

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
      {/* Welcome Header */}
      <div
        ref={headerRef}
        className={`gradient-card rounded-2xl p-8 text-white ${headerVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
      >
        <h1 className="text-3xl font-bold mb-2">
          Bonjour, {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-white/80 text-lg">
          Bienvenue dans votre espace enseignant au Forum de L'excellence
        </p>
      </div>

      {/* Quick Actions */}
      <div ref={actionsRef} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${actionsVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const { ref, isVisible } = useScrollReveal();
          const delayClass = ['', 'animation-delay-100', 'animation-delay-200', 'animation-delay-300'][index] || '';
          let state = undefined;
          if (action.href === '/teacher/classes') state = { scrollTo: 'teacher-classes' };
          else if (action.href === '/teacher/students') state = { scrollTo: 'teacher-students' };
          else if (action.href === '/teacher/grades') state = { scrollTo: 'teacher-grades' };
          else if (action.href === '/teacher/schedule') state = { scrollTo: 'teacher-schedule' };
          let cardId = undefined;
          if (action.href === '/teacher/classes') cardId = 'teacher-card-classes';
          else if (action.href === '/teacher/students') cardId = 'teacher-card-students';
          else if (action.href === '/teacher/grades') cardId = 'teacher-card-grades';
          else if (action.href === '/teacher/schedule') cardId = 'teacher-card-schedule';
          return (
            <div key={index} ref={ref} className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${delayClass}`}>
              <Link
                to={action.href}
                state={state}
                id={cardId}
                className="card p-6 text-center group hover:shadow-lg transition-all duration-300 h-full flex flex-col items-center justify-center"
              >
                <Icon className={`w-8 h-8 mx-auto mb-3 ${action.color} group-hover:scale-110 transition-transform`} />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] whitespace-normal">{action.name}</h3>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Stats Grid */}
      <div ref={statsRef} className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${statsVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const { ref, isVisible } = useScrollReveal();
          const delayClass = ['', 'animation-delay-100', 'animation-delay-200', 'animation-delay-300'][index] || '';
          return (
            <div key={index} ref={ref} className={`card p-6 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${delayClass}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {loadingData && (
        <div className="text-sm text-[var(--color-text-secondary)]">Chargement du tableau de bord...</div>
      )}

      {loadError && (
        <div className="text-sm text-red-600">{loadError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Classes */}
        <div
          ref={classesRef}
          className={`card p-6 ${classesVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Mes Classes
            </h2>
            <Link to="/teacher/classes" state={{ scrollTo: 'teacher-classes' }} className="text-sm text-[var(--color-primary-navy)] hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="space-y-4">
            {classCards.map((classe) => (
              <div key={classe.id} className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-lg">
                <div>
                  <h4 className="font-medium text-[var(--color-text-primary)]">{classe.name}</h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {classe.students ?? '-'} élèves • Prochain cours: {classe.nextClass}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--color-primary-navy)]">{classe.avgGrade}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Moyenne classe</p>
                </div>
              </div>
            ))}
            {classCards.length === 0 && (
              <div className="text-sm text-[var(--color-text-secondary)]">
                Aucun cours planifie.
              </div>
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div
          ref={tasksRef}
          className={`card p-6 ${tasksVisible ? 'animate-slide-in-right' : 'opacity-0'}`}
        >
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
            Tâches en Attente
          </h2>
          <div className="space-y-3">
            {pendingTasks.map((task, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                {task.urgent ? (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-[var(--color-text-muted)] flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm text-[var(--color-text-primary)]">{task.task}</p>
                  <p className={`text-xs ${task.urgent ? 'text-red-500' : 'text-[var(--color-text-muted)]'}`}>
                    {task.deadline}
                  </p>
                </div>
                <button className="text-sm text-[var(--color-primary-navy)] hover:underline">
                  Traiter
                </button>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="text-sm text-[var(--color-text-secondary)]">
                Aucune tache en attente.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div
        ref={activityRef}
        className={`card p-6 ${activityVisible ? 'animate-slide-in-up' : 'opacity-0'}`}
      >
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
          Activité Récente
        </h2>
        <div className="space-y-4">
          <div className="text-sm text-[var(--color-text-secondary)]">
            Aucune activite recente.
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;