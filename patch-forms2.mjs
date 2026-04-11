import fs from 'fs';
let file = 'packages/core/src/form-hooks.svelte.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /queryKey: \[resource, 'one', safeId\]/g,
  `queryKey: [resource, 'one', safeId!]`
);
fs.writeFileSync(file, content);
