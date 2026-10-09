import type { HistoryPoint, TimeScale } from '../api/types';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatTimestamp(timestamp: string | number | Date, timeScale: TimeScale): string {
  const date = new Date(timestamp);
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());

  switch (timeScale) {
    case 'hour':
    case 'day':
      return `${hours}:${minutes}`;
    case 'week':
      return `${DAY_SHORT[date.getDay()]} ${hours}`;
    case 'month':
    case 'year':
      return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
    default:
      return date.toLocaleString();
  }
}

export function formatClock(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

export const TIME_SCALE_OPTIONS: { value: TimeScale; label: string }[] = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
];

export interface ChartPoint {
  time: number;
  temperature: number | null;
}

// Inserts a null point where collection paused so the chart shows a gap instead of
// interpolating a misleading line across missing data.
export function toChartPoints(history: HistoryPoint[]): ChartPoint[] {
  const points = history
    .map((p) => ({ time: new Date(p.timestamp).getTime(), temperature: p.temperature }))
    .filter((p) => !Number.isNaN(p.time))
    .sort((a, b) => a.time - b.time);
  if (points.length < 3) return points;

  const intervals = points
    .slice(1)
    .map((p, i) => p.time - points[i].time)
    .sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];
  const gapThreshold = Math.max(median * 5, 10 * 60 * 1000);

  const result: ChartPoint[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    if (points[i].time - prev.time > gapThreshold) {
      result.push({ time: (prev.time + points[i].time) / 2, temperature: null });
    }
    result.push(points[i]);
  }
  return result;
}

export function buildTimeTicks(points: ChartPoint[], count = 6): number[] | undefined {
  if (points.length < 2) return undefined;
  const min = points[0].time;
  const max = points[points.length - 1].time;
  if (max <= min) return undefined;
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(min + step * i));
}

const TEMPERATURE_TICK_STEPS = [0.5, 1, 2, 5, 10, 20];

// 温度変化が小さくても目盛りが重複しないよう、0.5°C 以上の刻みで均等な目盛りを作る
export function buildTemperatureAxis(
  points: ChartPoint[],
  maxTicks = 5,
): { domain: [number, number]; ticks: number[] } | undefined {
  const values = points
    .map((p) => p.temperature)
    .filter((v): v is number => v !== null && Number.isFinite(v));
  if (values.length === 0) return undefined;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const step =
    TEMPERATURE_TICK_STEPS.find(
      (s) => Math.ceil(max / s) * s - Math.floor(min / s) * s <= s * (maxTicks - 1),
    ) ?? TEMPERATURE_TICK_STEPS[TEMPERATURE_TICK_STEPS.length - 1];

  let lo = Math.floor(min / step) * step;
  let hi = Math.ceil(max / step) * step;
  if (hi === lo) {
    lo -= step;
    hi += step;
  }

  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) {
    ticks.push(Number(v.toFixed(2)));
  }
  return { domain: [ticks[0], ticks[ticks.length - 1]], ticks };
}

export function formatTemperatureTick(value: number): string {
  return `${Number(value.toFixed(1))}\u00b0`;
}
