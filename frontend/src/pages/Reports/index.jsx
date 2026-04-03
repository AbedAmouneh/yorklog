import { useState } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';
import toast from 'react-hot-toast';
import { reportsApi } from '../../lib/api.js';
import { useReportSummary, useReportByEmployee, useReportByProject, useHoursLog, useHoursLogAll } from '../../hooks/useReports.js';
import { fmtHours } from '@yorklog/lib';
import { ENTRY_STATUS_BADGE, EXPORT_PREFIX } from '@yorklog/assets';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Download, Clock, Users, BarChart2 } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#0e7490', '#0284c7', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#db2777'];


// Bi-weekly pay period anchored to 2025-01-06 (Monday)
function getPayPeriod(offset = 0) {
  const anchor = new Date('2025-01-06T00:00:00');
  const now = new Date();
  const diffDays = Math.floor((now - anchor) / 86400000);
  const idx = Math.floor(diffDays / 14) + offset;
  const start = new Date(anchor);
  start.setDate(anchor.getDate() + idx * 14);
  const end = new Date(start);
  end.setDate(start.getDate() + 13);
  return { start, end };
}

function buildPresets(now) {
  const pp = getPayPeriod(0);
  const lastPp = getPayPeriod(-1);
  return [
    {
      label: 'This week',
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    },
    { label: 'This month', start: startOfMonth(now), end: endOfMonth(now) },
    { label: 'Last month', start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) },
    { label: 'This pay period', start: pp.start, end: pp.end },
    { label: 'Last pay period', start: lastPp.start, end: lastPp.end },
  ];
}

// ── Overview tab ───────────────────────────────────────────────────────────────

