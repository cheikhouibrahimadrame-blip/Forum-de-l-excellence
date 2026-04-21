# Code complet des 6 fichiers dashboard

## 1. app/src/App.tsx

<pre><code>import type React from 'react';
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ScrollToTop } from './components/ScrollToTop';
import './App.css';

// Layouts (kept eager — they wrap every page)
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import AuthLayout from './components/layout/AuthLayout';

// Public Pages (kept eager — entry points)
import HomePage from './pages/public/HomePage';
import ProgramsPage from './pages/public/ProgramsPage';
import ProgramDetailPage from './pages/public/ProgramDetailPage';
import AdmissionsPage from './pages/public/AdmissionsPage';
import CampusLifePage from './pages/public/CampusLifePage';

// Auth Pages (kept eager — lightweight)
import LoginPage from './pages/auth/LoginPage';
import ChangePassword from './pages/auth/ChangePassword';

// =================================================================
// Dashboard Pages — LAZY LOADED for code-splitting
// =================================================================

// Student
const StudentDashboard = lazy(() =&gt; import('./pages/dashboard/student/StudentDashboard'));
const StudentGrades = lazy(() =&gt; import('./pages/dashboard/student/StudentGrades'));
const StudentSchedule = lazy(() =&gt; import('./pages/dashboard/student/StudentSchedule'));
const StudentAppointments = lazy(() =&gt; import('./pages/dashboard/student/StudentAppointments'));
const StudentReportCards = lazy(() =&gt; import('./pages/dashboard/student/StudentReportCards'));
const StudentLessons = lazy(() =&gt; import('./pages/dashboard/student/StudentLessons'));
const StudentSubjects = lazy(() =&gt; import('./pages/dashboard/student/StudentSubjects'));
const StudentHomework = lazy(() =&gt; import('./pages/dashboard/student/StudentHomework'));
const StudentMessages = lazy(() =&gt; import('./pages/dashboard/student/StudentMessages'));
const StudentBehavior = lazy(() =&gt; import('./pages/dashboard/student/StudentBehavior'));

// Parent
const ParentDashboard = lazy(() =&gt; import('./pages/dashboard/parent/ParentDashboard'));
const ParentChildren = lazy(() =&gt; import('./pages/dashboard/parent/ParentChildren'));
const ParentGrades = lazy(() =&gt; import('./pages/dashboard/parent/ParentGrades'));
const ParentSchedule = lazy(() =&gt; import('./pages/dashboard/parent/ParentSchedule'));
const ParentAppointments = lazy(() =&gt; import('./pages/dashboard/parent/ParentAppointments'));
const ParentAttendance = lazy(() =&gt; import('./pages/dashboard/parent/ParentAttendance'));
const ParentHomework = lazy(() =&gt; import('./pages/dashboard/parent/ParentHomework'));
const ParentMessages = lazy(() =&gt; import('./pages/dashboard/parent/ParentMessages'));
const ParentBehavior = lazy(() =&gt; import('./pages/dashboard/parent/ParentBehavior'));
const ParentHealth = lazy(() =&gt; import('./pages/dashboard/parent/ParentHealth'));
const ParentPickup = lazy(() =&gt; import('./pages/dashboard/parent/ParentPickup'));

// Teacher
const TeacherDashboard = lazy(() =&gt; import('./pages/dashboard/teacher/TeacherDashboard'));
const TeacherClasses = lazy(() =&gt; import('./pages/dashboard/teacher/TeacherClasses'));
const TeacherStudents = lazy(() =&gt; import('./pages/dashboard/teacher/TeacherStudents'));
const TeacherGrades = lazy(() =&gt; import('./pages/dashboard/teacher/TeacherGrades'));
const TeacherSchedule = lazy(() =&gt; import('./pages/dashboard/teacher/TeacherSchedule'));
const TeacherLessons = lazy(() =&gt; import('./pages/dashboard/teacher/TeacherLessons'));
const TeacherAttendance = lazy(() =&gt; import('./pages/dashboard/teacher/TeacherAttendance'));
const TeacherHomework = lazy(() =&gt; import('./pages/dashboard/teacher/TeacherHomework'));
const TeacherMessages = lazy(() =&gt; import('./pages/dashboard/teacher/TeacherMessages'));
const TeacherBehavior = lazy(() =&gt; import('./pages/dashboard/teacher/TeacherBehavior'));

// Admin
const AdminDashboard = lazy(() =&gt; import('./pages/dashboard/admin/AdminDashboard'));
const AdminReports = lazy(() =&gt; import('./pages/dashboard/admin/AdminReports'));
const AdminMainPage = lazy(() =&gt; import('./pages/dashboard/admin/AdminMainPage'));
const AdminSettings = lazy(() =&gt; import('./pages/dashboard/admin/AdminSettings'));
const AdminClasses = lazy(() =&gt; import('./pages/dashboard/admin/AdminClasses'));
const AdminSubjects = lazy(() =&gt; import('./pages/dashboard/admin/AdminSubjects'));
const AdminYears = lazy(() =&gt; import('./pages/dashboard/admin/AdminYears'));
const AdminAdmissionsContent = lazy(() =&gt; import('./pages/dashboard/admin/AdminAdmissionsContent'));
const AdminProgramsContent = lazy(() =&gt; import('./pages/dashboard/admin/AdminProgramsContent'));
const AdminCampusLifeContent = lazy(() =&gt; import('./pages/dashboard/admin/AdminCampusLifeContent'));
const AdminParentsStudents = lazy(() =&gt; import('./pages/dashboard/admin/AdminParentsStudents'));
const AdminSchedules = lazy(() =&gt; import('./pages/dashboard/admin/AdminSchedules'));
const AdminGradeLocks = lazy(() =&gt; import('./pages/dashboard/admin/AdminGradeLocks'));
const AdminAppointments = lazy(() =&gt; import('./pages/dashboard/admin/AdminAppointments'));
const AdminUsers = lazy(() =&gt; import('./pages/dashboard/admin/AdminUsers'));
const AdminPrograms = lazy(() =&gt; import('./pages/dashboard/admin/AdminPrograms'));
const AdminCourses = lazy(() =&gt; import('./pages/dashboard/admin/AdminCourses'));
const AdminAttendance = lazy(() =&gt; import('./pages/dashboard/admin/AdminAttendance'));
const AdminHealth = lazy(() =&gt; import('./pages/dashboard/admin/AdminHealth'));
const AdminBehavior = lazy(() =&gt; import('./pages/dashboard/admin/AdminBehavior'));
const AdminPickup = lazy(() =&gt; import('./pages/dashboard/admin/AdminPickup'));

// =================================================================
// Route guard components
// =================================================================

const LoadingSpinner = () =&gt; (
  &lt;div className="min-h-screen flex items-center justify-center"&gt;
    &lt;div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy"&gt;&lt;/div&gt;
  &lt;/div&gt;
);

const ProtectedRoute: React.FC&lt;{ allowedRoles: string[]; children: React.ReactNode }&gt; = ({
  allowedRoles,
  children
}) =&gt; {
  const { user, loading } = useAuth();

  if (loading) return &lt;LoadingSpinner /&gt;;
  if (!user) return &lt;Navigate to="/login" replace /&gt;;
  if (user.mustChangePassword) return &lt;Navigate to="/change-password" replace /&gt;;
  if (!allowedRoles.includes(user.role)) return &lt;Navigate to="/" replace /&gt;;

  return &lt;&gt;{children}&lt;/&gt;;
};

const PublicRoute: React.FC&lt;{ children: React.ReactNode }&gt; = ({ children }) =&gt; {
  const { loading } = useAuth();
  if (loading) return &lt;LoadingSpinner /&gt;;
  return &lt;&gt;{children}&lt;/&gt;;
};

