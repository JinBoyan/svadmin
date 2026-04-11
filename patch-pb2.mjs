import fs from 'fs';
let file = 'packages/pocketbase/src/data-provider.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /filter: buildFilter\(params\.filters\),/g,
  `filter: buildFilter((params.filters || []).filter((f) => 'field' in f) as any),`
);
fs.writeFileSync(file, content);
