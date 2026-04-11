import fs from 'fs';
let file = 'packages/ui/src/components/AutoTable.svelte';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /await Promise\.allSettled\(ids\.map\(id => deleteMutation\.mutateAsync\(\{ id, resource: resourceName \}\)\)\);/g,
  `const results = await Promise.allSettled(ids.map(id => deleteMutation.mutateAsync({ id, resource: resourceName })));\n      const failed = results.filter(r => r.status === 'rejected');\n      if (failed.length > 0) {\n        console.error('Batch delete partial failure', failed);\n        // Rely on individual mutation error toasts, or show a summary\n      }`
);

content = content.replace(
  /<option value="">全部<\/option>/g,
  `<option value="">{t('common.all') ?? '全部'}</option>`
);

fs.writeFileSync(file, content);