function OverviewTab({ startDate, endDate }) {
  const { data: summaryData } = useReportSummary(startDate, endDate);
  const { data: byEmpData } = useReportByEmployee(startDate, endDate);
  const { data: byProjData } = useReportByProject(startDate, endDate);

  const summary = summaryData?.summary ?? {};
  const employees = byEmpData?.employees ?? [];
  const projects = byProjData?.projects ?? [];

  const empChartData = employees.slice(0, 10).map((e) => ({
    name: e.name.split(' ')[0],
    hours: +(e.totalMinutes / 60).toFixed(1),
  }));

  const projChartData = projects.slice(0, 7).map((p, i) => ({
    name: p.name.length > 16 ? p.name.slice(0, 14) + '…' : p.name,
    value: +(p.totalMinutes / 60).toFixed(1),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const handleExport = async () => {
    try {
      const res = await reportsApi.export({ startDate, endDate });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${EXPORT_PREFIX}-Report-${startDate}-to-${endDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported!');
    } catch {
      toast.error('Export failed. Try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={handleExport} className="btn-primary gap-2">
          <Download size={16} />
          Export Excel
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Hours', value: fmtHours(summary.totalMinutes) },
          { label: 'Employees', value: summary.activeEmployees ?? '—' },
          { label: 'Avg per Employee', value: fmtHours(summary.avgMinutesPerEmployee) },
          { label: 'Entries', value: summary.totalEntries ?? '—' },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className="text-2xl font-black text-navy-900">{s.value}</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <p className="card-title">Hours by Employee</p>
          {empChartData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={empChartData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={64} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }} formatter={(v) => [`${v}h`, 'Hours']} />
                <Bar dataKey="hours" fill="#0e7490" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <p className="card-title">Hours by Project</p>
          {projChartData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={projChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {projChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }} formatter={(v) => [`${v}h`, 'Hours']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <p className="card-title">Employee Breakdown</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-semibold">Employee</th>
              <th className="pb-2 font-semibold">Department</th>
              <th className="pb-2 font-semibold text-right">Hours</th>
              <th className="pb-2 font-semibold text-right">Entries</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees.map((e) => (
              <tr key={e.userId} className="hover:bg-slate-50">
                <td className="py-2.5 font-medium text-slate-800">{e.name}</td>
                <td className="py-2.5 text-slate-400 text-xs">{e.department}</td>
                <td className="py-2.5 text-right font-bold text-navy-900">{fmtHours(e.totalMinutes)}</td>
                <td className="py-2.5 text-right text-slate-400">{e.entryCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {employees.length === 0 && <p className="text-center text-slate-400 text-sm py-6">No data for this range.</p>}
      </div>

      <div className="card overflow-x-auto">
        <p className="card-title">Project Breakdown</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-semibold">Project</th>
              <th className="pb-2 font-semibold text-right">Hours</th>
              <th className="pb-2 font-semibold text-right">Employees</th>
              <th className="pb-2 font-semibold text-right">Entries</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {projects.map((p) => (
              <tr key={p.projectId} className="hover:bg-slate-50">
                <td className="py-2.5 font-medium text-slate-800">{p.name}</td>
                <td className="py-2.5 text-right font-bold text-navy-900">{fmtHours(p.totalMinutes)}</td>
                <td className="py-2.5 text-right text-slate-400">{p.employeeCount}</td>
                <td className="py-2.5 text-right text-slate-400">{p.entryCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && <p className="text-center text-slate-400 text-sm py-6">No data for this range.</p>}
      </div>
    </div>
  );
}

// ── Hours Log tab ──────────────────────────────────────────────────────────────

function HoursLogTab({ startDate, endDate }) {
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [search, setSearch] = useState('');

  const params = {
    startDate,
    endDate,
    ...(employeeFilter ? { userId: employeeFilter } : {}),
    ...(projectFilter ? { projectId: projectFilter } : {}),
  };

  const { data, isLoading } = useHoursLog(params);

  // Always fetch unfiltered list to build dropdowns
  const { data: allData } = useHoursLogAll(startDate, endDate);

  const entries = data?.entries ?? [];
  const totalMinutes = data?.totalMinutes ?? 0;

  const employeeOptions = [...new Map(
    (allData?.entries ?? []).map(e => [e.employeeId, { id: e.employeeId, name: e.employee }])
  ).values()].sort((a, b) => a.name.localeCompare(b.name));

  const projectOptions = [...new Map(
    (allData?.entries ?? []).map(e => [e.projectId, { id: e.projectId, name: e.project }])
  ).values()].sort((a, b) => a.name.localeCompare(b.name));

  const filtered = search.trim()
    ? entries.filter(e =>
        [e.employee, e.project, e.task, e.taskSummary, e.description]
          .filter(Boolean)
          .some(v => v.toLowerCase().includes(search.toLowerCase()))
      )
    : entries;

  const handleExport = async () => {
    try {
      const res = await reportsApi.export(params);
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${EXPORT_PREFIX}-Hours-${startDate}-to-${endDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exported!');
    } catch {
      toast.error('Export failed.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="label">Employee</label>
            <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="input">
              <option value="">All employees</option>
              {employeeOptions.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="label">Project</label>
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="input">
              <option value="">All projects</option>
              {projectOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="label">Search</label>
            <input
              type="text"
              placeholder="Employee, project, task…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />
          </div>
          <button onClick={handleExport} className="btn-primary gap-2 shrink-0">
            <Download size={15} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-lg font-black text-navy-900">{fmtHours(totalMinutes)}</p>
            <p className="text-xs text-slate-400 font-semibold">Total hours</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <BarChart2 size={18} />
          </div>
          <div>
            <p className="text-lg font-black text-navy-900">{filtered.length}</p>
            <p className="text-xs text-slate-400 font-semibold">Entries shown</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <p className="text-lg font-black text-navy-900">
              {new Set(filtered.map(e => e.employeeId)).size}
            </p>
            <p className="text-xs text-slate-400 font-semibold">Employees</p>
          </div>
        </div>
      </div>

      {/* Full log table */}
      <div className="card overflow-x-auto">
        {isLoading ? (
          <p className="text-center text-slate-400 text-sm py-8">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">No entries for this range.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-semibold">Date</th>
                <th className="pb-2 font-semibold">Employee</th>
                <th className="pb-2 font-semibold">Dept</th>
                <th className="pb-2 font-semibold">Project</th>
                <th className="pb-2 font-semibold">Task / Work Done</th>
                <th className="pb-2 font-semibold">Notes</th>
                <th className="pb-2 font-semibold text-right">Hours</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="py-2.5 text-slate-500 whitespace-nowrap text-xs">
                    {format(new Date(e.date), 'd MMM yyyy')}
                  </td>
                  <td className="py-2.5 font-medium text-slate-800 whitespace-nowrap">{e.employee}</td>
                  <td className="py-2.5 text-xs text-slate-400 whitespace-nowrap">{e.department ?? '—'}</td>
                  <td className="py-2.5 text-slate-600 whitespace-nowrap">{e.project}</td>
                  <td className="py-2.5 text-slate-700 max-w-[200px]">
                    <span className="block truncate" title={e.task ?? e.taskSummary}>
                      {e.task ?? e.taskSummary}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-400 text-xs max-w-[160px]">
                    <span className="block truncate" title={e.description ?? ''}>
                      {e.description || '—'}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-bold text-navy-900 whitespace-nowrap">
                    {fmtHours(e.totalMinutes)}
                  </td>
                  <td className="py-2.5">
                    <span className={`badge ${ENTRY_STATUS_BADGE[e.status] ?? 'badge-slate'}`}>
                      {e.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Root export ────────────────────────────────────────────────────────────────

export default function Reports() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(now), 'yyyy-MM-dd'));

  const presets = buildPresets(now);

  const setRange = (start, end) => {
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-navy-900">Reports</h1>
        <p className="text-sm text-slate-400 mt-0.5">Analyse team hours and work breakdown</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'log', label: 'Hours Log' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date range — shared */}
      <div className="card">
        <p className="text-xs font-bold text-slate-400 mb-3">DATE RANGE</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => setRange(p.start, p.end)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap">
          <div>
            <label className="label">From</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={format(now, 'yyyy-MM-dd')}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {activeTab === 'overview'
        ? <OverviewTab startDate={startDate} endDate={endDate} />
        : <HoursLogTab startDate={startDate} endDate={endDate} />
      }
    </div>
  );
}
