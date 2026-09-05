const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Replace font-family for body
css = css.replace(
  /font-family: 'Inter', system-ui/g,
  "font-family: 'Plus Jakarta Sans', 'Inter', system-ui"
);

// Add Playfair Display for headings
const headingRule = `
h1, h2, h3, h4, h5, h6, .font-serif, .serif-heading {
  font-family: 'Playfair Display', serif !important;
}
`;
if (!css.includes('Playfair Display')) {
  css = css.replace('html { background: var(--md-surface); }', 'html { background: var(--md-surface); }\n' + headingRule);
}

fs.writeFileSync('src/index.css', css);
console.log('CSS updated');
