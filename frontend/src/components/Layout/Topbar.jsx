import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Menu, X, Check, CheckCheck, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '../ui/avatar.jsx';
import { Button } from '../ui/button.jsx';

function NotificationPanel({ onClose }) {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-sm font-bold text-navy-900 font-slab">
          Notifications{unread > 0 && <span className="text-brand-700 ml-1">({unread})</span>}
        </span>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={() => markAll.mutate()}
              className="text-xs text-navy-900 hover:text-brand-800 font-medium flex items-center gap-1"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-0.5">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
        {notifications.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">No notifications</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                !n.isRead ? 'bg-brand-50/60' : ''
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                  !n.isRead ? 'bg-brand-700' : 'bg-transparent'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 leading-snug">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markRead.mutate(n.id)}
                  className="text-slate-300 hover:text-brand-700 shrink-0 transition-colors"
                  title="Mark as read"
                >
                  <Check size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const unread = data?.unreadCount ?? 0;

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Date */}
      <p className="hidden sm:block text-xs text-slate-400 font-medium">{today}</p>

      <div className="ml-auto flex items-center gap-2">
        {/* Log Hours CTA — York Press yellow */}
        <Button asChild size="sm" className="hidden sm:inline-flex gap-1.5">
          <Link to="/log-hours">
            <Plus size={14} />
            Log Hours
          </Link>
        </Button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-700 text-navy-900 text-[9px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
        </div>

        {/* Avatar */}
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-navy-900 text-white text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
