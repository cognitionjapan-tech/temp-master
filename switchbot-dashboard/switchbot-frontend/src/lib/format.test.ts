import { describe, expect, it } from 'vitest';
import { buildTimeTicks, formatClock, formatTimestamp, pad2, toChartPoints } from './format';

describe('pad2', () => {
  it('zero-pads single digits', () => {
    expect(pad2(3)).toBe('03');
    expect(pad2(12)).toBe('12');
  });
});

describe('formatTimestamp', () => {
  const ts = new Date(2026, 9, 9, 7, 5).getTime(); // Fri Oct 9 07:05 local

  it.each([
    ['hour', '07:05'],
    ['day', '07:05'],
    ['week', 'Fri 07'],
    ['month', 'Oct 9'],
    ['year', 'Oct 9'],
  ] as const)('formats %s scale', (scale, expected) => {
    expect(formatTimestamp(ts, scale)).toBe(expected);
  });
});

describe('formatClock', () => {
  it('formats HH:MM:SS', () => {
    expect(formatClock(new Date(2026, 0, 1, 9, 4, 7))).toBe('09:04:07');
  });
});

describe('toChartPoints', () => {
  const at = (min: number, temperature = 25) => ({
    timestamp: new Date(Date.UTC(2026, 9, 9, 0, min)).toISOString(),
    temperature,
    humidity: 50,
    battery: 100,
  });

  it('sorts points chronologically', () => {
    const points = toChartPoints([at(4), at(0), at(2)]);
    expect(points.map((p) => p.time)).toEqual([...points.map((p) => p.time)].sort((a, b) => a - b));
    expect(points).toHaveLength(3);
  });

  it('inserts a null break across collection gaps', () => {
    const points = toChartPoints([at(0), at(2), at(4), at(6), at(300), at(302)]);
    expect(points).toHaveLength(7);
    expect(points[4].temperature).toBeNull();
  });
});

describe('buildTimeTicks', () => {
  it('returns evenly spaced ticks across the range', () => {
    const ticks = buildTimeTicks([
      { time: 0, temperature: 1 },
      { time: 1000, temperature: 2 },
    ], 3);
    expect(ticks).toEqual([0, 500, 1000]);
  });

  it('returns undefined for a single point', () => {
    expect(buildTimeTicks([{ time: 0, temperature: 1 }])).toBeUndefined();
  });
});
