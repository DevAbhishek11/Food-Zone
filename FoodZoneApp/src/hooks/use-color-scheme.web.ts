/**
 * Dark-first on web too — keeps Expo web output identical to native and to
 * the Next.js app (which is dark-only). Static rendering needs no hydration
 * dance when the value is constant.
 */
export function useColorScheme(): 'dark' {
  return 'dark';
}
