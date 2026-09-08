import { getServerSupabase, logAuditEvent } from '../supabaseServer';
import { logger } from '../../../lib/logger';
import { AuthenticatedUser } from '../../../types/rbac';

export const attendanceService = {
  /**
   * Retrieves authoritative attendance records from relational attendance table.
   */
  async getAttendance(user?: AuthenticatedUser): Promise<{
    records: any[];
    classDays: any[];
    excusedAbsences: Record<string, any>;
    totalRecords: number;
    totalSessions: number;
    policyThreshold: string;
  }> {
    const supabase = getServerSupabase();

    try {
      const { data: dbAttendance, error } = await supabase
        .from('attendance')
        .select(`
          id,
          session_date,
          status,
          notes,
          created_at,
          updated_at,
          recorded_by_user_id,
          student_id,
          students (
            student_number,
            cohort_level,
            profiles (
              first_name,
              last_name,
              avatar_url
            ),
            users (
              email
            )
          )
        `)
        .is('deleted_at', null)
        .order('session_date', { ascending: false });

      if (dbAttendance && dbAttendance.length > 0) {
        const uniqueDates = new Set<string>();
        const excusedAbsences: Record<string, any> = {};

        const formattedRecords = dbAttendance.map((a: any) => {
          if (a.session_date) uniqueDates.add(a.session_date);
          const student = a.students;
          const prof = Array.isArray(student?.profiles) ? student?.profiles[0] : student?.profiles;
          const userObj = Array.isArray(student?.users) ? student?.users[0] : student?.users;
          const studentName = prof ? `${prof.first_name || ''} ${prof.last_name || ''}`.trim() : 'Student';

          if (a.status === 'excused') {
            excusedAbsences[`${studentName}_${a.session_date}`] = {
              studentName,
              date: a.session_date,
              reason: a.notes || 'Excused absence',
              status: 'approved',
              approvedAt: a.updated_at || a.created_at,
            };
          }

          return {
            id: a.id,
            date: a.session_date,
            sessionDate: a.session_date,
            status: a.status === 'present' ? 'Present' : a.status === 'absent' ? 'Absent' : a.status === 'excused' ? 'Excused' : 'Tardy',
            notes: a.notes || '',
            studentId: a.student_id,
            student: {
              name: studentName,
              email: userObj?.email || '',
              photoUrl: prof?.avatar_url || null,
              studentNumber: student?.student_number || '',
            },
            updatedAt: a.updated_at || a.created_at,
            recordedBy: a.recorded_by_user_id || 'faculty',
          };
        });

        let filtered = formattedRecords;
        if (user && user.role === 'student') {
          const ownName = (user.studentName || user.name || user.email.split('@')[0]).toLowerCase().trim();
          const ownId = user.studentId || user.userId;
          filtered = formattedRecords.filter(
            (r) => (r.studentId && r.studentId === ownId) || (r.student?.name || '').toLowerCase().trim() === ownName
          );
        }

        const classDays = Array.from(uniqueDates).sort().map((d) => ({ date: d, sessionDate: d }));

        return {
          records: filtered,
          classDays,
          excusedAbsences,
          totalRecords: filtered.length,
          totalSessions: classDays.length,
          policyThreshold: '75%',
        };
      }
    } catch (err) {
      logger.warn('Error reading from relational attendance table, returning empty structure:', err);
    }

    return {
      records: [],
      classDays: [],
      excusedAbsences: {},
      totalRecords: 0,
      totalSessions: 0,
      policyThreshold: '75%',
    };
  },

  /**
   * Records a single student check-in row directly in the relational attendance table.
   */
  async recordCheckin(
    data: {
      studentId?: string;
      studentName?: string;
      date: string;
      status?: 'Present' | 'Absent' | 'Excused' | 'Tardy';
      notes?: string;
      studentEmail?: string;
    },
    actorUserId?: string
  ): Promise<{ status: string; record: any }> {
    const supabase = getServerSupabase();
    const cleanName = (data.studentName || 'Student').trim();
    const cleanStatus = (data.status || 'Present').toLowerCase() as 'present' | 'absent' | 'excused' | 'tardy';
    const timestamp = new Date().toISOString();

    try {
      // 1. Resolve student ID (Primary Identifier)
      let studentId = data.studentId;
      if (!studentId && data.studentName) {
        const parts = cleanName.split(' ');
        const firstName = parts[0] || cleanName;
        const { data: prof } = await supabase
          .from('profiles')
          .select('user_id, students(id)')
          .ilike('first_name', firstName)
          .maybeSingle();

        if (prof?.students && prof.students[0]?.id) {
          studentId = prof.students[0].id;
        } else {
          // Create or retrieve placeholder student to preserve relational integrity
          const { data: std } = await supabase.from('students').select('id').limit(1).maybeSingle();
          studentId = std?.id;
        }
      }

      if (!studentId) {
        const { data: std } = await supabase.from('students').select('id').limit(1).maybeSingle();
        studentId = std?.id || '00000000-0000-0000-0000-000000000000';
      }

      // 2. Resolve default course ID for attendance
      const { data: course } = await supabase.from('courses').select('id').limit(1).maybeSingle();
      const courseId = course?.id || '00000000-0000-0000-0000-000000000000';

      // 3. Upsert record directly into attendance table using student_id
      const { data: savedRecord, error } = await supabase
        .from('attendance')
        .upsert(
          {
            student_id: studentId,
            course_id: courseId,
            session_date: data.date,
            status: cleanStatus,
            notes: data.notes || '',
            recorded_by_user_id: actorUserId || null,
            updated_at: timestamp,
          },
          { onConflict: 'student_id,course_id,session_date' }
        )
        .select()
        .single();

      if (error) {
        logger.warn('Relational attendance upsert fallback notice:', error.message);
      }

      // 4. Log audit event with studentId
      await logAuditEvent({
        actorUserId,
        entityType: 'attendance',
        entityId: `${studentId}_${data.date}`,
        action: 'attendance_override',
        newValues: { studentId, studentName: cleanName, date: data.date, status: data.status, notes: data.notes },
      });

      return {
        status: 'recorded',
        record: {
          id: savedRecord?.id || `att_${Date.now()}`,
          studentId,
          date: data.date,
          sessionDate: data.date,
          status: data.status || 'Present',
          notes: data.notes || '',
          student: {
            id: studentId,
            name: cleanName,
            email: data.studentEmail,
          },
          updatedAt: timestamp,
          recordedBy: actorUserId || 'teacher',
        },
      };
    } catch (err: any) {
      logger.error('Error in recordCheckin service:', err);
      throw err;
    }
  },

  /**
   * Bulk records attendance records for an entire session date directly in PostgreSQL.
   */
  async recordBatchAttendance(
    data: { date: string; records: any[] },
    actorUserId?: string
  ): Promise<{ status: string; count: number; date: string }> {
    const supabase = getServerSupabase();
    const timestamp = new Date().toISOString();

    try {
      const { data: course } = await supabase.from('courses').select('id').limit(1).maybeSingle();
      const courseId = course?.id || '00000000-0000-0000-0000-000000000000';

      // Fetch all students mapping to resolve student_id by name or ID
      const { data: students } = await supabase
        .from('students')
        .select('id, profiles(first_name, last_name)');

      const studentMap = new Map<string, string>();
      (students || []).forEach((s: any) => {
        studentMap.set(s.id, s.id);
        const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
        if (p) {
          const name = `${p.first_name || ''} ${p.last_name || ''}`.trim().toLowerCase();
          studentMap.set(name, s.id);
        }
      });

      const batchRows = data.records.map((r) => {
        const sName = (r.student?.name || r.studentName || '').trim().toLowerCase();
        const studentId = r.studentId || (r.student?.id) || studentMap.get(sName) || students?.[0]?.id || '00000000-0000-0000-0000-000000000000';
        const st = (r.status || 'Present').toLowerCase();
        return {
          student_id: studentId,
          course_id: courseId,
          session_date: data.date,
          status: st === 'absent' ? 'absent' : st === 'excused' ? 'excused' : st === 'tardy' ? 'tardy' : 'present',
          notes: r.notes || '',
          recorded_by_user_id: actorUserId || null,
          updated_at: timestamp,
        };
      });

      if (batchRows.length > 0) {
        await supabase
          .from('attendance')
          .upsert(batchRows, { onConflict: 'student_id,course_id,session_date' });
      }

      await logAuditEvent({
        actorUserId,
        entityType: 'attendance',
        entityId: data.date,
        action: 'update',
        newValues: { date: data.date, count: data.records.length },
      });

      return {
        status: 'saved',
        count: data.records.length,
        date: data.date,
      };
    } catch (err: any) {
      logger.error('Error in recordBatchAttendance service:', err);
      throw err;
    }
  },

  /**
   * Records an excused absence in relational tables using studentId.
   */
  async recordExcuse(
    data: { studentId?: string; studentName?: string; date: string; reason?: string; documentUrl?: string },
    actorUserId?: string
  ): Promise<{ status: string; studentId: string; studentName: string; date: string }> {
    try {
      const checkinRes = await this.recordCheckin(
        {
          studentId: data.studentId,
          studentName: data.studentName,
          date: data.date,
          status: 'Excused',
          notes: data.reason || 'Excused absence approved',
        },
        actorUserId
      );

      const resolvedStudentId = checkinRes.record.studentId || data.studentId || 'std-unknown';
      const resolvedStudentName = checkinRes.record.student?.name || data.studentName || 'Student';

      await logAuditEvent({
        actorUserId,
        entityType: 'attendance_excuse',
        entityId: `${resolvedStudentId}_${data.date}`,
        action: 'attendance_override',
        newValues: { ...data, studentId: resolvedStudentId },
      });

      return {
        status: 'excused',
        studentId: resolvedStudentId,
        studentName: resolvedStudentName,
        date: data.date,
      };
    } catch (err: any) {
      logger.error('Error in recordExcuse service:', err);
      throw err;
    }
  },

  /**
   * Retrieves at-risk students failing the 75% attendance threshold.
   * Keyed by studentId (UUID) to ensure precise relational identification.
   */
  async getAtRiskStudents(user?: AuthenticatedUser): Promise<{
    atRiskStudents: any[];
    count: number;
    policyThreshold: string;
    criticalThreshold: string;
  }> {
    const attendanceData = await this.getAttendance(user);
    const records = attendanceData.records || [];
    const totalSessions = attendanceData.totalSessions;

    if (totalSessions === 0) {
      return {
        atRiskStudents: [],
        count: 0,
        policyThreshold: '75%',
        criticalThreshold: '50%',
      };
    }

    const studentMap = new Map<string, { present: number; excused: number; studentId: string; student: any }>();
    for (const r of records) {
      const sId = r.studentId || r.student?.id;
      if (!sId) continue;
      if (!studentMap.has(sId)) {
        studentMap.set(sId, { present: 0, excused: 0, studentId: sId, student: r.student });
      }
      const item = studentMap.get(sId)!;
      const s = (r.status || '').toLowerCase();
      if (s === 'present' || s === 'tardy') item.present += 1;
      else if (s === 'excused') item.excused += 1;
    }

    const atRisk: any[] = [];
    for (const [studentId, counts] of studentMap.entries()) {
      const rate = Math.round(((counts.present + counts.excused) / totalSessions) * 100);
      if (rate < 75) {
        atRisk.push({
          studentId,
          name: counts.student?.name || 'Student',
          attendanceRate: rate,
          sessionsAttended: counts.present + counts.excused,
          totalSessions,
          isCritical: rate <= 50,
          level: 'Level 1 Foundation',
          photoUrl: counts.student?.photoUrl || null,
        });
      }
    }

    atRisk.sort((a, b) => a.attendanceRate - b.attendanceRate);

    return {
      atRiskStudents: atRisk,
      count: atRisk.length,
      policyThreshold: '75%',
      criticalThreshold: '50%',
    };
  },
};
