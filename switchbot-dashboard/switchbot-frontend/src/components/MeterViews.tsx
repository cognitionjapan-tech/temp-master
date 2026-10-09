import type { Meter, TimeScale } from '../api/types';
import { buildShelfLayout } from '../lib/meters';
import { MeterCard } from './MeterCard';

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3';

export function DefaultView({ meters, timeScale }: { meters: Meter[]; timeScale: TimeScale }) {
  if (meters.length === 0) return null;
  return (
    <div data-testid="default-view" className={GRID}>
      {meters.map((meter) => (
        <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} />
      ))}
    </div>
  );
}

function ShelfLabel({ children }: { children: string }) {
  return <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-fg-muted">{children}</h2>;
}

export function ShelfView({ meters, timeScale }: { meters: Meter[]; timeScale: TimeScale }) {
  const layout = buildShelfLayout(meters);
  const columnLabels = ['Left', 'Middle', 'Right'];

  return (
    <div data-testid="shelf-view" className="space-y-6">
      {layout.topRow.length > 0 && (
        <section>
          <ShelfLabel>Top Shelf</ShelfLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {layout.topRow.map((meter) => (
              <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} featured />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {layout.columns.map((column, i) => (
          <section key={columnLabels[i]} data-testid={`shelf-column-${i}`} className="space-y-4">
            <ShelfLabel>{`${columnLabels[i]} Column`}</ShelfLabel>
            {column.map((meter) => (
              <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} />
            ))}
          </section>
        ))}
      </div>

      {layout.others.length > 0 && (
        <section data-testid="shelf-others">
          <ShelfLabel>その他のメーター</ShelfLabel>
          <div className={GRID}>
            {layout.others.map((meter) => (
              <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function StaleMetersSection({ meters, timeScale }: { meters: Meter[]; timeScale: TimeScale }) {
  if (meters.length === 0) return null;
  return (
    <section data-testid="stale-meters" className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-warn">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          未更新のメーター
        </h2>
        <p className="text-xs text-warn">1週間以上更新されていないデバイス</p>
      </div>
      <div className="rounded-xl border-theme border-warn/50 bg-warn-bg/60 p-4">
        <div className={GRID}>
          {meters.map((meter) => (
            <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} isStale />
          ))}
        </div>
      </div>
    </section>
  );
}
