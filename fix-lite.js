const fs = require('fs');

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = require('path').join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walkSync(p, callback);
    } else if (p.endsWith('.svelte') || p.endsWith('.ts')) {
      callback(p);
    }
  }
}

walkSync('./packages/lite/src', (p) => {
  let cnt = fs.readFileSync(p, 'utf8');
  let original = cnt;
  
  cnt = cnt.replace(/`([^`\n]+)`/g, (match) => {
    // Only target known variables to be extra safe
    return match.replace(/(?<!\$)\{(basePath|resource|resource\.name|res\.name|id|idStr|recordItemId|page|String\(value\)|value)\}/g, '${$1}');
  });

  if (cnt !== original) {
    fs.writeFileSync(p, cnt);
    console.log('Fixed', p);
  }
});
