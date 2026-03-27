# AdminApp

> One-stop admin entry component / 一站式管理后台入口组件

## Import

```typescript
import { AdminApp } from '@svadmin/ui';
```

## Usage / 用法

```svelte
<script lang="ts">
  import { AdminApp } from '@svadmin/ui';
  import { createSimpleRestDataProvider } from '@svadmin/simple-rest';
  import { resources } from './resources';

  const dataProvider = createSimpleRestDataProvider({
    apiUrl: 'https://jsonplaceholder.typicode.com',
  });
</script>

<AdminApp {dataProvider} {resources} title="My Admin" defaultTheme="system" />
```

### With Auth / 带认证

```svelte
<AdminApp
  {dataProvider}
  authProvider={myAuthProvider}
  {resources}
  title="Secure Admin"
>
  {#snippet loginPage()}<MyLogin />{/snippet}
  {#snippet dashboard()}<MyDashboard />{/snippet}
</AdminApp>
```

## Props

| Prop | Type | Required | Default | Description / 描述 |
|------|------|----------|---------|-------------------|
| `dataProvider` | `DataProvider` | ✅ | — | Data source adapter / 数据源适配器 |
| `authProvider` | `AuthProvider` | — | — | Auth adapter / 认证适配器 |
| `routerProvider` | `RouterProvider` | — | hash | Custom router / 自定义路由提供者 |
| `resources` | `ResourceDefinition[]` | ✅ | — | Resource definitions / 资源定义 |
| `title` | `string` | — | `'Admin'` | App title (shown in sidebar) / 应用标题 |
| `defaultTheme` | `'light' \| 'dark' \| 'system'` | — | `'system'` | Initial theme / 初始主题 |
| `locale` | `string` | — | auto-detect | Override locale / 覆盖语言 |
| `dashboard` | `Snippet` | — | — | Custom dashboard page / 自定义仪表盘 |
| `loginPage` | `Snippet` | — | — | Custom login page / 自定义登录页 |
| `components` | `Partial<ComponentRegistry>` | — | — | Override default components (DI) / 覆盖默认组件 |

## Component Injection / 组件注入

Override any built-in component via the `components` prop (Svelte Context-based DI):

通过 `components` prop 覆盖任意内置组件（基于 Svelte Context 的依赖注入）：

```svelte
<script lang="ts">
  import { AdminApp } from '@svadmin/ui';
  import MyCustomLayout from './components/MyLayout.svelte';
  import MyCustomHeader from './components/MyHeader.svelte';
</script>

<AdminApp
  {dataProvider}
  {resources}
  components={{ Layout: MyCustomLayout, Header: MyCustomHeader }}
/>
```

Available slots: `Layout`, `Sidebar`, `Header`, `LoginPage`, `AutoTable`, `AutoForm`, `ShowPage`, `Button`, `Input`, `Badge`, `Skeleton`.

可覆盖的组件插槽：`Layout`、`Sidebar`、`Header`、`LoginPage`、`AutoTable`、`AutoForm`、`ShowPage`、`Button`、`Input`、`Badge`、`Skeleton`。

Use `create-svadmin eject` to extract component source for customization. See [@svadmin/create README](../packages/create-svadmin/README.md).

使用 `create-svadmin eject` 提取组件源码进行深度定制。

## Built-in Routing / 内置路由

AdminApp uses hash-based routing:

| Route | Page |
|-------|------|
| `#/` | Dashboard |
| `#/login` | Login |
| `#/:resource` | AutoTable (list) |
| `#/:resource/create` | AutoForm (create) |
| `#/:resource/edit/:id` | AutoForm (edit) |
| `#/:resource/show/:id` | ShowPage (detail) |
