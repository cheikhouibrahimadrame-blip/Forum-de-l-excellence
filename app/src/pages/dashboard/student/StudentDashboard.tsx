import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';
import { useLiveRefresh } from '../../../hooks/useLiveRefresh';
import { 
  Award,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Clock,
  BookOpen,
  CheckCircle,
  Users,
  GraduationCap,
  MoreHorizontal,
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
  const { branding } = useBranding();
  const location = useLocation();
  const refreshTick = useLiveRefresh(15000);
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
          api.get(API.GRADES_BY_STUDENT(user.student.id)),
          api.get(API.SCHEDULES_STUDENT(user.student.id))
        ]);

        let overallPercentage: number | null = null;
        let currentGPA: number | null = null;
        let assignmentsCount = 0;

        const gradesResult = gradesRes.data;
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

        const scheduleResult = scheduleRes.data;
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
  }, [user?.student?.id, refreshTick]);

  const quickActions = [
    { name: 'Mes Notes', href: '/student/grades', icon: Award },
    { name: 'Mon Emploi du Temps', href: '/student/schedule', icon: Calendar },
    { name: 'Mes Leçons', href: '/student/lessons', icon: BookOpen },
    { name: 'Mes Matières', href: '/student/subjects', icon: TrendingUp },
  ];

  const growthValue = 62;
  const successValue = 52;

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-6 py-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
              <div className="oak-stat-card" style={{ background: 'linear-gradient(145deg, #cedfb4 0%, #aac240 100%)' }}>
                <div>
                  <div className="text-sm text-[#2f3615]">Moyenne Générale</div>
                  <div className="text-3xl font-extrabold text-[#171b11]">{stats[0]?.value}</div>
                </div>
                <Award className="w-5 h-5 text-[#2a3313]" />
              </div>
              <div className="oak-stat-card" style={{ background: 'linear-gradient(145deg, #f4f8b8 0%, #e7ef96 100%)' }}>
                <div>
                  <div className="text-sm text-[#2f3615]">Devoirs</div>
                  <div className="text-3xl font-extrabold text-[#171b11]">{stats[2]?.value}</div>
                </div>
                <GraduationCap className="w-5 h-5 text-[#2a3313]" />
              </div>
              <div className="oak-stat-card" style={{ background: 'linear-gradient(145deg, #d8e2ce 0%, #bccdb6 100%)' }}>
                <div>
                  <div className="text-sm text-[#2f3615]">Assiduité</div>
                  <div className="text-3xl font-extrabold text-[#171b11]">{progress.attendance}</div>
                </div>
                <Users className="w-5 h-5 text-[#2a3313]" />
              </div>
            </div>

            <div className="oak-hero-banner w-full lg:w-[38%]">
              <img src={branding.brand.heroBannerUrl} alt={branding.brand.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="text-sm/5 opacity-90">Bonjour {user?.firstName}</div>
                <div className="text-xl font-bold">Ton espace FORUM-EXCELLENCE</div>
              </div>
            </div>
          </div>

          {(loadingData || loadError) && (
            <div className="card p-4 text-sm text-[var(--color-text-secondary)]">
              {loadingData ? 'Chargement du tableau de bord...' : loadError}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="card xl:col-span-3 p-5">
              <div className="text-sm text-[var(--color-text-muted)] mb-3">Academy growth</div>
              <div className="oak-growth-ring relative">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#e3ead5" strokeWidth="12" />
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(2 * Math.PI * 46 * growthValue) / 100} ${2 * Math.PI * 46}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold">{growthValue}%</div>
              </div>
            </div>

            <div className="card xl:col-span-5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Dernières Notes</h3>
                <Link to="/student/grades" state={{ scrollTo: 'student-grades' }} className="text-sm text-[var(--color-primary)]">
                  Voir tout
                </Link>
              </div>
              <div className="space-y-2">
                {recentGrades.map((grade) => (
                  <div key={`${grade.course}-${grade.date}`} className="oak-event-item">
                    <div>
                      <div className="text-sm font-medium">{grade.course}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{grade.type}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{grade.grade}</span>
                      <MoreHorizontal className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </div>
                  </div>
                ))}
                {recentGrades.length === 0 && <div className="text-sm text-[var(--color-text-secondary)]">Aucune note recente.</div>}
              </div>
            </div>

            <div className="card xl:col-span-4 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Prochaines Échéances</h3>
                <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
              </div>
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <div key={`${event.title}-${event.date}`} className="oak-event-item">
                    <div>
                      <div className="text-sm font-medium">{event.title}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{event.date}</div>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]">{event.time}</span>
                  </div>
                ))}
                {upcomingEvents.length === 0 && <div className="text-sm text-[var(--color-text-secondary)]">Aucun evenement planifie.</div>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="card xl:col-span-4 p-5 bg-[linear-gradient(145deg,#fff7dc_0%,#ffe2ad_100%)]">
              <div className="text-sm text-[#69511b]">Progression</div>
              <div className="text-4xl font-extrabold text-[#2c250f] my-1">{progress.semester}</div>
              <p className="text-sm text-[#6a5a32]">Semestre en cours</p>
            </div>

            <div className="oak-dark-card xl:col-span-4 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Actions rapides</h3>
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div className="space-y-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.name} to={action.href} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10">
                      <div className="flex items-center gap-2 text-sm">
                        <Icon className="w-4 h-4" />
                        <span>{action.name}</span>
                      </div>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="card xl:col-span-4 p-5">
              <h3 className="text-lg font-semibold mb-4">Success Rate</h3>
              <div className="w-full max-w-[220px] mx-auto">
                <svg viewBox="0 0 220 120" className="w-full h-auto">
                  <path d="M20 110 A90 90 0 0 1 200 110" stroke="#efe4bf" strokeWidth="18" fill="none" strokeLinecap="round" />
                  <path d="M20 110 A90 90 0 0 1 200 110" stroke="#e1bf6c" strokeWidth="18" fill="none" strokeLinecap="round" strokeDasharray={`${successValue * 2.83} 283`} />
                </svg>
              </div>
              <div className="text-center -mt-3">
                <div className="text-4xl font-extrabold tracking-tight">{successValue}%</div>
                <div className="text-sm text-[var(--color-text-muted)] mt-1">Mention {progress.mention}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;