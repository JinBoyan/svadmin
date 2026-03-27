/**
 * Component Registry — Svelte Context-based DI for component injection.
 *
 * Allows users to override any registered component via the `components`
 * prop on `AdminApp`, while providing sensible defaults.
 */
import { getContext, setContext, type Component } from 'svelte';

// ─── Overridable component slots ────────────────────────────────
export interface ComponentRegistry {
  // Layout primitives
  Layout: Component<any>;
  Sidebar: Component<any>;
  Header: Component<any>;

  // Pages
  LoginPage: Component<any>;
  AutoTable: Component<any>;
  AutoForm: Component<any>;
  ShowPage: Component<any>;

  // Shadcn primitives
  Button: Component<any>;
  Input: Component<any>;
  Badge: Component<any>;
  Skeleton: Component<any>;
}

const REGISTRY_KEY = 'svadmin:components';

/** Set the component registry in context (called by AdminApp). */
export function setComponentRegistry(registry: ComponentRegistry): void {
  setContext(REGISTRY_KEY, registry);
}

/** Retrieve the full component registry from context. */
export function getComponentRegistry(): ComponentRegistry {
  return getContext<ComponentRegistry>(REGISTRY_KEY);
}

/** Retrieve a single component by name from the registry. */
export function useComponent<K extends keyof ComponentRegistry>(
  name: K,
): ComponentRegistry[K] {
  return getComponentRegistry()[name];
}
