import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { usersApi, departmentsApi } from '../../lib/api.js';
import { Plus, X, UserX, Edit2 } from 'lucide-react';

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['employee', 'dept_manager', 'hr_finance', 'org_admin', 'super_admin']),
  departmentId: z.string().min(1),
});

const editSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['employee', 'dept_manager', 'hr_finance', 'org_admin', 'super_admin']),
  departmentId: z.string().min(1),
  password: z.string().optional(),
});

const ROLE_LABELS = {
  employee: 'Employee',
  dept_manager: 'Team Leader',
  hr_finance: 'HR / Finance',
  org_admin: 'Manager',
  super_admin: 'Super Admin',
};

function UserForm({ departments, onClose, editUser }) {
  const qc = useQueryClient();
  const isEdit = !!editUser;
  const schema = isEdit ? editSchema : createSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: editUser
      ? {
          name: editUser.name,
          email: editUser.email,
          role: editUser.role,
          departmentId: editUser.departmentId,
          password: '',
        }
      : { role: 'employee' },
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data };
      if (isEdit && !payload.password) delete payload.password;
      return isEdit
        ? usersApi.update(editUser.id, payload)
        : usersApi.create(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'User updated!' : 'User created!');
      qc.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Operation failed.'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{isEdit ? 'Edit User' : 'Create User'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input {...register('name')} className="input" placeholder="John Doe" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Email *</label>
              <input {...register('email')} type="email" className="input" placeholder="john@yorkpress.co.uk" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Role *</label>
              <select {...register('role')} className="input">
                {Object.entries(ROLE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Department *</label>
              <select {...register('departmentId')} className="input">
                <option value="">— Select —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {errors.departmentId && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>
            <div className="col-span-2">
              <label className="label">
                Password {isEdit && <span className="font-normal text-slate-400">(leave blank to keep)</span>}
                {!isEdit && '*'}
              </label>
              <input
                {...register('password')}
                type="password"
                className="input"
                placeholder={isEdit ? '••••••••' : 'Min 6 characters'}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary flex-1 justify-center">
              {isSubmitting || mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPanel() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [search, setSearch] = useState('');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll().then((r) => r.data),
  });

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll().then((r) => r.data),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => usersApi.deactivate(id),
    onSuccess: () => {
      toast.success('User deactivated.');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed.'),
  });

  const users = usersData?.users ?? [];
  const departments = deptsData?.departments ?? [];
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {(showForm || editUser) && (
        <UserForm
          departments={departments}
          editUser={editUser}
          onClose={() => { setShowForm(false); setEditUser(null); }}
        />
      )}

      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="text"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-xs"
        />
        <button onClick={() => setShowForm(true)} className="btn-primary ml-auto gap-1.5">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-semibold">Name</th>
              <th className="pb-2 font-semibold">Email</th>
              <th className="pb-2 font-semibold">Role</th>
              <th className="pb-2 font-semibold">Department</th>
              <th className="pb-2 font-semibold">Status</th>
              <th className="pb-2 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Loading…</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="py-2.5 font-medium text-slate-800">{u.name}</td>
                <td className="py-2.5 text-slate-500 text-xs">{u.email}</td>
                <td className="py-2.5">
                  <span className="badge badge-teal">{ROLE_LABELS[u.role]}</span>
                </td>
                <td className="py-2.5 text-slate-400 text-xs">{u.department?.name ?? '—'}</td>
                <td className="py-2.5">
                  <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => setEditUser(u)}
                      className="p-1.5 text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    {u.isActive && (
                      <button
                        onClick={() => {
                          if (confirm(`Deactivate ${u.name}?`)) deactivateMutation.mutate(u.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deactivate"
                      >
                        <UserX size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-6">No users found.</p>
        )}
      </div>
    </div>
  );
}
