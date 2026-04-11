import fs from 'fs';
let file = 'packages/core/src/index.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "export type { UseInfiniteListOptions } from './query-hooks.svelte';\nexport type { UseSelectOptions } from './query-hooks.svelte';",
  "export type { UseInfiniteListOptions } from './hooks.svelte';\nexport type { UseSelectOptions } from './hooks.svelte';"
);
fs.writeFileSync(file, content);

let file2 = 'packages/core/src/form-hooks.svelte.ts';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(
  "export interface UseFormReturn",
  "export interface UseFormReturn"
); // wait, where is UseFormReturn?

if (content2.includes("export interface UseFormReturn")) {
  content2 = content2.replace(
    "isTainted: () => boolean;",
    "isTainted: () => boolean;\n  untaint: () => void;"
  );
  content2 = content2.replace(
    "isTainted: () => Object.keys(tainted).length > 0,",
    "isTainted: () => Object.keys(tainted).length > 0,\n    untaint: () => { tainted = {}; },"
  );
  fs.writeFileSync(file2, content2);
}
