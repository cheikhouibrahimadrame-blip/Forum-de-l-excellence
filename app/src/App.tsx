import type React from 'react';
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
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// =================================================================
// Dashboard Pages — LAZY LOADED for code-splitting
// =================================================================

// Student
const StudentDashboard = lazy(() => import('./pages/dashboard/student/StudentDashboard'));
const StudentGrades = lazy(() => import('./pages/dashboard/student/StudentGrades'));
const StudentSchedule = lazy(() => import('./pages/dashboard/student/StudentSchedule'));
const StudentAppointments = lazy(() => import('./pages/dashboard/student/StudentAppointments'));
const StudentReportCards = lazy(() => import('./pages/dashboard/student/StudentReportCards'));
const StudentLessons = lazy(() => import('./pages/dashboard/student/StudentLessons'));
const StudentSubjects = lazy(() => import('./pages/dashboard/student/StudentSubjects'));
const StudentHomework = lazy(() => import('./pages/dashboard/student/StudentHomework'));
const StudentMessages = lazy(() => import('./pages/dashboard/student/StudentMessages'));
const StudentBehavior = lazy(() => import('./pages/dashboard/student/StudentBehavior'));

// Parent
const ParentDashboard = lazy(() => import('./pages/dashboard/parent/ParentDashboard'));
const ParentChildren = lazy(() => import('./pages/dashboard/parent/ParentChildren'));
const ParentGrades = lazy(() => import('./pages/dashboard/parent/ParentGrades'));
const ParentSchedule = lazy(() => import('./pages/dashboard/parent/ParentSchedule'));
const ParentAppointments = lazy(() => import('./pages/dashboard/parent/ParentAppointments'));
const ParentAttendance = lazy(() => import('./pages/dashboard/parent/ParentAttendance'));
const ParentHomework = lazy(() => import('./pages/dashboard/parent/ParentHomework'));
const ParentMessages = lazy(() => import('./pages/dashboard/parent/ParentMessages'));
const ParentBehavior = lazy(() => import('./pages/dashboard/parent/ParentBehavior'));
const ParentHealth = lazy(() => import('./pages/dashboard/parent/ParentHealth'));
const ParentPickup = lazy(() => import('./pages/dashboard/parent/ParentPickup'));

// Teacher
const TeacherDashboard = lazy(() => import('./pages/dashboard/teacher/TeacherDashboard'));
const TeacherClasses = lazy(() => import('./pages/dashboard/teacher/TeacherClasses'));
const TeacherStudents = lazy(() => import('./pages/dashboard/teacher/TeacherStudents'));
const TeacherGrades = lazy(() => import('./pages/dashboard/teacher/TeacherGrades'));
const TeacherSchedule = lazy(() => import('./pages/dashboard/teacher/TeacherSchedule'));
const TeacherLessons = lazy(() => import('./pages/dashboard/teacher/TeacherLessons'));
const TeacherAttendance = lazy(() => import('./pages/dashboard/teacher/TeacherAttendance'));
const TeacherHomework = lazy(() => import('./pages/dashboard/teacher/TeacherHomework'));
const TeacherMessages = lazy(() => import('./pages/dashboard/teacher/TeacherMessages'));
const TeacherBehavior = lazy(() => import('./pages/dashboard/teacher/TeacherBehavior'));

