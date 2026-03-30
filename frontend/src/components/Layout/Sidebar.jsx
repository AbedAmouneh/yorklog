import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, isAdmin, isManager, isHR, canManageTeams } from '../../lib/auth.jsx';
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  CheckSquare,
  BarChart3,
  FolderKanban,
  UsersRound,
  Settings,
  LogOut,
  ChevronRight,
  ListTodo,
} from 'lucide-react';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/my-tasks', label: 'My Tasks', icon: ListTodo, guard: (u) => u?.role === 'employee' },
  { to: '/log-hours', label: 'Log Hours', icon: Clock },
  { to: '/history', label: 'My History', icon: CalendarDays },
  { to: '/approvals', label: 'Approvals', icon: CheckSquare, guard: (u) => isManager(u) },
  { to: '/reports', label: 'Reports', icon: BarChart3, guard: (u) => isManager(u) || isHR(u) },
  { to: '/projects', label: 'Projects', icon: FolderKanban, guard: (u) => isManager(u) },
  { to: '/teams', label: 'Teams', icon: UsersRound, guard: (u) => canManageTeams(u) },
  { to: '/admin', label: 'Admin', icon: Settings, guard: (u) => isAdmin(u) },
];

const ROLE_LABELS = {
  employee: 'Employee',
  dept_manager: 'Team Leader',
  hr_finance: 'HR / Finance',
  org_admin: 'Manager',
  super_admin: 'Super Admin',
};

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  return (
    <aside className="flex flex-col h-full bg-navy-900 text-white w-64 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center shrink-0">
          <span className="text-white font-black text-sm leading-none">YL</span>
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-none">YorkLog</p>
          <p className="text-white/40 text-xs mt-0.5">York Press</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-white/40 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.filter((item) => !item.guard || item.guard(user)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-700 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} className={isActive ? 'text-white' : 'text-white/50'} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-white/40 truncate">{ROLE_LABELS[user?.role]}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/8 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
