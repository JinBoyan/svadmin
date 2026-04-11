import fs from 'fs';

// 1. form-hooks
{
  let file = 'packages/core/src/form-hooks.svelte.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /autoSaveTimer = setTimeout\(async \(\) => \{/g,
    `const safeId = currentId;\n    autoSaveTimer = setTimeout(async () => {`
  );
  content = content.replace(
    /await provider\.update<TData, TVariables>\(\{ resource, id: currentId, variables: finalValues, meta: mutationMeta \}\);/g,
    `await provider.update<TData, TVariables>({ resource, id: safeId as string | number, variables: finalValues, meta: mutationMeta });`
  );
  content = content.replace(
    /else if \(scope === 'detail' && currentId\) queryClient\.invalidateQueries\(\{ queryKey: \[resource, 'one', currentId\] \}\);/g,
    `else if (scope === 'detail' && safeId != null) queryClient.invalidateQueries({ queryKey: [resource, 'one', safeId] });`
  );
  fs.writeFileSync(file, content);
}

// 2. elysia data-provider
{
  let file = 'packages/elysia/src/data-provider.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /filters\.forEach\(\(f\) => \{\n          if \(!\('field' in f\)\) return;/g,
    `filters.forEach((_f) => {\n          if (!('field' in _f)) return;\n          const f = _f as import('@svadmin/core').FieldFilter;`
  );
  fs.writeFileSync(file, content);
}

// 3. pocketbase data-provider
{
  let file = 'packages/pocketbase/src/data-provider.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /export function buildFilterString\(filters: Filter\[\]\): string \{/g,
    `export function buildFilterString(filters: import('@svadmin/core').FieldFilter[]): string {`
  );
  fs.writeFileSync(file, content);
}

