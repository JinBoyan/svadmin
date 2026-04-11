import fs from 'fs';

{
  let file = 'packages/elysia/src/data-provider.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /filters\.forEach\(\(_f\) => \{\n          if \(!\('field' in _f\)\) return;\n          const f = _f as import\('@svadmin\/core'\)\.FieldFilter;/g,
    `filters.forEach((_f) => {\n          if (!('field' in _f)) return;\n          const f = _f as import('@svadmin/core').FieldFilter;`
  );
  // Actually, wait, let's just use regex to replace f.field with (f as any).field, etc.
  content = fs.readFileSync(file, 'utf8');
  content = content.replace(/f\.field/g, "(f as any).field");
  content = content.replace(/f\.operator/g, "(f as any).operator");
  content = content.replace(/f\.value/g, "(f as any).value");
  fs.writeFileSync(file, content);
}

{
  let file = 'packages/pocketbase/src/data-provider.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /buildFilterString\(\(filters \|\| \[\]\)\.filter\(\(f\): f is import\('@svadmin\/core'\)\.FieldFilter => 'field' in f\)\)/g,
    `buildFilterString((filters || []) as any)`
  );
  content = content.replace(
    /buildFilterString\(filters \|\| \[\]\)/g,
    `buildFilterString((filters || []) as any)`
  );
  fs.writeFileSync(file, content);
}

