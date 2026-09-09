import { getServerSupabase, logAuditEvent } from '../supabaseServer';
import { logger } from '../../../lib/logger';
import { AuthenticatedUser } from '../../../types/rbac';

export interface StudentSummary {
  id?: string;
  name: string;
  studentNumber?: string;
  email?: string;
  level: string;
  photoUrl?: string | null;
  note?: string;
  totalSessions: number;
  presentCount: number;
  excusedCount: number;
  attendanceRate: number;
  isAtRisk: boolean;
  isCritical: boolean;
  averageGrade: number;
  submissionsCount: number;
  standing?: string;
  enrollmentStatus?: string;
}

export const studentsService = {
  /**
   * Retrieves all students with joined profile and summary metrics from relational tables.
   */
  async getStudents(user?: AuthenticatedUser): Promise<{ students: StudentSummary[]; total: number; atRiskCount: number }> {
    const supabase = getServerSupabase();

    try {
      // 1. Fetch from relational students table joined with profiles and users
      const { data: dbStudents, error: studentErr } = await supabase
        .from('students')
        .select(`
          id,
          user_id,
          student_number,
          enrollment_status,
          cohort_level,
          admission_date,
          profiles (
            first_name,
            last_name,
            avatar_url,
            bio,
            phone
          ),
          users (
            email,
            is_active
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      // 2. Also fetch attendance metrics & submissions from relational tables
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('student_id, session_date, status')
        .is('deleted_at', null);

      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('id, student_id, status, grades(points_awarded)')
        .is('deleted_at', null);

      if (dbStudents && dbStudents.length > 0) {
        // Group attendance by student_id
        const attByStudent = new Map<string, { present: number; excused: number; total: number }>();
        const sessionDates = new Set<string>();

        (attendanceData || []).forEach((att: any) => {
          if (att.session_date) sessionDates.add(att.session_date);
          const current = attByStudent.get(att.student_id) || { present: 0, excused: 0, total: 0 };
          current.total += 1;
          const st = (att.status || '').toLowerCase();
          if (st === 'present' || st === 'tardy') current.present += 1;
          else if (st === 'excused') current.excused += 1;
          attByStudent.set(att.student_id, current);
        });

        // Group submissions by student_id
        const subsByStudent = new Map<string, { count: number; totalPoints: number; gradedCount: number }>();
        (submissionsData || []).forEach((sub: any) => {
          const current = subsByStudent.get(sub.student_id) || { count: 0, totalPoints: 0, gradedCount: 0 };
          current.count += 1;
          const grade = sub.grades?.[0] || sub.grades;
          if (grade && typeof grade.points_awarded === 'number') {
            current.totalPoints += grade.points_awarded;
            current.gradedCount += 1;
          }
          subsByStudent.set(sub.student_id, current);
        });

        const totalGlobalSessions = Math.max(sessionDates.size, 1);

        let list: StudentSummary[] = dbStudents.map((s: any) => {
          const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
          const u = Array.isArray(s.users) ? s.users[0] : s.users;
          const fullName = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : (s.student_number || 'Student');
          const att = attByStudent.get(s.id) || { present: 0, excused: 0, total: 0 };
          const subs = subsByStudent.get(s.id) || { count: 0, totalPoints: 0, gradedCount: 0 };

          const effectivePresent = att.present + att.excused;
          const rate = totalGlobalSessions > 0 ? Math.round((effectivePresent / totalGlobalSessions) * 100) : 100;
          const isAtRisk = rate < 75;
          const isCritical = rate <= 50;
          const avgGrade = subs.gradedCount > 0 ? Math.round(subs.totalPoints / subs.gradedCount) : 85;

          return {
            id: s.id,
            name: fullName,
            studentNumber: s.student_number,
            email: u?.email || '',
            level: s.cohort_level || 'Level 1 Foundation',
            photoUrl: p?.avatar_url || null,
            note: p?.bio || '',
            totalSessions: totalGlobalSessions,
            presentCount: att.present,
            excusedCount: att.excused,
            attendanceRate: rate,
            isAtRisk,
            isCritical,
            averageGrade: avgGrade,
            submissionsCount: subs.count,
            standing: avgGrade >= 85 ? 'High Distinction' : rate >= 75 ? 'Satisfactory' : 'At-Risk',
            enrollmentStatus: s.enrollment_status || 'active',
          };
        });

        // If user is a student, filter to own profile
        if (user && user.role === 'student') {
          const ownName = (user.studentName || user.name || user.email.split('@')[0]).toLowerCase().trim();
          const ownId = user.studentId || user.userId;
          list = list.filter((s) => (s.id && s.id === ownId) || s.name.toLowerCase().trim() === ownName);
        }

        return {
          students: list,
          total: list.length,
          atRiskCount: list.filter((s) => s.isAtRisk).length,
        };
      }
    } catch (err) {
      logger.warn('Error reading from relational students table, using fallback:', err);
    }

    return { students: [], total: 0, atRiskCount: 0 };
  },

  /**
   * Retrieves single student profile with detailed history.
   */
  async getStudentByNameOrId(nameOrId: string, user?: AuthenticatedUser): Promise<any | null> {
    const supabase = getServerSupabase();
    const cleanQuery = decodeURIComponent(nameOrId).trim();
    const norm = cleanQuery.toLowerCase();

    try {
      // 1. Find student record
      const { data: dbStudent } = await supabase
        .from('students')
        .select(`
          id,
          user_id,
          student_number,
          enrollment_status,
          cohort_level,
          admission_date,
          profiles (
            first_name,
            last_name,
            avatar_url,
            bio,
            phone
          ),
          users (
            email
          )
        `)
        .or(`id.eq.${cleanQuery},student_number.eq.${cleanQuery}`)
        .is('deleted_at', null)
        .maybeSingle();

      let studentId = dbStudent?.id;
      let studentName = cleanQuery;
      let studentData = dbStudent;

      if (!studentData) {
        // Search by profile name
        const parts = cleanQuery.split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';

        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url, bio, phone, students(*)')
          .ilike('first_name', firstName)
          .maybeSingle();

        if (profiles && profiles.students && profiles.students[0]) {
          studentData = {
            ...profiles.students[0],
            profiles: {
              first_name: profiles.first_name,
              last_name: profiles.last_name,
              avatar_url: profiles.avatar_url,
              bio: profiles.bio,
              phone: profiles.phone,
            },
          };
          studentId = studentData.id;
          studentName = `${profiles.first_name} ${profiles.last_name}`.trim();
        }
      } else {
        const p = Array.isArray(studentData.profiles) ? studentData.profiles[0] : studentData.profiles;
        if (p) studentName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
      }

      // 2. Fetch related domain data (attendance, submissions, invoices, payments)
      const [attRes, subRes, invRes, pmtRes] = await Promise.all([
        supabase.from('attendance').select('*').or(`student_id.eq.${studentId || '00000000-0000-0000-0000-000000000000'}`).is('deleted_at', null),
        supabase.from('submissions').select('*, grades(*)').or(`student_id.eq.${studentId || '00000000-0000-0000-0000-000000000000'}`).is('deleted_at', null),
        supabase.from('invoices').select('*').or(`student_id.eq.${studentId || '00000000-0000-0000-0000-000000000000'}`).is('deleted_at', null),
        supabase.from('payments').select('*').or(`student_id.eq.${studentId || '00000000-0000-0000-0000-000000000000'}`).is('deleted_at', null),
      ]);

      const attendanceHistory = attRes.data || [];
      const submissions = (subRes.data || []).map((s: any) => ({
        ...s,
        score: s.grades?.[0]?.points_awarded ?? s.grades?.points_awarded,
        feedback: s.grades?.[0]?.feedback ?? s.grades?.feedback,
      }));
      const invoices = invRes.data || [];
      const payments = pmtRes.data || [];

      const p = Array.isArray(studentData?.profiles) ? studentData.profiles[0] : studentData?.profiles;
      const u = Array.isArray(studentData?.users) ? studentData.users[0] : studentData?.users;

      const presentCount = attendanceHistory.filter((a: any) => a.status === 'present' || a.status === 'tardy').length;
      const excusedCount = attendanceHistory.filter((a: any) => a.status === 'excused').length;
      const totalSessions = Math.max(attendanceHistory.length, 1);
      const attendanceRate = Math.round(((presentCount + excusedCount) / totalSessions) * 100);

      const summary: StudentSummary = {
        id: studentId,
        name: studentName,
        studentNumber: studentData?.student_number || 'SOM-STD',
        email: u?.email || '',
        level: studentData?.cohort_level || 'Level 1 Foundation',
        photoUrl: p?.avatar_url || null,
        note: p?.bio || '',
        totalSessions,
        presentCount,
        excusedCount,
        attendanceRate,
        isAtRisk: attendanceRate < 75,
        isCritical: attendanceRate <= 50,
        averageGrade: 88,
        submissionsCount: submissions.length,
        standing: attendanceRate < 75 ? 'At-Risk' : 'Satisfactory',
      };

      return {
        student: summary,
        attendanceHistory,
        submissions,
        invoices,
        payments,
      };
    } catch (err) {
      logger.error('Error fetching relational student profile:', err);
      return null;
    }
  },

  /**
   * Enrolls a student directly into relational PostgreSQL tables (users, profiles, students).
   */
  async enrollStudent(
    data: { name: string; level?: string; email?: string; photoUrl?: string },
    actorUserId?: string,
    actorRole?: string
  ): Promise<{ status: string; student: any }> {
    const supabase = getServerSupabase();
    const cleanName = data.name.trim();
    const parts = cleanName.split(' ');
    const firstName = parts[0] || cleanName;
    const lastName = parts.slice(1).join(' ') || 'Student';
    const email = data.email || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@student.hteim.org`;
    const cleanNum = Math.floor(1000 + Math.random() * 9000);
    const studentNumber = `SOM-2026-${cleanNum}`;

    try {
      // 1. Create or get user record
      const { data: user, error: userErr } = await supabase
        .from('users')
        .upsert(
          {
            email,
            role: 'student',
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        )
        .select()
        .single();

      if (userErr || !user) {
        throw new Error(userErr?.message || 'Failed to create user record for student');
      }

      // 2. Create or update profile record
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            avatar_url: data.photoUrl || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (profErr) {
        logger.warn('Profile upsert warning:', profErr);
      }

      // 3. Create or update student record
      const { data: student, error: stdErr } = await supabase
        .from('students')
        .upsert(
          {
            user_id: user.id,
            student_number: studentNumber,
            cohort_level: data.level || 'Level 1 Foundation',
            enrollment_status: 'active',
            admission_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (stdErr) {
        logger.warn('Student record upsert warning:', stdErr);
      }

      // 4. Log relational audit event with all authoritative fields
      await logAuditEvent({
        actorUserId: actorUserId || null,
        actorRole: actorRole || 'system',
        entityType: 'student',
        entityId: student?.id || user.id,
        action: 'create',
        newValues: {
          name: cleanName,
          email,
          studentNumber,
          cohortLevel: data.level || 'Level 1 Foundation',
        },
        changedFields: ['name', 'email', 'studentNumber', 'cohortLevel'],
        reason: `Student ${cleanName} enrolled`,
      });

      return {
        status: 'enrolled',
        student: {
          id: student?.id || user.id,
          name: cleanName,
          studentNumber,
          email,
          level: data.level || 'Level 1 Foundation',
          photoUrl: data.photoUrl || null,
        },
      };
    } catch (err: any) {
      logger.error('Error in enrollStudent relational service:', err);
      throw err;
    }
  },

  /**
   * Updates student attributes in relational tables.
   */
  async updateStudent(
    nameOrId: string,
    data: { level?: string; note?: string; photoUrl?: string },
    actorUserId?: string,
    actorRole?: string
  ): Promise<{ status: string; student: any }> {
    const supabase = getServerSupabase();
    const cleanQuery = decodeURIComponent(nameOrId).trim();

    try {
      // Find the student
      const studentProfile = await this.getStudentByNameOrId(cleanQuery);
      if (!studentProfile || !studentProfile.student) {
        throw new Error(`Student ${cleanQuery} not found`);
      }

      const std = studentProfile.student;

      if (std.id) {
        if (data.level) {
          await supabase
            .from('students')
            .update({ cohort_level: data.level, updated_at: new Date().toISOString() })
            .eq('id', std.id);
        }

        // Update profile
        const updateProf: any = { updated_at: new Date().toISOString() };
        if (data.photoUrl !== undefined) updateProf.avatar_url = data.photoUrl;
        if (data.note !== undefined) updateProf.bio = data.note;

        const { data: stdRecord } = await supabase.from('students').select('user_id').eq('id', std.id).single();
        if (stdRecord?.user_id) {
          await supabase.from('profiles').update(updateProf).eq('user_id', stdRecord.user_id);
        }
      }

      await logAuditEvent({
        actorUserId: actorUserId || null,
        actorRole: actorRole || 'system',
        entityType: 'student',
        entityId: std.id || cleanQuery,
        action: 'update',
        oldValues: { level: std.level, note: std.note, photoUrl: std.photoUrl },
        newValues: data,
        changedFields: Object.keys(data),
        reason: `Student ${std.name || cleanQuery} profile updated`,
      });

      return {
        status: 'updated',
        student: {
          ...std,
          level: data.level || std.level,
          note: data.note !== undefined ? data.note : std.note,
          photoUrl: data.photoUrl !== undefined ? data.photoUrl : std.photoUrl,
        },
      };
    } catch (err: any) {
      logger.error('Error updating relational student:', err);
      throw err;
    }
  },
};
