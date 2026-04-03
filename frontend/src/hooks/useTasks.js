import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { tasksApi } from '../lib/api.js';
import { keys } from './keys.js';

export function useMyTasks(params) {
  return useQuery({
    queryKey: keys.myTasks(params),
    queryFn: () => tasksApi.getMyTasks(params).then((r) => r.data),
  });
}

export function useMyTasksFiltered(filter) {
  return useQuery({
    queryKey: keys.myTasksAll(filter),
    queryFn: () => tasksApi.getMyTasks(filter !== 'all' ? { status: filter } : {}).then((r) => r.data),
  });
}

export function useAllTasks(params) {
  return useQuery({
    queryKey: keys.projectAssignedTasks(params?.projectId),
    queryFn: () => tasksApi.getAll(params).then((r) => r.data),
  });
}

export function useCreateTask({ onSuccess } = {}) {
  return useMutation({
    mutationFn: (data) => tasksApi.create(data),
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (e) => toast.error(e.response?.data?.error?.message || 'Could not create task.'),
  });
}

export function useUpdateTask({ onSuccess } = {}) {
  return useMutation({
    mutationFn: ({ id, ...data }) => tasksApi.update(id, data),
    onSuccess: () => {
      onSuccess?.();
    },
  });
}

export function useCompleteTask({ onSuccess, onError } = {}) {
  return useMutation({
    mutationFn: ({ id, ...data }) => tasksApi.complete(id, data),
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (e) => {
      onError?.(e);
    },
  });
}

export function useDeleteTask({ onSuccess } = {}) {
  return useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: () => {
      toast.success('Task removed.');
      onSuccess?.();
    },
  });
}
