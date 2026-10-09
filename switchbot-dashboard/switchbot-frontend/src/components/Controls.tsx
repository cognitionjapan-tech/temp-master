import type { TimeScale } from '../api/types';
import { TIME_SCALE_OPTIONS } from '../lib/format';

export type ViewType = 'default' | 'shelf';

const VIEW_OPTIONS: { value: ViewType; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'shelf', label: 'Shelf' },
];

interface ControlsProps {
  viewType: ViewType;
  onViewTypeChange: (view: ViewType) => void;
  timeScale: TimeScale;
  onTimeScaleChange: (scale: TimeScale) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onBackup: () => void;
}

export function Controls({
  viewType,
  onViewTypeChange,
  timeScale,
  onTimeScaleChange,
  onRefresh,
  isRefreshing,
  onBackup,
}: ControlsProps) {
  return (
    <section className="tm-card flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-fg-muted">View:</span>
        <div role="group" aria-label="View" className="inline-flex overflow-hidden rounded-lg border-theme border-line">
          {VIEW_OPTIONS.map((option) => {
            const selected = option.value === viewType;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onViewTypeChange(option.value)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  selected ? 'bg-primary text-primary-fg' : 'bg-surface text-fg hover:bg-surface-muted'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="time-scale-select" className="text-sm font-semibold text-fg-muted">
          Time Range:
        </label>
        <select
          id="time-scale-select"
          value={timeScale}
          onChange={(e) => onTimeScaleChange(e.target.value as TimeScale)}
          className="rounded-lg border-theme border-line bg-surface px-3 py-1.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {TIME_SCALE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 sm:ml-auto">
        <button type="button" className="tm-btn-primary" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button type="button" className="tm-btn-secondary" onClick={onBackup}>
          Download Backup
        </button>
      </div>
    </section>
  );
}
