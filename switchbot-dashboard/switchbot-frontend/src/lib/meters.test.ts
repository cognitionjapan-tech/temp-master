import { describe, expect, it } from 'vitest';
import { makeMeter } from '../test/utils';
import { getDisplayName } from './displayNames';
import { buildShelfLayout, isStaleMeter, partitionMeters, STALE_METER_THRESHOLD_MS } from './meters';

const NOW = new Date('2026-10-09T00:00:00Z').getTime();

describe('getDisplayName', () => {
  it('maps device names to factory equipment names', () => {
    expect(getDisplayName('Bedroom Meter')).toBe('第1蒸留塔 (T-101)');
    expect(getDisplayName('外')).toBe('屋外モニター (EM-1101)');
  });

  it('falls back to the raw device name', () => {
    expect(getDisplayName('Unknown Device')).toBe('Unknown Device');
  });
});

describe('isStaleMeter', () => {
  it('treats missing or invalid last_updated as stale', () => {
    expect(isStaleMeter(makeMeter({ last_updated: null }), NOW)).toBe(true);
    expect(isStaleMeter(makeMeter({ last_updated: 'not-a-date' }), NOW)).toBe(true);
  });

  it('uses a 7 day threshold', () => {
    const fresh = new Date(NOW - STALE_METER_THRESHOLD_MS + 1000).toISOString();
    const old = new Date(NOW - STALE_METER_THRESHOLD_MS).toISOString();
    expect(isStaleMeter(makeMeter({ last_updated: fresh }), NOW)).toBe(false);
    expect(isStaleMeter(makeMeter({ last_updated: old }), NOW)).toBe(true);
  });
});

describe('partitionMeters', () => {
  it('splits active and stale meters', () => {
    const active = makeMeter({ device_id: 'A', last_updated: new Date(NOW).toISOString() });
    const stale = makeMeter({ device_id: 'S', last_updated: '2026-01-01T00:00:00Z' });
    expect(partitionMeters([active, stale], NOW)).toEqual({ active: [active], stale: [stale] });
  });
});

describe('buildShelfLayout', () => {
  it('places meters by shelf config and collects the rest', () => {
    const meters = [
      makeMeter({ device_id: '1', device_name: '外' }),
      makeMeter({ device_id: '2', device_name: 'Study Hub' }),
      makeMeter({ device_id: '3', device_name: 'バロン' }),
      makeMeter({ device_id: '4', device_name: '蛇棚' }),
      makeMeter({ device_id: '5', device_name: 'ゴンタ' }),
      makeMeter({ device_id: '6', device_name: 'Bedroom Meter' }),
      makeMeter({ device_id: '7', device_name: 'インキュベーター' }),
    ];
    const layout = buildShelfLayout(meters);
    expect(layout.topRow.map((m) => m.device_id)).toEqual(['1', '2']);
    expect(layout.columns.map((c) => c.map((m) => m.device_id))).toEqual([['3'], ['4'], ['5']]);
    expect(layout.others.map((m) => m.device_id)).toEqual(['7']);
  });

  it('does not place the same device twice when names collide', () => {
    const meters = [
      makeMeter({ device_id: 'a', device_name: '夢男' }),
      makeMeter({ device_id: 'b', device_name: '夢男' }),
    ];
    const layout = buildShelfLayout(meters);
    expect(layout.columns[2].map((m) => m.device_id)).toEqual(['a']);
    expect(layout.others.map((m) => m.device_id)).toEqual(['b']);
  });
});
