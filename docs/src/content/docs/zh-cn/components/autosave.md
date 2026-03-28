---
title: 自动保存
description: 带防抖的表单自动保存
---

`useForm` 支持编辑表单的自动保存，可配置防抖延迟。

## 设置

```typescript
const form = useForm({
  resource: 'posts',
  action: 'edit',
  id: 42,
  autoSave: {
    enabled: true,
    debounce: 1000,  // 毫秒（默认：1000）
    onFinish: (values) => {
      // 可选：保存前转换数据
      return { ...values, updatedAt: new Date().toISOString() };
    },
  },
});
```

## 触发自动保存

表单值变化时调用 `triggerAutoSave`：

```svelte
<input
  value={title}
  oninput={(e) => {
    form.setFieldValue('title', e.target.value);
    form.triggerAutoSave();
  }}
/>
```

## 状态指示器

```svelte
{#if form.autoSave.status === 'saving'}
  <span>保存中...</span>
{:else if form.autoSave.status === 'saved'}
  <span>✓ 已保存</span>
{:else if form.autoSave.status === 'error'}
  <span>保存失败</span>
{/if}
```

## 注意事项

- 自动保存仅在**编辑**模式下生效（创建模式跳过）
- 变更会**防抖** — 快速编辑不会触发多次保存
- 状态在 2 秒后重置为 `idle`
