export const DarkColors = {
  base: '#080b0f',
  surface: '#0f1318',
  surface2: '#161c22',
  border: '#1e2830',
  borderLight: '#253040',
  primary: '#f0f4f8',
  secondary: '#8a9ab0',
  muted: '#4a5568',
  accent: '#2d9cff',
  accent2: '#8b5cf6',
  accentGreen: '#22c55e',
  accentAmber: '#f59e0b',
  accentRed: '#ef4444',
  accentHeat: '#ff6b35',
  push: '#2d9cff',
  pull: '#8b5cf6',
  legs: '#22c55e',
  upper: '#f59e0b',
  lower: '#ef4444',
  rest: '#4a5568',
} as const;

export const LightColors = {
  base: '#f5f3ef',
  surface: '#ffffff',
  surface2: '#ede9e3',
  border: '#ddd9d2',
  borderLight: '#ccc8c0',
  primary: '#0a0a0a',
  secondary: '#4b5563',
  muted: '#9ca3af',
  accent: '#1a85e8',
  accent2: '#7c3aed',
  accentGreen: '#16a34a',
  accentAmber: '#d97706',
  accentRed: '#dc2626',
  accentHeat: '#e8521a',
  push: '#1a85e8',
  pull: '#7c3aed',
  legs: '#16a34a',
  upper: '#d97706',
  lower: '#dc2626',
  rest: '#9ca3af',
} as const;

export type ColorScheme = typeof DarkColors;

// Kept for any non-reactive static usage (e.g. navigation config)
export const Colors = DarkColors;

export const Gradients = {
  discipline: ['#2d9cff', '#8b5cf6'] as const,
  protein: ['#22c55e', '#16a34a'] as const,
  calories: ['#ff6b35', '#e8521a'] as const,
  danger: ['#ef4444', '#dc2626'] as const,
  push: ['#2d9cff', '#1a85e8'] as const,
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
