/**
 * FoodZone is a dark-first product (the web app is dark-only). Force the dark
 * scheme regardless of the OS setting so every screen renders the
 * deep-neutral palette consistently.
 */
export function useColorScheme(): 'dark' {
  return 'dark';
}
