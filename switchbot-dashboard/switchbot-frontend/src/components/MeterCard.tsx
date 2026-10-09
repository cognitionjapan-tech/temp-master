import type { Meter, TimeScale } from '../api/types';
import { getDisplayName } from '../lib/displayNames';
import { MeterChart } from './MeterChart';

interface MeterCardProps {
  meter: Meter;
  timeScale: TimeScale;
  isStale?: boolean;
  featured?: boolean;
}

function Stat({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className={`flex flex-col rounded-lg border-theme px-2.5 py-1.5 ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</span>
      <span className="text-lg font-bold leading-tight tabular-nums">{value}</span>
    </div>
  );
}

const hasValue = (v: number | null | undefined): v is number => v !== null && v !== undefined;

export function MeterCard({ meter, timeScale, isStale = false, featured = false }: MeterCardProps) {
  const displayName = getDisplayName(meter.device_name);

  return (
    <article
      data-testid="meter-card"
      data-device-id={meter.device_id}
      aria-label={displayName}
      className={`tm-card flex flex-col overflow-hidden ${isStale ? 'border-warn/60' : ''}`}
    >
      <header className="flex items-center justify-between gap-2 border-b-theme border-line bg-surface-muted px-4 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className={`truncate font-bold text-fg ${featured ? 'text-lg' : 'text-base'}`}>{displayName}</h3>
          {isStale && (
            <span className="rounded-full border-theme border-warn bg-warn-bg px-2 py-0.5 text-[11px] font-semibold text-warn">
              7日以上未更新
            </span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-canvas px-2 py-0.5 text-[11px] text-fg-muted">{meter.device_type}</span>
      </header>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {hasValue(meter.current_temperature) && (
            <Stat label="Temp" value={`${meter.current_temperature}\u00b0C`} className="border-temp/30 bg-temp/10 text-temp" />
          )}
          {hasValue(meter.current_humidity) && (
            <Stat label="Humidity" value={`${meter.current_humidity}%`} className="border-humidity/30 bg-humidity/10 text-humidity" />
          )}
          {hasValue(meter.battery) && (
            <Stat label="Battery" value={`${meter.battery}%`} className="border-battery/30 bg-battery/10 text-battery" />
          )}
        </div>

        {isStale ? (
          <p className="text-sm text-warn">履歴データの取得対象外</p>
        ) : (
          <MeterChart deviceId={meter.device_id} timeScale={timeScale} height={featured ? 260 : 200} />
        )}

        {meter.last_updated ? (
          <p className="mt-auto text-xs text-fg-muted">Last updated: {new Date(meter.last_updated).toLocaleString()}</p>
        ) : (
          isStale && <p className="text-sm text-warn">値がありません（データ未受信）</p>
        )}
      </div>
    </article>
  );
}
