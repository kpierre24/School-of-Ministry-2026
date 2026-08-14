const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseDiagnosticModal.tsx', 'utf8');

// Replace all occurrences of `f.(name || '')` with `(f.name || '')`
// We do not need regex, we can just split and join.
code = code.split("f.(name || '')").join("(f?.name || '')");

fs.writeFileSync('src/components/SupabaseDiagnosticModal.tsx', code);
