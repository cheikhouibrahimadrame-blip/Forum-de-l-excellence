import type React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import { useLiveRefresh } from '../../../hooks/useLiveRefresh';
import {
  Users,
  GraduationCap,
  Building2,
  ArrowUpRight,
  MoreHorizontal,
  BellRing,
  Calendar,
} from 'lucide-react';

type EventItem = {
  id: string;
  title: string;
  date: string;
  type: string;
};

type TeacherItem = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

const AdminDashboard: React.FC = () => {
    const formatEventType = (status?: string) => {
      if (status === 'PENDING') return 'En attente';
      if (status === 'CONFIRMED') return 'Confirmé';
      if (status === 'CANCELLED') return 'Annulé';
      if (status === 'COMPLETED') return 'Terminé';
      return status || '-';
    };

    const formatAppointmentType = (value?: string) => {
      if (value === 'ACADEMIC_ADVISING') return 'Conseil académique';
      if (value === 'PARENT_CONFERENCE') return 'Réunion parent-professeur';
      if (value === 'COUNSELING') return 'Orientation';
      if (value === 'ADMINISTRATIVE') return 'Administratif';
      if (value === 'TUTORING') return 'Tutorat';
      return String(value || 'Rendez-vous').replace(/_/g, ' ');
    };

    const isInCurrentMonth = (dateValue?: string) => {
      if (!dateValue) return false;
      const date = new Date(dateValue);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    };

  const { user } = useAuth();
  const refreshTick = useLiveRefresh(15000);
  const [academicYears, setAcademicYears] = useState<Array<{ year: string; isActive: boolean }>>([]);
  const [userCounts, setUserCounts] = useState({ active: 0, mustChangePassword: 0, disabled: 0 });
  const [roleCounts, setRoleCounts] = useState({ students: 0, parents: 0, teachers: 0, admins: 0 });
  const [classSummary, setClassSummary] = useState({ classes: 0, subjects: 0, teachers: 0, yearsClosed: 0 });
  const [appointmentSummary, setAppointmentSummary] = useState({ pending: 0, confirmed: 0, cancelled: 0 });
  const [recentEvents, setRecentEvents] = useState<EventItem[]>([]);
  const [topTeachers, setTopTeachers] = useState<Array<{ name: string; role: string }>>([]);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setStatsError('');
        const [
          activeRes,
          mustChangeRes,
          disabledRes,
          studentsRes,
          parentsRes,
          teachersRes,
          adminsRes,
          yearsRes,
          classesRes,
          subjectsRes,
          appointmentsRes
        ] = await Promise.all([
          api.get('/api/users', { params: { status: 'active', limit: 1 } }),
          api.get('/api/users', { params: { status: 'mustChangePassword', limit: 1 } }),
          api.get('/api/users', { params: { status: 'disabled', limit: 1 } }),
          api.get('/api/users', { params: { role: 'STUDENT', limit: 1 } }),
          api.get('/api/users', { params: { role: 'PARENT', limit: 1 } }),
          api.get('/api/users', { params: { role: 'TEACHER', limit: 6 } }),
          api.get('/api/users', { params: { role: 'ADMIN', limit: 1 } }),
          api.get('/api/academic-years'),
          api.get('/api/classes'),
          api.get('/api/subjects'),
          api.get('/api/appointments')
        ]);

        const activeTotal = activeRes.data?.data?.pagination?.total ?? 0;
        const mustChangeTotal = mustChangeRes.data?.data?.pagination?.total ?? 0;
        const disabledTotal = disabledRes.data?.data?.pagination?.total ?? 0;
        const studentsTotal = studentsRes.data?.data?.pagination?.total ?? 0;
        const parentsTotal = parentsRes.data?.data?.pagination?.total ?? 0;
        const adminsTotal = adminsRes.data?.data?.pagination?.total ?? 0;

        setUserCounts({ active: activeTotal, mustChangePassword: mustChangeTotal, disabled: disabledTotal });

        const teacherTotal = teachersRes.data?.data?.pagination?.total ?? 0;
        const teacherRows: TeacherItem[] = Array.isArray(teachersRes.data?.data?.users)
          ? teachersRes.data.data.users
          : [];
        setTopTeachers(
          teacherRows.slice(0, 3).map((teacher) => ({
            name: [teacher.firstName, teacher.lastName].filter(Boolean).join(' ').trim() || teacher.email || 'Enseignant',
            role: 'Enseignant'
          }))
        );
        setRoleCounts({
          students: studentsTotal,
          parents: parentsTotal,
          teachers: teacherTotal,
          admins: adminsTotal
        });

        const yearsResult = yearsRes.data;
        const years = Array.isArray(yearsResult?.data)
          ? yearsResult.data
              .map((item: { year?: string; isActive?: boolean }) => ({
                year: item.year || '',
                isActive: Boolean(item.isActive)
              }))
              .filter((item: { year: string }) => item.year)
          : [];
        setAcademicYears(years);
        setClassSummary((prev) => ({
          ...prev,
          yearsClosed: years.filter((item: { isActive: boolean }) => !item.isActive).length
        }));

        const classesCount = classesRes.data?.data?.length ?? 0;
        const subjectsCount = subjectsRes.data?.data?.length ?? 0;

        setClassSummary((prev) => ({
          ...prev,
          classes: classesCount,
          subjects: subjectsCount,
          teachers: teacherTotal
        }));

        const appointmentsResult = appointmentsRes.data;
        const items = Array.isArray(appointmentsResult?.data?.appointments)
          ? appointmentsResult.data.appointments
          : [];

        const monthItems = items.filter((item: any) => isInCurrentMonth(item?.scheduledDatetime));
        const monthUpcomingItems = monthItems
          .filter((item: any) => item?.scheduledDatetime && new Date(item.scheduledDatetime).getTime() >= Date.now())
          .sort((a: any, b: any) => new Date(a.scheduledDatetime).getTime() - new Date(b.scheduledDatetime).getTime());

        setAppointmentSummary({
          pending: monthItems.filter((item: { status?: string }) => item.status === 'PENDING').length,
          confirmed: monthItems.filter((item: { status?: string }) => item.status === 'CONFIRMED').length,
          cancelled: monthItems.filter((item: { status?: string }) => item.status === 'CANCELLED').length
        });

        const mappedEvents: EventItem[] = monthUpcomingItems
          .slice(0, 4)
          .map((item: any) => ({
            id: String(item.id),
            title: formatAppointmentType(item.appointmentType),
            date: new Date(item.scheduledDatetime).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short'
            }),
            type: item.status || 'PENDING'
          }));
        setRecentEvents(mappedEvents);
      } catch (error) {
        console.error('Error loading admin dashboard:', error);
        setStatsError('Erreur lors du chargement des statistiques.');
      }
    };

    fetchDashboardData();
  }, [refreshTick]);

  const totalUsers = roleCounts.students + roleCounts.parents + roleCounts.teachers + roleCounts.admins;
  const growthValue = totalUsers > 0 ? Math.round((userCounts.active / totalUsers) * 100) : 0;
  const totalAppointments = appointmentSummary.pending + appointmentSummary.confirmed + appointmentSummary.cancelled;
  const successValue = totalAppointments > 0 ? Math.round((appointmentSummary.confirmed / totalAppointments) * 100) : 0;

  const attendanceBars = [
    userCounts.active,
    classSummary.teachers,
    classSummary.classes,
    classSummary.subjects,
    appointmentSummary.confirmed,
    appointmentSummary.pending
  ];
  const attendanceMonths = ['Actifs', 'Ens.', 'Classes', 'Mat.', 'RDV OK', 'RDV Att.'];
  const maxBar = Math.max(1, ...attendanceBars);

  const quickStats = [
    {
      label: 'Utilisateurs',
      value: totalUsers.toLocaleString('fr-FR'),
      icon: Users,
      bg: 'linear-gradient(145deg, #cedfb4 0%, #aac240 100%)',
    },
    {
      label: 'Parents',
      value: roleCounts.parents.toLocaleString('fr-FR'),
      icon: Users,
      bg: 'linear-gradient(145deg, #f4f8b8 0%, #e7ef96 100%)',
    },
    {
      label: 'Étudiants',
      value: roleCounts.students.toLocaleString('fr-FR'),
      icon: GraduationCap,
      bg: 'linear-gradient(145deg, #d8e2ce 0%, #bccdb6 100%)',
    },
    {
      label: 'Personnel (Ens. + Admin)',
      value: (roleCounts.teachers + roleCounts.admins).toLocaleString('fr-FR'),
      icon: Building2,
      bg: 'linear-gradient(145deg, #f4f8b8 0%, #e7ef96 100%)',
    },
  ];

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-6 py-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 flex-1">
              {quickStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="oak-stat-card" style={{ background: stat.bg }}>
                    <div>
                      <div className="text-sm text-[#2f3615]">{stat.label}</div>
                      <div className="text-3xl font-extrabold tracking-tight text-[#171b11]">{stat.value}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#2a3313]" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="oak-hero-banner w-full lg:w-[38%]">
              <img src="/campus-hero.png" alt="Campus" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="text-white">
                  <div className="text-sm/5 opacity-90">Forum de L'excellence</div>
                  <div className="text-xl font-bold">Tableau de bord campus</div>
                </div>
                <Link to="/admin/users" className="btn-primary !px-4 !py-2 !text-sm">
                  Ajouter un membre
                </Link>
              </div>
            </div>
          </div>

          {statsError && <div className="text-sm text-red-600">{statsError}</div>}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="card xl:col-span-3 p-5">
              <div className="text-sm text-[var(--color-text-muted)] mb-3">Croissance de l'académie</div>
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
              <p className="text-center text-sm text-[var(--color-text-muted)] mt-3">Performance globale de l'académie</p>
            </div>

            <div className="card xl:col-span-5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Indicateurs clés</h3>
                <span className="text-xs text-[var(--color-text-muted)]">Mois en cours</span>
              </div>
              <div className="oak-bar-chart">
                {attendanceBars.map((bar, idx) => (
                  <div key={attendanceMonths[idx]} className="flex flex-col items-center gap-2 h-full justify-end">
                    <div className="oak-bar w-full" style={{ height: `${Math.round((bar / maxBar) * 100)}%` }} />
                    <span className="text-xs text-[var(--color-text-muted)]">{attendanceMonths[idx]}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="badge badge-info">Classes: {classSummary.classes}</span>
                <span className="badge badge-success">Matières: {classSummary.subjects}</span>
                <span className="badge badge-warning">Années clôturées: {classSummary.yearsClosed}</span>
              </div>
            </div>

            <div className="card xl:col-span-4 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Événements à venir</h3>
                <BellRing className="w-4 h-4 text-[var(--color-text-muted)]" />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mb-3">Rendez-vous à venir du mois en cours</p>
              <div className="space-y-2">
                {(recentEvents.length > 0 ? recentEvents : [{ id: 'none', title: 'Aucun événement proche', date: '-', type: '-' }]).map((item) => (
                  <div key={item.id} className="oak-event-item">
                    <div>
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{formatEventType(item.type)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-text-muted)]">{item.date}</span>
                      <MoreHorizontal className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="card xl:col-span-3 p-5 bg-[linear-gradient(145deg,#fff7dc_0%,#ffe2ad_100%)]">
              <div className="text-sm text-[#69511b]">Annonces</div>
              <div className="text-4xl font-extrabold text-[#2c250f] my-1">{appointmentSummary.pending}</div>
              <p className="text-sm text-[#6a5a32]">Rendez-vous en attente ce mois-ci.</p>
              <div className="flex gap-2 mt-4">
                {Array.from({ length: 7 }).map((_, idx) => (
                  <div key={idx} className="oak-dot-decoration" />
                ))}
              </div>
            </div>

            <div className="oak-dark-card xl:col-span-5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Enseignants principaux</h3>
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div className="space-y-3">
                {(topTeachers.length > 0 ? topTeachers : [{ name: 'Aucun enseignant', role: 'N/A' }]).map((teacher, idx) => (
                  <div key={teacher.name} className="flex items-center gap-3 py-1">
                    <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                      <span className="text-sm font-semibold">{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{teacher.name}</div>
                      <div className="text-xs text-white/65">{teacher.role}</div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/70" />
                  </div>
                ))}
              </div>
            </div>

            <div className="card xl:col-span-4 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Taux de réussite</h3>
                <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
              </div>

              <div className="w-full max-w-[220px] mx-auto">
                <svg viewBox="0 0 220 120" className="w-full h-auto">
                  <path d="M20 110 A90 90 0 0 1 200 110" stroke="#efe4bf" strokeWidth="18" fill="none" strokeLinecap="round" />
                  <path
                    d="M20 110 A90 90 0 0 1 200 110"
                    stroke="#e1bf6c"
                    strokeWidth="18"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${successValue * 2.83} 283`}
                  />
                </svg>
              </div>

              <div className="text-center -mt-3">
                <div className="text-4xl font-extrabold tracking-tight">{successValue}%</div>
                <div className="text-sm text-[var(--color-text-muted)] mt-1">Taux de réussite global</div>
              </div>

              <div className="mt-5 pt-4 border-t border-[var(--color-divider)] text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Rendez-vous en attente</span>
                  <span className="font-semibold">{appointmentSummary.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confirmés</span>
                  <span className="font-semibold">{appointmentSummary.confirmed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annulés</span>
                  <span className="font-semibold">{appointmentSummary.cancelled}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Année Académique Active</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Connecté en tant que {user?.firstName} {user?.lastName}
                </p>
              </div>
              <select className="input-field max-w-[280px]">
                {academicYears.length === 0 && <option value="">Aucune année</option>}
                {academicYears.map((year) => (
                  <option key={year.year} value={year.year}>
                    {year.year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
