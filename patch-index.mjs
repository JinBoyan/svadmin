import fs from 'fs';

let content = fs.readFileSync('packages/core/src/index.ts', 'utf8');

content = content.replace(
  "export { HttpError } from './types';",
  "export { HttpError, UndoError } from './types';"
);

content = content.replace(
  "ValidationErrors, CrudOperator, LogicalFilter,",
  "ValidationErrors, CrudOperator, LogicalFilter, FieldFilter,"
);

// We need UseInfiniteListOptions, UseSelectOptions
content = content.replace(
  "export type { TableStateOptions } from './table-state.svelte';",
  "export type { TableStateOptions } from './table-state.svelte';\nexport type { UseInfiniteListOptions } from './query-hooks.svelte';\nexport type { UseSelectOptions } from './query-hooks.svelte';\nexport type { UseFormReturn } from './form-hooks.svelte';"
);

// Also useList return types
content = content.replace(
  "export { TableState } from './table-state.svelte';",
  "export { TableState } from './table-state.svelte';\nexport type { UseListReturnType } from './query-hooks.svelte';\nexport type { UseOneReturnType } from './query-hooks.svelte';"
);

fs.writeFileSync('packages/core/src/index.ts', content);

