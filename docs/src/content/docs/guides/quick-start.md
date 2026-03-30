---
title: Quick Start
description: Get up and running with svadmin in 5 minutes
---

## Create a new project

```bash
bunx @svadmin/create my-admin
cd my-admin
bun install
bun run dev
```

The CLI will ask for your auth preference and set up a complete admin panel.

## Manual Setup

### 1. Install dependencies

```bash
bun add @svadmin/core @svadmin/ui @svadmin/simple-rest @tanstack/svelte-query
```

### 2. Define resources

```typescript
import type { ResourceDefinition } from '@svadmin/core';

export const resources: ResourceDefinition[] = [
  {
    name: 'posts',
    label: 'Posts',
    fields: [
      { key: 'id', label: 'ID', type: 'number', showInForm: false },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'body', label: 'Content', type: 'textarea' },
      { key: 'userId', label: 'Author', type: 'number' },
    ],
  },
];
```

### 3. Create AdminApp

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
  <AdminApp {dataProvider} {resources} title="My Admin" />
</QueryClientProvider>
```

### 4. Run

```bash
bun run dev
```

Visit `http://localhost:5173` — your admin panel is ready!

## Optional: Rich Text Editor

To keep the core lightweight, the rich text editor is an optional plugin. If your resources use `type: 'richtext'`, you must explicitly register the editor:

```bash
bun add @svadmin/editor
```

```svelte
// In your App.svelte or +layout.svelte
import { setRichTextEditor } from '@svadmin/ui';
import { Editor } from '@svadmin/editor';

setRichTextEditor(Editor);
```

## Optional: SvelteKit Unsaved Changes

To prevent users from navigating away and losing data using the SvelteKit router, register the `beforeNavigate` lifecycle during app initialization:

```svelte
// In your root +layout.svelte
import { beforeNavigate } from '$app/navigation';
import { initUnsavedChangesNotifier } from '@svadmin/core';

initUnsavedChangesNotifier({ beforeNavigate });
```

## With Authentication

Add an `AuthProvider` to enable login/logout:

```svelte
<AdminApp
  {dataProvider}
  {authProvider}
  {resources}
  title="My Admin"
/>
```

See the [Auth Provider](/providers/auth) guide for details.
