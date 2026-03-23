// Elysia DataProvider — CRUD convention compatible
// Expects backend routes following: GET /resource, GET /resource/:id, POST /resource, PATCH /resource/:id, DELETE /resource/:id
// Response format for lists: { items: T[], total: number }

import type {
  DataProvider, GetListParams, GetListResult, GetOneParams, GetOneResult,
  CreateParams, CreateResult, UpdateParams, UpdateResult, DeleteParams, DeleteResult,
  GetManyParams, GetManyResult, CreateManyParams, CreateManyResult,
  UpdateManyParams, UpdateManyResult, DeleteManyParams, DeleteManyResult,
  CustomParams, CustomResult,
} from '@svadmin/core';

export interface ElysiaDataProviderOptions {
  /** Base API URL, e.g. 'http://localhost:3000' */
  apiUrl: string;
  /** Static headers or a function returning headers (useful for auth tokens) */
  headers?: Record<string, string> | (() => Record<string, string>);
}

function resolveHeaders(opts: ElysiaDataProviderOptions): Record<string, string> {
  const base = { 'Content-Type': 'application/json' };
  const extra = typeof opts.headers === 'function' ? opts.headers() : (opts.headers ?? {});
  return { ...base, ...extra };
}

async function request<T>(url: string, headers: Record<string, string>, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { ...headers, ...init?.headers } });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${response.statusText}${body ? ` — ${body}` : ''}`);
  }
  return response.json();
}

/**
 * Creates a DataProvider for Elysia backends using the CRUD plugin convention.
 *
 * List responses are expected to return `{ items: T[], total: number }`.
 * Single-record responses return the record directly.
 */
export function createElysiaDataProvider(opts: ElysiaDataProviderOptions): DataProvider {
  const { apiUrl } = opts;

  return {
    getApiUrl: () => apiUrl,

    async getList<T>({ resource, pagination, sorters, filters }: GetListParams): Promise<GetListResult<T>> {
      const params = new URLSearchParams();
      const { current = 1, pageSize = 10 } = pagination ?? {};
      params.set('_page', String(current));
      params.set('_limit', String(pageSize));

      if (sorters?.length) {
        params.set('_sort', sorters.map(s => s.field).join(','));
        params.set('_order', sorters.map(s => s.order).join(','));
      }

      if (filters?.length) {
        for (const f of filters) {
          if (f.operator === 'eq') params.set(f.field, String(f.value));
          else if (f.operator === 'contains') params.set(`${f.field}_like`, String(f.value));
          else params.set(`${f.field}_${f.operator}`, String(f.value));
        }
      }

      const url = `${apiUrl}/${resource}?${params.toString()}`;
      const headers = resolveHeaders(opts);
      const json = await request<{ items: T[]; total: number }>(url, headers);
      return { data: json.items, total: json.total };
    },

    async getOne<T>({ resource, id }: GetOneParams): Promise<GetOneResult<T>> {
      const data = await request<T>(`${apiUrl}/${resource}/${id}`, resolveHeaders(opts));
      return { data };
    },

    async create<T>({ resource, variables }: CreateParams): Promise<CreateResult<T>> {
      const data = await request<T>(`${apiUrl}/${resource}`, resolveHeaders(opts), {
        method: 'POST',
        body: JSON.stringify(variables),
      });
      return { data };
    },

    async update<T>({ resource, id, variables }: UpdateParams): Promise<UpdateResult<T>> {
      const data = await request<T>(`${apiUrl}/${resource}/${id}`, resolveHeaders(opts), {
        method: 'PATCH',
        body: JSON.stringify(variables),
      });
      return { data };
    },

    async deleteOne<T>({ resource, id }: DeleteParams): Promise<DeleteResult<T>> {
      const data = await request<T>(`${apiUrl}/${resource}/${id}`, resolveHeaders(opts), {
        method: 'DELETE',
      });
      return { data };
    },

    async getMany<T>({ resource, ids }: GetManyParams): Promise<GetManyResult<T>> {
      const params = ids.map(id => `id=${id}`).join('&');
      const data = await request<T[]>(`${apiUrl}/${resource}?${params}`, resolveHeaders(opts));
      return { data };
    },

    async createMany<T>({ resource, variables }: CreateManyParams): Promise<CreateManyResult<T>> {
      const results: T[] = [];
      for (const vars of variables) {
        const data = await request<T>(`${apiUrl}/${resource}`, resolveHeaders(opts), {
          method: 'POST',
          body: JSON.stringify(vars),
        });
        results.push(data);
      }
      return { data: results };
    },

    async updateMany<T>({ resource, ids, variables }: UpdateManyParams): Promise<UpdateManyResult<T>> {
      const results: T[] = [];
      for (const id of ids) {
        const data = await request<T>(`${apiUrl}/${resource}/${id}`, resolveHeaders(opts), {
          method: 'PATCH',
          body: JSON.stringify(variables),
        });
        results.push(data);
      }
      return { data: results };
    },

    async deleteMany<T>({ resource, ids }: DeleteManyParams): Promise<DeleteManyResult<T>> {
      const results: T[] = [];
      for (const id of ids) {
        const data = await request<T>(`${apiUrl}/${resource}/${id}`, resolveHeaders(opts), {
          method: 'DELETE',
        });
        results.push(data);
      }
      return { data: results };
    },

    async custom<T>({ url, method, payload, headers }: CustomParams): Promise<CustomResult<T>> {
      const data = await request<T>(url, { ...resolveHeaders(opts), ...headers }, {
        method: method.toUpperCase(),
        body: payload ? JSON.stringify(payload) : undefined,
      });
      return { data };
    },
  };
}
