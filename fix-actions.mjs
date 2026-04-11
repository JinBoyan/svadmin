import fs from 'fs';
const files = [
  'packages/lite/src/components/pages/LiteCreatePage.svelte',
  'packages/lite/src/components/pages/LiteEditPage.svelte',
  'packages/lite/src/components/buttons/LiteDeleteButton.svelte'
];
for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\?\/\$\{resource\.name\}_create/g, '?/create');
  c = c.replace(/\?\/\$\{resource\.name\}_update/g, '?/update');
  c = c.replace(/\?\/\$\{resource\}_delete/g, '?/delete');
  c = c.replace(/\?\/\$resource_delete/g, '?/delete'); // just in case
  fs.writeFileSync(f, c);
}
