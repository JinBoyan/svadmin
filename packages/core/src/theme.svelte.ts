// Theme — dark/light/system mode + color theme management (Svelte 5 runes)
//
// Supports two class strategies:
//   - 'standard' (default): adds 'dark' class for dark mode (light-first)
//   - 'dark-first': adds 'light' class for light mode (dark-first, e.g. Elygate-style)

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorTheme = 'blue' | 'green' | 'rose' | 'orange' | 'violet' | 'zinc';

/** Controls how the theme class is applied to <html> */
export type ThemeStrategy = 'standard' | 'dark-first';

export interface ThemeConfig {
  /** Class strategy: 'standard' toggles '.dark', 'dark-first' toggles '.light' */
  strategy?: ThemeStrategy;
  /** Custom CSS variables to inject as overrides on <html> */
  cssOverrides?: Record<string, string>;
  /** Whether to disable the built-in color-scheme attribute */
  disableColorScheme?: boolean;
}

const STORAGE_KEY = 'svadmin-theme';
const COLOR_STORAGE_KEY = 'svadmin-color-theme';

// ── Theme configuration ──────────────────────────────────
let themeConfig: ThemeConfig = {};

/**
 * Configure the theme system. Must be called before setTheme() or
 * automatically via AdminApp's themeConfig prop.
 */
export function configureTheme(config: ThemeConfig): void {
  themeConfig = { ...config };
  // Re-apply the current theme with new strategy
  applyTheme(mode);
  // Apply CSS overrides
  if (config.cssOverrides) {
    applyCssOverrides(config.cssOverrides);
  }
}

/** Get current theme configuration */
export function getThemeConfig(): ThemeConfig {
  return { ...themeConfig };
}

function applyCssOverrides(overrides: Record<string, string>): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(overrides)) {
    const cssVar = key.startsWith('--') ? key : `--${key}`;
    root.style.setProperty(cssVar, value);
  }
}

/** Remove previously applied CSS overrides */
export function clearCssOverrides(keys?: string[]): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (keys) {
    for (const key of keys) {
      const cssVar = key.startsWith('--') ? key : `--${key}`;
      root.style.removeProperty(cssVar);
    }
  } else if (themeConfig.cssOverrides) {
    for (const key of Object.keys(themeConfig.cssOverrides)) {
      const cssVar = key.startsWith('--') ? key : `--${key}`;
      root.style.removeProperty(cssVar);
    }
  }
}

// ── Color themes (display metadata) ──────────────────────
export const colorThemes: { id: ColorTheme; label: string; color: string }[] = [
  { id: 'blue',   label: 'Blue',   color: '#3b82f6' },
  { id: 'green',  label: 'Green',  color: '#22c55e' },
  { id: 'rose',   label: 'Rose',   color: '#f43f5e' },
  { id: 'orange', label: 'Orange', color: '#f97316' },
  { id: 'violet', label: 'Violet', color: '#8b5cf6' },
  { id: 'zinc',   label: 'Zinc',   color: '#71717a' },
];

// ── Dark/Light mode ──────────────────────────────────────

function getStoredTheme(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'system';
  return (localStorage.getItem(STORAGE_KEY) as ThemeMode) ?? 'system';
}

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

let mode = $state<ThemeMode>(getStoredTheme());

function applyTheme(m: ThemeMode): void {
  const resolved = m === 'system' ? getSystemPreference() : m;
  if (typeof document === 'undefined') return;

  const strategy = themeConfig.strategy ?? 'standard';
  const el = document.documentElement;

  if (strategy === 'dark-first') {
    // Dark-first: default is dark, add 'light' class for light mode
    el.classList.toggle('light', resolved === 'light');
    el.classList.remove('dark'); // ensure no conflict
  } else {
    // Standard: default is light, add 'dark' class for dark mode
    el.classList.toggle('dark', resolved === 'dark');
    el.classList.remove('light'); // ensure no conflict
  }

  // Set color-scheme attribute unless disabled
  if (!themeConfig.disableColorScheme) {
    el.style.colorScheme = resolved;
  }
}

// Apply on init
applyTheme(mode);

// Listen for system preference changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (mode === 'system') applyTheme('system');
  });
}

export function getTheme(): ThemeMode {
  return mode;
}

export function setTheme(newMode: ThemeMode): void {
  mode = newMode;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, newMode);
  }
  applyTheme(newMode);
}

export function toggleTheme(): void {
  const resolved = mode === 'system' ? getSystemPreference() : mode;
  setTheme(resolved === 'dark' ? 'light' : 'dark');
}

/** Resolved theme (always 'light' or 'dark', never 'system') */
export function getResolvedTheme(): 'light' | 'dark' {
  return mode === 'system' ? getSystemPreference() : mode;
}

// ── Color theme ──────────────────────────────────────────

function getStoredColorTheme(): ColorTheme {
  if (typeof localStorage === 'undefined') return 'blue';
  return (localStorage.getItem(COLOR_STORAGE_KEY) as ColorTheme) ?? 'blue';
}

let colorTheme = $state<ColorTheme>(getStoredColorTheme());

function applyColorTheme(ct: ColorTheme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', ct);
  }
}

// Apply on init
applyColorTheme(colorTheme);

export function getColorTheme(): ColorTheme {
  return colorTheme;
}

export function setColorTheme(ct: ColorTheme): void {
  colorTheme = ct;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(COLOR_STORAGE_KEY, ct);
  }
  applyColorTheme(ct);
}
