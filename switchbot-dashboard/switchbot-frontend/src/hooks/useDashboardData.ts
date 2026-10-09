import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchHistory, fetchMeters, fetchStatus, triggerRefresh } from '../api/client';
import type { TimeScale } from '../api/types';

export const queryKeys = {
  meters: ['meters'] as const,
  status: ['status'] as const,
  history: (deviceId: string, timeScale: TimeScale) => ['history', deviceId, timeScale] as const,
};

export function useMeters() {
  return useQuery({ queryKey: queryKeys.meters, queryFn: fetchMeters });
}

export function useStatus() {
  return useQuery({ queryKey: queryKeys.status, queryFn: fetchStatus });
}

export function useHistory(deviceId: string, timeScale: TimeScale, enabled = true) {
  return useQuery({
    queryKey: queryKeys.history(deviceId, timeScale),
    queryFn: () => fetchHistory(deviceId, timeScale),
    enabled,
  });
}

export function useRefreshMeters() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: triggerRefresh,
    onSettled: () => queryClient.invalidateQueries(),
  });
}
