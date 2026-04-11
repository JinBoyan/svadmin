import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { getAdminOptions } from './options.svelte';
import { getDataProviderForResource, getResource, getLiveProvider } from './context.svelte';
import { useParsed } from './useParsed.svelte';
import { audit } from './audit';
import { UndoError } from './types';
import type { BaseRecord, HttpError, CreateParams, UpdateParams, DeleteParams, KnownResources } from './types';
import { createOvertimeTracker, fireSuccessNotification, fireErrorNotification } from './hook-utils.svelte';
import type { NotificationConfig, OvertimeOptions } from './hook-utils.svelte';
import { toast } from './toast.svelte';

// ─── Helper: publish live events after mutations ────────────────

function publishLiveEvent(resource: string, type: 'created' | 'updated' | 'deleted', ids?: (string | number)[]) {
  try {
    const liveProvider = getLiveProvider();
    if (liveProvider?.publish) {
      liveProvider.publish({
        type: type === 'created' ? 'INSERT' : type === 'updated' ? 'UPDATE' : 'DELETE',
        resource,
        payload: { ids },
      });
    }
  } catch { /* LiveProvider not configured — skip silently */ }
}

// ─── useCreate ─────────────────────────────────────────────────

export interface UseCreateOptions {
  resource?: KnownResources;
  mutationOptions?: Record<string, unknown>;
  overtimeOptions?: OvertimeOptions;
}

export interface UseCreateMutateParams<TVariables> {
  resource?: KnownResources;
  variables: TVariables;
  successNotification?: NotificationConfig;
  errorNotification?: NotificationConfig;
  invalidates?: string[] | false;
  meta?: Record<string, unknown>;
  dataProviderName?: string;
}

export function useCreate<TData extends BaseRecord = BaseRecord, TError = HttpError, TVariables = Record<string, unknown>>(options: UseCreateOptions = {}) {
  const parsed = useParsed();
  const defaultResource = options.resource ?? parsed.resource ?? '';
  const adminOptions = getAdminOptions();
  const queryClient = useQueryClient();

  let isMutating = $state(false);
  const overtime = createOvertimeTracker(() => isMutating, options.overtimeOptions ?? adminOptions.overtime);

  const mutation = createMutation<
    { data: TData },
    TError,
    UseCreateMutateParams<TVariables>
  >(() => ({
    ...options.mutationOptions,
    mutationFn: async (params) => {
      isMutating = true;
      const resName = params.resource ?? defaultResource;
      const provider = getDataProviderForResource(resName, params.dataProviderName);
      try {
        return await provider.create<TData, TVariables>({
          resource: resName,
          variables: params.variables,
          meta: params.meta,
        });
      } finally {
        isMutating = false;
      }
    },
    onMutate: (options.mutationOptions as any)?.onMutate,
    onSuccess: (data, params, context) => {
      const resName = params.resource ?? defaultResource;
      fireSuccessNotification(params.successNotification, 'Created successfully', data.data, params.variables, resName);
      const res = getResource(resName);
      const pk = res.primaryKey ?? 'id';
      const newId = (data.data as Record<string, unknown>)[pk];
      audit({ action: 'create', resource: resName, recordId: String(newId) });
      publishLiveEvent(resName, 'created', newId != null ? [newId as string | number] : undefined);
      if (typeof options.mutationOptions?.onSuccess === 'function') {
        (options.mutationOptions.onSuccess as Function)(data, params, context);
      }
    },
    // Invalidation in onSettled ensures cache is refreshed on BOTH success and error
    onSettled: (_data, _error, params) => {
      const resName = params.resource ?? defaultResource;
      if (params.invalidates !== false) {
        queryClient.invalidateQueries({ queryKey: [resName, 'list'] });
        queryClient.invalidateQueries({ queryKey: [resName, 'many'] });
      }
    },
    onError: (error, params, context) => {
      fireErrorNotification(params.errorNotification, 'Create failed', error);
      if (typeof options.mutationOptions?.onError === 'function') {
        (options.mutationOptions.onError as Function)(error, params, context);
      }
    },
  }));

  return { mutation, get overtime() { return overtime; } };
}

// ─── useUpdate ─────────────────────────────────────────────────

