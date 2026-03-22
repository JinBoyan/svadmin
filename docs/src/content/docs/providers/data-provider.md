---
title: Data Provider
description: Connect svadmin to any backend API
---

The `DataProvider` interface defines how svadmin talks to your backend. Implement it once, and all hooks and components work automatically.

## Interface

```typescript
interface DataProvider {
  getList: <T>(params: GetListParams) => Promise<GetListResult<T>>;
  getOne: <T>(params: GetOneParams) => Promise<GetOneResult<T>>;
  create: <T>(params: CreateParams) => Promise<CreateResult<T>>;
  update: <T>(params: UpdateParams) => Promise<UpdateResult<T>>;
  deleteOne: <T>(params: DeleteParams) => Promise<DeleteResult<T>>;
  getApiUrl: () => string;

  // Optional
  getMany?: <T>(params: GetManyParams) => Promise<GetManyResult<T>>;
  createMany?: <T>(params: CreateManyParams) => Promise<CreateManyResult<T>>;
  updateMany?: <T>(params: UpdateManyParams) => Promise<UpdateManyResult<T>>;
  deleteMany?: <T>(params: DeleteManyParams) => Promise<DeleteManyResult<T>>;
  custom?: <T>(params: CustomParams) => Promise<CustomResult<T>>;
}
```

## Built-in Providers

### Simple REST

```typescript
import { createSimpleRestProvider } from '@svadmin/simple-rest';
const dataProvider = createSimpleRestProvider('https://api.example.com');
```

Maps to: `GET /posts`, `GET /posts/1`, `POST /posts`, `PUT /posts/1`, `DELETE /posts/1`

### Supabase

```typescript
import { createSupabaseDataProvider } from '@svadmin/supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);
const dataProvider = createSupabaseDataProvider(supabase);
```

### GraphQL

```typescript
import { createGraphQLDataProvider } from '@svadmin/graphql';
const dataProvider = createGraphQLDataProvider('https://api.example.com/graphql');
```

### Appwrite

```typescript
import { Client, Databases } from 'appwrite';
import { createAppwriteDataProvider } from '@svadmin/appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('PROJECT_ID');
const databases = new Databases(client);
const dataProvider = createAppwriteDataProvider({ databases, databaseId: 'main' });
```

Supports sorters, 10+ filter operators, and bulk operations (`getMany`, `deleteMany`).

### PocketBase

```typescript
import PocketBase from 'pocketbase';
import { createPocketBaseDataProvider } from '@svadmin/pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');
const dataProvider = createPocketBaseDataProvider({ pb });
```

Supports sorters, filters, and bulk operations. PocketBase also provides `createPocketBaseAuthProvider` and `createPocketBaseLiveProvider`.

## Multiple Data Providers

Use different backends for different resources:

```typescript
import { setDataProvider } from '@svadmin/core';

setDataProvider({
  default: restProvider,
  cms: graphqlProvider,
});
```

Tag resources with their provider via `meta.dataProviderName`:

```typescript
const resources = [
  { name: 'posts', label: 'Posts', meta: { dataProviderName: 'cms' }, fields: [...] },
  { name: 'users', label: 'Users', fields: [...] },  // uses 'default'
];
```

## Filter Operators

svadmin supports 16 filter operators:

| Operator | Description |
|----------|-------------|
| `eq`, `ne` | Equal, not equal |
| `lt`, `gt`, `lte`, `gte` | Comparisons |
| `contains`, `ncontains` | String contains / not contains |
| `startswith`, `endswith` | String prefix / suffix |
| `in`, `nin` | In array / not in array |
| `null`, `nnull` | Is null / not null |
| `between`, `nbetween` | Range / not in range |

### Logical Filters

Combine filters with `or` / `and`:

```typescript
const filters: LogicalFilter = {
  operator: 'or',
  value: [
    { field: 'status', operator: 'eq', value: 'published' },
    { field: 'status', operator: 'eq', value: 'draft' },
  ],
};
```

## HttpError

Data providers should throw `HttpError` for structured error handling:

```typescript
import { HttpError } from '@svadmin/core';

throw new HttpError('Validation Failed', 422, {
  email: ['Email is required'],
  name: 'Name is too short',
});
```

`useForm` automatically maps `HttpError.errors` to form field errors.
