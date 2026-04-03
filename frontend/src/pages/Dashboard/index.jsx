import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth, isManager } from '../../lib/auth.jsx';
import { useCalendar } from '../../hooks/useTimesheets.js';
import { useMyTasks, useCompleteTask, useUpdateTask } from '../../hooks/useTasks.js';
import { useReportSummary, useReportByEmployee, useWhoLoggedToday, useDashHoursLog } from '../../hooks/useReports.js';
import { fmtHours } from '@yorklog/lib';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@yorklog/assets';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Clock, Users, TrendingUp, CheckCircle, ChevronLeft, ChevronRight,
  AlertCircle, CheckSquare, Circle, PlayCircle, Calendar, ListTodo,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-black text-navy-900">{value}</p>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Task status helpers ────────────────────────────────────────────────────────

const STATUS_ICONS = { todo: Circle, in_progress: PlayCircle, done: CheckSquare };

// ── Complete Task Modal ────────────────────────────────────────────────────────

function CompleteModal({ task, defaultDate, onClose, onDone }) {
  const [hours, setHours] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');

  const mutation = useCompleteTask({
    onSuccess: () => { onDone(); onClose(); },
    onError: (e) => setError(e.response?.data?.error?.fieldErrors?.hours?.[0] || 'Something went wrong.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">
              {task.project?.name}
            </p>
            <h2 className="text-base font-bold text-navy-900">{task.title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none ml-4">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Hours worked <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              {[0.5, 1, 2, 3, 4, 6, 8].map((h) => (
                <button
                  key={h}
                  onClick={() => setHours(String(h))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    hours === String(h)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
            <input
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Or type a custom value"
              className="input w-full"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Any extra details, blockers, or notes…"
              rows={3}
              className="input w-full resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => mutation.mutate({
              id: task.id,
              hours: parseFloat(hours),
              description: desc || undefined,
              date: defaultDate,
            })}
            disabled={!hours || mutation.isPending}
            className="btn btn-primary flex-1 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving…' : '✓ Mark Done & Log'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({ task, onComplete, onStatusChange }) {
  const colors = TASK_STATUS_COLORS[task.status] ?? TASK_STATUS_COLORS.todo;
  const Icon = STATUS_ICONS[task.status] ?? STATUS_ICONS.todo;
  const label = TASK_STATUS_LABELS[task.status] ?? TASK_STATUS_LABELS.todo;

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      task.status === 'done'
        ? 'bg-slate-50 border-slate-100 opacity-60'
        : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-brand-200'
    }`}>
      <div className="flex items-start gap-3">
        <Icon size={16} className={`mt-0.5 shrink-0 ${colors.color}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-slate-400">{task.project?.name}</span>
            {task.taskType && (
              <>
                <span className="text-slate-200">·</span>
                <span className="text-xs text-slate-400">{task.taskType.name}</span>
              </>
            )}
            {task.estimatedHours && (
              <>
                <span className="text-slate-200">·</span>
                <span className="text-xs text-slate-400">~{task.estimatedHours}h est.</span>
              </>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${colors.bg}`}>
          {label}
        </span>
      </div>

      {task.status !== 'done' && (
        <div className="flex gap-2 mt-3">
          {task.status === 'todo' && (
            <button
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 font-semibold hover:bg-blue-50 transition-all"
            >
              Start
            </button>
          )}
          <button
            onClick={() => onComplete(task)}
            className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all"
          >
            Mark Done & Log Hours
          </button>
        </div>
      )}
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function CalendarGrid({ month, year, calData, tasksByDay, selectedDay, onSelectDay }) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month - 1 + 1, 0);
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });

  // pad start
  const startPad = getDay(firstDay); // 0 = Sun
  const paddedDays = [
    ...Array(startPad).fill(null),
    ...days,
  ];

  return (
    <div>
      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {paddedDays.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;
          const key = format(day, 'yyyy-MM-dd');
          const isSelected = key === selectedDay;
          const isTodayDay = isToday(day);
          const loggedMins = calData?.[key];
          const tasks = tasksByDay?.[key] ?? [];
          const pendingTasks = tasks.filter((t) => t.status !== 'done');

          return (
            <button
              key={key}
              onClick={() => onSelectDay(key)}
              className={`relative rounded-xl py-1.5 px-1 flex flex-col items-center gap-0.5 transition-all text-left cursor-pointer min-h-[56px]
                ${isSelected
                  ? 'bg-brand-600 text-white shadow-md'
                  : isTodayDay
                  ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-300 ring-offset-1'
                  : loggedMins
                  ? 'bg-green-50 hover:bg-green-100'
                  : 'hover:bg-slate-100'
                }`}
            >
              <span className={`text-sm font-bold leading-none ${
                isSelected ? 'text-white' : isTodayDay ? 'text-brand-700' : 'text-slate-700'
              }`}>
                {format(day, 'd')}
              </span>

              {loggedMins > 0 && (
                <span className={`text-xs font-semibold leading-none ${
                  isSelected ? 'text-brand-100' : 'text-green-600'
                }`}>
                  {fmtHours(loggedMins)}
                </span>
              )}

              {pendingTasks.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {pendingTasks.slice(0, 3).map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-brand-400'
                      }`}
                    />
                  ))}
                  {pendingTasks.length > 3 && (
                    <span className={`text-[9px] font-bold ${isSelected ? 'text-white' : 'text-brand-500'}`}>
                      +{pendingTasks.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Employee Dashboard ─────────────────────────────────────────────────────────

function EmployeeDashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [completingTask, setCompletingTask] = useState(null);
  const qc = useQueryClient();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  // Calendar data (hours logged per day)
  const { data: cal } = useCalendar(year, month);

  // All my tasks
  const { data: tasksData, refetch: refetchTasks } = useMyTasks({ month, year });

  const statusMutation = useUpdateTask({ onSuccess: () => refetchTasks() });

  const calData = cal?.calendar ?? cal?.days ?? {};
  const allTasks = tasksData?.tasks ?? [];

  // Group tasks by their due date
  const tasksByDay = {};
  allTasks.forEach((t) => {
    if (!t.dueDate) return;
    const k = format(parseISO(t.dueDate), 'yyyy-MM-dd');
    tasksByDay[k] = [...(tasksByDay[k] ?? []), t];
  });

  // Tasks for the selected day
  const tasksForSelectedDay = tasksByDay[selectedDay] ?? [];
  // Unscheduled (no due date) tasks
  const unscheduledTasks = allTasks.filter((t) => !t.dueDate && t.status !== 'done');

  const totalMins = Object.values(calData).reduce((a, b) => a + b, 0);
  const daysLogged = Object.keys(calData).length;
  const pendingCount = allTasks.filter((t) => t.status !== 'done').length;

  const handleTaskDone = (task) => setCompletingTask(task);
  const handleStatusChange = (id, status) => statusMutation.mutate({ id, status });
  const handleCompleted = () => {
    refetchTasks();
    qc.invalidateQueries({ queryKey: ['calendar', year, month] });
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Hours this month" value={fmtHours(totalMins)} sub={format(currentMonth, 'MMMM yyyy')} color="brand" />
        <StatCard icon={CheckCircle} label="Days logged" value={daysLogged} sub="this month" color="green" />
        <StatCard icon={ListTodo} label="Pending tasks" value={pendingCount} sub="assigned to you" color={pendingCount > 0 ? 'amber' : 'slate'} />
        <StatCard icon={TrendingUp} label="Avg per day" value={daysLogged > 0 ? fmtHours(Math.round(totalMins / daysLogged)) : '—'} sub="when logged" color="slate" />
      </div>

      {/* Calendar + Day panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Calendar */}
        <div className="lg:col-span-3 card">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth((d) => subMonths(d, 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="text-base font-bold text-navy-900">{format(currentMonth, 'MMMM yyyy')}</p>
            <button
              onClick={() => setCurrentMonth((d) => addMonths(d, 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <CalendarGrid
            month={month}
            year={year}
            calData={calData}
            tasksByDay={tasksByDay}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-400 inline-block" /> Tasks due
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-green-100 border border-green-200 inline-block" /> Hours logged
            </span>
          </div>
        </div>

        {/* Day panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {format(parseISO(selectedDay), 'EEEE')}
              </p>
              <p className="text-lg font-black text-navy-900">
                {format(parseISO(selectedDay), 'd MMMM')}
              </p>
            </div>
            {calData[selectedDay] && (
              <span className="badge badge-green text-sm px-3 py-1">
                {fmtHours(calData[selectedDay])} logged
              </span>
            )}
          </div>

          {tasksForSelectedDay.length === 0 && !calData[selectedDay] ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <Calendar size={32} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-400 font-medium">No tasks for this day</p>
              <Link to="/my-tasks" className="text-xs text-brand-600 font-semibold mt-1 hover:underline">
                View all tasks →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tasksForSelectedDay.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onComplete={handleTaskDone}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {calData[selectedDay] && tasksForSelectedDay.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">Hours logged on this day (manual entry)</p>
              )}
            </div>
          )}

          {/* Manual log link */}
          <Link
            to="/log-hours"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400 font-semibold hover:border-brand-300 hover:text-brand-600 transition-all"
          >
            + Log hours manually
          </Link>
        </div>
      </div>

      {/* Unscheduled tasks */}
      {unscheduledTasks.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <p className="card-title mb-0">Unscheduled Tasks</p>
            <span className="badge badge-amber">{unscheduledTasks.length}</span>
          </div>
          <div className="space-y-3">
            {unscheduledTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onComplete={handleTaskDone}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* Complete modal */}
      {completingTask && (
        <CompleteModal
          task={completingTask}
          defaultDate={selectedDay}
          onClose={() => setCompletingTask(null)}
          onDone={handleCompleted}
        />
      )}
    </div>
  );
}

// ── Manager Dashboard ─────────────────────────────────────────────────────────

function ManagerDashboard() {
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  const { data: summaryData } = useReportSummary(monthStart, monthEnd);
  const { data: byEmpData } = useReportByEmployee(monthStart, monthEnd);
  const { data: whoToday } = useWhoLoggedToday();

  const summary = summaryData?.summary ?? {};
  const employees = byEmpData?.employees ?? [];
  const topEmployees = [...employees].sort((a, b) => b.totalMinutes - a.totalMinutes).slice(0, 8);

  const chartData = topEmployees.map((e) => ({
    name: e.name.split(' ')[0],
    hours: +(e.totalMinutes / 60).toFixed(1),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Total hours this month" value={fmtHours(summary.totalMinutes)} color="brand" />
        <StatCard icon={Users} label="Active employees" value={summary.activeEmployees ?? '—'} color="slate" />
        <StatCard icon={CheckCircle} label="Logged today" value={whoToday?.loggedCount ?? '—'} sub={`of ${whoToday?.totalCount ?? '?'} employees`} color="green" />
        <StatCard icon={TrendingUp} label="Avg per employee" value={fmtHours(summary.avgMinutesPerEmployee)} sub="this month" color="amber" />
      </div>

      {chartData.length > 0 && (
        <div className="card">
          <p className="card-title">Hours by Employee — {format(now, 'MMMM yyyy')}</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                formatter={(v) => [`${v}h`, 'Hours']}
              />
              <Bar dataKey="hours" fill="#0e7490" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {whoToday && whoToday.notLogged?.length > 0 && (
        <div className="card">
          <p className="card-title">Hasn't Logged Today</p>
          <div className="flex flex-wrap gap-2">
            {whoToday.notLogged.map((u) => (
              <span key={u.id} className="badge badge-amber">{u.name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="card-title mb-0">Employee Hours — {format(now, 'MMMM yyyy')}</p>
          <Link to="/reports" className="text-xs text-brand-700 font-semibold hover:underline">
            Full report →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-semibold">Employee</th>
              <th className="pb-2 font-semibold">Department</th>
              <th className="pb-2 font-semibold text-right">Total Hours</th>
              <th className="pb-2 font-semibold text-right">Entries</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees.map((e) => (
              <tr key={e.userId} className="hover:bg-slate-50">
                <td className="py-2.5 font-medium text-slate-800">{e.name}</td>
                <td className="py-2.5 text-slate-400">{e.department}</td>
                <td className="py-2.5 text-right font-bold text-navy-900">{fmtHours(e.totalMinutes)}</td>
                <td className="py-2.5 text-right text-slate-400">{e.entryCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {employees.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-6">No data for this month yet.</p>
        )}
      </div>

      <RecentHoursLog />
    </div>
  );
}

function RecentHoursLog() {
  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data, isLoading } = useDashHoursLog(weekStart, weekEnd);

  const entries = (data?.entries ?? []).slice(0, 15);

  return (
    <div className="card overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="card-title mb-0">Recent Hours Log</p>
          <p className="text-xs text-slate-400 mt-0.5">This week — latest {entries.length} entries</p>
        </div>
        <Link to="/reports" className="text-xs text-brand-700 font-semibold hover:underline">
          Hours Log →
        </Link>
      </div>
      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-6">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No entries logged this week yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-semibold">Date</th>
              <th className="pb-2 font-semibold">Employee</th>
              <th className="pb-2 font-semibold">Project</th>
              <th className="pb-2 font-semibold">Task / Work Done</th>
              <th className="pb-2 font-semibold text-right">Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="py-2.5 text-xs text-slate-400 whitespace-nowrap">
                  {format(new Date(e.date), 'EEE d MMM')}
                </td>
                <td className="py-2.5 font-medium text-slate-800 whitespace-nowrap">{e.employee}</td>
                <td className="py-2.5 text-slate-500 whitespace-nowrap">{e.project}</td>
                <td className="py-2.5 text-slate-600 max-w-[220px]">
                  <span className="block truncate" title={e.task ?? e.taskSummary}>
                    {e.task ?? e.taskSummary}
                  </span>
                </td>
                <td className="py-2.5 text-right font-bold text-navy-900 whitespace-nowrap">
                  {fmtHours(e.totalMinutes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const managerView = isManager(user);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black text-navy-900">
          {managerView ? 'Team Dashboard' : 'My Dashboard'}
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {managerView
            ? "Overview of your team's logged hours"
            : 'Your tasks and work calendar'}
        </p>
      </div>
      {managerView ? <ManagerDashboard /> : <EmployeeDashboard />}
    </div>
  );
}
