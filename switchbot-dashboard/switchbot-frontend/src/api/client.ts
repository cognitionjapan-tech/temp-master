import type { HistoryResponse, MetersResponse, StatusResponse, TimeScale } from './types';

// Data is served by the snakeroom backend, which actively collects readings
// from the same SwitchBot devices. Point all API calls there.
export const API_URL = 'https://snakeroom.fly.dev';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export function fetchMeters(): Promise<MetersResponse> {
  return request<MetersResponse>('/api/meters');
}

export function fetchStatus(): Promise<StatusResponse> {
  return request<StatusResponse>('/api/status');
}

export function fetchHistory(deviceId: string, timeScale: TimeScale): Promise<HistoryResponse> {
  const params = new URLSearchParams({ time_scale: timeScale });
  return request<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${params.toString()}`,
  );
}

export function triggerRefresh(): Promise<unknown> {
  return request<unknown>('/api/meters/refresh', { method: 'POST' });
}

export function backupUrl(): string {
  return `${API_URL}/api/backup`;
}
