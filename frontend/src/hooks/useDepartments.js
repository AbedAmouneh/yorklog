import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { departmentsApi } from '../lib/api.js';
import { keys } from './keys.js';

export function useDepartments() {
  return useQuery({
    queryKey: keys.departments(),
    queryFn: () => departmentsApi.getAll().then((r) => r.data),
  });
}

export function useCreateDepartment({ onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => departmentsApi.create(data),
    onSuccess: () => {
      toast.success('Department created!');
      qc.invalidateQueries({ queryKey: keys.departments() });
      onSuccess?.();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed.'),
  });
}

export function useUpdateDepartment({ onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => departmentsApi.update(id, data),
    onSuccess: () => {
      toast.success('Department updated!');
      qc.invalidateQueries({ queryKey: keys.departments() });
      onSuccess?.();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed.'),
  });
}
