const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/sub\.\(studentName \|\| ''\)/g, "(sub?.studentName || '')");
code = code.replace(/st\.\(name \|\| ''\)/g, "(st?.name || '')");
code = code.replace(/s\.\(studentName \|\| ''\)/g, "(s?.studentName || '')");
code = code.replace(/d\.\(name \|\| ''\)/g, "(d?.name || '')");
code = code.replace(/r\.\(studentName \|\| ''\)/g, "(r?.studentName || '')");
code = code.replace(/r\.\(name \|\| ''\)/g, "(r?.name || '')");
code = code.replace(/c\.\(name \|\| ''\)/g, "(c?.name || '')");

fs.writeFileSync('src/App.tsx', code);
