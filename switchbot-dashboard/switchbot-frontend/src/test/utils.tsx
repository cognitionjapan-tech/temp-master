import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';
import type { Meter } from '../api/types';
import { ThemeProvider } from '../hooks/useTheme';

export function renderWithProviders(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchInterval: false }, mutations: { retry: false } },
  });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <ThemeProvider>{ui}</ThemeProvider>
      </QueryClientProvider>,
    ),
  };
}

export function makeMeter(overrides: Partial<Meter> = {}): Meter {
  return {
    device_id: 'DEV1',
    device_name: 'Bedroom Meter',
    device_type: 'MeterPlus',
    hub_device_id: 'HUB',
    current_temperature: 25.3,
    current_humidity: 60,
    battery: 90,
    last_updated: new Date().toISOString(),
    ...overrides,
  };
}

type Handler = (url: URL, init?: RequestInit) => unknown;

export function mockFetch(routes: Record<string, Handler | unknown>) {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input.toString());
    const method = (init?.method ?? 'GET').toUpperCase();
    const key = Object.keys(routes).find((k) => {
      const [m, path] = k.includes(' ') ? k.split(' ') : ['GET', k];
      const pattern = new RegExp(`^${path.replace(/\*/g, '[^/]+')}$`);
      return m === method && pattern.test(url.pathname);
    });
    if (!key) return new Response('not found', { status: 404 });
    const route = routes[key];
    const body = typeof route === 'function' ? (route as Handler)(url, init) : route;
    if (body instanceof Response) return body;
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}
