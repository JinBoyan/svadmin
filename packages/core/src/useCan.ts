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
export function useCan(resourceOrOptions: string | UseCanOptions, action?: Action, params?: Record<string, unknown>): UseCanResult {
  // Normalize arguments: support both (resource, action, params) and (options) signatures
  const options: UseCanOptions = typeof resourceOrOptions === 'string'
    ? { resource: resourceOrOptions, action: action ?? 'list', params }
    : resourceOrOptions;

  const query = createQuery<CanResult>(() => ({
    queryKey: ['useCan', options.resource, options.action, options.params],
    queryFn: () => canAccessAsync(options.resource, options.action, options.params),
    enabled: options.queryOptions?.enabled ?? true,
    staleTime: options.queryOptions?.staleTime ?? 5 * 60 * 1000, // 5 min default cache
  }));

  return {
    get allowed() { return query.data?.can ?? true; },
    get reason() { return query.data?.reason; },
    get isLoading() { return query.isLoading; },
  };
}
