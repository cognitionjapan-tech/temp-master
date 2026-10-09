import { QueryClient } from '@tanstack/react-query';

export const REFRESH_INTERVAL_MS = 30_000;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchInterval: REFRESH_INTERVAL_MS,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
