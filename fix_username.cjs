const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/c\.user\(name \|\| ''\)\.toLowerCase\(\)/g, "(c.username || '').toLowerCase()");
code = code.replace(/user\(name \|\| ''\)\.toLowerCase\(\)/g, "(username || '').toLowerCase()");

fs.writeFileSync('src/App.tsx', code);
