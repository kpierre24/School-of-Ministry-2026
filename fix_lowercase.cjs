const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Generic replacements for some common patterns
code = code.replace(/studentName\.toLowerCase\(\)/g, "(studentName || '').toLowerCase()");
code = code.replace(/student\.name\.toLowerCase\(\)/g, "(student?.name || '').toLowerCase()");
code = code.replace(/s\.name\.toLowerCase\(\)/g, "(s?.name || '').toLowerCase()");
code = code.replace(/name\.toLowerCase\(\)/g, "(name || '').toLowerCase()");
code = code.replace(/st\.name\.toLowerCase\(\)/g, "(st?.name || '').toLowerCase()");
code = code.replace(/rawName\.toLowerCase\(\)/g, "(rawName || '').toLowerCase()");
code = code.replace(/canonicalName\.toLowerCase\(\)/g, "(canonicalName || '').toLowerCase()");
code = code.replace(/sheetTitle\.toLowerCase\(\)/g, "(sheetTitle || '').toLowerCase()");
code = code.replace(/trimmedDate\.toLowerCase\(\)/g, "(trimmedDate || '').toLowerCase()");
code = code.replace(/sub\.studentName\.toLowerCase\(\)/g, "(sub?.studentName || '').toLowerCase()");
code = code.replace(/r\.name\.toLowerCase\(\)/g, "(r?.name || '').toLowerCase()");
code = code.replace(/r\.studentName\.toLowerCase\(\)/g, "(r?.studentName || '').toLowerCase()");
code = code.replace(/targetKey\.toLowerCase\(\)/g, "(targetKey || '').toLowerCase()");
code = code.replace(/searchQuery\.toLowerCase\(\)/g, "(searchQuery || '').toLowerCase()");
code = code.replace(/d\.id\.toLowerCase\(\)/g, "(d?.id || '').toLowerCase()");
code = code.replace(/d\.name\.toLowerCase\(\)/g, "(d?.name || '').toLowerCase()");

// For cases like (r.studentName || r.name).toLowerCase()
code = code.replace(/\(r\.studentName \|\| r\.name\)\.toLowerCase\(\)/g, "(r?.studentName || r?.name || '').toLowerCase()");
code = code.replace(/mappedCanonical\.toLowerCase\(\)/g, "(mappedCanonical || '').toLowerCase()");
code = code.replace(/rawLower = (.*?)\.toLowerCase\(\)/g, "rawLower = ($1 || '').toLowerCase()");

// We can also just globally replace things like `n => n.toLowerCase()`
code = code.replace(/n => n\.toLowerCase\(\)/g, "n => (n || '').toLowerCase()");

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
