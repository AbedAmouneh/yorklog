import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, isAdmin, isManager, isHR, canManageTeams } from '../../lib/auth.jsx';
import { ROLE_LABELS, APP_NAME, COMPANY_NAME } from '@yorklog/assets';
import { Avatar, AvatarFallback } from '../ui/avatar.jsx';
import { Separator } from '../ui/separator.jsx';
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
  X,
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
    <aside className="flex flex-col h-full w-64 shrink-0 bg-navy-900 text-white">
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-lg bg-brand-700 flex items-center justify-center shrink-0 shadow-md">
          <span className="font-slab font-bold text-navy-900 text-sm leading-none">YL</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-slab font-bold text-white text-base leading-tight">{APP_NAME}</p>
          <p className="text-white/40 text-xs mt-0.5 font-sans">{COMPANY_NAME}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/80 transition-colors p-1 rounded lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <Separator className="bg-white/10 mx-0" />

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.filter((item) => !item.guard || item.guard(user)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-700 text-navy-900 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={17}
                  className={
                    isActive
                      ? 'text-navy-900'
                      : 'text-white/40 group-hover:text-white/80 transition-colors'
                  }
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <Separator className="bg-white/10 mx-0" />

      {/* ── User footer ───────────────────────────────────────────────────── */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-brand-700 text-navy-900 text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate leading-tight">{user?.name}</p>
            <p className="text-xs text-white/40 truncate mt-0.5">{ROLE_LABELS[user?.role]}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/8 transition-all"
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
