import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TimeScale } from '../api/types';
import { useHistory } from '../hooks/useDashboardData';
import { useTheme } from '../hooks/useTheme';
import { buildTimeTicks, formatTimestamp, toChartPoints } from '../lib/format';

interface MeterChartProps {
  deviceId: string;
  timeScale: TimeScale;
  height?: number;
}

export function MeterChart({ deviceId, timeScale, height = 200 }: MeterChartProps) {
  const { data, isPending, isError } = useHistory(deviceId, timeScale);
  const { chartPalette: palette, theme } = useTheme();

  const points = toChartPoints(data?.history ?? []);
  const ticks = buildTimeTicks(points);

  let overlay: string | null = null;
  if (isPending) overlay = 'Loading chart...';
  else if (isError) overlay = 'Failed to load history';
  else if (points.length === 0) overlay = 'No data for this range';

  const gradientId = `temp-fill-${deviceId}`;

  return (
    <div
      data-testid="meter-chart"
      data-device-id={deviceId}
      data-points={points.filter((p) => p.temperature !== null).length}
      className="relative"
      style={{ height }}
    >
      {overlay ? (
        <div className="flex h-full items-center justify-center rounded-lg bg-surface-muted text-sm text-fg-muted">
          {overlay}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.line} stopOpacity={theme === 'contrast' ? 0.45 : 0.35} />
                <stop offset="100%" stopColor={palette.line} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={palette.grid} strokeDasharray={theme === 'contrast' ? undefined : '3 3'} />
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={ticks}
              tickFormatter={(v: number) => formatTimestamp(v, timeScale)}
              tick={{ fill: palette.tick, fontSize: theme === 'contrast' ? 12 : 10 }}
              stroke={palette.grid}
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: palette.tick, fontSize: theme === 'contrast' ? 12 : 10 }}
              stroke={palette.grid}
              tickFormatter={(v: number) => `${Number(v.toFixed(1))}\u00b0`}
              domain={['auto', 'auto']}
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: palette.tooltipBg,
                border: `${theme === 'contrast' ? 2 : 1}px solid ${palette.tooltipBorder}`,
                borderRadius: theme === 'contrast' ? 0 : 8,
                color: palette.tooltipText,
              }}
              labelStyle={{ color: palette.tooltipText }}
              labelFormatter={(v) => new Date(Number(v)).toLocaleString()}
              formatter={(value) => [
                typeof value === 'number' ? `${value.toFixed(1)}\u00b0C` : '',
                'Temperature',
              ]}
            />
            <Area
              type="monotone"
              dataKey="temperature"
              stroke={palette.line}
              strokeWidth={theme === 'contrast' ? 3 : 2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, fill: palette.activeDot, stroke: palette.activeDot }}
              isAnimationActive={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
