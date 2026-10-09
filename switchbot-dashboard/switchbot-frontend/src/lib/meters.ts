import type { Meter } from '../api/types';

export const STALE_METER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export function isStaleMeter(meter: Meter, now: number = Date.now()): boolean {
  if (!meter.last_updated) return true;
  const lastUpdated = new Date(meter.last_updated).getTime();
  if (Number.isNaN(lastUpdated)) return true;
  return now - lastUpdated >= STALE_METER_THRESHOLD_MS;
}

export function partitionMeters(meters: Meter[], now: number = Date.now()) {
  const active: Meter[] = [];
  const stale: Meter[] = [];
  for (const meter of meters) {
    (isStaleMeter(meter, now) ? stale : active).push(meter);
  }
  return { active, stale };
}

// Physical shelf arrangement (device_name based), restored from the legacy Shelf view.
export const SHELF_VIEW_CONFIG = {
  topRow: ['外', 'Study Hub'],
  columns: [
    ['バロン', 'アワコ', 'ネズミ'],
    ['蛇棚', 'ジャガ百万石', '中華棚'],
    ['ゴンタ', '夢男'],
  ],
  excluded: ['Bedroom Meter', 'Living Meter'],
};

export interface ShelfLayout {
  topRow: Meter[];
  columns: Meter[][];
  others: Meter[];
}

export function buildShelfLayout(meters: Meter[], config = SHELF_VIEW_CONFIG): ShelfLayout {
  const used = new Set<string>();
  const pick = (name: string): Meter | undefined => {
    const meter = meters.find((m) => m.device_name === name && !used.has(m.device_id));
    if (meter) used.add(meter.device_id);
    return meter;
  };
  const pickAll = (names: string[]) => names.map(pick).filter((m): m is Meter => Boolean(m));

  const topRow = pickAll(config.topRow);
  const columns = config.columns.map(pickAll);
  const excluded = new Set(config.excluded);
  const others = meters.filter((m) => !used.has(m.device_id) && !excluded.has(m.device_name));

  return { topRow, columns, others };
}
