#!/bin/bash
cat src/components/AdminCommandCenter.tsx | awk '
/                  <BarChart data={coursePerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>/ {
  print $0
  print "                    <defs>"
  print "                      <linearGradient id=\"gradeHighGlow\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">"
  print "                        <stop offset=\"0%\" stopColor=\"#10B981\" stopOpacity={1}/>"
  print "                        <stop offset=\"100%\" stopColor=\"#047857\" stopOpacity={1}/>"
  print "                      </linearGradient>"
  print "                      <linearGradient id=\"gradeNormalGlow\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">"
  print "                        <stop offset=\"0%\" stopColor=\"#6366F1\" stopOpacity={1}/>"
  print "                        <stop offset=\"100%\" stopColor=\"#4338CA\" stopOpacity={1}/>"
  print "                      </linearGradient>"
  print "                    </defs>"
  next
}
/                        <Cell key={`cell-\${index}`} fill={entry.avgGrade >= 85 ? '\''#10B981'\'' : '\''#6366F1'\''} \/>/ {
  print "                        <Cell key={`cell-${index}`} fill={entry.avgGrade >= 85 ? '\''url(#gradeHighGlow)'\'' : '\''url(#gradeNormalGlow)'\''} />"
  next
}
{print}
' > tmp.tsx && mv tmp.tsx src/components/AdminCommandCenter.tsx
