// useCan — reactive permission check hook with TanStack Query integration

import { createQuery } from '@tanstack/svelte-query';
import { canAccessAsync } from './permissions';
import type { Action, CanResult } from './permissions';

export interface UseCanOptions {
  resource: string;
  action: Action;
  params?: Record<string, unknown>;
  queryOptions?: {
    enabled?: boolean;
    staleTime?: number;
  };
}

export interface UseCanResult {
  readonly allowed: boolean;
  readonly reason: string | undefined;
  readonly isLoading: boolean;
}

/**
 * Reactive permission check backed by TanStack Query for caching and deduplication.
 *
 * @example
 * ```ts
 * // Simple usage (backward compatible)
 * const can = useCan('posts', 'delete');
 * if (can.allowed) { ... }
 *
 * // With options object
 * const can = useCan({ resource: 'posts', action: 'delete', params: { id: 1 } });
 * ```
 */
export function useCan(
  resourceOrOptions: string | UseCanOptions | (() => UseCanOptions),
  action?: Action,
  params?: Record<string, unknown>
): UseCanResult {
  const getOptions = (): UseCanOptions => {
    if (typeof resourceOrOptions === 'function') {
      return resourceOrOptions();
    }
    if (typeof resourceOrOptions === 'string') {
      return { resource: resourceOrOptions, action: action ?? 'list', params };
    }
    return resourceOrOptions;
  };

  // @tanstack/svelte-query v6 Accessor pattern
  const query = createQuery<CanResult>(() => {
    const options = getOptions();
    return {
      queryKey: ['useCan', options.resource, options.action, options.params] as const,
      queryFn: () => canAccessAsync(options.resource, options.action, options.params),
      enabled: options.queryOptions?.enabled ?? true,
      staleTime: options.queryOptions?.staleTime ?? 5 * 60 * 1000, // 5 min default cache
    };
  });

  // Access via query store — use safe property access with fallbacks
  return {
    get allowed() { return (query.data as CanResult | undefined)?.can ?? true; },
    get reason() { return (query.data as CanResult | undefined)?.reason; },
    get isLoading() { return query.isLoading; },
  };
}

