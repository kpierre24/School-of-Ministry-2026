export type AttendanceByDay = Record<string, { present: boolean; timestamp?: string; score?: string }>;

export function normalizeName(name: string): string {
  return (name || '').replace(/\u00A0/g, ' ').trim().toLowerCase();
}

export function calculateAttendanceRate(attendanceByDay: AttendanceByDay): { rate: number; attended: number; total: number } {
  const days = Object.keys(attendanceByDay || {});
  const total = days.length;
  if (total === 0) return { rate: 100, attended: 0, total: 0 };
  const attended = days.reduce((acc, d) => acc + (attendanceByDay[d]?.present ? 1 : 0), 0);
  const rate = Math.round((attended / total) * 100);
  return { rate, attended, total };
}

export function calculateStreak(classDays: { id: string }[], attendanceByDay: AttendanceByDay): number {
  let count = 0;
  for (let i = classDays.length - 1; i >= 0; i--) {
    const day = classDays[i];
    const att = attendanceByDay[day.id];
    if (att && att.present) {
      count++;
    } else if (att && !att.present) {
      break;
    } else {
      break;
    }
  }
  return count;
}

export type MergePolicy = 'manual' | 'sheets' | 'prompt';

export function mergeAttendanceRecords(
  local: AttendanceByDay,
  sheets: AttendanceByDay,
  policy: MergePolicy = 'manual'
): { merged: AttendanceByDay; conflicts?: { dayId: string; local?: any; sheets?: any }[] } {
  const merged: AttendanceByDay = { ...local };
  const conflicts: { dayId: string; local?: any; sheets?: any }[] = [];

  const dayIds = new Set([...Object.keys(local || {}), ...Object.keys(sheets || {})]);
  dayIds.forEach(dayId => {
    const l = local?.[dayId];
    const s = sheets?.[dayId];
    if (l && s) {
      const same = !!l.present === !!s.present;
      if (same) merged[dayId] = l;
      else {
        if (policy === 'manual') merged[dayId] = l;
        else if (policy === 'sheets') merged[dayId] = s;
        else conflicts.push({ dayId, local: l, sheets: s });
      }
    } else if (s) merged[dayId] = s;
    else if (l) merged[dayId] = l;
  });

  return { merged, conflicts: conflicts.length ? conflicts : undefined };
}

export function computeModuleBreakdown(classDays: { id: string }[], attendanceByDay: AttendanceByDay, modules = 6) {
  const totalDays = classDays.length || 1;
  const daysPerMod = Math.max(1, Math.ceil(totalDays / modules));
  const result: { code: string; name: string; total: number; attended: number; rate: number }[] = [];
  for (let idx = 0; idx < modules; idx++) {
    const start = idx * daysPerMod;
    const modDays = classDays.slice(start, start + daysPerMod);
    let attended = 0;
    modDays.forEach(d => { if (attendanceByDay[d.id]?.present) attended++; });
    const total = modDays.length;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 100;
    result.push({ code: `M${idx+1}`, name: `Module ${idx+1}`, total, attended, rate });
  }
  return result;
}