function AppContent() {
  return (
    &lt;Router&gt;
      &lt;ScrollToTop /&gt;
      &lt;Suspense fallback={&lt;LoadingSpinner /&gt;}&gt;
        &lt;Routes&gt;
          {/* Public Routes */}
          &lt;Route path="/" element={&lt;PublicRoute&gt;&lt;PublicLayout&gt;&lt;HomePage /&gt;&lt;/PublicLayout&gt;&lt;/PublicRoute&gt;} /&gt;
          &lt;Route path="/programs" element={&lt;PublicRoute&gt;&lt;PublicLayout&gt;&lt;ProgramsPage /&gt;&lt;/PublicLayout&gt;&lt;/PublicRoute&gt;} /&gt;
          &lt;Route path="/programmes/:id" element={&lt;PublicRoute&gt;&lt;PublicLayout&gt;&lt;ProgramDetailPage /&gt;&lt;/PublicLayout&gt;&lt;/PublicRoute&gt;} /&gt;
          &lt;Route path="/admissions" element={&lt;PublicRoute&gt;&lt;PublicLayout&gt;&lt;AdmissionsPage /&gt;&lt;/PublicLayout&gt;&lt;/PublicRoute&gt;} /&gt;
          &lt;Route path="/campus-life" element={&lt;PublicRoute&gt;&lt;PublicLayout&gt;&lt;CampusLifePage /&gt;&lt;/PublicLayout&gt;&lt;/PublicRoute&gt;} /&gt;

          {/* Auth Routes */}
          &lt;Route path="/login" element={&lt;AuthLayout&gt;&lt;LoginPage /&gt;&lt;/AuthLayout&gt;} /&gt;
          &lt;Route path="/change-password" element={&lt;ChangePassword /&gt;} /&gt;

          {/* Student Dashboard */}
          &lt;Route path="/student" element={&lt;ProtectedRoute allowedRoles={['STUDENT']}&gt;&lt;DashboardLayout&gt;&lt;StudentDashboard /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/student/grades" element={&lt;ProtectedRoute allowedRoles={['STUDENT']}&gt;&lt;DashboardLayout&gt;&lt;StudentGrades /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/student/schedule" element={&lt;ProtectedRoute allowedRoles={['STUDENT']}&gt;&lt;DashboardLayout&gt;&lt;StudentSchedule /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/student/appointments" element={&lt;ProtectedRoute allowedRoles={['STUDENT']}&gt;&lt;DashboardLayout&gt;&lt;StudentAppointments /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/student/homework" element={&lt;ProtectedRoute allowedRoles={['STUDENT']}&gt;&lt;DashboardLayout&gt;&lt;StudentHomework /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/student/messages" element={&lt;ProtectedRoute allowedRoles={['STUDENT']}&gt;&lt;DashboardLayout&gt;&lt;StudentMessages /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/student/behavior" element={&lt;ProtectedRoute allowedRoles={['STUDENT']}&gt;&lt;DashboardLayout&gt;&lt;StudentBehavior /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/student/report-cards" element={&lt;ProtectedRoute allowedRoles={['STUDENT']}&gt;&lt;DashboardLayout&gt;&lt;StudentReportCards /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/student/lessons" element={&lt;ProtectedRoute allowedRoles={['STUDENT']}&gt;&lt;DashboardLayout&gt;&lt;StudentLessons /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/student/subjects" element={&lt;ProtectedRoute allowedRoles={['STUDENT']}&gt;&lt;DashboardLayout&gt;&lt;StudentSubjects /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;

          {/* Parent Dashboard */}
          &lt;Route path="/parent" element={&lt;ProtectedRoute allowedRoles={['PARENT']}&gt;&lt;DashboardLayout&gt;&lt;ParentDashboard /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/parent/children" element={&lt;ProtectedRoute allowedRoles={['PARENT']}&gt;&lt;DashboardLayout&gt;&lt;ParentChildren /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/parent/grades" element={&lt;ProtectedRoute allowedRoles={['PARENT']}&gt;&lt;DashboardLayout&gt;&lt;ParentGrades /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/parent/schedule" element={&lt;ProtectedRoute allowedRoles={['PARENT']}&gt;&lt;DashboardLayout&gt;&lt;ParentSchedule /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/parent/appointments" element={&lt;ProtectedRoute allowedRoles={['PARENT']}&gt;&lt;DashboardLayout&gt;&lt;ParentAppointments /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/parent/attendance" element={&lt;ProtectedRoute allowedRoles={['PARENT']}&gt;&lt;DashboardLayout&gt;&lt;ParentAttendance /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/parent/homework" element={&lt;ProtectedRoute allowedRoles={['PARENT']}&gt;&lt;DashboardLayout&gt;&lt;ParentHomework /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/parent/messages" element={&lt;ProtectedRoute allowedRoles={['PARENT']}&gt;&lt;DashboardLayout&gt;&lt;ParentMessages /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/parent/behavior" element={&lt;ProtectedRoute allowedRoles={['PARENT']}&gt;&lt;DashboardLayout&gt;&lt;ParentBehavior /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/parent/health" element={&lt;ProtectedRoute allowedRoles={['PARENT']}&gt;&lt;DashboardLayout&gt;&lt;ParentHealth /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/parent/pickup" element={&lt;ProtectedRoute allowedRoles={['PARENT']}&gt;&lt;DashboardLayout&gt;&lt;ParentPickup /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;

          {/* Teacher Dashboard */}
          &lt;Route path="/teacher" element={&lt;ProtectedRoute allowedRoles={['TEACHER']}&gt;&lt;DashboardLayout&gt;&lt;TeacherDashboard /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/teacher/classes" element={&lt;ProtectedRoute allowedRoles={['TEACHER']}&gt;&lt;DashboardLayout&gt;&lt;TeacherClasses /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/teacher/students" element={&lt;ProtectedRoute allowedRoles={['TEACHER']}&gt;&lt;DashboardLayout&gt;&lt;TeacherStudents /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/teacher/grades" element={&lt;ProtectedRoute allowedRoles={['TEACHER']}&gt;&lt;DashboardLayout&gt;&lt;TeacherGrades /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/teacher/lessons" element={&lt;ProtectedRoute allowedRoles={['TEACHER']}&gt;&lt;DashboardLayout&gt;&lt;TeacherLessons /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/teacher/attendance" element={&lt;ProtectedRoute allowedRoles={['TEACHER']}&gt;&lt;DashboardLayout&gt;&lt;TeacherAttendance /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/teacher/schedule" element={&lt;ProtectedRoute allowedRoles={['TEACHER']}&gt;&lt;DashboardLayout&gt;&lt;TeacherSchedule /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/teacher/homework" element={&lt;ProtectedRoute allowedRoles={['TEACHER']}&gt;&lt;DashboardLayout&gt;&lt;TeacherHomework /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/teacher/messages" element={&lt;ProtectedRoute allowedRoles={['TEACHER']}&gt;&lt;DashboardLayout&gt;&lt;TeacherMessages /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/teacher/behavior" element={&lt;ProtectedRoute allowedRoles={['TEACHER']}&gt;&lt;DashboardLayout&gt;&lt;TeacherBehavior /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;

          {/* Admin Dashboard */}
          &lt;Route path="/admin" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminDashboard /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/users" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminUsers /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/classes" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminClasses /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/subjects" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminSubjects /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/years" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminYears /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/programs" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminPrograms /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/courses" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminCourses /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/reports" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminReports /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/mainpage" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminMainPage /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/content/admissions" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminAdmissionsContent /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/content/programs" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminProgramsContent /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/content/campuslife" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminCampusLifeContent /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/settings" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminSettings /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/parents-students" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminParentsStudents /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/schedules" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminSchedules /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/grade-locks" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminGradeLocks /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/appointments" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminAppointments /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/attendance" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminAttendance /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/health" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminHealth /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/behavior" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminBehavior /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;
          &lt;Route path="/admin/pickup" element={&lt;ProtectedRoute allowedRoles={['ADMIN']}&gt;&lt;DashboardLayout&gt;&lt;AdminPickup /&gt;&lt;/DashboardLayout&gt;&lt;/ProtectedRoute&gt;} /&gt;

          {/* Default redirect */}
          &lt;Route path="*" element={&lt;Navigate to="/" replace /&gt;} /&gt;
        &lt;/Routes&gt;
      &lt;/Suspense&gt;
    &lt;/Router&gt;
  );
}

function App() {
  return (
    &lt;ThemeProvider&gt;
      &lt;AuthProvider&gt;
        &lt;AppContent /&gt;
      &lt;/AuthProvider&gt;
    &lt;/ThemeProvider&gt;
  );
}

export default App;</code></pre>

## 2. app/src/components/layout/DashboardLayout.tsx

<pre><code>import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Menu, 
  Sun, 
  Moon, 
  Search,
  Bell,
  User, 
  LogOut,
  ChevronDown,
  Home,
  BookOpen,
  Calendar,
  MessageSquare,
  FileText,
  Users,
  Settings,
  ClipboardList,
  Award,
  ClipboardCheck,
  Heart,
  ShieldCheck,
  TrendingUp,
  Mail
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC&lt;DashboardLayoutProps&gt; = ({ children }) =&gt; {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef&lt;HTMLDivElement&gt;(null);

  // Keep a responsive rail: icon-only on desktop, expanded drawer on mobile.
  useEffect(() =&gt; {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');

    const syncLayout = () =&gt; {
      const desktop = mediaQuery.matches;
      setIsDesktop(desktop);
      if (desktop) {
        setSidebarOpen(false);
      }
    };

    syncLayout();
    mediaQuery.addEventListener('change', syncLayout);

    return () =&gt; mediaQuery.removeEventListener('change', syncLayout);
  }, []);

  useEffect(() =&gt; {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
    setSidebarOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const getDashboardPath = () =&gt; {
    if (!user) return '/';
    switch (user.role) {
      case 'STUDENT': return '/student';
      case 'PARENT': return '/parent';
      case 'TEACHER': return '/teacher';
      case 'ADMIN': return '/admin';
      default: return '/';
    }
  };

  const getNavigationItems = () =&gt; {
    if (!user) return [];

    const baseItems = [
      { name: 'Tableau de bord', href: getDashboardPath(), icon: Home },
    ];

    switch (user.role) {
      case 'STUDENT':
        return [
          ...baseItems,
          { name: 'Mes Notes', href: '/student/grades', icon: Award },
          { name: 'Mon Emploi du Temps', href: '/student/schedule', icon: Calendar },
          { name: 'Mes Devoirs', href: '/student/homework', icon: ClipboardCheck },
          { name: 'Mes Messages', href: '/student/messages', icon: Mail },
          { name: 'Mon Comportement', href: '/student/behavior', icon: TrendingUp },
          { name: 'Mes Rendez-vous', href: '/student/appointments', icon: MessageSquare },
          { name: 'Mes Bulletins', href: '/student/report-cards', icon: FileText },
        ];

      case 'PARENT':
        return [
          ...baseItems,
          { name: 'Mes Enfants', href: '/parent/children', icon: Users },
          { name: 'Présence', href: '/parent/attendance', icon: ClipboardCheck },
          { name: 'Devoirs', href: '/parent/homework', icon: ClipboardList },
          { name: 'Messages', href: '/parent/messages', icon: Mail },
          { name: 'Comportement', href: '/parent/behavior', icon: TrendingUp },
          { name: 'Santé', href: '/parent/health', icon: Heart },
          { name: 'Personnes Autorisées', href: '/parent/pickup', icon: ShieldCheck },
          { name: 'Notes', href: '/parent/grades', icon: Award },
          { name: 'Emplois du Temps', href: '/parent/schedule', icon: Calendar },
          { name: 'Rendez-vous', href: '/parent/appointments', icon: MessageSquare },
        ];

      case 'TEACHER':
        return [
          ...baseItems,
          { name: 'Mes Classes', href: '/teacher/classes', icon: BookOpen },
          { name: 'Mes Élèves', href: '/teacher/students', icon: Users },
          { name: 'Présence', href: '/teacher/attendance', icon: ClipboardCheck },
          { name: 'Devoirs', href: '/teacher/homework', icon: ClipboardList },
          { name: 'Messages', href: '/teacher/messages', icon: Mail },
          { name: 'Comportement', href: '/teacher/behavior', icon: TrendingUp },
          { name: 'Gestion des Notes', href: '/teacher/grades', icon: Award },
          { name: 'Mon Emploi du Temps', href: '/teacher/schedule', icon: Calendar },
        ];

      case 'ADMIN':
        return [
          ...baseItems,
          { name: 'Utilisateurs', href: '/admin/users', icon: Users },
          { name: 'Classes', href: '/admin/classes', icon: BookOpen },
          { name: 'Matières', href: '/admin/subjects', icon: ClipboardList },
          { name: 'Années &amp; Trimestres', href: '/admin/years', icon: Calendar },
          { name: 'Emplois du temps', href: '/admin/schedules', icon: Calendar },
          { name: 'Verrous de notes', href: '/admin/grade-locks', icon: FileText },
          { name: 'Parents &amp; Élèves', href: '/admin/parents-students', icon: Users },
          { name: 'Rendez-vous', href: '/admin/appointments', icon: MessageSquare },
          { name: 'Présence', href: '/admin/attendance', icon: ClipboardCheck },
          { name: 'Comportement', href: '/admin/behavior', icon: TrendingUp },
          { name: 'Santé', href: '/admin/health', icon: Heart },
          { name: 'Ramassage', href: '/admin/pickup', icon: ShieldCheck },
          { name: 'Page Accueil', href: '/admin/mainpage', icon: Home },
          { name: 'Paramètres', href: '/admin/settings', icon: Settings },
        ];

      default:
        return baseItems;
    }
  };

  const getRoleColor = () =&gt; {
    switch (user?.role) {
      case 'STUDENT': return 'bg-blue-500';
      case 'PARENT': return 'bg-green-500';
      case 'TEACHER': return 'bg-purple-500';
      case 'ADMIN': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleName = () =&gt; {
    switch (user?.role) {
      case 'STUDENT': return 'Élève';
      case 'PARENT': return 'Parent';
      case 'TEACHER': return 'Enseignant';
      case 'ADMIN': return 'Administrateur';
      default: return '';
    }
  };

  const navigation = getNavigationItems();
  const activeLabel = navigation.find((item) =&gt; item.href === location.pathname)?.name || 'Tableau de bord';

  return (
    &lt;div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground dark:bg-[linear-gradient(135deg,var(--color-bg-primary)_0%,var(--color-bg-secondary)_100%)]"&gt;
      &lt;div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-primary-gold-light)]/35 blur-3xl" /&gt;
      &lt;div className="pointer-events-none absolute -right-32 top-16 h-80 w-80 rounded-full bg-white/5 blur-3xl dark:bg-white/6" /&gt;

      &lt;div className="relative flex min-h-screen w-full"&gt;
        &lt;aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-card/95 text-foreground shadow-2xl transition-transform duration-300 dark:bg-[linear-gradient(180deg,var(--color-bg-card)_0%,var(--color-bg-secondary)_100%)] dark:text-[var(--color-text-primary)] ${
            isDesktop ? 'w-20 translate-x-0' : `w-72 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          }`}
        &gt;
          &lt;div className="flex h-20 items-center justify-center border-b border-border"&gt;
            &lt;img src="/logo.jpeg" alt="Forum de L'excellence" className="h-11 w-11 rounded-2xl object-cover" /&gt;
          &lt;/div&gt;

          &lt;nav className="flex-1 space-y-2 overflow-y-auto px-2 py-4"&gt;
            {navigation.map((item) =&gt; {
              const Icon = item.icon;
              const active = location.pathname === item.href;

              return (
                &lt;Link
                  key={item.name}
                  to={item.href}
                  title={item.name}
                  onClick={() =&gt; setSidebarOpen(false)}
                  className={`group relative flex items-center rounded-2xl px-3 py-3 text-sm transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[var(--color-primary-gold-light)] to-[var(--color-primary-gold)] text-[var(--color-primary-navy)] shadow-lg shadow-[rgb(99_91_255_/_0.22)] dark:text-white'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                  } ${isDesktop ? 'justify-center' : 'justify-start gap-3'}`}
                &gt;
                  &lt;Icon className="h-5 w-5 shrink-0" /&gt;
                  {!isDesktop &amp;&amp; &lt;span className="truncate"&gt;{item.name}&lt;/span&gt;}
                  {isDesktop &amp;&amp; (
                    &lt;span className="pointer-events-none absolute left-[4.75rem] hidden whitespace-nowrap rounded-lg bg-card px-2 py-1 text-xs text-foreground shadow group-hover:block dark:bg-[var(--color-bg-card)] dark:text-[var(--color-text-primary)]"&gt;
                      {item.name}
                    &lt;/span&gt;
                  )}
                &lt;/Link&gt;
              );
            })}
          &lt;/nav&gt;

          &lt;div className="border-t border-border px-3 py-4"&gt;
            &lt;div className={`flex items-center rounded-2xl bg-muted/40 p-2 ${isDesktop ? 'justify-center' : 'gap-3'}`}&gt;
              &lt;div className={`flex h-10 w-10 items-center justify-center rounded-full ${getRoleColor()}`}&gt;
                &lt;User className="h-5 w-5 text-white" /&gt;
              &lt;/div&gt;
              {!isDesktop &amp;&amp; (
                &lt;div className="min-w-0"&gt;
                  &lt;p className="truncate text-sm font-medium text-foreground dark:text-white"&gt;
                    {user?.firstName} {user?.lastName}
                  &lt;/p&gt;
                  &lt;p className="truncate text-xs text-muted-foreground dark:text-slate-300"&gt;{getRoleName()}&lt;/p&gt;
                &lt;/div&gt;
              )}
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/aside&gt;

        &lt;div className={`flex min-h-screen w-full flex-col ${isDesktop ? 'lg:pl-20' : ''}`}&gt;
          &lt;header className="sticky top-0 z-30 px-4 pb-4 pt-4 md:px-6"&gt;
            &lt;div className="mx-auto flex w-full max-w-[1600px] items-center justify-between rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:bg-[linear-gradient(180deg,var(--color-bg-card)_0%,var(--color-bg-secondary)_100%)]"&gt;
              &lt;div className="flex min-w-0 items-center gap-3"&gt;
                {!isDesktop &amp;&amp; (
                  &lt;button
                    onClick={() =&gt; setSidebarOpen((prev) =&gt; !prev)}
                    className="rounded-xl border border-border p-2 text-foreground hover:bg-muted dark:text-[var(--color-text-primary)]"
                    aria-label="Ouvrir la navigation"
                  &gt;
                    &lt;Menu className="h-5 w-5" /&gt;
                  &lt;/button&gt;
                )}
                &lt;div className="min-w-0"&gt;
                  &lt;p className="truncate text-base font-semibold text-foreground md:text-lg"&gt;{activeLabel}&lt;/p&gt;
                  &lt;p className="truncate text-xs text-muted-foreground"&gt;Forum de L'excellence&lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;

              &lt;div className="flex items-center gap-2 md:gap-3"&gt;
                &lt;button className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted dark:text-slate-300" aria-label="Recherche"&gt;
                  &lt;Search className="h-5 w-5" /&gt;
                &lt;/button&gt;
                &lt;button className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted dark:text-slate-300" aria-label="Notifications"&gt;
                  &lt;Bell className="h-5 w-5" /&gt;
                &lt;/button&gt;
                &lt;button
                  onClick={toggleTheme}
                  className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted dark:text-slate-300"
                  aria-label="Changer de theme"
                &gt;
                  {theme === 'light' ? &lt;Moon className="h-5 w-5" /&gt; : &lt;Sun className="h-5 w-5" /&gt;}
                &lt;/button&gt;

                &lt;div className="relative"&gt;
                  &lt;button
                    onClick={() =&gt; setUserMenuOpen((prev) =&gt; !prev)}
                    className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 hover:bg-muted dark:bg-[var(--color-bg-card)]"
                  &gt;
                    &lt;div className={`flex h-8 w-8 items-center justify-center rounded-full ${getRoleColor()}`}&gt;
                      &lt;User className="h-4 w-4 text-white" /&gt;
                    &lt;/div&gt;
                    &lt;ChevronDown className="h-4 w-4 text-muted-foreground" /&gt;
                  &lt;/button&gt;

                  {userMenuOpen &amp;&amp; (
                    &lt;div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl dark:bg-[var(--color-bg-card)]"&gt;
                      &lt;div className="border-b border-border px-4 py-2"&gt;
                        &lt;p className="text-sm font-semibold text-foreground"&gt;
                          {user?.firstName} {user?.lastName}
                        &lt;/p&gt;
                        &lt;p className="text-xs text-muted-foreground"&gt;{getRoleName()}&lt;/p&gt;
                      &lt;/div&gt;

                      &lt;Link to="/" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"&gt;
                        &lt;Home className="h-4 w-4" /&gt;
                        Retour au site
                      &lt;/Link&gt;

                      &lt;button
                        onClick={() =&gt; {
                          logout();
                          navigate('/');
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                      &gt;
                        &lt;LogOut className="h-4 w-4" /&gt;
                        Deconnexion
                      &lt;/button&gt;
                    &lt;/div&gt;
                  )}
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/header&gt;

          &lt;main ref={mainRef} className="flex-1 overflow-y-auto px-4 pb-8 md:px-6"&gt;
            &lt;div className="mx-auto w-full max-w-[1600px]" onClick={() =&gt; setUserMenuOpen(false)}&gt;
              {children}
            &lt;/div&gt;
          &lt;/main&gt;
        &lt;/div&gt;

        {!isDesktop &amp;&amp; sidebarOpen &amp;&amp; (
          &lt;button
            aria-label="Fermer la navigation"
            className="fixed inset-0 z-30 bg-black/40"
            onClick={() =&gt; setSidebarOpen(false)}
          /&gt;
        )}
      &lt;/div&gt;
    &lt;/div&gt;
  );
};

export default DashboardLayout;</code></pre>

## 3. app/src/pages/dashboard/admin/AdminDashboard.tsx

<pre><code>import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  MailCheck,
  ClipboardList,
  BookOpen,
  CalendarClock,
  LayoutTemplate,
  FileSpreadsheet,
  Settings,
  Link as LinkIcon,
  BellRing,
  Lock,
  Globe
} from 'lucide-react';

type SectionLink = {
  label: string;
  to: string;
  scrollTo?: string;
};

type Section = {
  title: string;
  icon: React.ElementType;
  links: SectionLink[];
  badges: string[];
};

type LocationState = {
  scrollTo?: string;
};

const AdminDashboard: React.FC = () =&gt; {
  const { user } = useAuth();
  const location = useLocation();
  const [academicYears, setAcademicYears] = useState&lt;Array&lt;{ year: string; isActive: boolean }&gt;&gt;([]);
  const [userCounts, setUserCounts] = useState({ active: 0, mustChangePassword: 0, disabled: 0 });
  const [allowedDomainsCount, setAllowedDomainsCount] = useState&lt;number | null&gt;(null);
  const [classSummary, setClassSummary] = useState({ classes: 0, subjects: 0, teachers: 0, yearsClosed: 0 });
  const [appointmentSummary, setAppointmentSummary] = useState({ pending: 0, confirmed: 0, cancelled: 0 });
  const [statsError, setStatsError] = useState('');

  useEffect(() =&gt; {
    const scrollTargets: { [key: string]: string } = {
      'contenu-site-public': 'admin-card-contenu-site-public',
      'utilisateurs-acces': 'admin-card-utilisateurs-acces',
      'classes-matieres': 'admin-card-classes-matieres',
      'annees-academiques': 'admin-card-annees-academiques',
      'parents-eleves': 'admin-card-parents-eleves',
      'emplois-du-temps': 'admin-card-emplois-du-temps',
      'notes-verrous': 'admin-card-notes-verrous',
      'rendez-vous': 'admin-card-rendez-vous',
      'parametres-securite': 'admin-card-parametres-securite'
    };

    const locationState = location.state as LocationState | null;
    const targetKey = locationState?.scrollTo;
    if (targetKey &amp;&amp; scrollTargets[targetKey]) {
      const element = document.getElementById(scrollTargets[targetKey]);
      if (element) {
        element.scrollIntoView({ behavior: 'auto', block: 'center' });
        element.classList.add('ring-2', 'ring-[var(--color-primary-gold)]', 'ring-offset-2');
        setTimeout(() =&gt; {
          element.classList.remove('ring-2', 'ring-[var(--color-primary-gold)]', 'ring-offset-2');
        }, 2000);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() =&gt; {
    const fetchDashboardData = async () =&gt; {
      try {
        setStatsError('');
        const [
          activeRes,
          mustChangeRes,
          disabledRes,
          teachersRes,
          settingsRes,
          yearsRes,
          classesRes,
          subjectsRes,
          appointmentsRes
        ] = await Promise.all([
          api.get('/api/users', { params: { status: 'active', limit: 1 } }),
          api.get('/api/users', { params: { status: 'mustChangePassword', limit: 1 } }),
          api.get('/api/users', { params: { status: 'disabled', limit: 1 } }),
          api.get('/api/users', { params: { role: 'TEACHER', limit: 1 } }),
          api.get('/api/settings'),
          api.get('/api/academic-years'),
          api.get('/api/classes'),
          api.get('/api/subjects'),
          api.get('/api/appointments')
        ]);

        const activeTotal = activeRes.data?.data?.pagination?.total ?? 0;
        const mustChangeTotal = mustChangeRes.data?.data?.pagination?.total ?? 0;
        const disabledTotal = disabledRes.data?.data?.pagination?.total ?? 0;

        setUserCounts({ active: activeTotal, mustChangePassword: mustChangeTotal, disabled: disabledTotal });

        const teacherTotal = teachersRes.data?.data?.pagination?.total ?? 0;

        const settings = settingsRes.data;
        const email = settings?.data?.general?.email || '';
        const domain = email.includes('@') ? email.split('@')[1] : '';
        setAllowedDomainsCount(domain ? 1 : 0);

        const yearsResult = yearsRes.data;
        const years = Array.isArray(yearsResult?.data)
          ? yearsResult.data
              .map((item: { year?: string; isActive?: boolean }) =&gt; ({
                year: item.year || '',
                isActive: Boolean(item.isActive)
              }))
              .filter((item: { year: string }) =&gt; item.year)
          : [];
        setAcademicYears(years);
        setClassSummary((prev) =&gt; ({
          ...prev,
          yearsClosed: years.filter((item: { isActive: boolean }) =&gt; !item.isActive).length
        }));

        const classesCount = classesRes.data?.data?.length ?? 0;
        const subjectsCount = subjectsRes.data?.data?.length ?? 0;

        setClassSummary((prev) =&gt; ({
          ...prev,
          classes: classesCount,
          subjects: subjectsCount,
          teachers: teacherTotal
        }));

        const appointmentsResult = appointmentsRes.data;
        const items = Array.isArray(appointmentsResult?.data?.appointments)
          ? appointmentsResult.data.appointments
          : [];
        setAppointmentSummary({
          pending: items.filter((item: { status?: string }) =&gt; item.status === 'PENDING').length,
          confirmed: items.filter((item: { status?: string }) =&gt; item.status === 'CONFIRMED').length,
          cancelled: items.filter((item: { status?: string }) =&gt; item.status === 'CANCELLED').length
        });
      } catch (error) {
        console.error('Error loading admin dashboard:', error);
        setStatsError('Erreur lors du chargement des statistiques.');
      }
    };

    fetchDashboardData();
  }, []);

  const quickStats = [
    { label: 'Comptes actifs', value: userCounts.active.toLocaleString('fr-FR'), icon: Users, tone: 'bg-blue-100 text-blue-700' },
    { label: 'En attente (must change pw)', value: userCounts.mustChangePassword.toLocaleString('fr-FR'), icon: ShieldCheck, tone: 'bg-amber-100 text-amber-700' },
    { label: 'Comptes désactivés', value: userCounts.disabled.toLocaleString('fr-FR'), icon: UserX, tone: 'bg-rose-100 text-rose-700' },
    { label: 'Domaines autorisés', value: allowedDomainsCount === null ? '-' : allowedDomainsCount.toString(), icon: MailCheck, tone: 'bg-emerald-100 text-emerald-700' }
  ];

  const sections: Section[] = [
    {
      title: 'Contenu du Site Public',
      icon: Globe,
      links: [
        { label: "Éditer page d'accueil", to: '/admin/mainpage', scrollTo: 'contenu-site-public' },
        { label: 'Éditer page Admissions', to: '/admin/content/admissions', scrollTo: 'contenu-site-public' },
        { label: 'Éditer page Niveaux', to: '/admin/content/programs', scrollTo: 'contenu-site-public' },
        { label: 'Éditer page Vie scolaire', to: '/admin/content/campuslife', scrollTo: 'contenu-site-public' }
      ],
      badges: ['Contenu public', 'En temps réel', 'Admin uniquement']
    },
    {
      title: 'Utilisateurs &amp; Accès',
      icon: Users,
      links: [
        { label: 'Créer un utilisateur', to: '/admin/users', scrollTo: 'utilisateurs-acces' },
        { label: 'Activer / désactiver', to: '/admin/users', scrollTo: 'utilisateurs-acces' },
        { label: 'Forcer mot de passe', to: '/admin/users', scrollTo: 'utilisateurs-acces' }
      ],
      badges: ['Admin-only creation', 'Email institutionnel', 'mustChangePassword']
    },
    {
      title: 'Classes &amp; Matières',
      icon: ClipboardList,
      links: [
        { label: 'Gérer les classes (CI-CM2)', to: '/admin/classes', scrollTo: 'classes-matieres' },
        { label: 'Gérer les matières', to: '/admin/subjects', scrollTo: 'classes-matieres' },
        { label: 'Assigner enseignants', to: '/admin/classes', scrollTo: 'classes-matieres' }
      ],
      badges: ['École primaire', 'Matières dynamiques']
    },
    {
      title: 'Années académiques',
      icon: CalendarClock,
      links: [
        { label: 'Gérer les années', to: '/admin/years', scrollTo: 'annees-academiques' },
        { label: 'Gérer les trimestres', to: '/admin/years', scrollTo: 'annees-academiques' },
        { label: 'Activer année/trimestre', to: '/admin/years', scrollTo: 'annees-academiques' }
      ],
      badges: ['Verrou par trimestre']
    },
    {
      title: 'Parents &amp; Élèves',
      icon: LinkIcon,
      links: [
        { label: 'Lier parents &amp; élèves', to: '/admin/parents-students', scrollTo: 'parents-eleves' },
        { label: 'Voir élèves liés', to: '/admin/parents-students', scrollTo: 'parents-eleves' }
      ],
      badges: ['Multi-élèves par parent']
    },
    {
      title: 'Emplois du temps',
      icon: LayoutTemplate,
      links: [
        { label: 'Publier un horaire', to: '/admin/schedules', scrollTo: 'emplois-du-temps' },
        { label: 'Par classe', to: '/admin/schedules', scrollTo: 'emplois-du-temps' }
      ],
      badges: ['Version publiée']
    },
    {
      title: 'Notes &amp; Verrous',
      icon: FileSpreadsheet,
      links: [
        { label: 'Suivi des saisies', to: '/admin/grade-locks', scrollTo: 'notes-verrous' },
        { label: 'Verrouiller une période', to: '/admin/grade-locks', scrollTo: 'notes-verrous' }
      ],
      badges: ['Droits enseignants']
    },
    {
      title: 'Rendez-vous',
      icon: BellRing,
      links: [
        { label: 'Requêtes en attente', to: '/admin/appointments', scrollTo: 'rendez-vous' },
        { label: 'Réassigner ou annuler', to: '/admin/appointments', scrollTo: 'rendez-vous' }
      ],
      badges: ['Contrôle admin']
    },
    {
      title: 'Paramètres &amp; Sécurité',
      icon: Settings,
      links: [
        { label: 'Domaine email', to: '/admin/settings', scrollTo: 'parametres-securite' },
        { label: 'Politique mot de passe', to: '/admin/settings', scrollTo: 'parametres-securite' },
        { label: 'CORS / Origines', to: '/admin/settings', scrollTo: 'parametres-securite' }
      ],
      badges: ['Pas de signup public', 'Taux limites auth']
    }
  ];

  const activity: Array&lt;{ who: string; what: string; detail: string; status: string }&gt; = [];

  const cardIdByTitle: Record&lt;string, string&gt; = {
    'Contenu du Site Public': 'admin-card-contenu-site-public',
    'Utilisateurs &amp; Accès': 'admin-card-utilisateurs-acces',
    'Classes &amp; Matières': 'admin-card-classes-matieres',
    'Années académiques': 'admin-card-annees-academiques',
    'Parents &amp; Élèves': 'admin-card-parents-eleves',
    'Emplois du temps': 'admin-card-emplois-du-temps',
    'Notes &amp; Verrous': 'admin-card-notes-verrous',
    'Rendez-vous': 'admin-card-rendez-vous',
    'Paramètres &amp; Sécurité': 'admin-card-parametres-securite'
  };

  return (
    &lt;div className="section"&gt;
      &lt;div className="section-content"&gt;
        &lt;div className="space-y-8"&gt;
          &lt;div className="gradient-card rounded-2xl p-8 text-white flex flex-col gap-4 md:flex-row md:items-center md:justify-between"&gt;
            &lt;div&gt;
              &lt;h1 className="text-3xl font-bold mb-1"&gt;Console d'administration&lt;/h1&gt;
              &lt;p className="text-white/80 text-lg"&gt;Gestion centralisée des accès, classes, emplois du temps et sécurité&lt;/p&gt;
              &lt;p className="text-white/70 text-sm"&gt;Connecté en tant que {user?.firstName} {user?.lastName}&lt;/p&gt;
            &lt;/div&gt;
            &lt;div className="flex flex-col md:items-end gap-3"&gt;
              &lt;label className="text-sm text-white/80"&gt;Année académique&lt;/label&gt;
              &lt;select className="bg-white/10 border border-white/30 rounded-lg px-4 py-2 text-white"&gt;
                {academicYears.length === 0 &amp;&amp; (
                  &lt;option value="" className="text-black"&gt;Aucune année&lt;/option&gt;
                )}
                {academicYears.map((year) =&gt; (
                  &lt;option key={year.year} value={year.year} className="text-black"&gt;{year.year}&lt;/option&gt;
                ))}
              &lt;/select&gt;
              &lt;Link to="/admin/users" className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-semibold shadow border border-white/20 hover:bg-white/20 transition-all"&gt;
                &lt;Users className="w-4 h-4" /&gt; Créer un utilisateur
              &lt;/Link&gt;
            &lt;/div&gt;
          &lt;/div&gt;

          &lt;div className="grid grid-cols-1 md:grid-cols-4 gap-4"&gt;
            {quickStats.map((stat, idx) =&gt; {
              const Icon = stat.icon;
              return (
                &lt;div key={idx} className="card p-4 flex items-center gap-3"&gt;
                  &lt;div className={`w-11 h-11 rounded-lg flex items-center justify-center ${stat.tone}`}&gt;
                    &lt;Icon className="w-5 h-5" /&gt;
                  &lt;/div&gt;
                  &lt;div&gt;
                    &lt;div className="text-sm text-[var(--color-text-secondary)]"&gt;{stat.label}&lt;/div&gt;
                    &lt;div className="text-xl font-bold text-[var(--color-text-primary)]"&gt;{stat.value}&lt;/div&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
              );
            })}
          &lt;/div&gt;

          {statsError &amp;&amp; (
            &lt;div className="text-sm text-red-600"&gt;{statsError}&lt;/div&gt;
          )}

          &lt;div className="grid grid-cols-1 lg:grid-cols-3 gap-6"&gt;
            {sections.map((section, idx) =&gt; {
              const Icon = section.icon;
              const cardId = cardIdByTitle[section.title];
              return (
                &lt;div
                  key={idx}
                  id={cardId}
                  className="card p-5 flex flex-col gap-4 transition-all duration-300"
                &gt;
                  &lt;div className="flex items-center justify-between"&gt;
                    &lt;div className="flex items-center gap-3"&gt;
                      &lt;div className="w-10 h-10 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center"&gt;
                        &lt;Icon className="w-5 h-5 text-[var(--color-primary-navy)]" /&gt;
                      &lt;/div&gt;
                      &lt;div&gt;
                        &lt;h3 className="text-lg font-semibold text-[var(--color-text-primary)]"&gt;{section.title}&lt;/h3&gt;
                        &lt;p className="text-sm text-[var(--color-text-muted)]"&gt;Accès réservé Administrateur&lt;/p&gt;
                      &lt;/div&gt;
                    &lt;/div&gt;
                    &lt;Lock className="w-4 h-4 text-[var(--color-text-muted)]" /&gt;
                  &lt;/div&gt;
                  &lt;div className="flex flex-wrap gap-2"&gt;
                    {section.badges.map((badge) =&gt; (
                      &lt;span key={badge} className="text-xs px-2 py-1 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"&gt;
                        {badge}
                      &lt;/span&gt;
                    ))}
                  &lt;/div&gt;
                  &lt;div className="space-y-2"&gt;
                    {section.links.map((link) =&gt; (
                      &lt;Link
                        key={link.label}
                        to={link.to}
                        state={link.scrollTo ? { scrollTo: link.scrollTo } : undefined}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                      &gt;
                        &lt;span&gt;{link.label}&lt;/span&gt;
                        &lt;ShieldCheck className="w-4 h-4 text-[var(--color-primary-navy)]" /&gt;
                      &lt;/Link&gt;
                    ))}
                  &lt;/div&gt;
                &lt;/div&gt;
              );
            })}
          &lt;/div&gt;

          &lt;div className="grid grid-cols-1 lg:grid-cols-3 gap-6"&gt;
            &lt;div className="card p-5"&gt;
              &lt;div className="flex items-center justify-between mb-4"&gt;
                &lt;h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2"&gt;
                  &lt;UserCheck className="w-5 h-5 text-[var(--color-primary-navy)]" /&gt; Flux comptes récents
                &lt;/h3&gt;
                &lt;Link to="/admin/users" className="text-sm text-[var(--color-primary-navy)] hover:underline"&gt;Gérer&lt;/Link&gt;
              &lt;/div&gt;
              &lt;div className="space-y-3"&gt;
                {activity.map((row, idx) =&gt; (
                  &lt;div key={idx} className="p-3 rounded-lg bg-[var(--color-bg-secondary)]"&gt;
                    &lt;div className="flex items-center justify-between text-sm text-[var(--color-text-primary)]"&gt;
                      &lt;span className="font-medium"&gt;{row.what}&lt;/span&gt;
                      &lt;span className="text-xs text-[var(--color-text-muted)]"&gt;{row.status}&lt;/span&gt;
                    &lt;/div&gt;
                    &lt;div className="text-xs text-[var(--color-text-secondary)]"&gt;{row.detail}&lt;/div&gt;
                  &lt;/div&gt;
                ))}
                {activity.length === 0 &amp;&amp; (
                  &lt;div className="text-sm text-[var(--color-text-secondary)]"&gt;
                    Aucune activite recente.
                  &lt;/div&gt;
                )}
              &lt;/div&gt;
            &lt;/div&gt;

            &lt;div className="card p-5"&gt;
              &lt;h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2"&gt;
                &lt;BookOpen className="w-5 h-5 text-[var(--color-primary-navy)]" /&gt; Classes &amp; matières (résumé)
              &lt;/h3&gt;
              &lt;ul className="space-y-2 text-sm text-[var(--color-text-primary)]"&gt;
                &lt;li className="flex justify-between"&gt;&lt;span&gt;Classes actives&lt;/span&gt;&lt;span className="font-semibold"&gt;{classSummary.classes}&lt;/span&gt;&lt;/li&gt;
                &lt;li className="flex justify-between"&gt;&lt;span&gt;Matières&lt;/span&gt;&lt;span className="font-semibold"&gt;{classSummary.subjects}&lt;/span&gt;&lt;/li&gt;
                &lt;li className="flex justify-between"&gt;&lt;span&gt;Enseignants assignés&lt;/span&gt;&lt;span className="font-semibold"&gt;{classSummary.teachers}&lt;/span&gt;&lt;/li&gt;
                &lt;li className="flex justify-between"&gt;&lt;span&gt;Années clôturées&lt;/span&gt;&lt;span className="font-semibold"&gt;{classSummary.yearsClosed}&lt;/span&gt;&lt;/li&gt;
              &lt;/ul&gt;
            &lt;/div&gt;

            &lt;div className="card p-5"&gt;
              &lt;h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2"&gt;
                &lt;BellRing className="w-5 h-5 text-[var(--color-primary-navy)]" /&gt; Rendez-vous et demandes
              &lt;/h3&gt;
              &lt;ul className="space-y-2 text-sm text-[var(--color-text-primary)]"&gt;
                &lt;li className="flex justify-between"&gt;&lt;span&gt;Requêtes en attente&lt;/span&gt;&lt;span className="font-semibold"&gt;{appointmentSummary.pending}&lt;/span&gt;&lt;/li&gt;
                &lt;li className="flex justify-between"&gt;&lt;span&gt;Validées&lt;/span&gt;&lt;span className="font-semibold"&gt;{appointmentSummary.confirmed}&lt;/span&gt;&lt;/li&gt;
                &lt;li className="flex justify-between"&gt;&lt;span&gt;Annulées&lt;/span&gt;&lt;span className="font-semibold"&gt;{appointmentSummary.cancelled}&lt;/span&gt;&lt;/li&gt;
              &lt;/ul&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
};

export default AdminDashboard;</code></pre>

## 4. app/src/pages/dashboard/parent/ParentDashboard.tsx

<pre><code>import type React from 'react';
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
  enrollments: Array&lt;{
    course: {
      name: string;
      program: {
        name: string;
      };
    };
  }&gt;;
}

const ParentDashboard: React.FC = () =&gt; {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [linkedStudents, setLinkedStudents] = useState&lt;LinkedStudent[]&gt;([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: actionsRef, isVisible: actionsVisible } = useScrollReveal();
  const { ref: childrenRef, isVisible: childrenVisible } = useScrollReveal();
  const { ref: activityRef, isVisible: activityVisible } = useScrollReveal();

  useEffect(() =&gt; {
    console.log('[ParentDashboard] auth state:', {
      userId: user?.id,
      role: user?.role,
      loading
    });

    // Fetch linked students
    const fetchLinkedStudents = async () =&gt; {
      try {
        const response = await api.get('/api/parent-students/my-students');
        const data = response.data;

        console.log('[ParentDashboard] my-students status:', response.status);

        if (data.success &amp;&amp; data.data.students) {
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
    if (targetKey &amp;&amp; scrollTargets[targetKey]) {
      const element = document.getElementById(scrollTargets[targetKey]);
      if (element) {
        element.scrollIntoView({ behavior: 'auto', block: 'center' });
        element.classList.add('ring-2', 'ring-[var(--color-primary-gold)]', 'ring-offset-2');
        setTimeout(() =&gt; {
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

  const recentActivity: Array&lt;{ icon: React.ElementType; text: string; time: string; color: string }&gt; = [];

  return (
    &lt;div className="section"&gt;
      &lt;div className="section-content"&gt;
        &lt;div className="space-y-8"&gt;
      {/* Welcome Header */}
      &lt;div
        ref={headerRef}
        className={`gradient-card rounded-2xl p-8 text-white ${headerVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
      &gt;
        &lt;h1 className="text-3xl font-bold mb-2"&gt;
          Bonjour, {user?.firstName} {user?.lastName}
        &lt;/h1&gt;
        &lt;p className="text-white/80 text-lg"&gt;
          Bienvenue dans votre espace parent au Forum de L'excellence
        &lt;/p&gt;
      &lt;/div&gt;

      {/* Quick Actions */}
      &lt;div ref={actionsRef} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 ${actionsVisible ? 'animate-fade-in-up' : 'opacity-0'}`}&gt;
        {quickActions.map((action, index) =&gt; {
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
            &lt;div key={index} className={`${actionsVisible ? 'animate-fade-in-up' : 'opacity-0'} ${delayClass}`}&gt;
              &lt;Link
                to={action.href}
                state={state}
                id={cardId}
                className="card p-6 text-center group hover:shadow-lg transition-all duration-300 h-full flex flex-col items-center justify-center"
              &gt;
                &lt;Icon className={`w-8 h-8 mx-auto mb-3 ${action.color} group-hover:scale-110 transition-transform`} /&gt;
                &lt;h3 className="text-sm font-semibold text-[var(--color-text-primary)] whitespace-normal"&gt;{action.name}&lt;/h3&gt;
              &lt;/Link&gt;
            &lt;/div&gt;
          );
        })}
      &lt;/div&gt;

      {/* Children Overview */}
      &lt;div ref={childrenRef} className={`space-y-4 ${childrenVisible ? 'animate-fade-in-up' : 'opacity-0'}`}&gt;
        &lt;h2 className="text-2xl font-bold text-[var(--color-text-primary)]"&gt;Mes Enfants&lt;/h2&gt;
        
        {loadingStudents ? (
          &lt;div className="card p-8 text-center"&gt;
            &lt;p className="text-[var(--color-text-secondary)]"&gt;Chargement des élèves...&lt;/p&gt;
          &lt;/div&gt;
        ) : linkedStudents.length === 0 ? (
          &lt;div className="card p-8 text-center"&gt;
            &lt;Users className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-muted)]" /&gt;
            &lt;h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2"&gt;Aucun enfant associé pour le moment&lt;/h3&gt;
            &lt;p className="text-[var(--color-text-secondary)]"&gt;
              Veuillez contacter l'administration pour lier votre compte à celui de votre enfant.
            &lt;/p&gt;
          &lt;/div&gt;
        ) : (
          &lt;div className="grid grid-cols-1 lg:grid-cols-2 gap-8"&gt;
            {linkedStudents.map((student, index) =&gt; {
              const delayClass = ['', 'animation-delay-150'][index] || '';
              const courseName = student.enrollments?.[0]?.course?.program?.name || 'Non inscrit';
              
              return (
                &lt;div key={student.id} className={`card p-6 ${childrenVisible ? 'animate-fade-in-up' : 'opacity-0'} ${delayClass}`}&gt;
                  &lt;div className="flex items-center justify-between mb-6"&gt;
                    &lt;div&gt;
                      &lt;h3 className="text-xl font-semibold text-[var(--color-text-primary)]"&gt;
                        {student.user.firstName} {student.user.lastName}
                      &lt;/h3&gt;
                      &lt;p className="text-sm text-[var(--color-text-secondary)]"&gt;{courseName}&lt;/p&gt;
                    &lt;/div&gt;
                    &lt;div className="w-12 h-12 rounded-full bg-[var(--color-primary-gold-light)] flex items-center justify-center"&gt;
                      &lt;Users className="w-6 h-6 text-[var(--color-primary-navy)]" /&gt;
                    &lt;/div&gt;
                  &lt;/div&gt;

                  &lt;div className="grid grid-cols-3 gap-4 mb-6"&gt;
                    &lt;div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-lg"&gt;
                      &lt;div className="text-2xl font-bold text-[var(--color-primary-navy)]"&gt;{student.gpa || '0.00'}&lt;/div&gt;
                      &lt;p className="text-xs text-[var(--color-text-secondary)]"&gt;Moyenne&lt;/p&gt;
                    &lt;/div&gt;
                    &lt;div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-lg"&gt;
                      &lt;div className="text-2xl font-bold text-[var(--color-primary-navy)]"&gt;-&lt;/div&gt;
                      &lt;p className="text-xs text-[var(--color-text-secondary)]"&gt;Rang&lt;/p&gt;
                    &lt;/div&gt;
                    &lt;div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-lg"&gt;
                      &lt;div className="text-2xl font-bold text-[var(--color-primary-navy)]"&gt;-&lt;/div&gt;
                      &lt;p className="text-xs text-[var(--color-text-secondary)]"&gt;Présence&lt;/p&gt;
                    &lt;/div&gt;
                  &lt;/div&gt;

                  &lt;div className="space-y-3"&gt;
                    &lt;div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"&gt;
                      &lt;div className="flex items-center gap-2"&gt;
                        &lt;CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" /&gt;
                        &lt;span className="text-sm text-[var(--color-text-primary)]"&gt;Statut&lt;/span&gt;
                      &lt;/div&gt;
                      &lt;span className="text-sm font-medium text-green-700 dark:text-green-400"&gt;{student.status}&lt;/span&gt;
                    &lt;/div&gt;
                    
                    &lt;div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"&gt;
                      &lt;div className="flex items-center gap-2"&gt;
                        &lt;BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" /&gt;
                        &lt;span className="text-sm text-[var(--color-text-primary)]"&gt;Email&lt;/span&gt;
                      &lt;/div&gt;
                      &lt;span className="text-sm text-[var(--color-text-secondary)]"&gt;{student.user.email}&lt;/span&gt;
                    &lt;/div&gt;
                  &lt;/div&gt;

                  &lt;div className="mt-6 flex gap-2"&gt;
                    &lt;Link to="/parent/grades" className="btn-accent flex-1 text-center"&gt;
                      Voir les notes
                    &lt;/Link&gt;
                    &lt;Link to="/parent/schedule" className="btn-secondary flex-1 text-center"&gt;
                      Emploi du temps
                    &lt;/Link&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
              );
            })}
          &lt;/div&gt;
        )}
      &lt;/div&gt;

      {/* Recent Activity */}
      &lt;div
        ref={activityRef}
        className={`card p-6 ${activityVisible ? 'animate-slide-in-up' : 'opacity-0'}`}
      &gt;
        &lt;h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6"&gt;
          Activité Récente
        &lt;/h2&gt;
        &lt;div className="space-y-4"&gt;
          {recentActivity.map((activity, index) =&gt; {
            const Icon = activity.icon;
            return (
              &lt;div key={index} className="flex items-center gap-4 p-3 bg-[var(--color-bg-secondary)] rounded-lg"&gt;
                &lt;Icon className={`w-5 h-5 ${activity.color}`} /&gt;
                &lt;div className="flex-1"&gt;
                  &lt;p className="text-sm text-[var(--color-text-primary)]"&gt;{activity.text}&lt;/p&gt;
                  &lt;p className="text-xs text-[var(--color-text-muted)]"&gt;{activity.time}&lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            );
          })}
          {recentActivity.length === 0 &amp;&amp; (
            &lt;div className="text-sm text-[var(--color-text-secondary)]"&gt;
              Aucune activite recente.
            &lt;/div&gt;
          )}
        &lt;/div&gt;
      &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
};

export default ParentDashboard;</code></pre>

## 5. app/src/pages/dashboard/student/StudentDashboard.tsx

<pre><code>import type React from 'react';
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

const StudentDashboard: React.FC = () =&gt; {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState([
    { label: 'Moyenne Générale', value: '-', icon: Award, color: 'bg-blue-500' },
    { label: 'Absences', value: '-', icon: Clock, color: 'bg-amber-500' },
    { label: 'Devoirs Rendus', value: '-', icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Bon Comportement', value: '-', icon: BookOpen, color: 'bg-purple-500' }
  ]);
  const [recentGrades, setRecentGrades] = useState&lt;GradeItem[]&gt;([]);
  const [upcomingEvents, setUpcomingEvents] = useState&lt;EventItem[]&gt;([]);
  const [progress, setProgress] = useState({ semester: '-', attendance: '-', mention: '-' });
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: actionsRef, isVisible: actionsVisible } = useScrollReveal();
  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal();
  const { ref: gradesRef, isVisible: gradesVisible } = useScrollReveal();
  const { ref: eventsRef, isVisible: eventsVisible } = useScrollReveal();
  const { ref: progressRef, isVisible: progressVisible } = useScrollReveal();

  useEffect(() =&gt; {
    const scrollTargets: { [key: string]: string } = {
      'student-grades': 'student-card-grades',
      'student-schedule': 'student-card-schedule',
      'student-lessons': 'student-card-lessons',
      'student-subjects': 'student-card-subjects',
      'student-appointments': 'student-card-appointments',
      'student-report-cards': 'student-card-report-cards'
    };

    const targetKey = location.state?.scrollTo;
    if (targetKey &amp;&amp; scrollTargets[targetKey]) {
      const element = document.getElementById(scrollTargets[targetKey]);
      if (element) {
        element.scrollIntoView({ behavior: 'auto', block: 'center' });
        element.classList.add('ring-2', 'ring-[var(--color-primary-gold)]', 'ring-offset-2');
        setTimeout(() =&gt; {
          element.classList.remove('ring-2', 'ring-[var(--color-primary-gold)]', 'ring-offset-2');
        }, 2000);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() =&gt; {
    const fetchDashboardData = async () =&gt; {
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
          const allAssignments = courses.flatMap((course: any) =&gt; {
            const assignments = Array.isArray(course.assignments) ? course.assignments : [];
            return assignments.map((assignment: any) =&gt; {
              const pointsEarned = assignment.pointsEarned?.toString?.() ?? assignment.pointsEarned;
              const pointsPossible = assignment.pointsPossible?.toString?.() ?? assignment.pointsPossible;
              return {
                course: course.courseName || 'Cours',
                grade: pointsEarned &amp;&amp; pointsPossible ? `${pointsEarned}/${pointsPossible}` : '-',
                date: assignment.gradeDate || assignment.createdAt || '',
                type: assignment.assignmentType || 'Devoir'
              } as GradeItem;
            });
          });

          allAssignments.sort((a: GradeItem, b: GradeItem) =&gt; b.date.localeCompare(a.date));
          assignmentsCount = allAssignments.length;
          setRecentGrades(allAssignments.slice(0, 4));
        } else {
          setRecentGrades([]);
        }

        if (scheduleRes.ok) {
          const scheduleResult = await scheduleRes.json();
          const weeklySchedule = scheduleResult?.data?.weeklySchedule || {};
          const events = Object.entries(weeklySchedule).flatMap(([dayName, schedules]) =&gt; {
            if (!Array.isArray(schedules)) return [];
            return schedules.map((schedule: any) =&gt; ({
              title: schedule.courseName || 'Cours',
              date: dayName,
              time: schedule.startTime || ''
            }));
          });
          setUpcomingEvents(events.slice(0, 3));
          const semesterLabel = scheduleResult?.data?.semester || '-';
          setProgress((prev) =&gt; ({ ...prev, semester: semesterLabel }));
        } else {
          setUpcomingEvents([]);
        }

        const averageValue = overallPercentage !== null
          ? `${overallPercentage}%`
          : currentGPA !== null
            ? currentGPA.toString()
            : '-';

        const mention = overallPercentage !== null
          ? overallPercentage &gt;= 90
            ? 'A'
            : overallPercentage &gt;= 80
              ? 'B'
              : overallPercentage &gt;= 70
                ? 'C'
                : overallPercentage &gt;= 60
                  ? 'D'
                  : 'E'
          : '-';

        setProgress((prev) =&gt; ({
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
    &lt;div className="section"&gt;
      &lt;div className="section-content"&gt;
        &lt;div className="space-y-8"&gt;
      {/* Welcome Header */}
      &lt;div
        ref={headerRef}
        className={`gradient-card rounded-2xl p-8 text-white ${headerVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
      &gt;
        &lt;h1 className="text-3xl font-bold mb-2"&gt;
          Bonjour {user?.firstName} ! &lt;span className="wave"&gt;👋&lt;/span&gt;
        &lt;/h1&gt;
        &lt;p className="text-white/80 text-lg"&gt;
          Bienvenue dans ton espace élève au Forum de L'excellence
        &lt;/p&gt;
      &lt;/div&gt;

      {/* Quick Actions */}
      &lt;div ref={actionsRef} className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 ${actionsVisible ? 'animate-fade-in-up' : 'opacity-0'}`}&gt;
        {quickActions.map((action, index) =&gt; {
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
            &lt;div key={index} ref={ref} className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${delayClass}`}&gt;
              &lt;Link
                to={action.href}
                state={state}
                id={cardId}
                className="card p-6 text-center group hover:shadow-lg transition-all duration-300 h-full flex flex-col items-center justify-center"
              &gt;
                &lt;Icon className={`w-8 h-8 mx-auto mb-3 ${action.color} group-hover:scale-110 transition-transform`} /&gt;
                &lt;h3 className="text-sm font-semibold text-[var(--color-text-primary)] whitespace-normal"&gt;{action.name}&lt;/h3&gt;
              &lt;/Link&gt;
            &lt;/div&gt;
          );
        })}
      &lt;/div&gt;

      {/* Stats Grid */}
      &lt;div ref={statsRef} className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${statsVisible ? 'animate-fade-in-up' : 'opacity-0'}`}&gt;
        {stats.map((stat, index) =&gt; {
          const Icon = stat.icon;
          const { ref, isVisible } = useScrollReveal();
          const delayClass = ['', 'animation-delay-100', 'animation-delay-200', 'animation-delay-300'][index] || '';
          return (
            &lt;div key={index} ref={ref} className={`card p-6 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${delayClass}`}&gt;
              &lt;div className="flex items-center justify-between mb-4"&gt;
                &lt;div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}&gt;
                  &lt;Icon className="w-6 h-6 text-white" /&gt;
                &lt;/div&gt;
                &lt;TrendingUp className="w-5 h-5 text-green-500" /&gt;
              &lt;/div&gt;
              &lt;div className="text-2xl font-bold text-[var(--color-text-primary)] mb-1"&gt;
                {stat.value}
              &lt;/div&gt;
              &lt;div className="text-sm text-[var(--color-text-secondary)]"&gt;
                {stat.label}
              &lt;/div&gt;
            &lt;/div&gt;
          );
        })}
      &lt;/div&gt;

      {loadingData &amp;&amp; (
        &lt;div className="text-sm text-[var(--color-text-secondary)]"&gt;Chargement du tableau de bord...&lt;/div&gt;
      )}
      {loadError &amp;&amp; (
        &lt;div className="text-sm text-red-600"&gt;{loadError}&lt;/div&gt;
      )}

      &lt;div className="grid grid-cols-1 lg:grid-cols-2 gap-8"&gt;
        {/* Recent Grades */}
        &lt;div
          ref={gradesRef}
          className={`card p-6 ${gradesVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
        &gt;
          &lt;div className="flex items-center justify-between mb-6"&gt;
            &lt;h2 className="text-xl font-semibold text-[var(--color-text-primary)]"&gt;
              Dernières Notes
            &lt;/h2&gt;
            &lt;Link to="/student/grades" state={{ scrollTo: 'student-grades' }} className="text-sm text-[var(--color-primary-navy)] hover:underline"&gt;
              Voir tout
            &lt;/Link&gt;
          &lt;/div&gt;
          &lt;div className="space-y-4"&gt;
            {recentGrades.map((grade, index) =&gt; (
              &lt;div key={index} className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-lg"&gt;
                &lt;div&gt;
                  &lt;h4 className="font-medium text-[var(--color-text-primary)]"&gt;{grade.course}&lt;/h4&gt;
                  &lt;p className="text-sm text-[var(--color-text-muted)]"&gt;{grade.type} - {grade.date}&lt;/p&gt;
                &lt;/div&gt;
                &lt;span className="text-lg font-bold text-[var(--color-primary-navy)]"&gt;{grade.grade}&lt;/span&gt;
              &lt;/div&gt;
            ))}
            {recentGrades.length === 0 &amp;&amp; (
              &lt;div className="text-sm text-[var(--color-text-secondary)]"&gt;
                Aucune note recente.
              &lt;/div&gt;
            )}
          &lt;/div&gt;
        &lt;/div&gt;

        {/* Upcoming Events */}
        &lt;div
          ref={eventsRef}
          className={`card p-6 ${eventsVisible ? 'animate-slide-in-right' : 'opacity-0'}`}
        &gt;
          &lt;div className="flex items-center justify-between mb-6"&gt;
            &lt;h2 className="text-xl font-semibold text-[var(--color-text-primary)]"&gt;
              Prochaines Échéances
            &lt;/h2&gt;
            &lt;Link to="/student/schedule" state={{ scrollTo: 'student-schedule' }} className="text-sm text-[var(--color-primary-navy)] hover:underline"&gt;
              Voir l'emploi du temps
            &lt;/Link&gt;
          &lt;/div&gt;
          &lt;div className="space-y-4"&gt;
            {upcomingEvents.map((event, index) =&gt; (
              &lt;div key={index} className="flex items-start gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg"&gt;
                &lt;div className="w-10 h-10 rounded-lg bg-[var(--color-primary-gold-light)] flex items-center justify-center flex-shrink-0"&gt;
                  &lt;Calendar className="w-5 h-5 text-[var(--color-primary-navy)]" /&gt;
                &lt;/div&gt;
                &lt;div className="flex-1"&gt;
                  &lt;h4 className="font-medium text-[var(--color-text-primary)]"&gt;{event.title}&lt;/h4&gt;
                  &lt;p className="text-sm text-[var(--color-text-muted)]"&gt;
                    {event.date} à {event.time}
                  &lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            ))}
            {upcomingEvents.length === 0 &amp;&amp; (
              &lt;div className="text-sm text-[var(--color-text-secondary)]"&gt;
                Aucun evenement planifie.
              &lt;/div&gt;
            )}
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      {/* Academic Progress */}
      &lt;div
        ref={progressRef}
        className={`card p-6 ${progressVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
      &gt;
        &lt;h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6"&gt;
          Progression Académique
        &lt;/h2&gt;
        &lt;div className="grid grid-cols-1 md:grid-cols-3 gap-6"&gt;
          &lt;div className={`text-center p-6 bg-[var(--color-bg-secondary)] rounded-lg ${progressVisible ? 'animation-delay-100 animate-fade-in-up' : 'opacity-0'}`}&gt;
            &lt;div className="text-3xl font-bold text-[var(--color-primary-navy)] mb-2"&gt;{progress.semester}&lt;/div&gt;
            &lt;p className="text-sm text-[var(--color-text-secondary)]"&gt;Semestre&lt;/p&gt;
            &lt;p className="text-xs text-[var(--color-text-muted)] mt-1"&gt;En cours&lt;/p&gt;
          &lt;/div&gt;
          &lt;div className={`text-center p-6 bg-[var(--color-bg-secondary)] rounded-lg ${progressVisible ? 'animation-delay-200 animate-fade-in-up' : 'opacity-0'}`}&gt;
            &lt;div className="text-3xl font-bold text-green-600 mb-2"&gt;{progress.attendance}&lt;/div&gt;
            &lt;p className="text-sm text-[var(--color-text-secondary)]"&gt;Assiduité&lt;/p&gt;
            &lt;p className="text-xs text-[var(--color-text-muted)] mt-1"&gt;Excellente&lt;/p&gt;
          &lt;/div&gt;
          &lt;div className={`text-center p-6 bg-[var(--color-bg-secondary)] rounded-lg ${progressVisible ? 'animation-delay-300 animate-fade-in-up' : 'opacity-0'}`}&gt;
            &lt;div className="text-3xl font-bold text-[var(--color-success)] mb-2"&gt;{progress.mention}&lt;/div&gt;
            &lt;p className="text-sm text-[var(--color-text-secondary)]"&gt;Mention&lt;/p&gt;
            &lt;p className="text-xs text-[var(--color-text-muted)] mt-1"&gt;Très Bien&lt;/p&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
};

export default StudentDashboard;</code></pre>

## 6. app/src/pages/dashboard/teacher/TeacherDashboard.tsx

<pre><code>import type React from 'react';
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

const TeacherDashboard: React.FC = () =&gt; {
  const { user } = useAuth();
  const location = useLocation();
  const [classCards, setClassCards] = useState&lt;ClassCard[]&gt;([]);
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

  useEffect(() =&gt; {
    const scrollTargets: { [key: string]: string } = {
      'teacher-classes': 'teacher-card-classes',
      'teacher-students': 'teacher-card-students',
      'teacher-grades': 'teacher-card-grades',
      'teacher-schedule': 'teacher-card-schedule'
    };

    const targetKey = location.state?.scrollTo;
    if (targetKey &amp;&amp; scrollTargets[targetKey]) {
      const element = document.getElementById(scrollTargets[targetKey]);
      if (element) {
        element.scrollIntoView({ behavior: 'auto', block: 'center' });
        element.classList.add('ring-2', 'ring-[var(--color-primary-gold)]', 'ring-offset-2');
        setTimeout(() =&gt; {
          element.classList.remove('ring-2', 'ring-[var(--color-primary-gold)]', 'ring-offset-2');
        }, 2000);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() =&gt; {
    const fetchDashboardData = async () =&gt; {
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

        const dayOrder: Record&lt;string, number&gt; = {
          Lundi: 1,
          Mardi: 2,
          Mercredi: 3,
          Jeudi: 4,
          Vendredi: 5,
          Samedi: 6,
          Dimanche: 7
        };

        const items: ScheduleItem[] = Object.entries(teachingSchedule).flatMap(([dayName, schedules]) =&gt; {
          if (!Array.isArray(schedules)) return [];
          return schedules.map((schedule: any) =&gt; ({
            courseId: schedule.courseId,
            courseName: schedule.courseName,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            dayName,
            enrolledStudents: schedule.enrolledStudents
          }));
        });

        items.sort((a, b) =&gt; {
          const dayDiff = (dayOrder[a.dayName] || 99) - (dayOrder[b.dayName] || 99);
          if (dayDiff !== 0) return dayDiff;
          return a.startTime.localeCompare(b.startTime);
        });

        const classMap = new Map&lt;string, ClassCard&gt;();
        items.forEach((item) =&gt; {
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

        const totalStudents = items.reduce((sum, item) =&gt; sum + (item.enrolledStudents || 0), 0);

        const timeToMinutes = (timeValue: string) =&gt; {
          const [hours, minutes] = timeValue.split(':').map(Number);
          if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
          return hours * 60 + minutes;
        };

        const totalMinutes = items.reduce((sum, item) =&gt; {
          if (!item.startTime || !item.endTime) return sum;
          const start = timeToMinutes(item.startTime);
          const end = timeToMinutes(item.endTime);
          const duration = Math.max(0, end - start);
          return sum + duration;
        }, 0);

        const hoursPerWeek = totalMinutes &gt; 0 ? `${(totalMinutes / 60).toFixed(1)}h` : '-';
        const primaryClassName = classList[0]?.name || 'Aucune classe';
        const studentValue = totalStudents &gt; 0 ? totalStudents.toString() : '-';

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

  const pendingTasks: Array&lt;{ task: string; deadline: string; urgent: boolean }&gt; = [];

  return (
    &lt;div className="section"&gt;
      &lt;div className="section-content"&gt;
        &lt;div className="space-y-8"&gt;
      {/* Welcome Header */}
      &lt;div
        ref={headerRef}
        className={`gradient-card rounded-2xl p-8 text-white ${headerVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
      &gt;
        &lt;h1 className="text-3xl font-bold mb-2"&gt;
          Bonjour, {user?.firstName} {user?.lastName}
        &lt;/h1&gt;
        &lt;p className="text-white/80 text-lg"&gt;
          Bienvenue dans votre espace enseignant au Forum de L'excellence
        &lt;/p&gt;
      &lt;/div&gt;

      {/* Quick Actions */}
      &lt;div ref={actionsRef} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${actionsVisible ? 'animate-fade-in-up' : 'opacity-0'}`}&gt;
        {quickActions.map((action, index) =&gt; {
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
            &lt;div key={index} ref={ref} className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${delayClass}`}&gt;
              &lt;Link
                to={action.href}
                state={state}
                id={cardId}
                className="card p-6 text-center group hover:shadow-lg transition-all duration-300 h-full flex flex-col items-center justify-center"
              &gt;
                &lt;Icon className={`w-8 h-8 mx-auto mb-3 ${action.color} group-hover:scale-110 transition-transform`} /&gt;
                &lt;h3 className="text-sm font-semibold text-[var(--color-text-primary)] whitespace-normal"&gt;{action.name}&lt;/h3&gt;
              &lt;/Link&gt;
            &lt;/div&gt;
          );
        })}
      &lt;/div&gt;

      {/* Stats Grid */}
      &lt;div ref={statsRef} className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${statsVisible ? 'animate-fade-in-up' : 'opacity-0'}`}&gt;
        {stats.map((stat, index) =&gt; {
          const Icon = stat.icon;
          const { ref, isVisible } = useScrollReveal();
          const delayClass = ['', 'animation-delay-100', 'animation-delay-200', 'animation-delay-300'][index] || '';
          return (
            &lt;div key={index} ref={ref} className={`card p-6 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${delayClass}`}&gt;
              &lt;div className="flex items-center justify-between mb-4"&gt;
                &lt;div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}&gt;
                  &lt;Icon className="w-6 h-6 text-white" /&gt;
                &lt;/div&gt;
                &lt;TrendingUp className="w-5 h-5 text-green-500" /&gt;
              &lt;/div&gt;
              &lt;div className="text-2xl font-bold text-[var(--color-text-primary)] mb-1"&gt;
                {stat.value}
              &lt;/div&gt;
              &lt;div className="text-sm text-[var(--color-text-secondary)]"&gt;
                {stat.label}
              &lt;/div&gt;
            &lt;/div&gt;
          );
        })}
      &lt;/div&gt;

      {loadingData &amp;&amp; (
        &lt;div className="text-sm text-[var(--color-text-secondary)]"&gt;Chargement du tableau de bord...&lt;/div&gt;
      )}

      {loadError &amp;&amp; (
        &lt;div className="text-sm text-red-600"&gt;{loadError}&lt;/div&gt;
      )}

      &lt;div className="grid grid-cols-1 lg:grid-cols-2 gap-8"&gt;
        {/* My Classes */}
        &lt;div
          ref={classesRef}
          className={`card p-6 ${classesVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
        &gt;
          &lt;div className="flex items-center justify-between mb-6"&gt;
            &lt;h2 className="text-xl font-semibold text-[var(--color-text-primary)]"&gt;
              Mes Classes
            &lt;/h2&gt;
            &lt;Link to="/teacher/classes" state={{ scrollTo: 'teacher-classes' }} className="text-sm text-[var(--color-primary-navy)] hover:underline"&gt;
              Voir tout
            &lt;/Link&gt;
          &lt;/div&gt;
          &lt;div className="space-y-4"&gt;
            {classCards.map((classe) =&gt; (
              &lt;div key={classe.id} className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-lg"&gt;
                &lt;div&gt;
                  &lt;h4 className="font-medium text-[var(--color-text-primary)]"&gt;{classe.name}&lt;/h4&gt;
                  &lt;p className="text-sm text-[var(--color-text-secondary)]"&gt;
                    {classe.students ?? '-'} élèves • Prochain cours: {classe.nextClass}
                  &lt;/p&gt;
                &lt;/div&gt;
                &lt;div className="text-right"&gt;
                  &lt;p className="font-semibold text-[var(--color-primary-navy)]"&gt;{classe.avgGrade}&lt;/p&gt;
                  &lt;p className="text-xs text-[var(--color-text-muted)]"&gt;Moyenne classe&lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            ))}
            {classCards.length === 0 &amp;&amp; (
              &lt;div className="text-sm text-[var(--color-text-secondary)]"&gt;
                Aucun cours planifie.
              &lt;/div&gt;
            )}
          &lt;/div&gt;
        &lt;/div&gt;

        {/* Pending Tasks */}
        &lt;div
          ref={tasksRef}
          className={`card p-6 ${tasksVisible ? 'animate-slide-in-right' : 'opacity-0'}`}
        &gt;
          &lt;h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6"&gt;
            Tâches en Attente
          &lt;/h2&gt;
          &lt;div className="space-y-3"&gt;
            {pendingTasks.map((task, index) =&gt; (
              &lt;div key={index} className="flex items-center gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg"&gt;
                {task.urgent ? (
                  &lt;AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" /&gt;
                ) : (
                  &lt;Clock className="w-5 h-5 text-[var(--color-text-muted)] flex-shrink-0" /&gt;
                )}
                &lt;div className="flex-1"&gt;
                  &lt;p className="text-sm text-[var(--color-text-primary)]"&gt;{task.task}&lt;/p&gt;
                  &lt;p className={`text-xs ${task.urgent ? 'text-red-500' : 'text-[var(--color-text-muted)]'}`}&gt;
                    {task.deadline}
                  &lt;/p&gt;
                &lt;/div&gt;
                &lt;button className="text-sm text-[var(--color-primary-navy)] hover:underline"&gt;
                  Traiter
                &lt;/button&gt;
              &lt;/div&gt;
            ))}
            {pendingTasks.length === 0 &amp;&amp; (
              &lt;div className="text-sm text-[var(--color-text-secondary)]"&gt;
                Aucune tache en attente.
              &lt;/div&gt;
            )}
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      {/* Recent Activity */}
      &lt;div
        ref={activityRef}
        className={`card p-6 ${activityVisible ? 'animate-slide-in-up' : 'opacity-0'}`}
      &gt;
        &lt;h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6"&gt;
          Activité Récente
        &lt;/h2&gt;
        &lt;div className="space-y-4"&gt;
          &lt;div className="text-sm text-[var(--color-text-secondary)]"&gt;
            Aucune activite recente.
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
};

export default TeacherDashboard;</code></pre>