// Admin
const AdminDashboard = lazy(() => import('./pages/dashboard/admin/AdminDashboard'));
const AdminReports = lazy(() => import('./pages/dashboard/admin/AdminReports'));
const AdminMainPage = lazy(() => import('./pages/dashboard/admin/AdminMainPage'));
const AdminSettings = lazy(() => import('./pages/dashboard/admin/AdminSettings'));
const AdminClasses = lazy(() => import('./pages/dashboard/admin/AdminClasses'));
const AdminSubjects = lazy(() => import('./pages/dashboard/admin/AdminSubjects'));
const AdminYears = lazy(() => import('./pages/dashboard/admin/AdminYears'));
const AdminAdmissionsContent = lazy(() => import('./pages/dashboard/admin/AdminAdmissionsContent'));
const AdminProgramsContent = lazy(() => import('./pages/dashboard/admin/AdminProgramsContent'));
const AdminCampusLifeContent = lazy(() => import('./pages/dashboard/admin/AdminCampusLifeContent'));
const AdminParentsStudents = lazy(() => import('./pages/dashboard/admin/AdminParentsStudents'));
const AdminSchedules = lazy(() => import('./pages/dashboard/admin/AdminSchedules'));
const AdminGradeLocks = lazy(() => import('./pages/dashboard/admin/AdminGradeLocks'));
const AdminAppointments = lazy(() => import('./pages/dashboard/admin/AdminAppointments'));
const AdminUsers = lazy(() => import('./pages/dashboard/admin/AdminUsers'));
const AdminPrograms = lazy(() => import('./pages/dashboard/admin/AdminPrograms'));
const AdminCourses = lazy(() => import('./pages/dashboard/admin/AdminCourses'));
const AdminAttendance = lazy(() => import('./pages/dashboard/admin/AdminAttendance'));
const AdminHealth = lazy(() => import('./pages/dashboard/admin/AdminHealth'));
const AdminBehavior = lazy(() => import('./pages/dashboard/admin/AdminBehavior'));
const AdminPickup = lazy(() => import('./pages/dashboard/admin/AdminPickup'));

// =================================================================
// Route guard components
// =================================================================

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Chargement en cours...">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy"></div>
  </div>
);

