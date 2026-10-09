import type { StatusResponse } from '../api/types';
import { formatClock } from '../lib/format';

export function StatusBar({ status, lastRefresh }: { status: StatusResponse; lastRefresh: Date | null }) {
  const count = status.meters_count || 0;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-theme border-info/30 bg-info-bg px-4 py-2.5 text-sm text-info"
    >
      <span>
        Monitoring {count} {count === 1 ? 'meter' : 'meters'}
      </span>
      {lastRefresh && <span>Last refresh: {formatClock(lastRefresh)}</span>}
    </div>
  );
}

export function RateLimitWarning({ status }: { status: StatusResponse }) {
  if (!status.is_rate_limited) return null;
  return (
    <div role="alert" data-testid="rate-limit-warning" className="rounded-xl border-theme border-warn/40 bg-warn-bg px-4 py-2.5 text-sm text-warn">
      <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {status.backoff_remaining || 0} seconds.
    </div>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border-theme border-danger/40 bg-danger-bg px-4 py-2.5 text-sm text-danger">
      <strong>Error.</strong> {message}
    </div>
  );
}
