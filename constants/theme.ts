/**
 * Forge · Red-Hot. Iron heats steel → red-hot → white-hot: steel is cold,
 * crimson is hot, cream is white-hot. No orange, no purple.
 * `feature` is the one standout card per screen (cream on dark, coal on light).
 */
export const DarkColors = {
  base: '#0C0B0A',
  surface: '#1A1714',
  surface2: '#2A2621',
  border: '#302B25',
  borderLight: '#3D3730',
  primary: '#F4EBD9',
  secondary: '#B3A994',
  muted: '#8C8377',
  dim: '#544D44',
  accent: '#FF2E4D',
  accent2: '#8FB0CC',
  accentGreen: '#7CCFA3',
  accentAmber: '#EADBB8',
  accentRed: '#E5484D',
  accentHeat: '#FF6B80',
  onAccent: '#FFFFFF',
  feature: '#F4EBD9',
  onFeature: '#0C0B0A',
  featureMuted: '#5E574D',
  /** Same in both modes: the backdrop for exercise photos shot on white. */
  cream: '#F4EBD9',
  /** Top of the heat scale: white-hot on dark, deep crimson on cream. */
  heatPeak: '#FFF4E0',
  shadow: '#000000',
  push: '#FF2E4D',
  pull: '#8FB0CC',
  legs: '#D6CCB8',
  upper: '#FF6B80',
  lower: '#B3A994',
  rest: '#544D44',
} as const;

export const LightColors = {
  base: '#F4EBD9',
  surface: '#FBF6EC',
  surface2: '#EADFCB',
  border: '#DDD0B9',
  borderLight: '#CFC1A8',
  primary: '#0C0B0A',
  secondary: '#5E574D',
  muted: '#8C8377',
  dim: '#B3A894',
  accent: '#E8173A',
  accent2: '#4F7392',
  accentGreen: '#2E8B62',
  accentAmber: '#7A6A50',
  accentRed: '#C81E3A',
  accentHeat: '#E8455E',
  onAccent: '#FFFFFF',
  feature: '#1A1714',
  onFeature: '#F4EBD9',
  featureMuted: '#ADA391',
  cream: '#F4EBD9',
  heatPeak: '#9E0F2C',
  shadow: '#3D2A14',
  push: '#E8173A',
  pull: '#4F7392',
  legs: '#0C0B0A',
  upper: '#E8455E',
  lower: '#7A6F60',
  rest: '#B3A894',
} as const;

/**
 * Widened to `string` per key: both palettes are `as const`, so a literal-typed
 * alias to one of them makes the other unassignable. The keys are what matter.
 */
export type ColorScheme = { readonly [K in keyof typeof DarkColors]: string };

// Kept for any non-reactive static usage (e.g. navigation config)
export const Colors = DarkColors;

export type SessionColorKey = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'rest';

export function sessionColor(C: ColorScheme, type: string | undefined): string | undefined {
  switch (type) {
    case 'push': case 'pull': case 'legs': case 'upper': case 'lower': case 'rest':
      return C[type];
    default:
      return undefined;
  }
}

/** Loaded in app/_layout.tsx. Each weight is its own family, so never pair these with fontWeight. */
export const Fonts = {
  display: 'BigShoulders_800ExtraBold',
  displayBlack: 'BigShoulders_900Black',
  body: 'Manrope_500Medium',
  bodySemi: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyHeavy: 'Manrope_800ExtraBold',
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
