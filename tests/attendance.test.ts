import { describe, it, expect } from 'vitest';
import { normalizeName, calculateAttendanceRate, calculateStreak, mergeAttendanceRecords, computeModuleBreakdown } from '../src/lib/attendance';

describe('attendance utils', () => {
  it('normalizes names', () => {
    expect(normalizeName('  John\u00A0Doe  ')).toBe('john doe');
  });

  it('calculates rate correctly', () => {
    const att = { d1: { present: true }, d2: { present: false }, d3: { present: true } };
    const res = calculateAttendanceRate(att as any);
    expect(res).toEqual({ rate: 67, attended: 2, total: 3 });
  });

  it('calculates streak', () => {
    const days = [{ id: 'd1' }, { id: 'd2' }, { id: 'd3' }];
    const att = { d1: { present: true }, d2: { present: true }, d3: { present: false } };
    expect(calculateStreak(days as any, att as any)).toBe(0);
    const att2 = { d1: { present: true }, d2: { present: true }, d3: { present: true } };
    expect(calculateStreak(days as any, att2 as any)).toBe(3);
  });

  it('merges with manual policy preferring local', () => {
    const local = { d1: { present: true }, d2: { present: false } };
    const sheets = { d1: { present: false }, d3: { present: true } };
    const { merged, conflicts } = mergeAttendanceRecords(local as any, sheets as any, 'manual');
    expect(merged.d1.present).toBe(true);
    expect(merged.d3.present).toBe(true);
    expect(conflicts).toBeUndefined();
  });

  it('returns conflicts in prompt mode', () => {
    const local = { d1: { present: true } };
    const sheets = { d1: { present: false } };
    const { merged, conflicts } = mergeAttendanceRecords(local as any, sheets as any, 'prompt');
    expect(conflicts).toBeDefined();
    expect(conflicts && conflicts.length).toBe(1);
  });

  it('computes module breakdown', () => {
    const days = Array.from({ length: 6 }).map((_, i) => ({ id: `d${i+1}` }));
    const attendance = { d1: { present: true }, d2: { present: true }, d3: { present: false }, d4: { present: true }, d5: { present: true }, d6: { present: true } };
    const breakdown = computeModuleBreakdown(days as any, attendance as any, 3);
    expect(breakdown.length).toBe(3);
  });
});
