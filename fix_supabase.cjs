const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseDiagnosticModal.tsx', 'utf8');
code = code.replace(/f\.\(name || ''\)/g, "(f?.name || '')");
fs.writeFileSync('src/components/SupabaseDiagnosticModal.tsx', code);
