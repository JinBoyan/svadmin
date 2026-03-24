// Permission / Access Control

// ─── Types ────────────────────────────────────────────────────

/** Actions that can be checked for access control. Extensible via string literal union. */
export type Action = 'list' | 'show' | 'create' | 'edit' | 'delete' | 'export' | 'field' | (string & {});

export interface CanParams {
  resource: string;
  action: Action;
  params?: { id?: string | number; [key: string]: unknown };
}

export interface CanResult {
  can: boolean;
  reason?: string;
}

/** @deprecated Use `CanResult` instead */
export type AccessControlResult = CanResult;

/**
 * Formal Access Control Provider interface.
 * Implement this to define your authorization logic.
 *
 * @example
 * ```ts
 * const accessControlProvider: AccessControlProvider = {
 *   can: async ({ resource, action, params }) => {
 *     if (resource === 'users' && action === 'delete') {
 *       return { can: false, reason: 'Cannot delete users' };
 *     }
 *     return { can: true };
 *   },
 *   options: {
 *     buttons: { enableAccessControl: true, hideIfUnauthorized: false },
 *   },
 * };
 * ```
 */
export interface AccessControlProvider {
  can: (params: CanParams) => Promise<CanResult>;
  options?: {
    buttons?: {
      /** Enable access control checks on CRUD buttons globally. Default: false */
      enableAccessControl?: boolean;
      /** Hide buttons when unauthorized instead of disabling. Default: false */
      hideIfUnauthorized?: boolean;
    };
  };
}

/** @deprecated Use `AccessControlProvider['can']` instead */
export type AccessControlFn = (
  resource: string,
  action: Action,
  params?: Record<string, unknown>,
) => CanResult | Promise<CanResult>;

// ─── State ────────────────────────────────────────────────────

let provider: AccessControlProvider | null = null;
let legacyFn: AccessControlFn | null = null;

// ─── API ──────────────────────────────────────────────────────

/**
 * Register an AccessControlProvider.
 */
export function setAccessControlProvider(p: AccessControlProvider): void {
  provider = p;
  legacyFn = null;
}

/**
 * @deprecated Use `setAccessControlProvider()` with full `AccessControlProvider` interface.
 * Legacy API preserved for backward compatibility.
 */
export function setAccessControl(fn: AccessControlFn): void {
  legacyFn = fn;
  provider = {
    can: async ({ resource, action, params }) => {
      const result = fn(resource, action, params);
      return result instanceof Promise ? result : Promise.resolve(result);
    },
  };
}

/** Get the current AccessControlProvider (or null) */
export function getAccessControlProvider(): AccessControlProvider | null {
  return provider;
}

/** Get global button options from the AccessControlProvider */
export function getAccessControlOptions() {
  return provider?.options ?? {};
}

/**
 * Synchronous access check. Returns `{ can: true }` if no provider/fn is set.
 * When a legacy sync fn is registered via `setAccessControl()`, this calls it synchronously.
 * When only a provider is registered, this warns if provider.can() returns a Promise.
 */
export function canAccess(resource: string, action: Action, params?: Record<string, unknown>): CanResult {
  // Fast path: use legacy sync fn if available
  if (legacyFn) {
    const result = legacyFn(resource, action, params);
    if (result instanceof Promise) {
      console.warn('[permissions] canAccess called synchronously but accessControlFn returned a Promise. Defaulting to { can: true }. Use canAccessAsync() instead.');
      return { can: true };
    }
    return result;
  }
  if (!provider) return { can: true };
  // Provider path (always async) — warn
  console.warn('[permissions] canAccess called synchronously but provider.can() returned a Promise. Defaulting to { can: true }. Use canAccessAsync() instead.');
  return { can: true };
}

/**
 * Async access check. Preferred over `canAccess()`.
 */
export async function canAccessAsync(resource: string, action: Action, params?: Record<string, unknown>): Promise<CanResult> {
  if (legacyFn) {
    return legacyFn(resource, action, params);
  }
  if (!provider) return { can: true };
  return provider.can({ resource, action, params });
}
