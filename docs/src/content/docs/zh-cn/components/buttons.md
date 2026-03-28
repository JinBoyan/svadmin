---
title: CRUD 按钮
description: 10 个预构建的管理操作按钮
---

svadmin 包含 10 个与数据 Hook 和路由集成的操作按钮。

## 可用按钮

| 按钮 | 说明 | 关键操作 |
|------|------|----------|
| `CreateButton` | 导航到创建表单 | `navigate('/{resource}/create')` |
| `EditButton` | 导航到编辑表单 | `navigate('/{resource}/edit/{id}')` |
| `DeleteButton` | 带确认的删除 | `useDelete().mutate()` |
| `ShowButton` | 导航到详情页 | `navigate('/{resource}/show/{id}')` |
| `ListButton` | 导航到列表 | `navigate('/{resource}')` |
| `RefreshButton` | 刷新查询 | `queryClient.invalidateQueries()` |
| `ExportButton` | 导出 CSV 数据 | `useExport()` |
| `ImportButton` | 从 CSV 导入 | `useImport()` |
| `SaveButton` | 提交表单 | 触发 `submit()` |
| `CloneButton` | 克隆现有记录 | `navigate('/{resource}/create?clone={id}')` |

## 用法

```svelte
<script>
  import { EditButton, DeleteButton } from '@svadmin/ui';
</script>

<EditButton resource="posts" id={record.id} />
<DeleteButton resource="posts" id={record.id} onSuccess={() => refetch()} />
```
