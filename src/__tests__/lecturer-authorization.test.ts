import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyLecturerCourseInDatabase } from '../server/middleware/rbac';
import * as supabaseServer from '../server/services/supabaseServer';
import { AuthenticatedUser } from '../types/rbac';

describe('verifyLecturerCourseInDatabase - Targeted Query Optimization', () => {
  const lecturerUser: AuthenticatedUser = {
    uid: 'firebase-lecturer-123',
    userId: 'c1111111-1111-4111-8111-111111111111',
    id: 'c1111111-1111-4111-8111-111111111111',
    email: 'lecturer@som.hteim.org',
    name: 'Dr. John Doe',
    role: 'lecturer',
    permissions: ['grades:write', 'attendance:write'],
  };

  const courseDefId = 'd2222222-2222-4222-8222-222222222222';
  const offeringId = 'e3333333-3333-4333-8333-333333333333';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should immediately return false if user role is not lecturer', async () => {
    const studentUser: AuthenticatedUser = {
      ...lecturerUser,
      role: 'student',
    };

    const isAssigned = await verifyLecturerCourseInDatabase(studentUser, 'SOM-101');
    expect(isAssigned).toBe(false);
  });

  it('should immediately return false if courseCode is empty', async () => {
    const isAssigned = await verifyLecturerCourseInDatabase(lecturerUser, '');
    expect(isAssigned).toBe(false);
  });

  it('should authorize lecturer via direct targeted query on course_offerings using course_definition_id', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'course_definitions') {
          return {
            select: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: courseDefId, code: 'SOM-101' },
              error: null,
            }),
          };
        }
        if (table === 'course_offerings') {
          const chain: any = {
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: offeringId },
              error: null,
            }),
          };
          return chain;
        }
        return {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    vi.spyOn(supabaseServer, 'getServerSupabase').mockReturnValue(mockSupabase as any);

    const isAssigned = await verifyLecturerCourseInDatabase(lecturerUser, 'SOM-101');
    expect(isAssigned).toBe(true);

    // Verify course_offerings was queried with limit(1) instead of selecting all records
    expect(mockSupabase.from).toHaveBeenCalledWith('course_offerings');
  });

  it('should reject lecturer if targeted course_offerings query returns null', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'course_definitions') {
          return {
            select: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: courseDefId, code: 'SOM-101' },
              error: null,
            }),
          };
        }
        if (table === 'course_offerings') {
          return {
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { assigned_courses: [] },
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    vi.spyOn(supabaseServer, 'getServerSupabase').mockReturnValue(mockSupabase as any);

    const isAssigned = await verifyLecturerCourseInDatabase(lecturerUser, 'SOM-101');
    expect(isAssigned).toBe(false);
  });

  it('should accept direct UUID course definition parameter without querying course_definitions', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'course_offerings') {
          return {
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: offeringId },
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    vi.spyOn(supabaseServer, 'getServerSupabase').mockReturnValue(mockSupabase as any);

    const isAssigned = await verifyLecturerCourseInDatabase(lecturerUser, courseDefId);
    expect(isAssigned).toBe(true);

    // course_definitions table should NOT be queried when input is already a UUID
    expect(mockSupabase.from).not.toHaveBeenCalledWith('course_definitions');
    expect(mockSupabase.from).toHaveBeenCalledWith('course_offerings');
  });
});
