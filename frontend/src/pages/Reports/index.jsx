import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import toast from 'react-hot-toast';
import { reportsApi } from '../../lib/api.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Download, RefreshCw } from 'lucide-react';

function fmtHours(mins) {
  if (!mins) return '0h';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const CHART_COLORS = ['#0e7490', '#0284c7', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#db2777'];

export default function Reports() {
  const now = new Date();

  const [startDate, setStartDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(now), 'yyyy-MM-dd'));

  const commonParams = { startDate, endDate };

  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ['report-summary', startDate, endDate],
    queryFn: () => reportsApi.summary(commonParams).then((r) => r.data),
  });

  const { data: byEmpData } = useQuery({
    queryKey: ['report-by-employee', startDate, endDate],
    queryFn: () => reportsApi.byEmployee(commonParams).then((r) => r.data),
  });

  const { data: byProjData } = useQuery({
    queryKey: ['report-by-project', startDate, endDate],
    queryFn: () => reportsApi.byProject(commonParams).then((r) => r.data),
  });

  const summary = summaryData?.summary ?? {};
  const employees = byEmpData?.employees ?? [];
  const projects = byProjData?.projects ?? [];

  // Quick range helpers
  const setRange = (start, end) => {
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  const handleExport = async () => {
    try {
      const res = await reportsApi.export(commonParams);
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `YorkLog-Report-${startDate}-to-${endDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported!');
    } catch {
      toast.error('Export failed. Try again.');
    }
  };

  const empChartData = employees.slice(0, 10).map((e) => ({
    name: e.name.split(' ')[0],
    hours: +(e.totalMinutes / 60).toFixed(1),
  }));

  const projChartData = projects.slice(0, 7).map((p, i) => ({
    name: p.name.length > 16 ? p.name.slice(0, 14) + '…' : p.name,
    value: +(p.totalMinutes / 60).toFixed(1),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-navy-900">Reports</h1>
          <p className="text-sm text-slate-400 mt-0.5">Analyse team hours and project progress</p>
        </div>
        <button onClick={handleExport} className="btn-primary gap-2">
          <Download size={16} />
          Export Excel
        </button>
      </div>

      {/* Date range */}
      <div className="card">
        <p className="text-xs font-bold text-slate-400 mb-3">DATE RANGE</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: 'This month', start: startOfMonth(now), end: endOfMonth(now) },
            { label: 'Last month', start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) },
            { label: 'Last 3 months', start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => setRange(preset.start, preset.end)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              {preset.label}
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

      {/* Summary stats */}
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
        {/* By employee bar chart */}
        <div className="card">
          <p className="card-title">Hours by Employee</p>
          {empChartData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={empChartData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={64} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                  formatter={(v) => [`${v}h`, 'Hours']}
                />
                <Bar dataKey="hours" fill="#0e7490" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By project pie chart */}
        <div className="card">
          <p className="card-title">Hours by Project</p>
          {projChartData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={projChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {projChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                  formatter={(v) => [`${v}h`, 'Hours']}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Employee table */}
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
        {employees.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-6">No data for this range.</p>
        )}
      </div>

      {/* Project table */}
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
        {projects.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-6">No data for this range.</p>
        )}
      </div>
    </div>
  );
}
