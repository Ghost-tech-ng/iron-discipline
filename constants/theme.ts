export const Colors = {
  base: '#0a0a0a',
  surface: '#111111',
  surface2: '#1a1a1a',
  border: '#2a2a2a',
  borderLight: '#333333',

  primary: '#f5f5f5',
  secondary: '#999999',
  muted: '#555555',

  accent: '#3b82f6',
  accent2: '#8b5cf6',
  accentGreen: '#22c55e',
  accentAmber: '#f59e0b',
  accentRed: '#ef4444',

  // Session colors
  push: '#3b82f6',
  pull: '#8b5cf6',
  legs: '#22c55e',
  upper: '#f59e0b',
  lower: '#ef4444',
  rest: '#555555',
} as const;

export const Gradients = {
  discipline: ['#3b82f6', '#8b5cf6'] as const,
  protein: ['#22c55e', '#16a34a'] as const,
  calories: ['#f59e0b', '#d97706'] as const,
  danger: ['#ef4444', '#dc2626'] as const,
  push: ['#3b82f6', '#2563eb'] as const,
  pull: ['#8b5cf6', '#7c3aed'] as const,
  legs: ['#22c55e', '#16a34a'] as const,
  upper: ['#f59e0b', '#d97706'] as const,
  lower: ['#ef4444', '#dc2626'] as const,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Typography = {
  hero: { fontSize: 48, lineHeight: 52, letterSpacing: -1.5 },
  h1: { fontSize: 32, lineHeight: 36, letterSpacing: -1 },
  h2: { fontSize: 24, lineHeight: 28, letterSpacing: -0.5 },
  h3: { fontSize: 20, lineHeight: 24, letterSpacing: -0.3 },
  h4: { fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  small: { fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  caption: { fontSize: 11, lineHeight: 14, letterSpacing: 0.3 },
  label: { fontSize: 10, lineHeight: 12, letterSpacing: 1.2 },
} as const;