const ProtectedRoute: React.FC<{ allowedRoles: string[]; children: React.ReactNode }> = ({
  allowedRoles,
  children
}) => {
  const { user, loading } = useAuth();
  const roleRoute = user ? `/${user.role.toLowerCase()}` : '/login';

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to={roleRoute} replace />;

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode; blockAuthenticated?: boolean }> = ({ children, blockAuthenticated = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (blockAuthenticated && user) {
    return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  }
  return <>{children}</>;
};

function AppContent() {
  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicRoute><PublicLayout><HomePage /></PublicLayout></PublicRoute>} />
          <Route path="/programs" element={<PublicRoute><PublicLayout><ProgramsPage /></PublicLayout></PublicRoute>} />
          <Route path="/programmes/:id" element={<PublicRoute><PublicLayout><ProgramDetailPage /></PublicLayout></PublicRoute>} />
          <Route path="/admissions" element={<PublicRoute><PublicLayout><AdmissionsPage /></PublicLayout></PublicRoute>} />
          <Route path="/campus-life" element={<PublicRoute><PublicLayout><CampusLifePage /></PublicLayout></PublicRoute>} />

          {/* Auth Routes */}
          <Route path="/login" element={<PublicRoute blockAuthenticated={true}><AuthLayout><LoginPage /></AuthLayout></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><AuthLayout><ForgotPassword /></AuthLayout></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><AuthLayout><ResetPassword /></AuthLayout></PublicRoute>} />
          <Route path="/change-password" element={<ProtectedRoute allowedRoles={['STUDENT', 'PARENT', 'TEACHER', 'ADMIN']}><AuthLayout><ChangePassword /></AuthLayout></ProtectedRoute>} />

          {/* Student Dashboard */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><StudentDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/grades" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><StudentGrades /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/schedule" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><StudentSchedule /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/appointments" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><StudentAppointments /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/homework" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><StudentHomework /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/messages" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><StudentMessages /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/behavior" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><StudentBehavior /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/report-cards" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><StudentReportCards /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/lessons" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><StudentLessons /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/subjects" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><StudentSubjects /></DashboardLayout></ProtectedRoute>} />

          {/* Parent Dashboard */}
          <Route path="/parent" element={<ProtectedRoute allowedRoles={['PARENT']}><DashboardLayout><ParentDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/parent/children" element={<ProtectedRoute allowedRoles={['PARENT']}><DashboardLayout><ParentChildren /></DashboardLayout></ProtectedRoute>} />
          <Route path="/parent/grades" element={<ProtectedRoute allowedRoles={['PARENT']}><DashboardLayout><ParentGrades /></DashboardLayout></ProtectedRoute>} />
          <Route path="/parent/schedule" element={<ProtectedRoute allowedRoles={['PARENT']}><DashboardLayout><ParentSchedule /></DashboardLayout></ProtectedRoute>} />
          <Route path="/parent/appointments" element={<ProtectedRoute allowedRoles={['PARENT']}><DashboardLayout><ParentAppointments /></DashboardLayout></ProtectedRoute>} />
          <Route path="/parent/attendance" element={<ProtectedRoute allowedRoles={['PARENT']}><DashboardLayout><ParentAttendance /></DashboardLayout></ProtectedRoute>} />
          <Route path="/parent/homework" element={<ProtectedRoute allowedRoles={['PARENT']}><DashboardLayout><ParentHomework /></DashboardLayout></ProtectedRoute>} />
          <Route path="/parent/messages" element={<ProtectedRoute allowedRoles={['PARENT']}><DashboardLayout><ParentMessages /></DashboardLayout></ProtectedRoute>} />
          <Route path="/parent/behavior" element={<ProtectedRoute allowedRoles={['PARENT']}><DashboardLayout><ParentBehavior /></DashboardLayout></ProtectedRoute>} />
          <Route path="/parent/health" element={<ProtectedRoute allowedRoles={['PARENT']}><DashboardLayout><ParentHealth /></DashboardLayout></ProtectedRoute>} />
          <Route path="/parent/pickup" element={<ProtectedRoute allowedRoles={['PARENT']}><DashboardLayout><ParentPickup /></DashboardLayout></ProtectedRoute>} />

          {/* Teacher Dashboard */}
          <Route path="/teacher" element={<ProtectedRoute allowedRoles={['TEACHER']}><DashboardLayout><TeacherDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/teacher/classes" element={<ProtectedRoute allowedRoles={['TEACHER']}><DashboardLayout><TeacherClasses /></DashboardLayout></ProtectedRoute>} />
          <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={['TEACHER']}><DashboardLayout><TeacherStudents /></DashboardLayout></ProtectedRoute>} />
          <Route path="/teacher/grades" element={<ProtectedRoute allowedRoles={['TEACHER']}><DashboardLayout><TeacherGrades /></DashboardLayout></ProtectedRoute>} />
          <Route path="/teacher/lessons" element={<ProtectedRoute allowedRoles={['TEACHER']}><DashboardLayout><TeacherLessons /></DashboardLayout></ProtectedRoute>} />
          <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={['TEACHER']}><DashboardLayout><TeacherAttendance /></DashboardLayout></ProtectedRoute>} />
          <Route path="/teacher/schedule" element={<ProtectedRoute allowedRoles={['TEACHER']}><DashboardLayout><TeacherSchedule /></DashboardLayout></ProtectedRoute>} />
          <Route path="/teacher/homework" element={<ProtectedRoute allowedRoles={['TEACHER']}><DashboardLayout><TeacherHomework /></DashboardLayout></ProtectedRoute>} />
          <Route path="/teacher/messages" element={<ProtectedRoute allowedRoles={['TEACHER']}><DashboardLayout><TeacherMessages /></DashboardLayout></ProtectedRoute>} />
          <Route path="/teacher/behavior" element={<ProtectedRoute allowedRoles={['TEACHER']}><DashboardLayout><TeacherBehavior /></DashboardLayout></ProtectedRoute>} />

          {/* Admin Dashboard */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminUsers /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminClasses /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/subjects" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminSubjects /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/years" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminYears /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/programs" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminPrograms /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminCourses /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminReports /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/mainpage" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminMainPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/content/admissions" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminAdmissionsContent /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/content/programs" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminProgramsContent /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/content/campuslife" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminCampusLifeContent /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminSettings /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/parents-students" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminParentsStudents /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/schedules" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminSchedules /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/grade-locks" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminGradeLocks /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/appointments" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminAppointments /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminAttendance /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/health" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminHealth /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/behavior" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminBehavior /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/pickup" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminPickup /></DashboardLayout></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;