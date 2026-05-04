import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';
import { logger } from '../../../lib/logger';
import { useLiveRefresh } from '../../../hooks/useLiveRefresh';
import { 
  Users,
  Award,
  Calendar,
  ArrowUpRight,
  BookOpen,
  CheckCircle,
  Clock,
  MoreHorizontal,
} from 'lucide-react';

interface LinkedStudent {
  id: string;
  userId: string;
  studentId: string;
  dateOfBirth: string;
  enrollmentDate: string;
  major: string | null;
  gpa: number;
  status: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  enrollments: Array<{
    course: {
      name: string;
      program: {
        name: string;
      };
    };
  }>;
}

const ParentDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const { branding } = useBranding();
  const location = useLocation();
  const refreshTick = useLiveRefresh(15000);
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    logger.log('[ParentDashboard] auth state:', {
      userId: user?.id,
      role: user?.role,
      loading
    });

    // Fetch linked students
    const fetchLinkedStudents = async () => {
      try {
        const response = await api.get(API.PARENT_STUDENTS_MY);
        const data = response.data;

        logger.log('[ParentDashboard] my-students status:', response.status);

        if (data.success && data.data.students) {
          setLinkedStudents(data.data.students);
        } else {
          setLinkedStudents([]);
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement des élèves liés:', error);
        setLinkedStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchLinkedStudents();

    // Scroll to target
    const scrollTargets: { [key: string]: string } = {
      'parent-children': 'parent-card-children',
      'parent-grades': 'parent-card-grades',
      'parent-schedule': 'parent-card-schedule',
      'parent-attendance': 'parent-card-attendance',
      'parent-appointments': 'parent-card-appointments'
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
  }, [location.state, refreshTick]);

  const quickActions = [
    { name: 'Mes Enfants', href: '/parent/children', icon: Users },
    { name: 'Notes', href: '/parent/grades', icon: Award },
    { name: 'Emplois du Temps', href: '/parent/schedule', icon: Calendar },
    { name: 'Présences', href: '/parent/attendance', icon: Clock },
    { name: 'Rendez-vous', href: '/parent/appointments', icon: Calendar },
  ];

  const recentActivity: Array<{ icon: React.ElementType; text: string; time: string; color: string }> = [];

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-6 py-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
              <div className="oak-stat-card" style={{ background: 'linear-gradient(145deg, #cedfb4 0%, #aac240 100%)' }}>
                <div>
                  <div className="text-sm text-[#2f3615]">Enfants liés</div>
                  <div className="text-3xl font-extrabold text-[#171b11]">{linkedStudents.length}</div>
                </div>
                <Users className="w-5 h-5 text-[#2a3313]" />
              </div>
              <div className="oak-stat-card" style={{ background: 'linear-gradient(145deg, #f4f8b8 0%, #e7ef96 100%)' }}>
                <div>
                  <div className="text-sm text-[#2f3615]">Moyenne globale</div>
                  <div className="text-3xl font-extrabold text-[#171b11]">
                    {linkedStudents.length ? (linkedStudents.reduce((acc, s) => acc + (s.gpa || 0), 0) / linkedStudents.length).toFixed(2) : '-'}
                  </div>
                </div>
                <Award className="w-5 h-5 text-[#2a3313]" />
              </div>
              <div className="oak-stat-card" style={{ background: 'linear-gradient(145deg, #d8e2ce 0%, #bccdb6 100%)' }}>
                <div>
                  <div className="text-sm text-[#2f3615]">Compte parent</div>
                  <div className="text-2xl font-extrabold text-[#171b11]">Actif</div>
                </div>
                <CheckCircle className="w-5 h-5 text-[#2a3313]" />
              </div>
            </div>

            <div className="oak-hero-banner w-full lg:w-[38%]">
              <img src={branding.brand.heroBannerUrl} alt={branding.brand.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="text-sm/5 opacity-90">Bonjour {user?.firstName}</div>
                <div className="text-xl font-bold">Espace Parent FORUM-EXCELLENCE</div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Actions rapides</h3>
              <ArrowUpRight className="w-4 h-4 text-[var(--color-text-muted)]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.name} to={action.href} className="oak-event-item hover:bg-[var(--color-surface-offset)]">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Icon className="w-4 h-4" />
                      <span>{action.name}</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Mes Enfants</h2>

            {loadingStudents ? (
              <div className="card p-8 text-center">
                <p className="text-[var(--color-text-secondary)]">Chargement des élèves...</p>
              </div>
            ) : linkedStudents.length === 0 ? (
              <div className="card p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Aucun enfant associé pour le moment</h3>
                <p className="text-[var(--color-text-secondary)]">
                  Veuillez contacter l'administration pour lier votre compte à celui de votre enfant.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {linkedStudents.map((student) => {
                  const courseName = student.enrollments?.[0]?.course?.program?.name || 'Non inscrit';

                  return (
                    <div key={student.id} className="card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                            {student.user.firstName} {student.user.lastName}
                          </h3>
                          <p className="text-sm text-[var(--color-text-secondary)]">{courseName}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-[var(--color-primary-subtle)] flex items-center justify-center">
                          <Users className="w-6 h-6 text-[var(--color-primary)]" />
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="oak-event-item">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-[var(--color-primary)]" />
                            <span className="text-sm">Moyenne</span>
                          </div>
                          <span className="font-semibold">{student.gpa || '0.00'}</span>
                        </div>
                        <div className="oak-event-item">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Statut</span>
                          </div>
                          <span className="text-sm font-medium">{student.status}</span>
                        </div>
                        <div className="oak-event-item">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-[var(--color-text-muted)]" />
                            <span className="text-sm">Email</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--color-text-muted)]">{student.user.email}</span>
                            <MoreHorizontal className="w-4 h-4 text-[var(--color-text-muted)]" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Link to="/parent/grades" className="btn-accent flex-1 text-center">
                          Voir les notes
                        </Link>
                        <Link to="/parent/schedule" className="btn-secondary flex-1 text-center">
                          Emploi du temps
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="oak-dark-card p-5">
            <h2 className="text-xl font-semibold mb-4">Activité Récente</h2>
            {recentActivity.length === 0 ? (
              <div className="text-sm text-white/70">Aucune activite recente.</div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-white/10">
                      <Icon className={`w-4 h-4 ${activity.color}`} />
                      <div className="flex-1">
                        <p className="text-sm">{activity.text}</p>
                        <p className="text-xs text-white/70">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;