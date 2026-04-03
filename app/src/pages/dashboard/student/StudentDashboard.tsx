import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useScrollReveal } from '../../../hooks/useScrollReveal';
import { api } from '../../../lib/api';
import { 
  Award,
  Calendar,
  MessageSquare,
  FileText,
  TrendingUp,
  Clock,
  BookOpen,
  CheckCircle
} from 'lucide-react';

type GradeItem = {
  course: string;
  grade: string;
  date: string;
  type: string;
};

type EventItem = {
  title: string;
  date: string;
  time: string;
};

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState([
    { label: 'Moyenne Générale', value: '-', icon: Award, color: 'bg-blue-500' },
    { label: 'Absences', value: '-', icon: Clock, color: 'bg-amber-500' },
    { label: 'Devoirs Rendus', value: '-', icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Bon Comportement', value: '-', icon: BookOpen, color: 'bg-purple-500' }
  ]);
  const [recentGrades, setRecentGrades] = useState<GradeItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [progress, setProgress] = useState({ semester: '-', attendance: '-', mention: '-' });
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: actionsRef, isVisible: actionsVisible } = useScrollReveal();
  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal();
  const { ref: gradesRef, isVisible: gradesVisible } = useScrollReveal();
  const { ref: eventsRef, isVisible: eventsVisible } = useScrollReveal();
  const { ref: progressRef, isVisible: progressVisible } = useScrollReveal();

  useEffect(() => {
    const scrollTargets: { [key: string]: string } = {
      'student-grades': 'student-card-grades',
      'student-schedule': 'student-card-schedule',
      'student-lessons': 'student-card-lessons',
      'student-subjects': 'student-card-subjects',
      'student-appointments': 'student-card-appointments',
      'student-report-cards': 'student-card-report-cards'
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
      if (!user?.student?.id) {
        setLoadingData(false);
        return;
      }

      try {
        setLoadError('');
        setLoadingData(true);

        const [gradesRes, scheduleRes] = await Promise.all([
          api.get(`/api/grades/student/${user.student.id}`),
          api.get(`/api/schedules/student/${user.student.id}`)
        ]);

        let overallPercentage: number | null = null;
        let currentGPA: number | null = null;
        let assignmentsCount = 0;

        if (gradesRes.ok) {
          const gradesResult = await gradesRes.json();
          overallPercentage = typeof gradesResult?.data?.overallPercentage === 'number'
            ? gradesResult.data.overallPercentage
            : null;
          currentGPA = typeof gradesResult?.data?.currentGPA === 'number'
            ? gradesResult.data.currentGPA
            : null;

          const courses = Array.isArray(gradesResult?.data?.courses) ? gradesResult.data.courses : [];
          const allAssignments = courses.flatMap((course: any) => {
            const assignments = Array.isArray(course.assignments) ? course.assignments : [];
            return assignments.map((assignment: any) => {
              const pointsEarned = assignment.pointsEarned?.toString?.() ?? assignment.pointsEarned;
              const pointsPossible = assignment.pointsPossible?.toString?.() ?? assignment.pointsPossible;
              return {
                course: course.courseName || 'Cours',
                grade: pointsEarned && pointsPossible ? `${pointsEarned}/${pointsPossible}` : '-',
                date: assignment.gradeDate || assignment.createdAt || '',
                type: assignment.assignmentType || 'Devoir'
              } as GradeItem;
            });
          });

          allAssignments.sort((a: GradeItem, b: GradeItem) => b.date.localeCompare(a.date));
          assignmentsCount = allAssignments.length;
          setRecentGrades(allAssignments.slice(0, 4));
        } else {
          setRecentGrades([]);
        }

        if (scheduleRes.ok) {
          const scheduleResult = await scheduleRes.json();
          const weeklySchedule = scheduleResult?.data?.weeklySchedule || {};
          const events = Object.entries(weeklySchedule).flatMap(([dayName, schedules]) => {
            if (!Array.isArray(schedules)) return [];
            return schedules.map((schedule: any) => ({
              title: schedule.courseName || 'Cours',
              date: dayName,
              time: schedule.startTime || ''
            }));
          });
          setUpcomingEvents(events.slice(0, 3));
          const semesterLabel = scheduleResult?.data?.semester || '-';
          setProgress((prev) => ({ ...prev, semester: semesterLabel }));
        } else {
          setUpcomingEvents([]);
        }

        const averageValue = overallPercentage !== null
          ? `${overallPercentage}%`
          : currentGPA !== null
            ? currentGPA.toString()
            : '-';

        const mention = overallPercentage !== null
          ? overallPercentage >= 90
            ? 'A'
            : overallPercentage >= 80
              ? 'B'
              : overallPercentage >= 70
                ? 'C'
                : overallPercentage >= 60
                  ? 'D'
                  : 'E'
          : '-';

        setProgress((prev) => ({
          ...prev,
          mention,
          attendance: '-'
        }));

        setStats([
          { label: 'Moyenne Générale', value: averageValue, icon: Award, color: 'bg-blue-500' },
          { label: 'Absences', value: '-', icon: Clock, color: 'bg-amber-500' },
          { label: 'Devoirs Rendus', value: assignmentsCount ? assignmentsCount.toString() : '-', icon: CheckCircle, color: 'bg-green-500' },
          { label: 'Bon Comportement', value: '-', icon: BookOpen, color: 'bg-purple-500' }
        ]);
      } catch (error) {
        console.error('Error loading student dashboard:', error);
        setLoadError('Erreur lors du chargement du tableau de bord.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [user?.student?.id]);

  const quickActions = [
    { name: 'Mes Notes', href: '/student/grades', icon: Award, color: 'text-blue-600' },
    { name: 'Mon Emploi du Temps', href: '/student/schedule', icon: Calendar, color: 'text-green-600' },
    { name: 'Mes Leçons', href: '/student/lessons', icon: BookOpen, color: 'text-purple-600' },
    { name: 'Mes Matières', href: '/student/subjects', icon: TrendingUp, color: 'text-orange-600' },
    { name: 'Mes Rendez-vous', href: '/student/appointments', icon: MessageSquare, color: 'text-indigo-600' },
    { name: 'Bulletins', href: '/student/report-cards', icon: FileText, color: 'text-red-600' }
  ];

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
          Bonjour {user?.firstName} ! <span className="wave">👋</span>
        </h1>
        <p className="text-white/80 text-lg">
          Bienvenue dans ton espace élève au Forum de L'excellence
        </p>
      </div>

      {/* Quick Actions */}
      <div ref={actionsRef} className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 ${actionsVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const { ref, isVisible } = useScrollReveal();
          const delayClass = ['', 'animation-delay-100', 'animation-delay-200', 'animation-delay-300', 'animation-delay-400', 'animation-delay-500'][index] || '';
          let state = undefined;
          let cardId = undefined;
          if (action.href === '/student/grades') state = { scrollTo: 'student-grades' };
          else if (action.href === '/student/schedule') state = { scrollTo: 'student-schedule' };
          else if (action.href === '/student/lessons') state = { scrollTo: 'student-lessons' };
          else if (action.href === '/student/subjects') state = { scrollTo: 'student-subjects' };
          else if (action.href === '/student/appointments') state = { scrollTo: 'student-appointments' };
          else if (action.href === '/student/report-cards') state = { scrollTo: 'student-report-cards' };
          if (action.href === '/student/grades') cardId = 'student-card-grades';
          else if (action.href === '/student/schedule') cardId = 'student-card-schedule';
          else if (action.href === '/student/lessons') cardId = 'student-card-lessons';
          else if (action.href === '/student/subjects') cardId = 'student-card-subjects';
          else if (action.href === '/student/appointments') cardId = 'student-card-appointments';
          else if (action.href === '/student/report-cards') cardId = 'student-card-report-cards';
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
        {/* Recent Grades */}
        <div
          ref={gradesRef}
          className={`card p-6 ${gradesVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Dernières Notes
            </h2>
            <Link to="/student/grades" state={{ scrollTo: 'student-grades' }} className="text-sm text-[var(--color-primary-navy)] hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="space-y-4">
            {recentGrades.map((grade, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                <div>
                  <h4 className="font-medium text-[var(--color-text-primary)]">{grade.course}</h4>
                  <p className="text-sm text-[var(--color-text-muted)]">{grade.type} - {grade.date}</p>
                </div>
                <span className="text-lg font-bold text-[var(--color-primary-navy)]">{grade.grade}</span>
              </div>
            ))}
            {recentGrades.length === 0 && (
              <div className="text-sm text-[var(--color-text-secondary)]">
                Aucune note recente.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div
          ref={eventsRef}
          className={`card p-6 ${eventsVisible ? 'animate-slide-in-right' : 'opacity-0'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Prochaines Échéances
            </h2>
            <Link to="/student/schedule" state={{ scrollTo: 'student-schedule' }} className="text-sm text-[var(--color-primary-navy)] hover:underline">
              Voir l'emploi du temps
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-gold-light)] flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-[var(--color-primary-navy)]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-[var(--color-text-primary)]">{event.title}</h4>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {event.date} à {event.time}
                  </p>
                </div>
              </div>
            ))}
            {upcomingEvents.length === 0 && (
              <div className="text-sm text-[var(--color-text-secondary)]">
                Aucun evenement planifie.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Academic Progress */}
      <div
        ref={progressRef}
        className={`card p-6 ${progressVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
      >
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
          Progression Académique
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`text-center p-6 bg-[var(--color-bg-secondary)] rounded-lg ${progressVisible ? 'animation-delay-100 animate-fade-in-up' : 'opacity-0'}`}>
            <div className="text-3xl font-bold text-[var(--color-primary-navy)] mb-2">{progress.semester}</div>
            <p className="text-sm text-[var(--color-text-secondary)]">Semestre</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">En cours</p>
          </div>
          <div className={`text-center p-6 bg-[var(--color-bg-secondary)] rounded-lg ${progressVisible ? 'animation-delay-200 animate-fade-in-up' : 'opacity-0'}`}>
            <div className="text-3xl font-bold text-green-600 mb-2">{progress.attendance}</div>
            <p className="text-sm text-[var(--color-text-secondary)]">Assiduité</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Excellente</p>
          </div>
          <div className={`text-center p-6 bg-[var(--color-bg-secondary)] rounded-lg ${progressVisible ? 'animation-delay-300 animate-fade-in-up' : 'opacity-0'}`}>
            <div className="text-3xl font-bold text-[var(--color-success)] mb-2">{progress.mention}</div>
            <p className="text-sm text-[var(--color-text-secondary)]">Mention</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Très Bien</p>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;