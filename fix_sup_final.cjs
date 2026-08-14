const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseDiagnosticModal.tsx', 'utf8');

// Find the line that has filterFiles
// and replace the content inside it.
code = code.replace(/f\.\(name \|\| ''\)/g, "(f?.name || '')");

// Wait, the previous replace was: code.replace(/f\.\(name || ''\)/g, "(f?.name || '')");
// Let me just regex replace all `f.(name || '')` literally.
// In JS string literal, `f.\(name \|\| ''\)` matches `f.(name || '')`.
code = code.replace(/f\.\(name \|\| ''\)/g, "(f?.name || '')");

fs.writeFileSync('src/components/SupabaseDiagnosticModal.tsx', code);
