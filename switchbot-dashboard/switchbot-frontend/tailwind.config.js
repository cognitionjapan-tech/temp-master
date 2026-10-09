/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--tm-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        'surface-muted': token('surface-muted'),
        line: token('line'),
        fg: token('fg'),
        'fg-muted': token('fg-muted'),
        primary: token('primary'),
        'primary-fg': token('primary-fg'),
        temp: token('temp'),
        humidity: token('humidity'),
        battery: token('battery'),
        success: token('success'),
        warn: token('warn'),
        'warn-bg': token('warn-bg'),
        danger: token('danger'),
        'danger-bg': token('danger-bg'),
        info: token('info'),
        'info-bg': token('info-bg'),
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Hiragino Sans',
          'Hiragino Kaku Gothic ProN',
          'Noto Sans JP',
          'Noto Sans CJK JP',
          'Yu Gothic UI',
          'Meiryo',
          'sans-serif',
        ],
      },
      borderWidth: {
        theme: 'var(--tm-border-width)',
      },
    },
  },
  plugins: [],
};
