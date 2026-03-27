import { describe, test, expect, beforeEach } from 'bun:test';

/**
 * Unit tests for theme strategy logic.
 * Since theme.svelte.ts uses Svelte 5 runes ($state), we test the pure
 * strategy logic here without importing the module directly.
 */

// ── Replicate the pure applyTheme logic ──────────────────────

type ThemeMode = 'light' | 'dark' | 'system';
type ThemeStrategy = 'standard' | 'dark-first';

interface ThemeConfig {
  strategy?: ThemeStrategy;
  cssOverrides?: Record<string, string>;
  disableColorScheme?: boolean;
}

// Simulate DOM state
let classes: Set<string>;
let cssVars: Map<string, string>;
let colorScheme: string;

function resetMocks() {
  classes = new Set();
  cssVars = new Map();
  colorScheme = '';
}

/** Pure version of applyTheme logic extracted from theme.svelte.ts */
function applyTheme(mode: ThemeMode, config: ThemeConfig, systemPreference: 'light' | 'dark' = 'light') {
  const resolved = mode === 'system' ? systemPreference : mode;
  const strategy = config.strategy ?? 'standard';

  if (strategy === 'dark-first') {
    if (resolved === 'light') classes.add('light');
    else classes.delete('light');
    classes.delete('dark');
  } else {
    if (resolved === 'dark') classes.add('dark');
    else classes.delete('dark');
    classes.delete('light');
  }

  if (!config.disableColorScheme) {
    colorScheme = resolved;
  }
}

function applyCssOverrides(overrides: Record<string, string>) {
  for (const [key, value] of Object.entries(overrides)) {
    const cssVar = key.startsWith('--') ? key : `--${key}`;
    cssVars.set(cssVar, value);
  }
}

function clearCssOverrides(config: ThemeConfig, keys?: string[]) {
  if (keys) {
    for (const key of keys) {
      const cssVar = key.startsWith('--') ? key : `--${key}`;
      cssVars.delete(cssVar);
    }
  } else if (config.cssOverrides) {
    for (const key of Object.keys(config.cssOverrides)) {
      const cssVar = key.startsWith('--') ? key : `--${key}`;
      cssVars.delete(cssVar);
    }
  }
}

describe('Theme Strategy — standard (light-first)', () => {
  beforeEach(resetMocks);

  test('dark mode adds "dark" class', () => {
    applyTheme('dark', { strategy: 'standard' });
    expect(classes.has('dark')).toBe(true);
    expect(classes.has('light')).toBe(false);
  });

  test('light mode has no mode class', () => {
    applyTheme('light', { strategy: 'standard' });
    expect(classes.has('dark')).toBe(false);
    expect(classes.has('light')).toBe(false);
  });

  test('system mode resolves to system preference', () => {
    applyTheme('system', { strategy: 'standard' }, 'dark');
    expect(classes.has('dark')).toBe(true);
  });

  test('sets color-scheme by default', () => {
    applyTheme('dark', { strategy: 'standard' });
    expect(colorScheme).toBe('dark');
  });
});

describe('Theme Strategy — dark-first', () => {
  beforeEach(resetMocks);

  test('light mode adds "light" class', () => {
    applyTheme('light', { strategy: 'dark-first' });
    expect(classes.has('light')).toBe(true);
    expect(classes.has('dark')).toBe(false);
  });

  test('dark mode has no mode class', () => {
    applyTheme('dark', { strategy: 'dark-first' });
    expect(classes.has('light')).toBe(false);
    expect(classes.has('dark')).toBe(false);
  });

  test('system mode resolves correctly', () => {
    applyTheme('system', { strategy: 'dark-first' }, 'light');
    expect(classes.has('light')).toBe(true);
  });

  test('disableColorScheme prevents color-scheme change', () => {
    applyTheme('dark', { strategy: 'dark-first', disableColorScheme: true });
    expect(colorScheme).toBe('');
  });
});

describe('CSS Overrides', () => {
  beforeEach(resetMocks);

  test('applies CSS variables with -- prefix', () => {
    applyCssOverrides({
      '--primary': 'rgb(108, 124, 255)',
      '--background': '5, 8, 17',
    });
    expect(cssVars.get('--primary')).toBe('rgb(108, 124, 255)');
    expect(cssVars.get('--background')).toBe('5, 8, 17');
  });

  test('auto-prefixes keys without --', () => {
    applyCssOverrides({ 'primary': 'red' });
    expect(cssVars.get('--primary')).toBe('red');
  });

  test('clearCssOverrides removes all', () => {
    const config: ThemeConfig = {
      cssOverrides: { '--a': '1', '--b': '2' },
    };
    applyCssOverrides(config.cssOverrides!);
    expect(cssVars.size).toBe(2);

    clearCssOverrides(config);
    expect(cssVars.size).toBe(0);
  });

  test('clearCssOverrides with specific keys', () => {
    const config: ThemeConfig = {
      cssOverrides: { '--a': '1', '--b': '2' },
    };
    applyCssOverrides(config.cssOverrides!);
    clearCssOverrides(config, ['--a']);
    expect(cssVars.has('--a')).toBe(false);
    expect(cssVars.has('--b')).toBe(true);
  });
});
