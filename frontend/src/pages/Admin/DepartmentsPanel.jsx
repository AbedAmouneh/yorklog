import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDepartments, useCreateDepartment, useUpdateDepartment } from '../../hooks/useDepartments.js';
import { Plus, X, Edit2, Building2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2),
  maxDailyHours: z.coerce.number().min(1).max(24),
});

function DeptForm({ onClose, editDept }) {
  const isEdit = !!editDept;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: editDept ?? { maxDailyHours: 8 },
  });

  const createMutation = useCreateDepartment({ onSuccess: onClose });
  const updateMutation = useUpdateDepartment({ onSuccess: onClose });

  const mutation = {
    mutate: (data) => {
      if (isEdit) {
        updateMutation.mutate({ id: editDept.id, ...data });
      } else {
        createMutation.mutate(data);
      }
    },
    isPending: createMutation.isPending || updateMutation.isPending,
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{isEdit ? 'Edit Department' : 'New Department'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-5 space-y-4">
          <div>
            <label className="label">Department Name *</label>
            <input {...register('name')} className="input" placeholder="e.g. Development & IT" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Max Daily Hours *</label>
            <input {...register('maxDailyHours')} type="number" min={1} max={24} className="input" />
            {errors.maxDailyHours && <p className="text-red-500 text-xs mt-1">Enter a value between 1 and 24</p>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DepartmentsPanel() {
  const [showForm, setShowForm] = useState(false);
  const [editDept, setEditDept] = useState(null);

  const { data, isLoading } = useDepartments();

  const departments = data?.departments ?? [];

  return (
    <div className="space-y-4">
      {(showForm || editDept) && (
        <DeptForm
          editDept={editDept}
          onClose={() => { setShowForm(false); setEditDept(null); }}
        />
      )}

      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary gap-1.5">
          <Plus size={16} /> New Department
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-slate-400 py-8">Loading…</p>
      ) : departments.length === 0 ? (
        <div className="card text-center py-10">
          <Building2 size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No departments yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div key={d.id} className="card flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <Building2 size={20} className="text-brand-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800">{d.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">Max {d.maxDailyHours}h / day</p>
                <p className="text-xs text-slate-400">{d._count?.users ?? 0} members</p>
              </div>
              <button
                onClick={() => setEditDept(d)}
                className="p-1.5 text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors shrink-0"
              >
                <Edit2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
