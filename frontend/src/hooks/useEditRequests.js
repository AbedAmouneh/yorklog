import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { editRequestsApi } from '../lib/api.js';
import { keys } from './keys.js';

export function useTeamEditRequests(status) {
  return useQuery({
    queryKey: keys.teamRequests(status),
    queryFn: () => editRequestsApi.getTeamRequests({ status: status || undefined }).then((r) => r.data),
    refetchInterval: 30_000,
  });
}

export function useSubmitEditRequest({ onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, ...data }) => editRequestsApi.submit(entryId, data),
    onSuccess: () => {
      toast.success('Edit request submitted!');
      qc.invalidateQueries({ queryKey: ['my-entries'] });
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to submit edit request.');
    },
  });
}

export function useApproveEditRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => editRequestsApi.approve(id),
    onSuccess: () => {
      toast.success('Edit request approved!');
      qc.invalidateQueries({ queryKey: ['team-requests'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to approve.'),
  });
}

export function useRejectEditRequest({ onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => editRequestsApi.reject(id, reason),
    onSuccess: () => {
      toast.success('Edit request rejected.');
      qc.invalidateQueries({ queryKey: ['team-requests'] });
      onSuccess?.();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to reject.'),
  });
}
