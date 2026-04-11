import fs from 'fs';

// 1. table-hooks
{
  let file = 'packages/core/src/table-hooks.svelte.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /const idx = merged\.findIndex\(f => f\.field === nf\.field && f\.operator === nf\.operator\);/g,
    `if (!('field' in nf)) { merged.push(nf); continue; }\n        const idx = merged.findIndex(f => 'field' in f && f.field === nf.field && f.operator === nf.operator);`
  );
  fs.writeFileSync(file, content);
}

// 2. table-state
{
  let file = 'packages/core/src/table-state.svelte.ts';
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
      /const idx = merged\.findIndex\(f => f\.field === nf\.field && f\.operator === nf\.operator\);/g,
      `if (!('field' in nf)) { merged.push(nf); continue; }\n          const idx = merged.findIndex(f => 'field' in f && f.field === nf.field && f.operator === nf.operator);`
    );
    fs.writeFileSync(file, content);
  }
}

// 3. elysia data-provider
{
  let file = 'packages/elysia/src/data-provider.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /filters\.forEach\(\(f\) => \{/g,
    `filters.forEach((f) => {\n          if (!('field' in f)) return;`
  );
  fs.writeFileSync(file, content);
}

// 4. pocketbase data-provider
{
  let file = 'packages/pocketbase/src/data-provider.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /return buildFilterString\(filters \|\| \[\]\);/g,
    `return buildFilterString((filters || []).filter((f): f is import('@svadmin/core').FieldFilter => 'field' in f));`
  );
  fs.writeFileSync(file, content);
}

