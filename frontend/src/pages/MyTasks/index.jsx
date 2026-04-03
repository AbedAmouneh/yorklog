import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { useMyTasksFiltered, useCompleteTask, useUpdateTask, useCreateTask, useDeleteTask } from '../../hooks/useTasks.js';
import { useMyProjects } from '../../hooks/useProjects.js';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@yorklog/assets';
import { Circle, PlayCircle, CheckSquare, Plus, X, ChevronDown } from 'lucide-react';

const STATUS_ICONS = { todo: Circle, in_progress: PlayCircle, done: CheckSquare };

// ── Complete Task Modal ────────────────────────────────────────────────────────

function CompleteModal({ task, onClose, onDone }) {
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
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">{task.project?.name}</p>
            <h2 className="text-base font-bold text-navy-900">{task.title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none ml-4">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Hours worked <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {[0.5, 1, 2, 3, 4, 6, 8].map((h) => (
                <button key={h} onClick={() => setHours(String(h))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${hours === String(h) ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-600 hover:border-brand-300'}`}>
                  {h}h
                </button>
              ))}
            </div>
            <input type="number" min="0.25" max="24" step="0.25" value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Or type a custom value" className="input w-full" />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Any extra details…" rows={3} className="input w-full resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
          <button disabled={!hours || mutation.isPending}
            className="btn btn-primary flex-1 disabled:opacity-50"
            onClick={() => mutation.mutate({
              id: task.id,
              hours: parseFloat(hours),
              description: desc || undefined,
            })}>
            {mutation.isPending ? 'Saving…' : '✓ Mark Done & Log'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Task Modal ─────────────────────────────────────────────────────────────

function AddTaskModal({ onClose, onDone }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [projectId, setProjectId] = useState('');
  const [taskTypeId, setTaskTypeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [error, setError] = useState('');

  const { data: projectsData } = useMyProjects();
  const projects = projectsData?.projects ?? [];

  const selectedProject = projects.find((p) => p.id === projectId);
  const taskTypes = selectedProject?.taskTypes ?? [];

  const mutation = useCreateTask({
    onSuccess: () => { onDone(); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-navy-900">New Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Task title <span className="text-red-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?" className="input w-full" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Project <span className="text-red-500">*</span></label>
            <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setTaskTypeId(''); }}
              className="input w-full">
              <option value="">— Select a project —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {taskTypes.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category <span className="text-slate-400 font-normal">(optional)</span></label>
              <select value={taskTypeId} onChange={(e) => setTaskTypeId(e.target.value)} className="input w-full">
                <option value="">— None —</option>
                {taskTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Due date <span className="text-slate-400 font-normal">(optional)</span></label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Est. hours <span className="text-slate-400 font-normal">(optional)</span></label>
              <input type="number" min="0.25" max="999" step="0.25" value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)} placeholder="e.g. 4" className="input w-full" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Any extra context…" rows={2} className="input w-full resize-none" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutation.mutate({
              title: title.trim(),
              description: desc.trim() || undefined,
              projectId,
              taskTypeId: taskTypeId || undefined,
              dueDate: dueDate || undefined,
              estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
            })} disabled={!title.trim() || !projectId || mutation.isPending}
            className="btn btn-primary flex-1 disabled:opacity-50">
            {mutation.isPending ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const FILTERS = ['all', 'todo', 'in_progress', 'done'];
const FILTER_LABELS = { all: 'All', ...TASK_STATUS_LABELS };

export default function MyTasks() {
  const [filter, setFilter] = useState('all');
  const [completingTask, setCompletingTask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const qc = useQueryClient();

  const { data, refetch } = useMyTasksFiltered(filter);

  const statusMutation = useUpdateTask({ onSuccess: () => refetch() });

  const deleteMutation = useDeleteTask({ onSuccess: () => refetch() });

  const tasks = data?.tasks ?? [];

  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const handleDone = () => {
    refetch();
    qc.invalidateQueries({ queryKey: ['my-tasks'] });
    qc.invalidateQueries({ queryKey: ['calendar'] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-navy-900">My Tasks</h1>
          <p className="text-sm text-slate-400 mt-0.5">Tasks assigned to you across all projects</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {FILTER_LABELS[f]}
            {counts[f] > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-white/20' : 'bg-slate-200'}`}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="card text-center py-16">
          <CheckSquare size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">No tasks here</p>
          <p className="text-slate-400 text-sm mt-1">
            {filter === 'all' ? 'You have no tasks yet. Create one or ask your manager to assign one.' : `No ${FILTER_LABELS[filter].toLowerCase()} tasks.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const colors = TASK_STATUS_COLORS[task.status] ?? TASK_STATUS_COLORS.todo;
            const Icon = STATUS_ICONS[task.status] ?? STATUS_ICONS.todo;
            const statusLabel = TASK_STATUS_LABELS[task.status] ?? TASK_STATUS_LABELS.todo;
            return (
              <div key={task.id} className={`card hover:shadow-md transition-all border ${
                task.status === 'done' ? 'opacity-60 border-slate-100' : 'border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <Icon size={16} className={`mt-0.5 shrink-0 ${colors.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-slate-400">
                      <span>{task.project?.name}</span>
                      {task.taskType && <><span>·</span><span>{task.taskType.name}</span></>}
                      {task.dueDate && (
                        <><span>·</span>
                        <span className="font-medium text-slate-500">Due {format(parseISO(task.dueDate), 'd MMM yyyy')}</span></>
                      )}
                      {task.estimatedHours && <><span>·</span><span>~{task.estimatedHours}h</span></>}
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${colors.bg}`}>
                    {statusLabel}
                  </span>
                </div>

                {task.status !== 'done' && (
                  <div className="flex gap-2 mt-3">
                    {task.status === 'todo' && (
                      <button onClick={() => statusMutation.mutate({ id: task.id, status: 'in_progress' })}
                        className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 font-semibold hover:bg-blue-50 transition-all">
                        Start
                      </button>
                    )}
                    <button onClick={() => setCompletingTask(task)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all">
                      Mark Done & Log Hours
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {completingTask && (
        <CompleteModal task={completingTask} onClose={() => setCompletingTask(null)} onDone={handleDone} />
      )}
      {showAddModal && (
        <AddTaskModal onClose={() => setShowAddModal(false)} onDone={handleDone} />
      )}
    </div>
  );
}
