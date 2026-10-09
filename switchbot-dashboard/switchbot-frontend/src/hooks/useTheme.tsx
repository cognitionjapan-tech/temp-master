import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type ThemeName = 'light' | 'dark' | 'contrast';

export const THEME_STORAGE_KEY = 'temp-master-theme';

export const THEME_OPTIONS: { value: ThemeName; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'contrast', label: 'High Contrast' },
];

export interface ChartPalette {
  line: string;
  fill: string;
  grid: string;
  tick: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  activeDot: string;
}

export const CHART_PALETTES: Record<ThemeName, ChartPalette> = {
  light: {
    line: '#dc2626',
    fill: 'rgba(220, 38, 38, 0.15)',
    grid: 'rgba(15, 23, 42, 0.08)',
    tick: '#64748b',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e2e8f0',
    tooltipText: '#0f172a',
    activeDot: '#0284c7',
  },
  dark: {
    line: '#fb7185',
    fill: 'rgba(251, 113, 133, 0.18)',
    grid: 'rgba(148, 163, 184, 0.15)',
    tick: '#94a3b8',
    tooltipBg: '#0f172a',
    tooltipBorder: '#334155',
    tooltipText: '#f1f5f9',
    activeDot: '#38bdf8',
  },
  contrast: {
    line: '#ffd600',
    fill: 'rgba(255, 214, 0, 0.25)',
    grid: 'rgba(255, 255, 255, 0.35)',
    tick: '#ffffff',
    tooltipBg: '#000000',
    tooltipBorder: '#ffd600',
    tooltipText: '#ffffff',
    activeDot: '#00e5ff',
  },
};

function isThemeName(value: unknown): value is ThemeName {
  return value === 'light' || value === 'dark' || value === 'contrast';
}

export function readStoredTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeName(stored) ? stored : 'light';
  } catch {
    return 'light';
  }
}

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  chartPalette: ChartPalette;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable (e.g. private mode); theme still applies for this session.
    }
  }, [theme]);

  const setTheme = useCallback((next: ThemeName) => setThemeState(next), []);

  const value = useMemo(
    () => ({ theme, setTheme, chartPalette: CHART_PALETTES[theme] }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
