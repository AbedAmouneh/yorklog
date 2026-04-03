import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { projectsApi } from '../lib/api.js';
import { keys } from './keys.js';

export function useMyProjects() {
  return useQuery({
    queryKey: keys.myProjects(),
    queryFn: () => projectsApi.getMyProjects().then((r) => r.data),
  });
}

export function useAllProjects(status) {
  return useQuery({
    queryKey: keys.allProjects(status),
    queryFn: () => projectsApi.getAll({ status: status || undefined }).then((r) => r.data),
  });
}

export function useProjectTaskTypes(projectId) {
  return useQuery({
    queryKey: keys.projectTasks(projectId),
    queryFn: () => projectsApi.getTasks(projectId).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useCreateProject({ onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => projectsApi.create(data),
    onSuccess: () => {
      toast.success('Project created!');
      qc.invalidateQueries({ queryKey: ['all-projects'] });
      onSuccess?.();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed.'),
  });
}

export function useUpdateProject({ onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => projectsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-projects'] });
      onSuccess?.();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed.'),
  });
}

export function useAssignEmployees({ onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, userIds }) => projectsApi.assign(projectId, userIds),
    onSuccess: () => {
      toast.success('Assignments saved!');
      qc.invalidateQueries({ queryKey: ['all-projects'] });
      onSuccess?.();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed.'),
  });
}

export function useCreateTaskType({ projectId, onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => projectsApi.createTask(projectId, data),
    onSuccess: () => {
      toast.success('Task added!');
      qc.invalidateQueries({ queryKey: keys.projectTasks(projectId) });
      onSuccess?.();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed.'),
  });
}

export function useDeleteTaskType({ projectId } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId) => projectsApi.deleteTask(projectId, taskId),
    onSuccess: () => {
      toast.success('Task removed.');
      qc.invalidateQueries({ queryKey: keys.projectTasks(projectId) });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed.'),
  });
}
