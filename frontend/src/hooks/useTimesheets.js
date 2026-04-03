import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { timesheetsApi } from '../lib/api.js';
import { keys } from './keys.js';

export function useCalendar(year, month) {
  return useQuery({
    queryKey: keys.calendar(year, month),
    queryFn: () => timesheetsApi.getCalendar(year, month).then((r) => r.data),
  });
}

export function useMyEntries(dateStr, params) {
  return useQuery({
    queryKey: keys.myEntries(dateStr),
    queryFn: () => timesheetsApi.getMyEntries(params).then((r) => r.data),
  });
}

export function useTeamEntries(params) {
  return useQuery({
    queryKey: ['team-entries', params],
    queryFn: () => timesheetsApi.getTeamEntries(params).then((r) => r.data),
  });
}

export function useCreateEntry({ onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => timesheetsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar'] });
      qc.invalidateQueries({ queryKey: ['my-entries'] });
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to log hours.');
    },
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => timesheetsApi.delete(id),
    onSuccess: () => {
      toast.success('Entry deleted.');
      qc.invalidateQueries({ queryKey: ['my-entries'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not delete.'),
  });
}
