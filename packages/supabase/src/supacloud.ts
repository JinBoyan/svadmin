import type { LiveEvent, LiveProvider } from '@svadmin/core';

export interface SupaCloudTaskSubmitOptions {
  body?: Record<string, unknown>;
  idempotencyKey?: string;
  headers?: Record<string, string>;
}

export interface SupaCloudTaskRecord {
  id: string;
  status?: string;
  [key: string]: unknown;
}

export interface SupaCloudTaskSubscription {
  unsubscribe(): void;
}

export interface SupaCloudTaskHandle<TTask extends SupaCloudTaskRecord = SupaCloudTaskRecord> {
  id?: string;
  wait(): Promise<TTask>;
  subscribe?(callback: (task: TTask) => void): SupaCloudTaskSubscription | (() => void) | void;
  cancel?(): Promise<unknown>;
  retry?(): Promise<unknown>;
}

export interface SupaCloudTaskClient<TTask extends SupaCloudTaskRecord = SupaCloudTaskRecord> {
  submit(taskName: string, options?: SupaCloudTaskSubmitOptions): Promise<SupaCloudTaskHandle<TTask>>;
  get(taskId: string): Promise<TTask>;
  list?(params?: Record<string, unknown>): Promise<TTask[] | { data?: TTask[] }>;
  listDlq?(params?: Record<string, unknown>): Promise<TTask[] | { data?: TTask[] }>;
  cancel?(taskId: string): Promise<unknown>;
  retry?(taskId: string): Promise<unknown>;
  subscribe?(
    taskId: string,
    callback: (task: TTask) => void
  ): SupaCloudTaskSubscription | (() => void) | void;
}

export interface SupaCloudTaskProvider<TTask extends SupaCloudTaskRecord = SupaCloudTaskRecord> {
  submit(taskName: string, options?: SupaCloudTaskSubmitOptions): Promise<SupaCloudTaskHandle<TTask>>;
  get(taskId: string): Promise<TTask>;
  list(params?: Record<string, unknown>): Promise<TTask[] | { data?: TTask[] }>;
  listDlq(params?: Record<string, unknown>): Promise<TTask[] | { data?: TTask[] }>;
  cancel(taskId: string): Promise<unknown>;
  retry(taskId: string): Promise<unknown>;
  subscribe(
    taskId: string,
    callback: (task: TTask) => void
  ): SupaCloudTaskSubscription | (() => void) | void;
}

export interface CreateSupaCloudTaskProviderOptions<
  TTask extends SupaCloudTaskRecord = SupaCloudTaskRecord,
> {
  supacloud: SupaCloudTaskClient<TTask>;
}

export interface CreateSupaCloudTaskLiveProviderOptions<
  TTask extends SupaCloudTaskRecord = SupaCloudTaskRecord,
> {
  supacloud: Pick<SupaCloudTaskClient<TTask>, 'subscribe'>;
  resource?: string;
  mapTaskToEvent?: (task: TTask, resource: string) => LiveEvent;
}

function normalizeTaskSubscription(
  subscription: SupaCloudTaskSubscription | (() => void) | void,
): (() => void) | undefined {
  if (!subscription) return undefined;
  if (typeof subscription === 'function') return subscription;
  if (typeof subscription.unsubscribe === 'function') {
    return () => subscription.unsubscribe();
  }
  return undefined;
}

function normalizeTaskList<TTask extends SupaCloudTaskRecord>(
  value: TTask[] | { data?: TTask[] },
): TTask[] {
  return Array.isArray(value) ? value : (value.data ?? []);
}

function defaultMapTaskToEvent<TTask extends SupaCloudTaskRecord>(
  task: TTask,
  resource: string,
): LiveEvent {
  return {
    type: 'UPDATE',
    resource,
    payload: task as Record<string, unknown>,
  };
}

export function createSupaCloudTaskProvider<
  TTask extends SupaCloudTaskRecord = SupaCloudTaskRecord,
>(options: CreateSupaCloudTaskProviderOptions<TTask>): SupaCloudTaskProvider<TTask> {
  const { supacloud } = options;

  return {
    submit(taskName, submitOptions) {
      return supacloud.submit(taskName, submitOptions);
    },
    get(taskId) {
      return supacloud.get(taskId);
    },
    async list(params) {
      if (!supacloud.list) {
        throw new Error('[svadmin/supabase] SupaCloud client does not implement tasks.list');
      }
      return normalizeTaskList(await supacloud.list(params));
    },
    async listDlq(params) {
      if (!supacloud.listDlq) {
        throw new Error('[svadmin/supabase] SupaCloud client does not implement tasks.listDlq');
      }
      return normalizeTaskList(await supacloud.listDlq(params));
    },
    cancel(taskId) {
      if (!supacloud.cancel) {
        throw new Error('[svadmin/supabase] SupaCloud client does not implement tasks.cancel');
      }
      return supacloud.cancel(taskId);
    },
    retry(taskId) {
      if (!supacloud.retry) {
        throw new Error('[svadmin/supabase] SupaCloud client does not implement tasks.retry');
      }
      return supacloud.retry(taskId);
    },
    subscribe(taskId, callback) {
      if (!supacloud.subscribe) {
        throw new Error('[svadmin/supabase] SupaCloud client does not implement tasks.subscribe');
      }
      return supacloud.subscribe(taskId, callback);
    },
  };
}

export function createSupaCloudTaskLiveProvider<
  TTask extends SupaCloudTaskRecord = SupaCloudTaskRecord,
>(options: CreateSupaCloudTaskLiveProviderOptions<TTask>): LiveProvider {
  const resourceName = options.resource ?? 'tasks';
  const mapTaskToEvent = options.mapTaskToEvent ?? defaultMapTaskToEvent<TTask>;

  return {
    subscribe({ resource, liveParams, callback }) {
      if (!options.supacloud.subscribe) {
        throw new Error('[svadmin/supabase] SupaCloud client does not implement tasks.subscribe');
      }

      const taskId = typeof liveParams?.taskId === 'string' ? liveParams.taskId : undefined;
      if (!taskId) {
        throw new Error('[svadmin/supabase] createSupaCloudTaskLiveProvider requires liveParams.taskId');
      }

      const unsubscribe = options.supacloud.subscribe(taskId, (task) => {
        callback(mapTaskToEvent(task, resource || resourceName));
      });

      return normalizeTaskSubscription(unsubscribe) ?? (() => {});
    },
  };
}
