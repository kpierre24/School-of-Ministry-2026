const fs = require('fs');
const path = require('path');

const componentsDir = 'src/components';
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(componentsDir, file);
  let code = fs.readFileSync(filePath, 'utf8');

  // generic replacements
  code = code.replace(/quiz\.title\.toLowerCase\(\)/g, "(quiz.title || '').toLowerCase()");
  code = code.replace(/s\.name\.toLowerCase\(\)/g, "(s?.name || '').toLowerCase()");
  code = code.replace(/p\.studentName\.toLowerCase\(\)/g, "(p?.studentName || '').toLowerCase()");
  code = code.replace(/currentStudentName\.toLowerCase\(\)/g, "(currentStudentName || '').toLowerCase()");
  code = code.replace(/s\.studentName\.toLowerCase\(\)/g, "(s?.studentName || '').toLowerCase()");
  code = code.replace(/studentName\.toLowerCase\(\)/g, "(studentName || '').toLowerCase()");
  code = code.replace(/subItem\.studentName\.toLowerCase\(\)/g, "(subItem?.studentName || '').toLowerCase()");
  code = code.replace(/sub\.studentName\.toLowerCase\(\)/g, "(sub?.studentName || '').toLowerCase()");
  code = code.replace(/activeStudentName\.toLowerCase\(\)/g, "(activeStudentName || '').toLowerCase()");
  code = code.replace(/std\.name\.toLowerCase\(\)/g, "(std?.name || '').toLowerCase()");
  code = code.replace(/pay\.studentName\.toLowerCase\(\)/g, "(pay?.studentName || '').toLowerCase()");
  code = code.replace(/c\.studentName\.toLowerCase\(\)/g, "(c?.studentName || '').toLowerCase()");
  code = code.replace(/c\.email\.toLowerCase\(\)/g, "(c?.email || '').toLowerCase()");
  code = code.replace(/c\.name\.toLowerCase\(\)/g, "(c?.name || '').toLowerCase()");
  code = code.replace(/stName\.toLowerCase\(\)/g, "(stName || '').toLowerCase()");
  code = code.replace(/stEmail\.toLowerCase\(\)/g, "(stEmail || '').toLowerCase()");
  code = code.replace(/selectedStudent\.toLowerCase\(\)/g, "(selectedStudent || '').toLowerCase()");
  code = code.replace(/targetStudentName\.toLowerCase\(\)/g, "(targetStudentName || '').toLowerCase()");

  fs.writeFileSync(filePath, code);
}
