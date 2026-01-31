import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'color-mix(in srgb, var(--color-brand) 10%, white)',
          100: 'color-mix(in srgb, var(--color-brand) 20%, white)',
          200: 'color-mix(in srgb, var(--color-brand) 40%, white)',
          300: 'color-mix(in srgb, var(--color-brand) 60%, white)',
          400: 'color-mix(in srgb, var(--color-brand) 80%, white)',
          500: 'var(--color-brand)',
          600: 'color-mix(in srgb, var(--color-brand) 90%, black)',
          700: 'color-mix(in srgb, var(--color-brand) 75%, black)',
          800: 'color-mix(in srgb, var(--color-brand) 60%, black)',
          900: 'color-mix(in srgb, var(--color-brand) 45%, black)',
        },
        surface: {
          dark: 'var(--color-surface-dark)',
          card: 'var(--color-surface-card)',
          hover: 'var(--color-surface-hover)',
          elevated: 'var(--color-surface-elevated)',
        },
        accent: {
          gold: 'var(--color-accent-gold)',
          'gold-muted': 'var(--color-accent-gold-muted)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(var(--color-brand-rgb), 0.15)',
        'glow-lg': '0 0 40px rgba(var(--color-brand-rgb), 0.2)',
        'elevated': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.2)',
        'luxury': '0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.04)',
      },
      spacing: {
        'sidebar': 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-collapsed-width)',
        'header': 'var(--header-height)',
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
