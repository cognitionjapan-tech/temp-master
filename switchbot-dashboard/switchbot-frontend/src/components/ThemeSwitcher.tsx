import { THEME_OPTIONS, useTheme } from '../hooks/useTheme';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex overflow-hidden rounded-lg border-theme border-line">
      {THEME_OPTIONS.map((option) => {
        const selected = option.value === theme;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(option.value)}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
              selected ? 'bg-primary text-primary-fg' : 'bg-surface text-fg-muted hover:bg-surface-muted'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
