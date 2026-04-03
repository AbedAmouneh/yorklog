import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { teamsApi } from '../lib/api.js';
import { keys } from './keys.js';

export function useTeams() {
  return useQuery({
    queryKey: keys.teams(),
    queryFn: () => teamsApi.getAll().then((r) => r.data),
  });
}

export function useManagers() {
  return useQuery({
    queryKey: keys.managers(),
    queryFn: () => teamsApi.getManagers().then((r) => r.data),
  });
}

export function useCreateTeam({ onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => teamsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.teams() });
      onSuccess?.();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create team.'),
  });
}

export function useSetManager({ onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deptId, managerId }) => teamsApi.setManager(deptId, managerId),
    onSuccess: () => {
      toast.success('Team leader updated.');
      qc.invalidateQueries({ queryKey: keys.teams() });
      onSuccess?.();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update team leader.'),
  });
}

export function useMoveMember({ onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, departmentId }) => teamsApi.moveMember(userId, departmentId),
    onSuccess: () => {
      toast.success('Member moved successfully.');
      qc.invalidateQueries({ queryKey: keys.teams() });
      onSuccess?.();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to move member.'),
  });
}
