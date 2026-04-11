import fs from 'fs';

// 1. notification.svelte.ts
let notiContent = fs.readFileSync('packages/core/src/notification.svelte.ts', 'utf8');
notiContent = notiContent.replace(
  "let notificationProvider: NotificationProvider | null = null;",
  "let notificationProvider = $state<NotificationProvider | null>(null);"
);
notiContent = notiContent.replace(
  "case 'success': toast.success(message); break;",
  "case 'success': toast.success(message, undefined, { key: params.key }); break;"
);
notiContent = notiContent.replace(
  "case 'error': toast.error(message); break;",
  "case 'error': toast.error(message, undefined, { key: params.key }); break;"
);
notiContent = notiContent.replace(
  "case 'warning': toast.warning(message); break;",
  "case 'warning': toast.warning(message, undefined, { key: params.key }); break;"
);
notiContent = notiContent.replace(
  "case 'info': toast.info(message); break;",
  "case 'info': toast.info(message, undefined, { key: params.key }); break;"
);
fs.writeFileSync('packages/core/src/notification.svelte.ts', notiContent);

// 2. toast.svelte.ts
let toastContent = fs.readFileSync('packages/core/src/toast.svelte.ts', 'utf8');
// add key to ToastItem
toastContent = toastContent.replace(
  "export interface ToastItem {\n  id: number;",
  "export interface ToastItem {\n  id: number;\n  key?: string;"
);
toastContent = toastContent.replace(
  "options?: { onUndo?: () => void, onTimeout?: () => void }",
  "options?: { key?: string, onUndo?: () => void, onTimeout?: () => void }"
);
toastContent = toastContent.replace(
  "if (type !== 'undoable') {\n    queue.push({ id: nextId++, type, message, duration });\n    return;\n  }",
  `if (options?.key) {\n    if (queue.some(q => q.key === options.key) || toasts.some(t => t.key === options.key)) return;\n  }\n  if (type !== 'undoable') {\n    queue.push({ id: nextId++, type, message, duration, key: options?.key });\n    return;\n  }`
);
// convenience methods
toastContent = toastContent.replace(
  "success: (msg: string, duration?: number) => addToast('success', msg, duration),",
  "success: (msg: string, duration?: number, opts?: { key?: string }) => addToast('success', msg, duration, opts),"
);
toastContent = toastContent.replace(
  "error: (msg: string, duration?: number) => addToast('error', msg, duration ?? 5000),",
  "error: (msg: string, duration?: number, opts?: { key?: string }) => addToast('error', msg, duration ?? 5000, opts),"
);
toastContent = toastContent.replace(
  "info: (msg: string, duration?: number) => addToast('info', msg, duration),",
  "info: (msg: string, duration?: number, opts?: { key?: string }) => addToast('info', msg, duration, opts),"
);
toastContent = toastContent.replace(
  "warning: (msg: string, duration?: number) => addToast('warning', msg, duration ?? 4000),",
  "warning: (msg: string, duration?: number, opts?: { key?: string }) => addToast('warning', msg, duration ?? 4000, opts),"
);
fs.writeFileSync('packages/core/src/toast.svelte.ts', toastContent);

