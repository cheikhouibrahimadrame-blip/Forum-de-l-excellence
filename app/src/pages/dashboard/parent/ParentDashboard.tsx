import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useScrollReveal } from '../../../hooks/useScrollReveal';
import { api } from '../../../lib/api';
import { 
  Users,
  Award,
  Calendar,
  MessageSquare,
  BookOpen,
  CheckCircle,
  Clock
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
  const location = useLocation();
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: actionsRef, isVisible: actionsVisible } = useScrollReveal();
  const { ref: childrenRef, isVisible: childrenVisible } = useScrollReveal();
  const { ref: activityRef, isVisible: activityVisible } = useScrollReveal();

  useEffect(() => {
    console.log('[ParentDashboard] auth state:', {
      userId: user?.id,
      role: user?.role,
      loading
    });

    // Fetch linked students
    const fetchLinkedStudents = async () => {
      try {
        const response = await api.get('/api/parent-students/my-students');
        const data = response.data;

        console.log('[ParentDashboard] my-students status:', response.status);

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
  }, [location.state]);

  const quickActions = [
    { name: 'Mes Enfants', href: '/parent/children', icon: Users, color: 'text-blue-600' },
    { name: 'Notes', href: '/parent/grades', icon: Award, color: 'text-green-600' },
    { name: 'Emplois du Temps', href: '/parent/schedule', icon: Calendar, color: 'text-purple-600' },
    { name: 'Présences', href: '/parent/attendance', icon: Clock, color: 'text-orange-600' },
    { name: 'Rendez-vous', href: '/parent/appointments', icon: MessageSquare, color: 'text-amber-600' }
  ];

  const recentActivity: Array<{ icon: React.ElementType; text: string; time: string; color: string }> = [];

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
          Bienvenue dans votre espace parent au Forum de L'excellence
        </p>
      </div>

      {/* Quick Actions */}
      <div ref={actionsRef} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 ${actionsVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const delayClass = ['', 'animation-delay-100', 'animation-delay-200', 'animation-delay-300', 'animation-delay-400'][index] || '';
          let state = undefined;
          if (action.href === '/parent/children') state = { scrollTo: 'parent-children' };
          else if (action.href === '/parent/grades') state = { scrollTo: 'parent-grades' };
          else if (action.href === '/parent/schedule') state = { scrollTo: 'parent-schedule' };
          else if (action.href === '/parent/attendance') state = { scrollTo: 'parent-attendance' };
          else if (action.href === '/parent/appointments') state = { scrollTo: 'parent-appointments' };
          let cardId = undefined;
          if (action.href === '/parent/children') cardId = 'parent-card-children';
          else if (action.href === '/parent/grades') cardId = 'parent-card-grades';
          else if (action.href === '/parent/schedule') cardId = 'parent-card-schedule';
          else if (action.href === '/parent/attendance') cardId = 'parent-card-attendance';
          else if (action.href === '/parent/appointments') cardId = 'parent-card-appointments';
          return (
            <div key={index} className={`${actionsVisible ? 'animate-fade-in-up' : 'opacity-0'} ${delayClass}`}>
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

      {/* Children Overview */}
      <div ref={childrenRef} className={`space-y-4 ${childrenVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {linkedStudents.map((student, index) => {
              const delayClass = ['', 'animation-delay-150'][index] || '';
              const courseName = student.enrollments?.[0]?.course?.program?.name || 'Non inscrit';
              
              return (
                <div key={student.id} className={`card p-6 ${childrenVisible ? 'animate-fade-in-up' : 'opacity-0'} ${delayClass}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                        {student.user.firstName} {student.user.lastName}
                      </h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">{courseName}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary-gold-light)] flex items-center justify-center">
                      <Users className="w-6 h-6 text-[var(--color-primary-navy)]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-lg">
                      <div className="text-2xl font-bold text-[var(--color-primary-navy)]">{student.gpa || '0.00'}</div>
                      <p className="text-xs text-[var(--color-text-secondary)]">Moyenne</p>
                    </div>
                    <div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-lg">
                      <div className="text-2xl font-bold text-[var(--color-primary-navy)]">-</div>
                      <p className="text-xs text-[var(--color-text-secondary)]">Rang</p>
                    </div>
                    <div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-lg">
                      <div className="text-2xl font-bold text-[var(--color-primary-navy)]">-</div>
                      <p className="text-xs text-[var(--color-text-secondary)]">Présence</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-[var(--color-text-primary)]">Statut</span>
                      </div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">{student.status}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-[var(--color-text-primary)]">Email</span>
                      </div>
                      <span className="text-sm text-[var(--color-text-secondary)]">{student.user.email}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
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

      {/* Recent Activity */}
      <div
        ref={activityRef}
        className={`card p-6 ${activityVisible ? 'animate-slide-in-up' : 'opacity-0'}`}
      >
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
          Activité Récente
        </h2>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={index} className="flex items-center gap-4 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                <Icon className={`w-5 h-5 ${activity.color}`} />
                <div className="flex-1">
                  <p className="text-sm text-[var(--color-text-primary)]">{activity.text}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{activity.time}</p>
                </div>
              </div>
            );
          })}
          {recentActivity.length === 0 && (
            <div className="text-sm text-[var(--color-text-secondary)]">
              Aucune activite recente.
            </div>
          )}
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;