---
title: Drizzle ORM Data Provider
description: Direct database access via Drizzle ORM — SQLite, PostgreSQL, MySQL, Cloudflare D1
---

The `@svadmin/drizzle` package provides a DataProvider that connects directly to databases via [Drizzle ORM](https://orm.drizzle.team/), powered by [refine-sqlx](https://github.com/medz/refine-sqlx). No REST API needed — talk to your database directly.

## Installation

```bash
bun add @svadmin/drizzle refine-sqlx drizzle-orm
```

## Supported Databases

| Database | Drizzle Driver | Runtime |
|----------|---------------|---------|
| SQLite | `drizzle-orm/bun-sqlite` | Bun |
| SQLite | `drizzle-orm/better-sqlite3` | Node.js |
| PostgreSQL | `drizzle-orm/postgres-js` | Bun / Node.js |
| MySQL | `drizzle-orm/mysql2` | Node.js |
| Cloudflare D1 | `drizzle-orm/d1` | Cloudflare Workers |

## Basic Usage

```typescript
import { createDrizzleDataProvider } from '@svadmin/drizzle';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

const db = drizzle(new Database('./app.db'), { schema });

const dataProvider = await createDrizzleDataProvider({
  connection: db,
  schema,
});
```

## Schema Definition

Define your database schema using Drizzle ORM:

```typescript
// schema.ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').default('user'),
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content'),
  authorId: integer('author_id').references(() => users.id),
});
```

## Advanced Features

### Soft Delete

```typescript
const dataProvider = await createDrizzleDataProvider({
  connection: db,
  schema,
  softDelete: {
    enabled: true,
    field: 'deleted_at',
  },
});
```

### Relations

```typescript
const dataProvider = await createDrizzleDataProvider({
  connection: db,
  schema,
  features: {
    relations: { enabled: true },
  },
});

// Then use in hooks:
const query = useOne({
  resource: 'posts',
  id: 1,
  meta: { include: { author: true } },
});
```

### Transactions

```typescript
const dataProvider = await createDrizzleDataProvider({
  connection: db,
  schema,
  features: {
    transactions: { enabled: true },
  },
});
```

### Aggregations

```typescript
const dataProvider = await createDrizzleDataProvider({
  connection: db,
  schema,
  features: {
    aggregations: { enabled: true },
  },
});
```

### Security

```typescript
const dataProvider = await createDrizzleDataProvider({
  connection: db,
  schema,
  security: {
    allowedTables: ['users', 'posts'],
    hiddenFields: { users: ['password', 'apiKey'] },
    maxLimit: 1000,
    allowedOperations: ['read', 'create', 'update'],
  },
});
```

### Cloudflare D1

```typescript
import { createDrizzleDataProvider } from '@svadmin/drizzle';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export default {
  async fetch(request: Request, env: Env) {
    const db = drizzle(env.DB, { schema });
    const dataProvider = await createDrizzleDataProvider({
      connection: db,
      schema,
    });
    // ...
  },
};
```

## Configuration Reference

```typescript
interface RefineSQLConfig<TSchema> {
  /** Drizzle ORM instance */
  connection: VariableDrizzleDatabase<TSchema>;
  /** Drizzle schema definition */
  schema: TSchema;
  /** Field naming convention — default: 'snake_case' */
  casing?: 'camelCase' | 'snake_case' | 'none';
  /** Enable query logging */
  logger?: boolean;
  /** Soft delete configuration */
  softDelete?: { enabled: boolean; field?: string };
  /** Feature flags */
  features?: {
    relations?: { enabled: boolean };
    aggregations?: { enabled: boolean };
    transactions?: { enabled: boolean };
  };
  /** Security configuration */
  security?: SecurityConfig;
}
```

## Comparison with Other Providers

| Feature | `@svadmin/drizzle` | `@svadmin/supabase` | `@svadmin/simple-rest` |
|---------|-------------------|--------------------|-----------------------|
| Architecture | Direct DB access | Supabase API | REST API |
| Dependencies | Drizzle ORM | Supabase SDK | None |
| Type safety | Schema-level | Runtime | Manual |
| Soft delete | ✅ Built-in | ❌ Manual | ❌ Manual |
| Relations | ✅ Drizzle relations | ✅ Foreign keys | ❌ No |
| Transactions | ✅ Built-in | ❌ No | ❌ No |
| Aggregations | ✅ Built-in | ❌ Manual | ❌ No |
| Security | ✅ Built-in guard | ✅ RLS | ❌ API-level |
| Offline / Edge | ✅ SQLite / D1 | ❌ Cloud only | Depends on API |
