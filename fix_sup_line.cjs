const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseDiagnosticModal.tsx', 'utf8');

code = code.replace("return files.filter(f => || '').toLowerCase().includes(searchTerm.toLowerCase()));", "return files.filter(f => (f?.name || '').toLowerCase().includes(searchTerm.toLowerCase()));");
// Let me also just do a general regex in case it is slightly different
code = code.replace(/return files\.filter\(f => .*?\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\)\);/, "return files.filter(f => (f?.name || '').toLowerCase().includes(searchTerm.toLowerCase()));");

fs.writeFileSync('src/components/SupabaseDiagnosticModal.tsx', code);
