const fs = require('fs');
const path = require('path');
const componentsDir = 'src/components';
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
for (const file of files) {
  const filePath = path.join(componentsDir, file);
  let code = fs.readFileSync(filePath, 'utf8');
  // Match `obj.(prop || '')` -> `(obj?.prop || '')`
  code = code.replace(/([a-zA-Z0-9_]+)\.\(([a-zA-Z0-9_]+) \|\| ''\)/g, "($1?.$2 || '')");
  fs.writeFileSync(filePath, code);
}
