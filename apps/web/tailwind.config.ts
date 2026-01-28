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
          500: 'var(--color-brand)', // Cor primária dinâmica
          600: 'color-mix(in srgb, var(--color-brand) 90%, black)',
          700: 'color-mix(in srgb, var(--color-brand) 75%, black)',
          800: 'color-mix(in srgb, var(--color-brand) 60%, black)',
          900: 'color-mix(in srgb, var(--color-brand) 45%, black)',
        },
        surface: {
          dark: 'var(--color-surface-dark)',
          card: 'var(--color-surface-card)',
          hover: 'var(--color-surface-hover)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
