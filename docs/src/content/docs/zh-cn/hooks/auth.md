---
title: 认证 Hook
description: 响应式认证 Hook
---

所有认证 Hook 使用 TanStack Query 变更/查询实现自动加载状态和错误处理。

## Hook 参考

### `useLogin()`

```typescript
const { mutate, isPending } = useLogin();
mutate({ email: 'admin@example.com', password: 'secret' });
```

### `useLogout()`

```typescript
const { mutate } = useLogout();
mutate(); // 重定向到 /login
```

### `useGetIdentity()`

```typescript
const query = useGetIdentity();
// query.data → { id: '1', name: '管理员', avatar: '...' } | null
```

### `useIsAuthenticated()`

```typescript
const { isAuthenticated, isLoading } = useIsAuthenticated();
```

### `usePermissions<T>()`

```typescript
const { data } = usePermissions<string[]>();
// data → ['admin', 'editor']
```

### `useOnError()`

```typescript
const { mutate } = useOnError();
mutate(error); // 调用 authProvider.onError → 可能登出或重定向
```

### `useRegister()`、`useForgotPassword()`、`useUpdatePassword()`

与 `useLogin()` 相同的变更模式。
