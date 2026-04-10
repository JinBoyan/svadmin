const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.svelte')) results.push(file);
    }
  });
  return results;
}

const files = walk('packages/lite/src/components');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('const hasError = error.length > 0;')) {
    content = content.replace(/const hasError = error\.length > 0;/g, 'let hasError = $derived(error.length > 0);');
    changed = true;
  }
  if (content.includes('const hasError = !!error;')) {
    content = content.replace(/const hasError = !!error;/g, 'let hasError = $derived(!!error);');
    changed = true;
  }
  if (content.match(/const pk =\s*resource\.primaryKey\s*\?\?\s*'id';/)) {
    content = content.replace(/const pk =\s*resource\.primaryKey\s*\?\?\s*'id';/g, "let pk = $derived(resource.primaryKey ?? 'id');");
    changed = true;
  }
  if (content.includes('const id = record[pk];')) {
    content = content.replace(/const id = record\[pk\];/g, 'let id = $derived(record[pk]);');
    changed = true;
  }
  if (content.includes('const idStr = String(record[pk]);')) {
    content = content.replace(/const idStr = String\(record\[pk\]\);/g, 'let idStr = $derived(String(record[pk]));');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Fixed reactivity in ${file}`);
  }
}
