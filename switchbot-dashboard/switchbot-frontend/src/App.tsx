import { useState } from 'react';
import { backupUrl } from './api/client';
import type { TimeScale } from './api/types';
import type { ConnectionState } from './components/ConnectionBadge';
import { Controls } from './components/Controls';
import type { ViewType } from './components/Controls';
import { Footer } from './components/Footer';
import { DefaultView, ShelfView, StaleMetersSection } from './components/MeterViews';
import { Navbar } from './components/Navbar';
import { ErrorAlert, RateLimitWarning, StatusBar } from './components/StatusBar';
import { useMeters, useRefreshMeters, useStatus } from './hooks/useDashboardData';
import { partitionMeters } from './lib/meters';

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

export default function App() {
  const [viewType, setViewType] = useState<ViewType>('default');
  const [timeScale, setTimeScale] = useState<TimeScale>('day');

  const metersQuery = useMeters();
  const statusQuery = useStatus();
  const refresh = useRefreshMeters();

  let fetchError: string | null = null;
  if (metersQuery.isError) fetchError = `Failed to fetch meters: ${errorText(metersQuery.error)}`;
  else if (statusQuery.isError) fetchError = `Failed to fetch status: ${errorText(statusQuery.error)}`;
  const refreshError = refresh.isError ? `Failed to refresh: ${errorText(refresh.error)}` : null;

  const isLoading = metersQuery.isPending || statusQuery.isPending;
  const connection: ConnectionState = fetchError
    ? 'disconnected'
    : isLoading
      ? 'connecting'
      : 'connected';

  const { active, stale } = partitionMeters(metersQuery.data?.meters ?? []);
  const status = statusQuery.data;
  const lastRefresh = statusQuery.dataUpdatedAt ? new Date(statusQuery.dataUpdatedAt) : null;

  return (
    <div className="min-h-screen">
      <Navbar connection={connection} />
      <main className="mx-auto max-w-screen-2xl space-y-4 px-4 py-5">
        <Controls
          viewType={viewType}
          onViewTypeChange={setViewType}
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => refresh.mutate()}
          isRefreshing={refresh.isPending}
          onBackup={() => window.open(backupUrl(), '_blank')}
        />

        {status && !fetchError && <StatusBar status={status} lastRefresh={lastRefresh} />}
        {status && <RateLimitWarning status={status} />}
        {fetchError && <ErrorAlert message={fetchError} />}
        {refreshError && !fetchError && <ErrorAlert message={refreshError} />}

        {isLoading && !fetchError && (
          <p className="py-10 text-center text-fg-muted">Loading temperature data...</p>
        )}

        {metersQuery.data && (
          <>
            {viewType === 'shelf' ? (
              <ShelfView meters={active} timeScale={timeScale} />
            ) : (
              <DefaultView meters={active} timeScale={timeScale} />
            )}
            <StaleMetersSection meters={stale} timeScale={timeScale} />
          </>
        )}

        <Footer />
      </main>
    </div>
  );
}
