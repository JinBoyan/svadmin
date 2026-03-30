---
title: 配置参考
description: svadmin 完整配置参考
---

## AdminApp 属性

| 属性 | 类型 | 必填 | 默认值 |
|------|------|------|--------|
| `dataProvider` | `DataProvider \| Record<string, DataProvider>` | ✅ | — |
| `authProvider` | `AuthProvider` | — | — |
| `resources` | `ResourceDefinition[]` | ✅ | — |
| `routerProvider` | `RouterProvider` | — | Hash 路由 |
| `title` | `string` | — | `'Admin'` |
| `colorTheme` | `ColorTheme` | — | `'blue'` |

## 资源定义

```typescript
interface ResourceDefinition {
  name: string;               // URL 段（例如 'posts'）
  label: string;              // 显示名称（例如 '博客文章'）
  icon?: string;              // 侧边栏图标
  primaryKey?: string;        // 默认：'id'
  fields: FieldDefinition[];
  defaultSort?: Sort;
  pageSize?: number;          // 默认：10
  canCreate?: boolean;        // 默认：true
  canEdit?: boolean;
  canDelete?: boolean;
  canShow?: boolean;
  meta?: Record<string, unknown> & {
    dataProviderName?: string;  // 用于多 Provider 场景
  };
}
```

## 字段定义

```typescript
interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect'
    | 'tags' | 'textarea' | 'richtext' | 'image' | 'images' | 'json'
    | 'relation' | 'color' | 'url' | 'email' | 'phone';
  required?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  width?: string;
  showInList?: boolean;
  showInForm?: boolean;
  showInCreate?: boolean;
  showInEdit?: boolean;
  showInShow?: boolean;
  options?: { label: string; value: string | number }[];
  defaultValue?: unknown;
  resource?: string;       // 关联资源（关系字段）
  optionLabel?: string;
  optionValue?: string;
  validate?: (value: unknown) => string | null;
}
```

## 配色主题

可用主题：`blue`、`green`、`purple`、`orange`、`rose`、`teal`、`slate`

```typescript
<AdminApp colorTheme="purple" ... />
```

## 国际化 (I18n)

`@svadmin/core` 原生集成了基于 Svelte 5 Runes `$derived` 驱动的轻量级多语言系统 `useTranslation`。获取返回的 `t` 和属性后天然具备 Svelte 的响应式能力：

```svelte
<script>
  import { useTranslation, addTranslations } from '@svadmin/core';

  const { t, locale, setLocale, getAvailableLocales } = useTranslation();

  addTranslations('ja-JP', { 'common.test': 'テスト' });
</script>

<h1>{t('common.save')}</h1>
<p>当前语言: {locale}</p>
<button onclick={() => setLocale('ja-JP')}>切到日语</button>
```
