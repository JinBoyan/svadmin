---
title: 快速开始
description: 5 分钟上手 svadmin
---

## 创建新项目

```bash
bunx @svadmin/create my-admin
cd my-admin
bun install
bun run dev
```

CLI 会询问你的认证偏好，并搭建一个完整的管理后台。

## 手动搭建

### 1. 安装依赖

```bash
bun add @svadmin/core @svadmin/ui @svadmin/simple-rest @tanstack/svelte-query
```

### 2. 定义资源

```typescript
import type { ResourceDefinition } from '@svadmin/core';

export const resources: ResourceDefinition[] = [
  {
    name: 'posts',
    label: '文章',
    fields: [
      { key: 'id', label: 'ID', type: 'number', showInForm: false },
      { key: 'title', label: '标题', type: 'text', required: true },
      { key: 'body', label: '内容', type: 'textarea' },
      { key: 'userId', label: '作者', type: 'number' },
    ],
  },
];
```

### 3. 创建 AdminApp

```svelte
<script lang="ts">
  import { AdminApp } from '@svadmin/ui';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { createSimpleRestProvider } from '@svadmin/simple-rest';
  import { resources } from './resources';

  const queryClient = new QueryClient();
  const dataProvider = createSimpleRestProvider('https://jsonplaceholder.typicode.com');
</script>

<QueryClientProvider client={queryClient}>
  <AdminApp {dataProvider} {resources} title="我的后台" />
</QueryClientProvider>
```

### 4. 运行

```bash
bun run dev
```

访问 `http://localhost:5173` — 你的管理后台已就绪！

## 可选：富文本编辑器

为了保持核心包的轻量，富文本编辑器是一个可选插件。如果你的资源中包含 `type: 'richtext'` 的字段，你需要显式全局注册编辑器：

```bash
bun add @svadmin/editor
```

```svelte
// 在您的 App.svelte 或 +layout.svelte 中：
import { setRichTextEditor } from '@svadmin/ui';
import { Editor } from '@svadmin/editor';

setRichTextEditor(Editor);
```

## 可选：SvelteKit 未保存拦截

如果你在 SvelteKit 项目中使用，为了防止用户在表单未保存时切换页面导致数据丢失，你需要注入路由拦截器：

```svelte
// 在根 +layout.svelte 中
import { beforeNavigate } from '$app/navigation';
import { initUnsavedChangesNotifier } from '@svadmin/core';

initUnsavedChangesNotifier({ beforeNavigate });
```

## 使用认证

添加 `AuthProvider` 启用登录/登出：

```svelte
<AdminApp
  {dataProvider}
  {authProvider}
  {resources}
  title="我的后台"
/>
```

详见 [认证 Provider](/zh-cn/providers/auth) 指南。
