---
title: CRUD 页面
description: 列表、创建、编辑、详情页面的预构建包装器
---

CRUD 页面包装器组合了 PageHeader、面包屑、AutoTable/AutoForm 和操作按钮，实现零样板代码的管理页面。

## ListPage

```svelte
<script>
  import { ListPage } from '@svadmin/ui';
</script>

<ListPage resourceName="posts" />
```

包含：PageHeader + 面包屑 + AutoTable + 创建按钮。

### 属性

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `resourceName` | `string` | 必填 |
| `title` | `string?` | 资源标签 |
| `canCreate` | `boolean?` | 来自资源定义 |
| `headerActions` | `Snippet?` | 额外按钮 |

## CreatePage

```svelte
<CreatePage resourceName="posts" />
```

包含：PageHeader + 面包屑 + AutoForm（创建模式） + 返回按钮。

## EditPage

```svelte
<EditPage resourceName="posts" id={42} />
```

包含：PageHeader + 面包屑 + AutoForm（编辑模式） + 返回按钮 + 删除按钮。

### 属性

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `resourceName` | `string` | 必填 |
| `id` | `string \| number` | 必填 |
| `canDelete` | `boolean?` | 来自资源定义 |

## ShowPage

```svelte
<ShowPage resourceName="posts" id={42} />
```

带格式化字段、编辑按钮和返回导航的详情视图。

## 面包屑

根据当前路由和资源定义自动生成：

```
首页 / 文章 / 编辑 #42
```

支持：列表、创建、编辑和详情路由。
