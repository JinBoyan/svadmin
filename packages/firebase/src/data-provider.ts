import type {
  DataProvider, GetListParams, GetListResult, GetOneParams, GetOneResult,
  CreateParams, CreateResult, UpdateParams, UpdateResult, DeleteParams, DeleteResult,
  GetManyParams, GetManyResult, CustomParams, CustomResult, Filter
, BaseRecord } from '@svadmin/core';

interface FirestoreFieldValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  mapValue?: unknown;
  arrayValue?: { values?: unknown[] };
}

interface FirestoreDoc {
  name?: string;
  fields?: Record<string, FirestoreFieldValue>;
}

// Firebase REST API (Firestore REST v1)
function buildFirestoreUrl(projectId: string, collection: string, docId?: string | number): string {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}`;
  return docId ? `${base}/${docId}` : base;
}

function parseFirestoreValue(val: FirestoreFieldValue): unknown {
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('mapValue' in val) {
    const parsed: Record<string, unknown> = {};
    for (const [k, v] of Object.entries((val.mapValue as { fields?: Record<string, FirestoreFieldValue> }).fields ?? {})) {
      parsed[k] = parseFirestoreValue(v);
    }
    return parsed;
  }
  if ('arrayValue' in val) {
    return (val.arrayValue?.values ?? []).map(parseFirestoreValue);
  }
  return val;
}

function parseFirestoreDoc(doc: FirestoreDoc): Record<string, unknown> {
  const fields = doc.fields ?? {};
  const parsed: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields) as [string, FirestoreFieldValue][]) {
    parsed[key] = parseFirestoreValue(val);
  }
  // Extract document ID from name path
  const nameParts = (doc.name ?? '').split('/');
  parsed['id'] = nameParts[nameParts.length - 1];
  return parsed;
}

function toFirestoreValue(val: unknown): FirestoreFieldValue {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (val === null) return { nullValue: null };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') return { mapValue: { fields: toFirestoreFields(val as Record<string, unknown>) } };
  return {};
}

function toFirestoreFields(data: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (key === 'id') continue;
    fields[key] = toFirestoreValue(val);
  }
  return fields;
}

export function createFirebaseDataProvider(projectId: string, apiKey: string): DataProvider {
  const authHeaders = { 'Content-Type': 'application/json' };

  return {
    getApiUrl: () => `https://firestore.googleapis.com/v1/projects/${projectId}`,

    async getList<T extends BaseRecord = BaseRecord>({ resource, pagination }: GetListParams): Promise<GetListResult<T>> {
      const { pageSize = 20 } = pagination ?? {};
      const url = `${buildFirestoreUrl(projectId, resource)}?pageSize=${pageSize}&key=${apiKey}`;
      const res = await fetch(url, { headers: authHeaders });
      if (!res.ok) throw new Error(`Firebase error: ${res.status}`);
      const data = await res.json();
      const docs = (data.documents ?? []).map(parseFirestoreDoc);
      return { data: docs as unknown as T[], total: docs.length };
    },

    async getOne<T extends BaseRecord = BaseRecord>({ resource, id }: GetOneParams): Promise<GetOneResult<T>> {
      const res = await fetch(`${buildFirestoreUrl(projectId, resource, id)}?key=${apiKey}`, { headers: authHeaders });
      if (!res.ok) throw new Error(`Firebase error: ${res.status}`);
      return { data: parseFirestoreDoc(await res.json()) as unknown as T };
    },

    async create<T extends BaseRecord = BaseRecord>({ resource, variables }: CreateParams): Promise<CreateResult<T>> {
      const res = await fetch(`${buildFirestoreUrl(projectId, resource)}?key=${apiKey}`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify({ fields: toFirestoreFields(variables as Record<string, unknown>) }),
      });
      if (!res.ok) throw new Error(`Firebase error: ${res.status}`);
      return { data: parseFirestoreDoc(await res.json()) as unknown as T };
    },

    async update<T extends BaseRecord = BaseRecord>({ resource, id, variables }: UpdateParams): Promise<UpdateResult<T>> {
      const res = await fetch(`${buildFirestoreUrl(projectId, resource, id)}?key=${apiKey}`, {
        method: 'PATCH', headers: authHeaders, body: JSON.stringify({ fields: toFirestoreFields(variables as Record<string, unknown>) }),
      });
      if (!res.ok) throw new Error(`Firebase error: ${res.status}`);
      return { data: parseFirestoreDoc(await res.json()) as unknown as T };
    },

    async deleteOne<T extends BaseRecord = BaseRecord>({ resource, id }: DeleteParams): Promise<DeleteResult<T>> {
      const res = await fetch(`${buildFirestoreUrl(projectId, resource, id)}?key=${apiKey}`, { method: 'DELETE', headers: authHeaders });
      if (!res.ok) throw new Error(`Firebase error: ${res.status}`);
      return { data: { id } as unknown as T };
    },

    async getMany<T extends BaseRecord = BaseRecord>({ resource, ids }: GetManyParams): Promise<GetManyResult<T>> {
      const results = await Promise.all(ids.map(async (id: string | number) => {
        const res = await fetch(`${buildFirestoreUrl(projectId, resource, id)}?key=${apiKey}`, { headers: authHeaders });
        if (!res.ok) throw new Error(`Firebase error: ${res.status}`);
        return parseFirestoreDoc(await res.json()) as unknown as T;
      }));
      return { data: results };
    },

    async custom<T = unknown>({ url, method, payload, headers: h }: CustomParams): Promise<CustomResult<T>> {
      const res = await fetch(url, { method: method.toUpperCase(), headers: { ...authHeaders, ...h }, body: payload ? JSON.stringify(payload) : undefined });
      if (!res.ok) throw new Error(`Custom request failed: ${res.status}`);
      return { data: (await res.json()) as unknown as T };
    },
  };
}
