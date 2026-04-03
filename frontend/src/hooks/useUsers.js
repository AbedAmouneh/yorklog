import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usersApi } from '../lib/api.js';
import { keys } from './keys.js';

export function useUsers(params) {
  return useQuery({
    queryKey: keys.users(),
    queryFn: () => usersApi.getAll(params).then((r) => r.data),
  });
}

export function useCreateUser({ onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => usersApi.create(data),
    onSuccess: () => {
      toast.success('User created!');
      qc.invalidateQueries({ queryKey: keys.users() });
      onSuccess?.();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Operation failed.'),
  });
}

export function useUpdateUser({ onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => usersApi.update(id, data),
    onSuccess: () => {
      toast.success('User updated!');
      qc.invalidateQueries({ queryKey: keys.users() });
      onSuccess?.();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Operation failed.'),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => usersApi.deactivate(id),
    onSuccess: () => {
      toast.success('User deactivated.');
      qc.invalidateQueries({ queryKey: keys.users() });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed.'),
  });
}
