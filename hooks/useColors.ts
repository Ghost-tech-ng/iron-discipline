import { useThemeStore } from '../store/themeStore';
import { DarkColors, LightColors, type ColorScheme } from '../constants/theme';

export function useColors(): ColorScheme {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? DarkColors : LightColors;
}
