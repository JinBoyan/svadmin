---
title: Drizzle ORM 数据提供器
description: 通过 Drizzle ORM 直接访问数据库 — SQLite、PostgreSQL、MySQL、Cloudflare D1
---

`@svadmin/drizzle` 提供基于 [Drizzle ORM](https://orm.drizzle.team/) 的 DataProvider，由 [refine-sqlx](https://github.com/medz/refine-sqlx) 驱动。无需 REST API，直接操作数据库。

## 安装

```bash
bun add @svadmin/drizzle refine-sqlx drizzle-orm
```

## 支持的数据库

| 数据库 | Drizzle 驱动 | 运行时 |
|--------|-------------|--------|
| SQLite | `drizzle-orm/bun-sqlite` | Bun |
| SQLite | `drizzle-orm/better-sqlite3` | Node.js |
| PostgreSQL | `drizzle-orm/postgres-js` | Bun / Node.js |
| MySQL | `drizzle-orm/mysql2` | Node.js |
| Cloudflare D1 | `drizzle-orm/d1` | Cloudflare Workers |

## 基本用法

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

## Schema 定义

使用 Drizzle ORM 定义数据库结构：

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

## 高级功能

### 软删除

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

### 关联查询

```typescript
const dataProvider = await createDrizzleDataProvider({
  connection: db,
  schema,
  features: {
    relations: { enabled: true },
  },
});

// 在 hooks 中使用：
const query = useOne({
  resource: 'posts',
  id: 1,
  meta: { include: { author: true } },
});
```

### 事务

```typescript
const dataProvider = await createDrizzleDataProvider({
  connection: db,
  schema,
  features: {
    transactions: { enabled: true },
  },
});
```

### 聚合查询

```typescript
const dataProvider = await createDrizzleDataProvider({
  connection: db,
  schema,
  features: {
    aggregations: { enabled: true },
  },
});
```

### 安全控制

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

## 配置参考

```typescript
interface RefineSQLConfig<TSchema> {
  /** Drizzle ORM 实例 */
  connection: VariableDrizzleDatabase<TSchema>;
  /** Drizzle schema 定义 */
  schema: TSchema;
  /** 字段命名规范 — 默认: 'snake_case' */
  casing?: 'camelCase' | 'snake_case' | 'none';
  /** 启用查询日志 */
  logger?: boolean;
  /** 软删除配置 */
  softDelete?: { enabled: boolean; field?: string };
  /** 功能开关 */
  features?: {
    relations?: { enabled: boolean };
    aggregations?: { enabled: boolean };
    transactions?: { enabled: boolean };
  };
  /** 安全配置 */
  security?: SecurityConfig;
}
```

## 与其他提供器的对比

| 特性 | `@svadmin/drizzle` | `@svadmin/supabase` | `@svadmin/simple-rest` |
|------|-------------------|--------------------|-----------------------|
| 架构 | 直接数据库访问 | Supabase API | REST API |
| 依赖 | Drizzle ORM | Supabase SDK | 无 |
| 类型安全 | Schema 级别 | 运行时 | 手动 |
| 软删除 | ✅ 内置 | ❌ 需手动 | ❌ 需手动 |
| 关联查询 | ✅ Drizzle relations | ✅ 外键 | ❌ 不支持 |
| 事务 | ✅ 内置 | ❌ 不支持 | ❌ 不支持 |
| 聚合查询 | ✅ 内置 | ❌ 需手动 | ❌ 不支持 |
| 安全控制 | ✅ 内置 Guard | ✅ RLS | ❌ API 层 |
| 离线 / 边缘 | ✅ SQLite / D1 | ❌ 仅云端 | 取决于 API |
