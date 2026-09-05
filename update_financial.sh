#!/bin/bash
cat src/components/AdminCommandCenter.tsx | awk '
/                <div className="grid grid-cols-2 gap-3 mt-4">/ {
  print "                <div className=\"flex flex-col sm:flex-row gap-4 items-center justify-between mt-4\">"
  print "                  <div className=\"w-full sm:w-1/2\">"
  print "                    <ResponsiveContainer width=\"100%\" height={160}>"
  print "                      <PieChart>"
  print "                        <Pie"
  print "                          data={["
  print "                            { name: \"Collected\", value: totalCollectedTuition },"
  print "                            { name: \"Outstanding\", value: outstandingBalanceTotal }"
  print "                          ]}"
  print "                          cx=\"50%\""
  print "                          cy=\"50%\""
  print "                          innerRadius={45}"
  print "                          outerRadius={65}"
  print "                          paddingAngle={3}"
  print "                          dataKey=\"value\""
  print "                        >"
  print "                          <Cell fill=\"#10B981\" />"
  print "                          <Cell fill=\"#F59E0B\" />"
  print "                        </Pie>"
  print "                        <Tooltip formatter={(value) => \"$\" + Number(value).toLocaleString()} />"
  print "                      </PieChart>"
  print "                    </ResponsiveContainer>"
  print "                  </div>"
  print "                  <div className=\"w-full sm:w-1/2 space-y-3\">"
  print "                    <div className=\"p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60\">"
  print "                      <p className=\"text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-400 uppercase\">Collected</p>"
  print "                      <p className=\"text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5\">${totalCollectedTuition.toLocaleString()}</p>"
  print "                    </div>"
  print "                    <div className=\"p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60\">"
  print "                      <p className=\"text-[10px] font-mono font-bold text-amber-900 dark:text-amber-300 uppercase\">Outstanding</p>"
  print "                      <p className=\"text-lg font-black text-amber-900 dark:text-amber-200 mt-0.5\">${outstandingBalanceTotal.toLocaleString()}</p>"
  print "                    </div>"
  print "                  </div>"
  print "                </div>"
  in_financial = 1
  next
}
in_financial == 1 && /              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">/ {
  in_financial = 0
  print
  next
}
in_financial == 1 { next }
{print}
' > tmp_fin.tsx && mv tmp_fin.tsx src/components/AdminCommandCenter.tsx
