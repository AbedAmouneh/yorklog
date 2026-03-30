import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { projectsApi, timesheetsApi } from '../../lib/api.js';
import { Zap, Clock } from 'lucide-react';

const schema = z.object({
  projectId: z.string().min(1, 'Select a project'),
  taskTypeId: z.string().min(1, 'Select a task type'),
  date: z.string().min(1, 'Select a date'),
  hours: z.coerce.number().min(0).max(23),
  minutes: z.coerce.number().min(0).max(59),
  taskSummary: z.string().min(3, 'Enter at least 3 characters').max(200),
  description: z.string().max(1000).optional(),
}).refine((d) => d.hours * 60 + d.minutes >= 15, {
  message: 'Log at least 15 minutes',
  path: ['minutes'],
});

const QUICK_DURATIONS = [
  { label: '30m', h: 0, m: 30 },
  { label: '1h', h: 1, m: 0 },
  { label: '2h', h: 2, m: 0 },
  { label: '4h', h: 4, m: 0 },
  { label: '6h', h: 6, m: 0 },
  { label: '8h', h: 8, m: 0 },
];

export default function LogHours() {
  const qc = useQueryClient();
  const [selectedProject, setSelectedProject] = useState('');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      projectId: '',
      taskTypeId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      hours: 0,
      minutes: 0,
      taskSummary: '',
      description: '',
    },
  });

  const projectId = watch('projectId');

  // Projects the current user is assigned to
  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['my-projects'],
    queryFn: () => projectsApi.getMyProjects().then((r) => r.data),
  });

  // Task types for selected project
  const { data: tasksData } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => projectsApi.getTasks(projectId).then((r) => r.data),
    enabled: !!projectId,
  });

  const projects = projectsData?.projects ?? [];
  const taskTypes = tasksData?.tasks ?? [];
  const quickTasks = taskTypes.filter((t) => t.isQuickAccess);

  const createMutation = useMutation({
    mutationFn: (data) => timesheetsApi.create(data),
    onSuccess: () => {
      toast.success('Hours logged successfully!');
      reset({
        projectId: '',
        taskTypeId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        hours: 0,
        minutes: 0,
        taskSummary: '',
        description: '',
      });
      setSelectedProject('');
      qc.invalidateQueries({ queryKey: ['calendar'] });
      qc.invalidateQueries({ queryKey: ['my-entries'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to log hours.');
    },
  });

  const onSubmit = (data) => {
    const { hours, minutes, ...rest } = data;
    createMutation.mutate({
      ...rest,
      totalMinutes: hours * 60 + minutes,
    });
  };

  const setQuickDuration = (h, m) => {
    setValue('hours', h, { shouldValidate: true });
    setValue('minutes', m, { shouldValidate: true });
  };

  const setQuickTask = (task) => {
    setValue('taskTypeId', task.id, { shouldValidate: true });
    setValue('taskSummary', task.name, { shouldValidate: true });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-black text-navy-900">Log Hours</h1>
        <p className="text-sm text-slate-400 mt-0.5">Record your work for any day</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Project */}
          <div>
            <label className="label">Project *</label>
            <select
              {...register('projectId', {
                onChange: () => setValue('taskTypeId', ''),
              })}
              className="input"
            >
              <option value="">— Select a project —</option>
              {loadingProjects && <option disabled>Loading…</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="text-red-500 text-xs mt-1">{errors.projectId.message}</p>
            )}
          </div>

          {/* Task type */}
          <div>
            <label className="label">Task Type *</label>
            {quickTasks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {quickTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setQuickTask(t)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100 transition-colors border border-brand-100"
                  >
                    <Zap size={11} />
                    {t.name}
                  </button>
                ))}
              </div>
            )}
            <select {...register('taskTypeId')} className="input" disabled={!projectId}>
              <option value="">— Select a task type —</option>
              {taskTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.taskTypeId && (
              <p className="text-red-500 text-xs mt-1">{errors.taskTypeId.message}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="label">Date *</label>
            <input
              {...register('date')}
              type="date"
              max={format(new Date(), 'yyyy-MM-dd')}
              className="input"
            />
            {errors.date && (
              <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="label">Duration *</label>
            {/* Quick duration buttons */}
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_DURATIONS.map(({ label, h, m }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setQuickDuration(h, m)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                  <Clock size={11} />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  {...register('hours', { valueAsNumber: true })}
                  type="number"
                  min={0}
                  max={23}
                  placeholder="0"
                  className="input text-center"
                />
                <p className="text-center text-xs text-slate-400 mt-1">Hours</p>
              </div>
              <div className="flex-1">
                <input
                  {...register('minutes', { valueAsNumber: true })}
                  type="number"
                  min={0}
                  max={59}
                  step={5}
                  placeholder="0"
                  className="input text-center"
                />
                <p className="text-center text-xs text-slate-400 mt-1">Minutes</p>
              </div>
            </div>
            {errors.minutes && (
              <p className="text-red-500 text-xs mt-1">{errors.minutes.message}</p>
            )}
          </div>

          {/* Task summary */}
          <div>
            <label className="label">Task Summary *</label>
            <input
              {...register('taskSummary')}
              type="text"
              placeholder="Brief description of what you worked on"
              className="input"
            />
            {errors.taskSummary && (
              <p className="text-red-500 text-xs mt-1">{errors.taskSummary.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="label">Additional Details <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Any extra details, blockers, or notes…"
              className="input resize-none"
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className="btn-primary w-full justify-center py-3"
            >
              {isSubmitting || createMutation.isPending ? 'Saving…' : 'Submit Hours'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
