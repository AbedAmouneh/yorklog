import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, getDaysInMonth } from 'date-fns';
import toast from 'react-hot-toast';
import { timesheetsApi, editRequestsApi } from '../../lib/api.js';
import { ChevronLeft, ChevronRight, Trash2, Edit2, X } from 'lucide-react';

function fmtHours(mins) {
  if (!mins) return '0h';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const STATUS_COLORS = {
  submitted: 'badge-slate',
  approved: 'badge-green',
  pending_edit: 'badge-amber',
  rejected: 'badge-red',
};

// Calendar view component
function CalendarView({ year, month }) {
  const { data } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => timesheetsApi.getCalendar(year, month).then((r) => r.data),
  });

  const cal = data?.calendar ?? {};
  const firstDay = new Date(year, month - 1, 1);
  const days = eachDayOfInterval({
    start: startOfMonth(firstDay),
    end: endOfMonth(firstDay),
  });

  // Sunday offset
  const startOffset = getDay(firstDay);
  const blanks = Array(startOffset).fill(null);

  const maxMins = Math.max(...Object.values(cal), 1);

  return (
    <div className="card">
      <p className="card-title">Monthly Calendar — {format(firstDay, 'MMMM yyyy')}</p>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-xs font-semibold text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((_, i) => (
          <div key={`b${i}`} />
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const mins = cal[key];
          const isToday = key === format(new Date(), 'yyyy-MM-dd');
          const intensity = mins ? Math.min(1, mins / maxMins) : 0;

          return (
            <div
              key={key}
              title={mins ? `${format(day, 'EEE d MMM')}: ${fmtHours(mins)}` : format(day, 'EEE d MMM')}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition-colors ${
                isToday ? 'ring-2 ring-brand-700' : ''
              } ${
                mins
                  ? 'text-white'
                  : 'text-slate-300 bg-slate-50'
              }`}
              style={
                mins
                  ? { backgroundColor: `rgba(14,116,144,${0.15 + intensity * 0.85})` }
                  : {}
              }
            >
              <span>{format(day, 'd')}</span>
              {mins && <span className="text-[9px] mt-0.5 opacity-90">{fmtHours(mins)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Edit request modal
function EditRequestModal({ entry, onClose }) {
  const qc = useQueryClient();
  const [formData, setFormData] = useState({
    hours: Math.floor(entry.totalMinutes / 60),
    minutes: entry.totalMinutes % 60,
    taskSummary: entry.taskSummary,
    description: entry.description ?? '',
    reason: '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      editRequestsApi.submit(entry.id, {
        newData: {
          totalMinutes: formData.hours * 60 + formData.minutes,
          taskSummary: formData.taskSummary,
          description: formData.description,
        },
        reason: formData.reason,
      }),
    onSuccess: () => {
      toast.success('Edit request submitted!');
      qc.invalidateQueries({ queryKey: ['my-entries'] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to submit edit request.');
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Request Edit</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
            <strong>Entry:</strong> {entry.project?.name} · {entry.taskType?.name} · {format(new Date(entry.date), 'd MMM yyyy')}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Hours</label>
              <input
                type="number" min={0} max={23}
                value={formData.hours}
                onChange={(e) => setFormData((p) => ({ ...p, hours: +e.target.value }))}
                className="input text-center"
              />
            </div>
            <div className="flex-1">
              <label className="label">Minutes</label>
              <input
                type="number" min={0} max={59} step={5}
                value={formData.minutes}
                onChange={(e) => setFormData((p) => ({ ...p, minutes: +e.target.value }))}
                className="input text-center"
              />
            </div>
          </div>

          <div>
            <label className="label">Task Summary</label>
            <input
              type="text"
              value={formData.taskSummary}
              onChange={(e) => setFormData((p) => ({ ...p, taskSummary: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className="input resize-none"
            />
          </div>

          <div>
            <label className="label">Reason for edit *</label>
            <input
              type="text"
              placeholder="Why do you need to change this?"
              value={formData.reason}
              onChange={(e) => setFormData((p) => ({ ...p, reason: e.target.value }))}
              className="input"
            />
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!formData.reason || mutation.isPending}
            className="btn-primary flex-1 justify-center"
          >
            {mutation.isPending ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function History() {
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [editEntry, setEditEntry] = useState(null);

  const dateStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthStart = `${dateStr}-01`;
  const lastDay = getDaysInMonth(new Date(year, month - 1));
  const monthEnd = `${dateStr}-${String(lastDay).padStart(2, '0')}`;

  const { data, isLoading } = useQuery({
    queryKey: ['my-entries', dateStr],
    queryFn: () =>
      timesheetsApi.getMyEntries({ startDate: monthStart, endDate: monthEnd, limit: 100 }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => timesheetsApi.delete(id),
    onSuccess: () => {
      toast.success('Entry deleted.');
      qc.invalidateQueries({ queryKey: ['my-entries'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not delete.'),
  });

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const entries = data?.entries ?? [];
  const totalMins = entries.reduce((a, e) => a + e.totalMinutes, 0);

  return (
    <div className="space-y-6">
      {editEntry && (
        <EditRequestModal entry={editEntry} onClose={() => setEditEntry(null)} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-navy-900">My History</h1>
          <p className="text-sm text-slate-400 mt-0.5">View and manage your logged hours</p>
        </div>
        {/* Month navigator */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn-secondary px-2 py-2">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-slate-700 min-w-[110px] text-center">
            {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
          </span>
          <button onClick={nextMonth} disabled={isCurrentMonth} className="btn-secondary px-2 py-2 disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar heatmap */}
      <CalendarView year={year} month={month} />

      {/* Entries list */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="card-title mb-0">
            Entries — {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
          </p>
          {totalMins > 0 && (
            <span className="badge badge-teal">{fmtHours(totalMins)} total</span>
          )}
        </div>

        {isLoading ? (
          <p className="text-slate-400 text-sm text-center py-6">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">No entries for this month.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((e) => (
              <div key={e.id} className="py-4 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">{e.project?.name}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-sm text-slate-500">{e.taskType?.name}</span>
                    <span className={`badge ${STATUS_COLORS[e.status]}`}>
                      {e.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{e.taskSummary}</p>
                  {e.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{e.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {format(new Date(e.date), 'EEEE, d MMMM yyyy')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-black text-navy-900">{fmtHours(e.totalMinutes)}</p>
                  <div className="flex gap-1 mt-2 justify-end">
                    {e.status !== 'pending_edit' && (
                      <button
                        onClick={() => setEditEntry(e)}
                        className="p-1.5 text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Request edit"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {e.status === 'submitted' && (
                      <button
                        onClick={() => {
                          if (confirm('Delete this entry?')) deleteMutation.mutate(e.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
