import fs from 'fs';
let file = 'packages/core/src/query-hooks.svelte.ts';
let content = fs.readFileSync(file, 'utf8');

// replace extendQuery definition
content = content.replace(
  /function extendQuery<Q extends object, E extends Record<string, unknown>>\(\n  query: Q,\n  extensions: \(\) => E,\n\): Q & E \{\n  return new Proxy\(query, \{\n    get\(target, prop\) \{\n      if \(typeof prop === 'string'\) \{\n        const ext = extensions\(\);\n        if \(prop in ext\) return ext\[prop as keyof E\];\n      \}\n      return target\[prop as keyof Q\];\n    \},\n    has\(target, prop\) \{\n      if \(typeof prop === 'string' && prop in extensions\(\)\) return true;\n      return prop in target;\n    \},\n  \}\) as Q & E;\n\}/g,
  `function extendQuery<Q extends object, E extends Record<string, unknown>>(
  query: Q,
  extensions: E,
): Q & E {
  return new Proxy(query, {
    get(target, prop) {
      if (typeof prop === 'string' && prop in extensions) {
        return extensions[prop as keyof E];
      }
      return Reflect.get(target, prop);
    },
    has(target, prop) {
      if (typeof prop === 'string' && prop in extensions) return true;
      return Reflect.has(target, prop);
    },
  }) as Q & E;
}`
);

// replace usages
content = content.replace(/extendQuery\(query, \(\) => \(\{ overtime \}\)\)/g, 'extendQuery(query, { overtime })');
content = content.replace(/extendQuery\(result, \(\) => \(\{ showId, setShowId \}\)\)/g, 'extendQuery(result, { get showId() { return showId; }, setShowId })');

fs.writeFileSync(file, content);

