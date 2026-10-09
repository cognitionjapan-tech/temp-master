import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { API_URL } from './api/client';
import type { StatusResponse } from './api/types';
import { FOOTER_TEXT } from './components/Footer';
import { makeMeter, mockFetch, renderWithProviders } from './test/utils';

const now = new Date().toISOString();
const meters = [
  makeMeter({ device_id: 'M1', device_name: 'Bedroom Meter', last_updated: now }),
  makeMeter({ device_id: 'M2', device_name: '外', current_temperature: 18.2, current_humidity: 40, battery: 75, last_updated: now }),
  makeMeter({ device_id: 'M3', device_name: 'バロン', last_updated: now }),
  makeMeter({ device_id: 'S1', device_name: '夢男', last_updated: '2026-01-01T00:00:00Z' }),
];

const okStatus: StatusResponse = {
  configured: true,
  meters_count: 4,
  is_rate_limited: false,
  backoff_remaining: 0,
};

const history = {
  device_id: 'x',
  time_scale: 'day',
  history: [
    { timestamp: '2026-10-09T01:00:00Z', temperature: 25.1, humidity: 60, battery: 90 },
    { timestamp: '2026-10-09T02:00:00Z', temperature: 25.6, humidity: 61, battery: 90 },
  ],
};

function setup(status: StatusResponse = okStatus) {
  return mockFetch({
    '/api/meters': { meters },
    '/api/status': status,
    '/api/meters/*/history': history,
    'POST /api/meters/refresh': { message: 'ok' },
  });
}

const calledUrls = (fetchMock: ReturnType<typeof setup>) =>
  fetchMock.mock.calls.map(([input]) => String(input));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('renders meter cards with display names, readings and connection status', async () => {
    const fetchMock = setup();
    renderWithProviders(<App />);

    expect(screen.getByText('Loading temperature data...')).toBeInTheDocument();

    const card = await screen.findByRole('article', { name: '屋外モニター (EM-1101)' });
    expect(within(card).getByText('18.2\u00b0C')).toBeInTheDocument();
    expect(within(card).getByText('40%')).toBeInTheDocument();
    expect(within(card).getByText('75%')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: '第1蒸留塔 (T-101)' })).toBeInTheDocument();

    expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
    expect(screen.getByText('Monitoring 4 meters')).toBeInTheDocument();
    expect(calledUrls(fetchMock)).toContain(`${API_URL}/api/meters`);
    expect(calledUrls(fetchMock)).toContain(`${API_URL}/api/status`);
  });

  it('shows stale meters in a dedicated section without a chart', async () => {
    const fetchMock = setup();
    renderWithProviders(<App />);

    const section = await screen.findByTestId('stale-meters');
    expect(within(section).getByText('未更新のメーター')).toBeInTheDocument();
    const staleCard = within(section).getByRole('article', { name: '熱交換器 (E-301)' });
    expect(within(staleCard).getByText('7日以上未更新')).toBeInTheDocument();
    expect(within(staleCard).getByText('履歴データの取得対象外')).toBeInTheDocument();
    expect(within(staleCard).queryByTestId('meter-chart')).not.toBeInTheDocument();
    expect(calledUrls(fetchMock).some((u) => u.includes('/api/meters/S1/history'))).toBe(false);
  });

  it('fetches history for the selected time range', async () => {
    const user = userEvent.setup();
    const fetchMock = setup();
    renderWithProviders(<App />);

    await waitFor(() =>
      expect(calledUrls(fetchMock)).toContain(`${API_URL}/api/meters/M1/history?time_scale=day`),
    );

    await user.selectOptions(screen.getByLabelText('Time Range:'), 'week');
    await waitFor(() =>
      expect(calledUrls(fetchMock)).toContain(`${API_URL}/api/meters/M1/history?time_scale=week`),
    );
    await waitFor(() =>
      expect(screen.getAllByTestId('meter-chart')[0]).toHaveAttribute('data-points', '2'),
    );
  });

  it('toggles between Default and Shelf views', async () => {
    const user = userEvent.setup();
    setup();
    renderWithProviders(<App />);

    expect(await screen.findByTestId('default-view')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Shelf' }));

    const shelf = screen.getByTestId('shelf-view');
    expect(screen.queryByTestId('default-view')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Shelf' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(shelf).getByRole('article', { name: '屋外モニター (EM-1101)' })).toBeInTheDocument();
    expect(within(screen.getByTestId('shelf-column-0')).getByRole('article', { name: '遠心分離機 (S-701)' })).toBeInTheDocument();
    // Excluded from the shelf layout
    expect(within(shelf).queryByRole('article', { name: '第1蒸留塔 (T-101)' })).not.toBeInTheDocument();
    expect(screen.getByTestId('stale-meters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Default' }));
    expect(screen.getByTestId('default-view')).toBeInTheDocument();
  });

  it('shows the rate limit warning', async () => {
    setup({ ...okStatus, is_rate_limited: true, backoff_remaining: 42 });
    renderWithProviders(<App />);
    expect(await screen.findByTestId('rate-limit-warning')).toHaveTextContent(
      'SwitchBot API rate limit reached. Retry in 42 seconds.',
    );
  });

  it('posts to the refresh endpoint and refetches data', async () => {
    const user = userEvent.setup();
    const fetchMock = setup();
    renderWithProviders(<App />);
    await screen.findByTestId('default-view');

    const metersCallsBefore = calledUrls(fetchMock).filter((u) => u.endsWith('/api/meters')).length;
    await user.click(screen.getByRole('button', { name: 'Refresh Data' }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
      expect(post?.[0]).toBe(`${API_URL}/api/meters/refresh`);
    });
    await waitFor(() =>
      expect(calledUrls(fetchMock).filter((u) => u.endsWith('/api/meters')).length).toBeGreaterThan(
        metersCallsBefore,
      ),
    );
    expect(screen.getByRole('button', { name: 'Refresh Data' })).toBeEnabled();
  });

  it('shows Disconnected and an error when the API fails', async () => {
    mockFetch({ '/api/meters': () => new Response('boom', { status: 500 }), '/api/status': okStatus });
    renderWithProviders(<App />);
    expect(await screen.findByText(/Failed to fetch meters: HTTP 500/)).toBeInTheDocument();
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
  });

  it('renders the brand and the new tech stack footer', async () => {
    setup();
    renderWithProviders(<App />);
    expect(screen.getByRole('link', { name: 'Temp Master Dashboard' })).toBeInTheDocument();
    expect(screen.getByText(FOOTER_TEXT)).toBeInTheDocument();
    expect(FOOTER_TEXT).toContain('React 18');
    expect(document.body.innerHTML).not.toContain('jQuery');
  });
});
