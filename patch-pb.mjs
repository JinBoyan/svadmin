import fs from 'fs';
let file = 'packages/pocketbase/src/data-provider.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /buildFilterString\(\(filters \|\| \[\]\) as any\)/g,
  `buildFilterString((filters || []) as any)`
);
fs.writeFileSync(file, content);