export interface UseUpdateOptions {
  resource?: KnownResources;
  id?: string | number;
  mutationMode?: 'pessimistic' | 'optimistic' | 'undoable';
  undoableTimeout?: number;
  mutationOptions?: Record<string, unknown>;
  overtimeOptions?: OvertimeOptions;
}

export interface UseUpdateMutateParams<TVariables> {
  resource?: KnownResources;
  id?: string | number;
  variables: TVariables;
  successNotification?: NotificationConfig;
  errorNotification?: NotificationConfig;
  invalidates?: string[] | false;
  meta?: Record<string, unknown>;
  dataProviderName?: string;
  onCancel?: () => void;
  optimisticUpdateMap?: {
    detail?: boolean | ((previous: unknown, variables: TVariables, id?: string | number) => unknown);
    list?: boolean | ((previous: unknown, variables: TVariables, id?: string | number) => unknown);
    many?: boolean | ((previous: unknown, variables: TVariables, id?: string | number) => unknown);
  };
}

export function useUpdate<TData extends BaseRecord = BaseRecord, TError = HttpError, TVariables = Record<string, unknown>>(options: UseUpdateOptions = {}) {
  const parsed = useParsed();
  const defaultResource = options.resource ?? parsed.resource ?? '';
  const defaultId = options.id ?? parsed.id;
  const adminOptions = getAdminOptions();
  const queryClient = useQueryClient();
  const mutationMode = options.mutationMode ?? adminOptions.mutationMode ?? 'pessimistic';
  const undoableTimeout = options.undoableTimeout ?? adminOptions.undoableTimeout ?? 5000;

  let isMutating = $state(false);
  const overtime = createOvertimeTracker(() => isMutating, options.overtimeOptions ?? adminOptions.overtime);

  const mutation = createMutation<
    { data: TData },
    TError,
    UseUpdateMutateParams<TVariables>
  >(() => ({
    ...options.mutationOptions,
    mutationFn: async (params) => {
      isMutating = true;
      const resName = params.resource ?? defaultResource;
      const targetId = params.id ?? defaultId;
      if (targetId == null) throw new Error('useUpdate requires an id');

      if (mutationMode === 'undoable') {
        await new Promise<void>((resolve, reject) => {
          toast.undoable('Action can be undone', undoableTimeout, () => {
            params.onCancel?.();
            reject(new UndoError());
          }, resolve);
        });
      }

      const provider = getDataProviderForResource(resName, params.dataProviderName);
      try {
        return await provider.update<TData, TVariables>({
          resource: resName,
          id: targetId,
          variables: params.variables,
          meta: params.meta,
        });
      } finally {
        isMutating = false;
      }
    },
    onMutate: async (params) => {
      const userOnMutate = (options.mutationOptions as any)?.onMutate;
      const userContext = typeof userOnMutate === 'function' ? await userOnMutate(params) : undefined;
      
      if (mutationMode === 'pessimistic') return { _svadmin_ctx: true, userContext };
      const resName = params.resource ?? defaultResource;
      const targetId = params.id ?? defaultId;
      
      // Cancel in-flight queries for this resource
      await queryClient.cancelQueries({ queryKey: [resName] });

      // Snapshot ALL previous queries for rollback (matches refine pattern)
      const previousQueries = queryClient.getQueriesData({ queryKey: [resName] });
      
      const pk = getResource(resName).primaryKey ?? 'id';
      const updater = params.optimisticUpdateMap ?? { list: true, many: true, detail: true };
      
      // Optimistic update: detail queries
      if (updater.detail !== false) {
        const detailFn = updater.detail;
        if (typeof detailFn === 'function') {
          queryClient.setQueryData([resName, 'one', targetId], (old: unknown) => detailFn(old, params.variables, targetId));
        } else {
          queryClient.setQueryData([resName, 'one', targetId], (old: Record<string, unknown> | undefined) => old ? { ...old, data: { ...(old as any).data, ...params.variables } } : old);
        }
      }
      
      // Optimistic update: list queries
      if (updater.list !== false) {
        queryClient.setQueriesData({ queryKey: [resName, 'list'] }, (old: unknown) => {
          if (typeof updater.list === 'function') return updater.list!(old, params.variables, targetId);
          if (!old || typeof old !== 'object' || !('data' in old)) return old;
          const o = old as { data: Record<string, unknown>[] };
          return { ...o, data: o.data.map((item) => String(item[pk]) === String(targetId) ? { ...item, ...params.variables } : item) };
        });
      }

      // Optimistic update: many queries (missing before — refine parity)
      if (updater.many !== false) {
        queryClient.setQueriesData({ queryKey: [resName, 'many'] }, (old: unknown) => {
          if (typeof updater.many === 'function') return updater.many!(old, params.variables, targetId);
          if (!old || typeof old !== 'object' || !('data' in old)) return old;
          const o = old as { data: Record<string, unknown>[] };
          return { ...o, data: o.data.map((item) => String(item[pk]) === String(targetId) ? { ...item, ...params.variables } : item) };
        });
      }

      return { _svadmin_ctx: true, userContext, previousQueries };
    },
    onSuccess: (data, params, context) => {
      const extractedCtx = (context as any)?._svadmin_ctx ? (context as any).userContext : context;
      const resName = params.resource ?? defaultResource;
      const targetId = params.id ?? defaultId;
      fireSuccessNotification(params.successNotification, 'Updated successfully', data.data, params.variables, resName);
      audit({ action: 'update', resource: resName, recordId: String(targetId) });
      publishLiveEvent(resName, 'updated', targetId != null ? [targetId] : undefined);
      if (typeof options.mutationOptions?.onSuccess === 'function') {
        (options.mutationOptions.onSuccess as Function)(data, params, extractedCtx);
      }
    },
    // Invalidation in onSettled (refine pattern) — runs on BOTH success and error
    onSettled: (_data, _error, params) => {
      const resName = params.resource ?? defaultResource;
      const targetId = params.id ?? defaultId;
      if (params.invalidates !== false) {
        queryClient.invalidateQueries({ queryKey: [resName, 'list'] });
        queryClient.invalidateQueries({ queryKey: [resName, 'many'] });
        if (targetId != null) {
          queryClient.invalidateQueries({ queryKey: [resName, 'one', targetId] });
        }
      }
    },
    onError: (error, params, context: unknown) => {
      // Rollback ALL queries from snapshot (refine pattern — more robust than individual rollbacks)
      const ctx = context as { _svadmin_ctx?: boolean; previousQueries?: [unknown, unknown][]; userContext?: unknown } | undefined;
      if (ctx?.previousQueries) {
        for (const [queryKey, data] of ctx.previousQueries) {
          queryClient.setQueryData(queryKey as string[], data);
        }
      }
      if (error instanceof UndoError) return;
      const extractedCtx = ctx?._svadmin_ctx ? ctx.userContext : context;
      fireErrorNotification(params.errorNotification, 'Update failed', error);
      if (typeof options.mutationOptions?.onError === 'function') {
        (options.mutationOptions.onError as Function)(error, params, extractedCtx);
      }
    },
  }));

  return { mutation, get overtime() { return overtime; } };
}

