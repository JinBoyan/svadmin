// @svadmin/pocketbase — PocketBase DataProvider
// Maps svadmin CRUD operations to PocketBase SDK

import type {
  DataProvider, GetListParams, GetListResult, GetOneParams, GetOneResult,
  CreateParams, CreateResult, UpdateParams, UpdateResult, DeleteParams, DeleteResult,
  GetManyParams, GetManyResult, DeleteManyParams, DeleteManyResult,
} from '@svadmin/core';

interface PocketBaseProviderOptions {
  /** PocketBase client instance */
  pb: unknown; // PocketBase
}

// Duck-typed PocketBase collection interface
interface PBCollection {
  getList: (page: number, perPage: number, options?: { sort?: string; filter?: string }) => Promise<{ items: Record<string, unknown>[]; totalItems: number }>;
  getOne: (id: string) => Promise<Record<string, unknown>>;
  getFullList: (options?: { sort?: string; filter?: string; batch?: number }) => Promise<Record<string, unknown>[]>;
  create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
  update: (id: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>;
  delete: (id: string) => Promise<boolean>;
}

interface PBClient {
  collection: (name: string) => PBCollection;
  buildUrl: (path: string) => string;
}

function buildSort(sorters?: { field: string; order: 'asc' | 'desc' }[]): string | undefined {
  if (!sorters?.length) return undefined;
  return sorters.map(s => s.order === 'desc' ? `-${s.field}` : s.field).join(',');
}

function buildFilter(filters?: { field: string; operator: string; value: unknown }[]): string | undefined {
  if (!filters?.length) return undefined;
  return filters.map(f => {
    const v = f.value;
    switch (f.operator) {
      case 'eq': return `${f.field} = '${v}'`;
      case 'ne': return `${f.field} != '${v}'`;
      case 'contains': return `${f.field} ~ '${v}'`;
      case 'ncontains': return `${f.field} !~ '${v}'`;
      case 'gt': return `${f.field} > '${v}'`;
      case 'gte': return `${f.field} >= '${v}'`;
      case 'lt': return `${f.field} < '${v}'`;
      case 'lte': return `${f.field} <= '${v}'`;
      case 'null': return `${f.field} = ''`;
      case 'nnull': return `${f.field} != ''`;
      case 'in': return `${f.field} ?= '${(v as unknown[]).join("' || " + f.field + " ?= '")}'`;
      default: return `${f.field} = '${v}'`;
    }
  }).join(' && ');
}

/**
 * Create a DataProvider backed by PocketBase.
 *
 * Usage:
 * ```ts
 * import PocketBase from 'pocketbase';
 * import { createPocketBaseDataProvider } from '@svadmin/pocketbase';
 *
 * const pb = new PocketBase('http://127.0.0.1:8090');
 * const dataProvider = createPocketBaseDataProvider({ pb });
 * ```
 */
export function createPocketBaseDataProvider(options: PocketBaseProviderOptions): DataProvider {
  const pb = options.pb as PBClient;

  return {
    getApiUrl: () => pb.buildUrl('/api'),

    async getList<T>(params: GetListParams): Promise<GetListResult<T>> {
      const page = params.pagination?.current ?? 1;
      const perPage = params.pagination?.pageSize ?? 10;
      const result = await pb.collection(params.resource).getList(page, perPage, {
        sort: buildSort(params.sorters),
        filter: buildFilter(params.filters),
      });
      return {
        data: result.items as T[],
        total: result.totalItems,
      };
    },

    async getOne<T>(params: GetOneParams): Promise<GetOneResult<T>> {
      const record = await pb.collection(params.resource).getOne(String(params.id));
      return { data: record as T };
    },

    async create<T>(params: CreateParams): Promise<CreateResult<T>> {
      const record = await pb.collection(params.resource).create(params.variables);
      return { data: record as T };
    },

    async update<T>(params: UpdateParams): Promise<UpdateResult<T>> {
      const record = await pb.collection(params.resource).update(String(params.id), params.variables);
      return { data: record as T };
    },

    async deleteOne<T>(params: DeleteParams): Promise<DeleteResult<T>> {
      await pb.collection(params.resource).delete(String(params.id));
      return { data: { id: params.id } as T };
    },

    async getMany<T>(params: GetManyParams): Promise<GetManyResult<T>> {
      const filter = params.ids.map(id => `id = '${id}'`).join(' || ');
      const records = await pb.collection(params.resource).getFullList({ filter });
      return { data: records as T[] };
    },

    async deleteMany<T>(params: DeleteManyParams): Promise<DeleteManyResult<T>> {
      const results: unknown[] = [];
      for (const id of params.ids) {
        await pb.collection(params.resource).delete(String(id));
        results.push({ id });
      }
      return { data: results as T[] };
    },
  };
}
