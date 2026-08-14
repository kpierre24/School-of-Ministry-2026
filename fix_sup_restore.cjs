const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseDiagnosticModal.tsx', 'utf8');

code = code.split("(f?.name || '')").join("");

fs.writeFileSync('src/components/SupabaseDiagnosticModal.tsx', code);
