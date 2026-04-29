import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import { useLiveRefresh } from '../../../hooks/useLiveRefresh';
import { 
  BookOpen,
  Users,
  ClipboardList,
  Calendar,
  ArrowUpRight,
  Clock,
  MoreHorizontal,
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

type SubjectAssignment = {
  id: string;
  subjectName: string;
  subjectCode: string;
  classroomName: string;
  schoolYear: string;
};

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const refreshTick = useLiveRefresh(15000);
  const [classCards, setClassCards] = useState<ClassCard[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([]);
  const [stats, setStats] = useState([
    { label: 'Ma Classe', value: '-', icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Élèves', value: '-', icon: Users, color: 'bg-green-500' },
    { label: 'Cahiers à Corriger', value: '-', icon: ClipboardList, color: 'bg-amber-500' },
    { label: 'Heures/Semaine', value: '-', icon: Clock, color: 'bg-purple-500' }
  ]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState('');

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
        const [scheduleResponse, subjectsResponse] = await Promise.all([
          api.get(`/api/schedules/teacher/${user.teacher.id}`),
          api.get('/api/subjects/teacher/assignments')
        ]);

        const result = scheduleResponse.data;
        const teachingSchedule = result?.data?.teachingSchedule || {};
        const assignments = Array.isArray(subjectsResponse.data?.data?.assignments)
          ? subjectsResponse.data.data.assignments
          : [];

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
        setSubjectAssignments(
          assignments.map((item: any) => ({
            id: String(item.id || ''),
            subjectName: item.subjectName || 'Matière',
            subjectCode: item.subjectCode || '',
            classroomName: item.classroomName || '',
            schoolYear: item.schoolYear || ''
          })).filter((item: SubjectAssignment) => item.id && item.subjectName)
        );

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
  }, [user?.teacher?.id, refreshTick]);


  const quickActions = [
    { name: 'Mes Classes', href: '/teacher/classes', icon: BookOpen },
    { name: 'Mes Élèves', href: '/teacher/students', icon: Users },
    { name: 'Gestion des Notes', href: '/teacher/grades', icon: ClipboardList },
    { name: 'Mon Emploi du Temps', href: '/teacher/schedule', icon: Calendar },
  ];

  const pendingTasks: Array<{ task: string; deadline: string; urgent: boolean }> = [];

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-6 py-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
              {stats.slice(0, 3).map((stat, idx) => {
                const gradients = [
                  'linear-gradient(145deg, #cedfb4 0%, #aac240 100%)',
                  'linear-gradient(145deg, #f4f8b8 0%, #e7ef96 100%)',
                  'linear-gradient(145deg, #d8e2ce 0%, #bccdb6 100%)',
                ];
                return (
                  <div key={stat.label} className="oak-stat-card" style={{ background: gradients[idx] }}>
                    <div>
                      <div className="text-sm text-[#2f3615]">{stat.label}</div>
                      <div className="text-3xl font-extrabold text-[#171b11]">{stat.value}</div>
                    </div>
                    <stat.icon className="w-5 h-5 text-[#2a3313]" />
                  </div>
                );
              })}
            </div>

            <div className="oak-hero-banner w-full lg:w-[38%]">
              <img src="/campus-hero.png" alt="Campus" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="text-sm/5 opacity-90">Bonjour {user?.firstName}</div>
                <div className="text-xl font-bold">Enseignement FORUM-EXCELLENCE</div>
              </div>
            </div>
          </div>

          {(loadingData || loadError) && (
            <div className="card p-4 text-sm text-[var(--color-text-secondary)]">
              {loadingData ? 'Chargement du tableau de bord...' : loadError}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="card xl:col-span-8 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Mes Classes</h3>
                <Link to="/teacher/classes" state={{ scrollTo: 'teacher-classes' }} className="text-sm text-[var(--color-primary)]">
                  Voir tout
                </Link>
              </div>
              <div className="space-y-2">
                {classCards.map((classe) => (
                  <div key={classe.id} className="oak-event-item">
                    <div>
                      <div className="text-sm font-medium">{classe.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{classe.students ?? '-'} élèves</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[var(--color-text-muted)]">{classe.nextClass}</span>
                      <MoreHorizontal className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </div>
                  </div>
                ))}
                {classCards.length === 0 && <div className="text-sm text-[var(--color-text-secondary)]">Aucun cours planifie.</div>}
              </div>
            </div>

            <div className="card xl:col-span-4 p-5">
              <h3 className="text-lg font-semibold mb-4">Heures / Semaine</h3>
              <div className="text-5xl font-extrabold tracking-tight">{stats[3]?.value}</div>
              <div className="text-sm text-[var(--color-text-muted)] mt-1">Charge horaire planifiée</div>
              <div className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between"><span>Classes</span><span className="font-semibold">{classCards.length}</span></div>
                <div className="flex justify-between"><span>Élèves</span><span className="font-semibold">{stats[1]?.value}</span></div>
                <div className="flex justify-between"><span>Cahiers à corriger</span><span className="font-semibold">{stats[2]?.value}</span></div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Matières assignées</h3>
              <span className="text-sm text-[var(--color-text-muted)]">{subjectAssignments.length} matière(s)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {subjectAssignments.map((assignment) => (
                <div key={assignment.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                  <div className="text-sm font-semibold text-[var(--color-text-primary)]">{assignment.subjectName}</div>
                  <div className="text-xs text-[var(--color-text-muted)] font-mono">{assignment.subjectCode}</div>
                  <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{assignment.classroomName}</div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">Année {assignment.schoolYear}</div>
                </div>
              ))}
              {subjectAssignments.length === 0 && (
                <div className="text-sm text-[var(--color-text-secondary)]">Aucune matière assignée pour le moment.</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="card xl:col-span-4 p-5 bg-[linear-gradient(145deg,#fff7dc_0%,#ffe2ad_100%)]">
              <div className="text-sm text-[#69511b]">Agenda</div>
              <div className="text-4xl font-extrabold text-[#2c250f] my-1">12 Days Left</div>
              <p className="text-sm text-[#6a5a32]">Avant la remise finale des notes.</p>
            </div>

            <div className="oak-dark-card xl:col-span-8 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Actions rapides</h3>
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              {pendingTasks.length === 0 && <div className="text-sm text-white/70 mt-3">Aucune tache en attente.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;