// ─── useDelete ─────────────────────────────────────────────────

export interface UseDeleteOptions {
  resource?: KnownResources;
  id?: string | number;
  mutationMode?: 'pessimistic' | 'optimistic' | 'undoable';
  undoableTimeout?: number;
  mutationOptions?: Record<string, unknown>;
  overtimeOptions?: OvertimeOptions;
}

export interface UseDeleteMutateParams<TVariables> {
  resource?: KnownResources;
  id?: string | number;
  variables?: TVariables;
  successNotification?: NotificationConfig;
  errorNotification?: NotificationConfig;
  invalidates?: string[] | false;
  meta?: Record<string, unknown>;
  dataProviderName?: string;
  onCancel?: () => void;
}

export function useDelete<TData extends BaseRecord = BaseRecord, TError = HttpError, TVariables = Record<string, unknown>>(options: UseDeleteOptions = {}) {
  const parsed = useParsed();
  const defaultResource = options.resource ?? parsed.resource ?? '';
  const defaultId = options.id ?? parsed.id;
  const adminOptions = getAdminOptions();
  const queryClient = useQueryClient();
  const mutationMode = options.mutationMode ?? adminOptions.mutationMode ?? 'pessimistic';
  const undoableTimeout = options.undoableTimeout ?? adminOptions.undoableTimeout ?? 5000;

  let isMutating = $state(false);
  const overtime = createOvertimeTracker(() => isMutating, options.overtimeOptions ?? adminOptions.overtime);

  const mutation = createMutation<
    { data: TData },
    TError,
    UseDeleteMutateParams<TVariables>
  >(() => ({
    ...options.mutationOptions,
    mutationFn: async (params) => {
      isMutating = true;
      const resName = params.resource ?? defaultResource;
      const targetId = params.id ?? defaultId;
      if (targetId == null) throw new Error('useDelete requires an id');

      if (mutationMode === 'undoable') {
        await new Promise<void>((resolve, reject) => {
          toast.undoable('Action can be undone', undoableTimeout, () => {
            params.onCancel?.();
            reject(new UndoError());
          }, resolve);
        });
      }

      const provider = getDataProviderForResource(resName, params.dataProviderName);
      try {
        return await provider.deleteOne<TData, TVariables>({
          resource: resName,
          id: targetId,
          variables: params.variables,
          meta: params.meta,
        });
      } finally {
        isMutating = false;
      }
    },
    onMutate: async (params) => {
      const userOnMutate = (options.mutationOptions as any)?.onMutate;
      const userContext = typeof userOnMutate === 'function' ? await userOnMutate(params) : undefined;
      
      if (mutationMode === 'pessimistic') return { _svadmin_ctx: true, userContext };
      const resName = params.resource ?? defaultResource;
      const targetId = params.id ?? defaultId;
      
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: [resName] });

      // Snapshot ALL previous queries for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: [resName] });
      
      const pk = getResource(resName).primaryKey ?? 'id';
      
      // Optimistic remove from list queries
      queryClient.setQueriesData({ queryKey: [resName, 'list'] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('data' in old)) return old;
        const o = old as { data: Record<string, unknown>[]; total?: number };
        const filtered = o.data.filter((item) => String(item[pk]) !== String(targetId));
        return { ...o, data: filtered, total: (o.total ?? o.data.length) - (o.data.length - filtered.length) };
      });

      // Optimistic remove from many queries (refine parity)
      queryClient.setQueriesData({ queryKey: [resName, 'many'] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('data' in old)) return old;
        const o = old as { data: Record<string, unknown>[] };
        return { ...o, data: o.data.filter((item) => String(item[pk]) !== String(targetId)) };
      });

      return { _svadmin_ctx: true, userContext, previousQueries };
    },
    onSuccess: (data, params, context) => {
      const extractedCtx = (context as any)?._svadmin_ctx ? (context as any).userContext : context;
      const resName = params.resource ?? defaultResource;
      const targetId = params.id ?? defaultId;

      // Remove detail cache entry (refine pattern — no stale show page)
      if (targetId != null) {
        queryClient.removeQueries({ queryKey: [resName, 'one', targetId] });
      }

      fireSuccessNotification(params.successNotification, 'Deleted successfully', data.data, params.variables, resName);
      audit({ action: 'delete', resource: resName, recordId: String(targetId) });
      publishLiveEvent(resName, 'deleted', targetId != null ? [targetId] : undefined);
      if (typeof options.mutationOptions?.onSuccess === 'function') {
        (options.mutationOptions.onSuccess as Function)(data, params, extractedCtx);
      }
    },
    // Invalidation in onSettled (refine pattern)
    onSettled: (_data, _error, params) => {
      const resName = params.resource ?? defaultResource;
      if (params.invalidates !== false) {
        queryClient.invalidateQueries({ queryKey: [resName, 'list'] });
        queryClient.invalidateQueries({ queryKey: [resName, 'many'] });
      }
    },
    onError: (error, params, context: unknown) => {
      // Rollback ALL queries from snapshot
      const ctx = context as { _svadmin_ctx?: boolean; previousQueries?: [unknown, unknown][]; userContext?: unknown } | undefined;
      if (ctx?.previousQueries) {
        for (const [queryKey, data] of ctx.previousQueries) {
          queryClient.setQueryData(queryKey as string[], data);
        }
      }
      if (error instanceof UndoError) return;
      const extractedCtx = ctx?._svadmin_ctx ? ctx.userContext : context;
      fireErrorNotification(params.errorNotification, 'Delete failed', error);
      if (typeof options.mutationOptions?.onError === 'function') {
        (options.mutationOptions.onError as Function)(error, params, extractedCtx);
      }
    },
  }));

  return { mutation, get overtime() { return overtime; } };
}
