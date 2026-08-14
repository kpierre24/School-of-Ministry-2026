const fs = require('fs');
let code = fs.readFileSync('src/components/AdminAuditAndBackupModal.tsx', 'utf8');

code = code.split("c.user(name || '').toLowerCase()").join("(c?.username || '').toLowerCase()");

fs.writeFileSync('src/components/AdminAuditAndBackupModal.tsx', code);
