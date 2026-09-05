const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (f === 'node_modules' || f === 'dist') return;
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replacements = [
  { search: /\brounded-2xl\b/g, replace: 'rounded-xl' },
  { search: /\brounded-3xl\b/g, replace: 'rounded-xl' },
  { search: /\bactive:scale-95\b/g, replace: 'active:opacity-80' },
  { search: /\bhover:scale-105\b/g, replace: 'hover:bg-slate-100 dark:hover:bg-slate-700' },
  { search: /bg-gradient-to-br from-\[\#023264\] to-\[\#025798\]/g, replace: 'bg-[#023264]' },
  { search: /bg-gradient-to-r from-indigo-500 to-indigo-600/g, replace: 'bg-indigo-600' },
  { search: /bg-gradient-to-r from-\[\#023264\] to-\[\#011a36\]/g, replace: 'bg-[#011a36]' },
  { search: /shadow-2xl/g, replace: 'shadow-xl' }
];

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    replacements.forEach(r => {
      content = content.replace(r.search, r.replace);
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
