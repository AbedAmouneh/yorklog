import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../lib/api.js';
import { keys } from './keys.js';

export function useReportSummary(startDate, endDate) {
  return useQuery({
    queryKey: keys.reportSummary(startDate, endDate),
    queryFn: () => reportsApi.summary({ startDate, endDate }).then((r) => r.data),
  });
}

export function useReportByEmployee(startDate, endDate) {
  return useQuery({
    queryKey: keys.reportByEmployee(startDate, endDate),
    queryFn: () => reportsApi.byEmployee({ startDate, endDate }).then((r) => r.data),
  });
}

export function useReportByProject(startDate, endDate) {
  return useQuery({
    queryKey: keys.reportByProject(startDate, endDate),
    queryFn: () => reportsApi.byProject({ startDate, endDate }).then((r) => r.data),
  });
}

export function useWhoLoggedToday() {
  return useQuery({
    queryKey: keys.whoLoggedToday(),
    queryFn: () => reportsApi.whoLoggedToday().then((r) => r.data),
    refetchInterval: 60_000,
  });
}

export function useHoursLog(params) {
  return useQuery({
    queryKey: keys.hoursLog(params.startDate, params.endDate, params.userId, params.projectId),
    queryFn: () => reportsApi.hoursLog(params).then((r) => r.data),
  });
}

export function useHoursLogAll(startDate, endDate) {
  return useQuery({
    queryKey: keys.hoursLogAll(startDate, endDate),
    queryFn: () => reportsApi.hoursLog({ startDate, endDate }).then((r) => r.data),
  });
}

export function useDashHoursLog(startDate, endDate) {
  return useQuery({
    queryKey: keys.dashHoursLog(startDate, endDate),
    queryFn: () => reportsApi.hoursLog({ startDate, endDate }).then((r) => r.data),
  });
}
