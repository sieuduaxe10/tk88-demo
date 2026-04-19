export const COLORS = {
  red: '#DC143C',
  redDark: '#8B0000',
  gold: '#FFD700',
  goldDark: '#B8860B',
  black: '#0D0D0D',
  card: '#1F1F1F',
  muted: '#B0B0B0',
  accent: '#FF4757',
  success: '#22C55E',
  danger: '#EF4444',
} as const;

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

export const RADIUS = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  pill: '9999px',
} as const;

export const SHADOWS = {
  goldGlow: '0 0 20px rgba(255, 215, 0, 0.4)',
  redGlow: '0 0 20px rgba(220, 20, 60, 0.5)',
  cardHover: '0 10px 30px -5px rgba(0, 0, 0, 0.8)',
} as const;

export const FONT_SIZE = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
} as const;

export type ColorKey = keyof typeof COLORS;
