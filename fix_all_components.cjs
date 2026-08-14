const fs = require('fs');
const path = require('path');
const componentsDir = 'src/components';
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
for (const file of files) {
  const filePath = path.join(componentsDir, file);
  let code = fs.readFileSync(filePath, 'utf8');

  code = code.replace(/sName\.toLowerCase\(\)/g, "(sName || '').toLowerCase()");
  code = code.replace(/file\.name\.toLowerCase\(\)/g, "(file.name || '').toLowerCase()");
  code = code.replace(/r\.title\.toLowerCase\(\)/g, "(r.title || '').toLowerCase()");
  code = code.replace(/r\.author\.toLowerCase\(\)/g, "(r.author || '').toLowerCase()");
  code = code.replace(/r\.courseCode\.toLowerCase\(\)/g, "(r.courseCode || '').toLowerCase()");
  code = code.replace(/r\.summary\.toLowerCase\(\)/g, "(r.summary || '').toLowerCase()");
  code = code.replace(/resource\.format\.toLowerCase\(\)/g, "(resource.format || '').toLowerCase()");
  code = code.replace(/previewResource\.format\.toLowerCase\(\)/g, "(previewResource.format || '').toLowerCase()");
  code = code.replace(/st\.name\.toLowerCase\(\)/g, "(st.name || '').toLowerCase()");
  code = code.replace(/nameClean\.toLowerCase\(\)/g, "(nameClean || '').toLowerCase()");
  code = code.replace(/name\.toLowerCase\(\)/g, "(name || '').toLowerCase()");
  code = code.replace(/found\.room\?\.toLowerCase\(\)/g, "(found.room || '').toLowerCase()");
  code = code.replace(/s\.period\.toLowerCase\(\)/g, "(s.period || '').toLowerCase()");
  code = code.replace(/p\.label\.toLowerCase\(\)/g, "(p.label || '').toLowerCase()");
  code = code.replace(/item\.title\.toLowerCase\(\)/g, "(item.title || '').toLowerCase()");
  code = code.replace(/item\.category\.toLowerCase\(\)/g, "(item.category || '').toLowerCase()");
  code = code.replace(/c\.title\.toLowerCase\(\)/g, "(c.title || '').toLowerCase()");
  code = code.replace(/c\.code\.toLowerCase\(\)/g, "(c.code || '').toLowerCase()");
  code = code.replace(/c\.instructor\.toLowerCase\(\)/g, "(c.instructor || '').toLowerCase()");
  code = code.replace(/f\.name\.toLowerCase\(\)/g, "(f.name || '').toLowerCase()");
  code = code.replace(/currentUserName\.toLowerCase\(\)/g, "(currentUserName || '').toLowerCase()");
  code = code.replace(/msg\.recipientName\?\.toLowerCase\(\)/g, "(msg.recipientName || '').toLowerCase()");
  code = code.replace(/inputName\.trim\(\)\.toLowerCase\(\)/g, "(inputName || '').trim().toLowerCase()");
  code = code.replace(/student\.name\.trim\(\)\.toLowerCase\(\)/g, "(student.name || '').trim().toLowerCase()");

  fs.writeFileSync(filePath, code);
}
