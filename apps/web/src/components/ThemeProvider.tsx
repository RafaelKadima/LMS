'use client';

import { useEffect } from 'react';

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '20, 20, 20';
}

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
        const response = await fetch(`${apiUrl}/settings`);

        if (!response.ok) return;

        const settings = await response.json();
        const root = document.documentElement;

        if (settings.primaryColor) {
          root.style.setProperty('--color-brand', settings.primaryColor);
        }

        if (settings.secondaryColor) {
          root.style.setProperty('--color-surface-dark', settings.secondaryColor);
          root.style.setProperty('--color-surface-card', adjustBrightness(settings.secondaryColor, 15));
          root.style.setProperty('--color-surface-hover', adjustBrightness(settings.secondaryColor, 25));
          const rgb = hexToRgb(settings.secondaryColor);
          root.style.setProperty('--background-start-rgb', rgb);
          root.style.setProperty('--background-end-rgb', rgb);
        }
      } catch (err) {
        // Silently fail - use default colors
      }
    };

    loadSettings();
  }, []);

  return <>{children}</>;
}
