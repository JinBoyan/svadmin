---
title: 资源类型注册表
description: 编译时类型安全的资源名称和数据类型
---

**资源类型注册表**是 svadmin 实现编译时资源名称检查和自动数据类型推断的机制。通过扩展一个 TypeScript 接口，你可以获得防拼写错误的资源名称和完整类型推断。

## 快速设置

### 1. 定义数据类型

```typescript
// types.ts
export interface Post {
  id: number;
  title: string;
  body: string;
  status: 'draft' | 'published';
}

export interface User {
  id: number;
  name: string;
  email: string;
}
```

### 2. 注册到 ResourceTypeMap

```typescript
// resource-types.d.ts（或任何 .ts 文件）
import type { Post, User } from './types';

declare module '@svadmin/core' {
  interface ResourceTypeMap {
    posts: Post;
    users: User;
  }
}
```

### 3. 享受类型安全

```typescript
// ✅ 编译通过 — 'posts' 是 KnownResources 的键
useList({ resource: 'posts' });

// ❌ 编译错误 — 拼写错误被捕获！
useList({ resource: 'postz' });

// ✅ 数据自动推断为 Post[]
const query = useList({ resource: 'posts' });
query.data?.data[0].title; // string ✓
```

## 工作原理

svadmin 使用 TypeScript [声明合并](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)对一个空接口进行扩展：

```typescript
// @svadmin/core 导出：
export interface ResourceTypeMap {}                        // 空接口 — 用户扩展它
export type KnownResources = keyof ResourceTypeMap extends never
  ? string                                                 // 无注册 → 接受任意字符串
  : Extract<keyof ResourceTypeMap, string>;                // 有注册 → 约束类型
export type InferData<R extends string> = R extends keyof ResourceTypeMap
  ? ResourceTypeMap[R]
  : Record<string, unknown>;                               // 未知资源 → 基础类型
```

**关键设计**：当 `ResourceTypeMap` 为空（无用户注册）时，`KnownResources` 回退为 `string` — 未使用注册表的现有代码可以正常工作。

## 工具类型

| 类型 | 用途 |
|------|------|
| `ResourceTypeMap` | 扩展以注册资源 → 数据类型的映射 |
| `KnownResources` | 已注册资源名称的联合类型（回退为 `string`） |
| `InferData<R>` | 推断资源 `R` 的数据类型 |
| `BaseRecord` | `Record<string, unknown>` — 所有数据类型的基础 |

## 配合 Elysia（自动注册）

`@svadmin/elysia` 包可以从 Elysia 后端自动推断 `ResourceTypeMap`：

```typescript
import type { InferResourceMap } from '@svadmin/elysia';
import type { App } from './server';

declare module '@svadmin/core' {
  interface ResourceTypeMap extends InferResourceMap<App> {}
}
```

无需手动类型注册 — 类型直接从服务端路由推导。

## 最佳实践

1. **将注册放在 `.d.ts` 文件中** — 例如项目根目录的 `resource-types.d.ts`
2. **扩展而非替换** — 始终使用 `interface ResourceTypeMap { ... }`，不要用 `type ResourceTypeMap =`
3. **每个项目一个注册** — 所有资源放在同一个 `declare module` 块中
4. **在自定义 Hook 和组件中使用 `InferData`**：

```typescript
function usePostList() {
  return useList<InferData<'posts'>>({ resource: 'posts' });
}
```
