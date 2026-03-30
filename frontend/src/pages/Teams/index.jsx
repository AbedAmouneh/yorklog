import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { teamsApi } from '../../lib/api.js';
import { Users, UserPlus, ArrowRight, X, Edit2, Plus, Search } from 'lucide-react';

const ROLE_LABELS = {
  employee: 'Employee',
  dept_manager: 'Team Leader',
  hr_finance: 'HR / Finance',
  org_admin: 'Manager',
  super_admin: 'Super Admin',
};

const ROLE_BADGE_COLORS = {
  employee: 'bg-slate-100 text-slate-600',
  dept_manager: 'bg-brand-50 text-brand-700',
  hr_finance: 'bg-purple-50 text-purple-700',
  org_admin: 'bg-amber-50 text-amber-700',
  super_admin: 'bg-red-50 text-red-700',
};

function initials(name) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

// ── Create Team Modal ─────────────────────────────────────────────────────────

function CreateTeamModal({ allUsers, onClose }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [maxDailyHours, setMaxDailyHours] = useState('');
  const [headUserId, setHeadUserId] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');

  const { data: managersData } = useQuery({
    queryKey: ['managers'],
    queryFn: () => teamsApi.getManagers().then((r) => r.data),
  });
  const managers = managersData?.managers ?? [];

  const filteredUsers = allUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const mutation = useMutation({
    mutationFn: () =>
      teamsApi.create({
        name: name.trim(),
        maxDailyHours: maxDailyHours ? Number(maxDailyHours) : undefined,
        headUserId: headUserId || null,
        memberIds: [...selectedIds],
      }),
    onSuccess: () => {
      toast.success(`Team "${name.trim()}" created!`);
      qc.invalidateQueries({ queryKey: ['teams'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create team.'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-bold text-slate-800">New Team</h3>
            <p className="text-xs text-slate-400 mt-0.5">Set up a team and assign members right away</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Team name */}
          <div>
            <label className="label">Team Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g. Design, Marketing, Engineering…"
              autoFocus
            />
          </div>

          {/* Max daily hours */}
          <div>
            <label className="label">
              Max Daily Hours <span className="font-normal text-slate-400">(optional, default 8)</span>
            </label>
            <input
              type="number"
              value={maxDailyHours}
              onChange={(e) => setMaxDailyHours(e.target.value)}
              className="input"
              min={1}
              max={24}
              placeholder="8"
            />
          </div>

          {/* Team Leader */}
          <div>
            <label className="label">
              Team Leader <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <select
              value={headUserId}
              onChange={(e) => setHeadUserId(e.target.value)}
              className="input"
            >
              <option value="">— None —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {managers.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">No Team Leader users exist yet. Create one in Admin → Users.</p>
            )}
          </div>

          {/* Member selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">
                Members <span className="font-normal text-slate-400">(optional)</span>
              </label>
              {selectedIds.size > 0 && (
                <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                  {selectedIds.size} selected
                </span>
              )}
            </div>

            {/* Search */}
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-8 text-sm py-1.5"
                placeholder="Search people…"
              />
            </div>

            {/* User list */}
            <div className="border border-slate-100 rounded-lg divide-y divide-slate-50 max-h-48 overflow-y-auto">
              {filteredUsers.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 italic">No users found</p>
              )}
              {filteredUsers.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(u.id)}
                    onChange={() => toggleUser(u.id)}
                    className="w-4 h-4 accent-brand-700 shrink-0"
                  />
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-slate-500">{initials(u.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-semibold shrink-0 ${ROLE_BADGE_COLORS[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
            className="btn-primary flex-1 justify-center"
          >
            {mutation.isPending
              ? 'Creating…'
              : `Create Team${selectedIds.size > 0 ? ` · ${selectedIds.size} member${selectedIds.size !== 1 ? 's' : ''}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Move Member Modal ─────────────────────────────────────────────────────────

function MoveModal({ user, departments, onClose }) {
  const qc = useQueryClient();
  const [targetDeptId, setTargetDeptId] = useState(user.departmentId ?? '');

  const mutation = useMutation({
    mutationFn: () => teamsApi.moveMember(user.id, targetDeptId || null),
    onSuccess: () => {
      toast.success(`${user.name} moved successfully.`);
      qc.invalidateQueries({ queryKey: ['teams'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to move member.'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">Move {user.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Reassign to a different team</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Team</label>
            <select
              value={targetDeptId}
              onChange={(e) => setTargetDeptId(e.target.value)}
              className="input"
            >
              <option value="">— Unassigned —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}{d.headUser ? ` (${d.headUser.name})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="btn-primary flex-1 justify-center"
            >
              {mutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Set Manager Modal ─────────────────────────────────────────────────────────

function SetManagerModal({ dept, onClose }) {
  const qc = useQueryClient();
  const [managerId, setManagerId] = useState(dept.headUserId ?? '');

  const { data } = useQuery({
    queryKey: ['managers'],
    queryFn: () => teamsApi.getManagers().then((r) => r.data),
  });
  const managers = data?.managers ?? [];

  const mutation = useMutation({
    mutationFn: () => teamsApi.setManager(dept.id, managerId || null),
    onSuccess: () => {
      toast.success('Team leader updated.');
      qc.invalidateQueries({ queryKey: ['teams'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update team leader.'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">Set Team Leader</h3>
            <p className="text-xs text-slate-400 mt-0.5">{dept.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Team Leader</label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="input"
            >
              <option value="">— None —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {managers.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">No Team Leader users found. Create one in Admin → Users first.</p>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="btn-primary flex-1 justify-center"
            >
              {mutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Department Card ───────────────────────────────────────────────────────────

function DeptCard({ dept, allDepartments }) {
  const [showSetManager, setShowSetManager] = useState(false);
  const [movingUser, setMovingUser] = useState(null);

  const members = dept.users ?? [];

  return (
    <>
      {showSetManager && (
        <SetManagerModal dept={dept} onClose={() => setShowSetManager(false)} />
      )}
      {movingUser && (
        <MoveModal user={movingUser} departments={allDepartments} onClose={() => setMovingUser(null)} />
      )}

      <div className="card flex flex-col gap-3">
        {/* Card header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800">{dept.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Team leader row */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-brand-700">
              {dept.headUser ? initials(dept.headUser.name) : '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500 leading-none mb-0.5">TEAM LEADER</p>
            <p className="text-sm font-medium text-slate-800 truncate">
              {dept.headUser?.name ?? <span className="text-slate-300 italic font-normal">Unassigned</span>}
            </p>
          </div>
          <button
            onClick={() => setShowSetManager(true)}
            className="p-1.5 text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
            title="Change team leader"
          >
            <Edit2 size={13} />
          </button>
        </div>

        {/* Member list */}
        <div className="divide-y divide-slate-50">
          {members.map((u) => (
            <div key={u.id} className="flex items-center gap-2.5 py-2">
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-slate-500">{initials(u.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-semibold ${ROLE_BADGE_COLORS[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>
              </div>
              <button
                onClick={() => setMovingUser(u)}
                className="p-1.5 text-slate-300 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                title="Move to another team"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-xs text-slate-400 py-3 text-center italic">No members assigned</p>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Teams() {
  const [showCreate, setShowCreate] = useState(false);
  const [movingUnassigned, setMovingUnassigned] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll().then((r) => r.data),
  });

  const departments = data?.departments ?? [];
  const unassigned = data?.unassigned ?? [];

  // All active users for the member picker in the create modal
  const allUsers = [
    ...departments.flatMap((d) => d.users ?? []),
    ...unassigned,
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-navy-900">Team Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Create teams, assign members, and set team leaders
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary gap-1.5">
          <Plus size={16} /> New Team
        </button>
      </div>

      {showCreate && (
        <CreateTeamModal
          allUsers={allUsers}
          onClose={() => setShowCreate(false)}
        />
      )}

      {isLoading ? (
        <p className="text-center text-slate-400 py-10">Loading…</p>
      ) : (
        <>
          {/* Department cards grid */}
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {departments.map((d) => (
              <DeptCard key={d.id} dept={d} allDepartments={departments} />
            ))}
          </div>

          {/* Unassigned employees */}
          {unassigned.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-slate-400" />
                <p className="font-bold text-slate-700">
                  Unassigned ({unassigned.length})
                </p>
              </div>
              <div className="divide-y divide-slate-50">
                {unassigned.map((u) => (
                  <div key={u.id} className="flex items-center gap-2.5 py-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-slate-500">{initials(u.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                    <button
                      onClick={() => setMovingUnassigned(u)}
                      className="btn-secondary text-xs gap-1.5 py-1 px-2.5"
                    >
                      <UserPlus size={12} />
                      Assign
                    </button>
                  </div>
                ))}
              </div>

              {movingUnassigned && (
                <MoveModal
                  user={movingUnassigned}
                  departments={departments}
                  onClose={() => setMovingUnassigned(null)}
                />
              )}
            </div>
          )}

          {departments.length === 0 && !isLoading && (
            <div className="card text-center py-12">
              <Users size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold">No teams yet</p>
              <p className="text-slate-400 text-sm mt-1">Click "New Team" to create your first team.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
