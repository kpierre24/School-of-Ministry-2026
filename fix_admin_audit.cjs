const fs = require('fs');
let code = fs.readFileSync('src/components/AdminAuditAndBackupModal.tsx', 'utf8');

code = code.replace(/c\.user\(name \|\| ''\)\.toLowerCase\(\)/g, "(c.username || '').toLowerCase()");

fs.writeFileSync('src/components/AdminAuditAndBackupModal.tsx', code);
