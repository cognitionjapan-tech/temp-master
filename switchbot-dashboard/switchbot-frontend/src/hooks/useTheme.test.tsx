import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { THEME_STORAGE_KEY, ThemeProvider } from './useTheme';

function renderSwitcher() {
  return render(
    <ThemeProvider>
      <ThemeSwitcher />
    </ThemeProvider>,
  );
}

describe('ThemeProvider / ThemeSwitcher', () => {
  it('defaults to light theme', () => {
    renderSwitcher();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
  });

  it('restores the theme saved in localStorage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'contrast');
    renderSwitcher();
    expect(document.documentElement).toHaveAttribute('data-theme', 'contrast');
    expect(screen.getByRole('radio', { name: 'High Contrast' })).toHaveAttribute('aria-checked', 'true');
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    renderSwitcher();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('switches theme and persists the choice', async () => {
    const user = userEvent.setup();
    renderSwitcher();
    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await user.click(screen.getByRole('radio', { name: 'High Contrast' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'contrast');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('contrast');
  });
});
