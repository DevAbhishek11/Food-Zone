/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';

/**
 * FoodZone is dark-first (useColorScheme() always resolves to 'dark' — see
 * hooks/use-color-scheme.ts), so this always returns the dark palette.
 */
export function useTheme() {
  return Colors.dark;
}
