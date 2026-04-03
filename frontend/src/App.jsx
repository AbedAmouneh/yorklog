import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import { APP_NAME } from '@yorklog/assets';
import Layout from './components/Layout/index.jsx';

// Pages
import Login from './pages/Auth/Login.jsx';
import Dashboard from './pages/Dashboard/index.jsx';
import LogHours from './pages/LogHours/index.jsx';
import History from './pages/History/index.jsx';
import Approvals from './pages/Approvals/index.jsx';
import Reports from './pages/Reports/index.jsx';
import Projects from './pages/Projects/index.jsx';
import Teams from './pages/Teams/index.jsx';
import MyTasks from './pages/MyTasks/index.jsx';
import Admin from './pages/Admin/index.jsx';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-slate-400 text-sm">Loading {APP_NAME}…</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="my-tasks" element={<MyTasks />} />
        <Route path="log-hours" element={<LogHours />} />
        <Route path="history" element={<History />} />
        <Route path="approvals" element={
          <ProtectedRoute roles={['dept_manager', 'org_admin', 'super_admin']}>
            <Approvals />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute roles={['dept_manager', 'org_admin', 'hr_finance', 'super_admin']}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="projects" element={
          <ProtectedRoute roles={['dept_manager', 'org_admin', 'super_admin']}>
            <Projects />
          </ProtectedRoute>
        } />
        <Route path="teams" element={
          <ProtectedRoute roles={['hr_finance', 'org_admin', 'super_admin']}>
            <Teams />
          </ProtectedRoute>
        } />
        <Route path="admin/*" element={
          <ProtectedRoute roles={['super_admin']}>
            <Admin />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
