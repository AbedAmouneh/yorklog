import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { projectsApi, usersApi, tasksApi } from '../../lib/api.js';
import { Plus, X, ChevronDown, ChevronUp, Edit2, Users, Zap, ListTodo, Circle, PlayCircle, CheckSquare } from 'lucide-react';

const TASK_STATUS_META = {
  todo: { label: 'To Do', icon: Circle, bg: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'In Progress', icon: PlayCircle, bg: 'bg-blue-100 text-blue-700' },
  done: { label: 'Done', icon: CheckSquare, bg: 'bg-green-100 text-green-700' },
};

function AssignTaskModal({ project, onClose }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [taskTypeId, setTaskTypeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [error, setError] = useState('');

  const members = project.assignments?.map((a) => a.user).filter(Boolean) ?? [];
  const taskTypes = project.taskTypes ?? [];

  const mutation = useMutation({
    mutationFn: () => tasksApi.create({
      title: title.trim(),
      description: desc.trim() || undefined,
      projectId: project.id,
      assignedToId: assignedToId || undefined,
      taskTypeId: taskTypeId || undefined,
      dueDate: dueDate || undefined,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
    }),
    onSuccess: () => {
      toast.success('Task assigned!');
      qc.invalidateQueries({ queryKey: ['project-assigned-tasks', project.id] });
      onClose();
    },
    onError: (e) => setError(e.response?.data?.error?.message || 'Could not create task.'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">Assign Task</h3>
            <p className="text-xs text-slate-400 mt-0.5">{project.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Task title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?" className="input" />
          </div>
          <div>
            <label className="label">Assign to *</label>
            <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="input">
              <option value="">— Select employee —</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {members.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No employees assigned to this project yet.</p>
            )}
          </div>
          {taskTypes.length > 0 && (
            <div>
              <label className="label">Category <span className="font-normal text-slate-400">(optional)</span></label>
              <select value={taskTypeId} onChange={(e) => setTaskTypeId(e.target.value)} className="input">
                <option value="">— None —</option>
                {taskTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Due date <span className="font-normal text-slate-400">(opt.)</span></label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Est. hours <span className="font-normal text-slate-400">(opt.)</span></label>
              <input type="number" min="0.25" max="999" step="0.25" value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)} placeholder="e.g. 4" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Description <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Any extra context…" rows={2} className="input resize-none" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={() => mutation.mutate()}
            disabled={!title.trim() || !assignedToId || mutation.isPending}
            className="btn-primary flex-1 justify-center disabled:opacity-50">
            {mutation.isPending ? 'Assigning…' : 'Assign Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignedTasksSection({ project }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['project-assigned-tasks', project.id],
    queryFn: () => tasksApi.getAll({ projectId: project.id }).then((r) => r.data),
  });
  const tasks = data?.tasks ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: () => {
      toast.success('Task removed.');
      qc.invalidateQueries({ queryKey: ['project-assigned-tasks', project.id] });
    },
  });

  if (tasks.length === 0) return (
    <p className="text-xs text-slate-400 py-2 text-center">No tasks assigned yet.</p>
  );

  return (
    <div className="space-y-2">
      {tasks.map((t) => {
        const meta = TASK_STATUS_META[t.status] ?? TASK_STATUS_META.todo;
        return (
          <div key={t.id} className="flex items-start gap-2 text-sm py-1.5">
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-slate-700 ${t.status === 'done' ? 'line-through text-slate-400' : ''}`}>{t.title}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                <span>{t.assignedTo?.name}</span>
                {t.dueDate && <span>· Due {format(parseISO(t.dueDate), 'd MMM')}</span>}
                {t.estimatedHours && <span>· ~{t.estimatedHours}h</span>}
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${meta.bg}`}>{meta.label}</span>
            {t.status !== 'done' && (
              <button onClick={() => deleteMutation.mutate(t.id)}
                className="text-slate-300 hover:text-red-500 transition-colors shrink-0">
                <X size={13} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  maxDailyHours: z.coerce.number().min(1).max(24).optional(),
});

const taskSchema = z.object({
  name: z.string().min(2),
  isQuickAccess: z.boolean().optional(),
});

function ProjectForm({ onClose, editProject }) {
  const qc = useQueryClient();
  const isEdit = !!editProject;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: editProject ?? {},
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? projectsApi.update(editProject.id, data) : projectsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Project updated!' : 'Project created!');
      qc.invalidateQueries({ queryKey: ['all-projects'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed.'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{isEdit ? 'Edit Project' : 'New Project'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-5 space-y-4">
          <div>
            <label className="label">Project Name *</label>
            <input {...register('name')} className="input" placeholder="e.g. Website Redesign" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={2} className="input resize-none" placeholder="Brief description…" />
          </div>
          <div>
            <label className="label">Max Daily Hours <span className="font-normal text-slate-400">(optional)</span></label>
            <input {...register('maxDailyHours')} type="number" min={1} max={24} className="input" placeholder="e.g. 8" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignModal({ project, onClose }) {
  const qc = useQueryClient();

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll().then((r) => r.data),
  });

  const allUsers = usersData?.users?.filter((u) => u.isActive) ?? [];
  const assignedIds = new Set(project.assignments?.map((a) => a.userId) ?? []);
  const [selected, setSelected] = useState(new Set(assignedIds));

  const mutation = useMutation({
    mutationFn: () => projectsApi.assign(project.id, [...selected]),
    onSuccess: () => {
      toast.success('Assignments saved!');
      qc.invalidateQueries({ queryKey: ['all-projects'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed.'),
  });

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Assign Employees — {project.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-5 max-h-80 overflow-y-auto divide-y divide-slate-50">
          {allUsers.map((u) => (
            <label key={u.id} className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg">
              <input
                type="checkbox"
                checked={selected.has(u.id)}
                onChange={() => toggle(u.id)}
                className="w-4 h-4 accent-brand-700"
              />
              <div>
                <p className="text-sm font-medium text-slate-800">{u.name}</p>
                <p className="text-xs text-slate-400">{u.department?.name}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
            {mutation.isPending ? 'Saving…' : `Save (${selected.size} selected)`}
          </button>
        </div>
      </div>
    </div>
  );
}

function TasksSection({ project }) {
  const qc = useQueryClient();
  const [newTaskName, setNewTaskName] = useState('');
  const [isQuick, setIsQuick] = useState(false);

  const { data: tasksData } = useQuery({
    queryKey: ['project-tasks', project.id],
    queryFn: () => projectsApi.getTasks(project.id).then((r) => r.data),
  });

  const createTask = useMutation({
    mutationFn: () => projectsApi.createTask(project.id, { name: newTaskName, isQuickAccess: isQuick }),
    onSuccess: () => {
      toast.success('Task added!');
      setNewTaskName('');
      setIsQuick(false);
      qc.invalidateQueries({ queryKey: ['project-tasks', project.id] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed.'),
  });

  const deleteTask = useMutation({
    mutationFn: (taskId) => projectsApi.deleteTask(project.id, taskId),
    onSuccess: () => {
      toast.success('Task removed.');
      qc.invalidateQueries({ queryKey: ['project-tasks', project.id] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed.'),
  });

  const tasks = tasksData?.tasks ?? [];

  return (
    <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
      <p className="text-xs font-bold text-slate-400 mb-2">TASK TYPES</p>
      {tasks.map((t) => (
        <div key={t.id} className="flex items-center gap-2 text-sm">
          {t.isQuickAccess && <Zap size={12} className="text-brand-700 shrink-0" />}
          <span className="flex-1 text-slate-700">{t.name}</span>
          <button
            onClick={() => { if (confirm(`Delete "${t.name}"?`)) deleteTask.mutate(t.id); }}
            className="text-slate-300 hover:text-red-500 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      ))}
      {/* Add task row */}
      <div className="flex gap-2 pt-1">
        <input
          type="text"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          placeholder="New task type…"
          className="input text-xs py-1.5 flex-1"
          onKeyDown={(e) => e.key === 'Enter' && newTaskName && createTask.mutate()}
        />
        <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
          <input type="checkbox" checked={isQuick} onChange={(e) => setIsQuick(e.target.checked)} className="accent-brand-700" />
          Quick
        </label>
        <button
          onClick={() => newTaskName && createTask.mutate()}
          disabled={!newTaskName || createTask.isPending}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function ProjectRow({ project }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [expandedTab, setExpandedTab] = useState('tasks'); // 'tasks' | 'types'
  const [showEdit, setShowEdit] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);

  const archiveMutation = useMutation({
    mutationFn: () => projectsApi.update(project.id, { status: project.status === 'active' ? 'archived' : 'active' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-projects'] }),
    onError: (err) => toast.error(err.response?.data?.error || 'Failed.'),
  });

  return (
    <>
      {showEdit && <ProjectForm editProject={project} onClose={() => setShowEdit(false)} />}
      {showAssign && <AssignModal project={project} onClose={() => setShowAssign(false)} />}
      {showAssignTask && <AssignTaskModal project={project} onClose={() => setShowAssignTask(false)} />}

      <div className={`card ${project.status === 'archived' ? 'opacity-60' : ''}`}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800">{project.name}</span>
              <span className={`badge ${project.status === 'active' ? 'badge-green' : 'badge-slate'}`}>
                {project.status}
              </span>
              {project.maxDailyHours && (
                <span className="badge badge-teal">Max {project.maxDailyHours}h/day</span>
              )}
            </div>
            {project.description && (
              <p className="text-xs text-slate-400 mt-1">{project.description}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {project._count?.assignments ?? project.assignments?.length ?? 0} employees assigned
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setShowAssign(true)} className="btn-ghost text-xs gap-1 py-1.5 px-2" title="Assign employees">
              <Users size={13} /> People
            </button>
            <button onClick={() => setShowAssignTask(true)} className="btn-ghost text-xs gap-1 py-1.5 px-2" title="Assign a task">
              <ListTodo size={13} /> Task
            </button>
            <button onClick={() => setShowEdit(true)} className="p-1.5 text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors">
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => archiveMutation.mutate()}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title={project.status === 'active' ? 'Archive' : 'Restore'}
            >
              {project.status === 'active' ? 'Archive' : 'Restore'}
            </button>
            <button onClick={() => setExpanded((v) => !v)} className="p-1.5 text-slate-400 hover:text-slate-600">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        {expanded && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setExpandedTab('tasks')}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${expandedTab === 'tasks' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Assigned Tasks
              </button>
              <button onClick={() => setExpandedTab('types')}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${expandedTab === 'types' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Task Categories
              </button>
            </div>
            {expandedTab === 'tasks' ? (
              <AssignedTasksSection project={project} />
            ) : (
              <TasksSection project={project} />
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function ProjectsPanel() {
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState('active');

  const { data, isLoading } = useQuery({
    queryKey: ['all-projects', filterStatus],
    queryFn: () =>
      projectsApi.getAll({ status: filterStatus || undefined }).then((r) => r.data),
  });

  const projects = data?.projects ?? [];

  return (
    <div className="space-y-4">
      {showCreate && <ProjectForm onClose={() => setShowCreate(false)} />}

      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[{ v: 'active', l: 'Active' }, { v: 'archived', l: 'Archived' }, { v: '', l: 'All' }].map((t) => (
            <button
              key={t.v}
              onClick={() => setFilterStatus(t.v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                filterStatus === t.v ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary ml-auto gap-1.5">
          <Plus size={16} /> New Project
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-slate-400 py-8">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-slate-400 text-sm">No {filterStatus} projects.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => <ProjectRow key={p.id} project={p} />)}
        </div>
      )}
    </div>
  );
}
