/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/*
 * P26 design tokens — neutral-zinc dark palette matching the web design system.
 * Existing keys are preserved (with refreshed values) so all screens keep
 * working; new keys (brandLight/brandDark, surface1/2, textTertiary,
 * borderStrong, info) are added to both schemes.
 */
export const Colors = {
  light: {
    text: '#09090B',
    background: '#FFFFFF',
    backgroundElement: '#F4F4F5',
    backgroundSelected: '#E4E4E7',
    textSecondary: '#52525B',
    textTertiary: '#71717A',
    border: '#E4E4E7',
    borderStrong: '#D4D4D8',
    card: '#FFFFFF',
    surface1: '#F4F4F5',
    surface2: '#E4E4E7',
    brand: '#FF6B35',
    brandLight: '#FF8C5A',
    brandDark: '#E55A22',
    brandText: '#FFFFFF',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    info: '#2563EB',
  },
  dark: {
    text: '#FAFAFA',
    background: '#09090B',
    backgroundElement: '#27272A',
    backgroundSelected: '#3F3F46',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    border: '#2D2D31',
    borderStrong: '#3F3F46',
    card: '#1C1C1F',
    surface1: '#27272A',
    surface2: '#3F3F46',
    brand: '#FF6B35',
    brandLight: '#FF8C5A',
    brandDark: '#E55A22',
    brandText: '#FFFFFF',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Elevation/shadow presets (iOS shadow* + Android elevation). */
export const Shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 3 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
  brand: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 },
} as const;

/** Corner radii matching the web token scale. */
export const Radii = { sm: 6, md: 12, lg: 16, xl: 24, full: 9999 } as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
