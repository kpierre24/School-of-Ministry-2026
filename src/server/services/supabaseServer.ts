import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../../lib/logger';
import { sanitizeProductionState, isDemoRecord, isDemoUser } from '../../data/guards';
import { AuthenticatedUser } from '../../types/rbac';

let serverSupabaseClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;
  return Boolean(supabaseUrl && supabaseKey);
}

export function getServerSupabase(): SupabaseClient {
  if (serverSupabaseClient) {
    return serverSupabaseClient;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing required Supabase credentials (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  serverSupabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  logger.info("Initialized server-side Supabase PostgreSQL client");
  return serverSupabaseClient;
}

/**
 * Loads raw authoritative application state from Supabase PostgreSQL by docId / key.
 */
export async function getAuthoritativeState(userIdOrKey?: string | null): Promise<any | null> {
  const supabase = getServerSupabase();
  const docId = userIdOrKey 
    ? (userIdOrKey.startsWith('user_') || userIdOrKey === 'shared_default_state' ? userIdOrKey : `user_${userIdOrKey.replace(/[^a-zA-Z0-9]/g, '_')}`)
    : 'shared_default_state';

  const { data, error } = await supabase
    .from('app_states')
    .select('state, updated_at, updated_by')
    .eq('id', docId)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.warn(`Error loading state for ${docId} from PostgreSQL: ${error.message}`);
  }

  if (data?.state) {
    return data.state;
  }

  // Fall back to shared_default_state if user-specific state is not found
  if (docId !== 'shared_default_state') {
    const fallback = await supabase
      .from('app_states')
      .select('state')
      .eq('id', 'shared_default_state')
      .single();

    if (fallback.data?.state) {
      return fallback.data.state;
    }
  }

  return null;
}

/**
 * Loads authoritative state strictly scoped and authorized for the requesting user.
 * 
 * Flow:
 * userId (from verified req.user)
 *    ↓
 * database (PostgreSQL app_states / entities)
 *    ↓
 * that user's authorized data
 */
export async function getAuthorizedStateForUser(user: AuthenticatedUser): Promise<any | null> {
  const supabase = getServerSupabase();
  const userId = user.userId || user.uid;
  const userDocId = `user_${userId.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // 1. Fetch user-specific state or shared default state
  let rawState: any = null;

  const { data: userData } = await supabase
    .from('app_states')
    .select('state')
    .eq('id', userDocId)
    .single();

  if (userData?.state) {
    rawState = userData.state;
  } else if (user.email) {
    // Check legacy email key for migration continuity
    const legacyDocId = `user_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const { data: legacyData } = await supabase
      .from('app_states')
      .select('state')
      .eq('id', legacyDocId)
      .single();
    if (legacyData?.state) {
      rawState = legacyData.state;
    }
  }

  if (!rawState) {
    const { data: defaultData } = await supabase
      .from('app_states')
      .select('state')
      .eq('id', 'shared_default_state')
      .single();
    if (defaultData?.state) {
      rawState = defaultData.state;
    }
  }

  if (!rawState) {
    return null;
  }

  const cleanState = sanitizeProductionState(rawState);

  // 2. Apply strict role-based data scoping
  if (user.role === 'student') {
    const studentName = user.studentName ? user.studentName.toLowerCase().trim() : '';
    const studentId = user.studentId || '';

    const matchesStudent = (name?: string, id?: string) => {
      if (studentId && id && id === studentId) return true;
      if (studentName && name && name.toLowerCase().trim() === studentName) return true;
      return false;
    };

    return {
      ...cleanState,
      // Scope attendance records to this student only
      records: Array.isArray(cleanState.records)
        ? cleanState.records.filter((r: any) => matchesStudent(r.studentName, r.studentId))
        : [],
      // Scope homework submissions to this student only
      submissions: Array.isArray(cleanState.submissions)
        ? cleanState.submissions.filter((s: any) => matchesStudent(s.studentName, s.studentId))
        : [],
      // Scope payments and ledger to this student only
      payments: Array.isArray(cleanState.payments)
        ? cleanState.payments.filter((p: any) => matchesStudent(p.studentName, p.studentId))
        : [],
      invoices: Array.isArray(cleanState.invoices)
        ? cleanState.invoices.filter((i: any) => matchesStudent(i.studentName, i.studentId))
        : [],
      // Scope student profiles to this student only
      students: Array.isArray(cleanState.students)
        ? cleanState.students.filter((s: any) => matchesStudent(s.name, s.id))
        : [],
      // Only keep personal notifications
      notifications: Array.isArray(cleanState.notifications)
        ? cleanState.notifications.filter((n: any) => 
            !n.recipient || n.recipient === 'all' || n.recipient === 'students' || matchesStudent(n.recipient, n.studentId)
          )
        : [],
      // Student has no access to full administrative audit log history
      auditHistory: [],
    };
  }

  // Institutional users (admin, teacher, registrar, finance_officer) receive full institutional state
  return cleanState;
}

/**
 * Saves authoritative state authoritatively for the authenticated user based on req.user.
 */
export async function saveAuthoritativeStateForUser(
  user: AuthenticatedUser,
  state: any,
  actionDescription?: string
): Promise<{ success: boolean; updatedAt: string }> {
  const supabase = getServerSupabase();
  const userId = user.userId || user.uid;
  const docId = `user_${userId.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const timestamp = new Date().toISOString();
  const updater = userId;

  if (state?.dataSource === 'demo' || state?.isDemo) {
    logger.warn(`Blocked attempt to automatically save demo data for user ${userId}`);
    return { success: false, updatedAt: timestamp };
  }

  const sanitizedState = sanitizeProductionState(state);

  // If the user is a student, ensure they cannot overwrite institutional records
  let finalStateToSave = sanitizedState;
  if (user.role === 'student') {
    const existing = await getAuthoritativeState('shared_default_state');
    if (existing) {
      const studentName = user.studentName ? user.studentName.toLowerCase().trim() : '';
      const studentId = user.studentId || '';
      const matchesStudent = (name?: string, id?: string) => {
        if (studentId && id && id === studentId) return true;
        if (studentName && name && name.toLowerCase().trim() === studentName) return true;
        return false;
      };

      // Merge student's submissions and self assessments into existing institutional state
      const existingSubmissions = Array.isArray(existing.submissions) ? existing.submissions : [];
      const newStudentSubmissions = (Array.isArray(sanitizedState.submissions) ? sanitizedState.submissions : [])
        .filter((s: any) => matchesStudent(s.studentName, s.studentId));

      const mergedSubmissions = [
        ...existingSubmissions.filter((s: any) => !matchesStudent(s.studentName, s.studentId)),
        ...newStudentSubmissions,
      ];

      finalStateToSave = {
        ...existing,
        submissions: mergedSubmissions,
        lastSyncedAt: timestamp,
      };
    }
  }

  // 1. Update user state
  const { error: upsertErr } = await supabase
    .from('app_states')
    .upsert({
      id: docId,
      state: finalStateToSave,
      updated_at: timestamp,
      updated_by: updater,
    });

  if (upsertErr) {
    logger.error(`Failed to save authoritative state for user ${userId}:`, upsertErr);
    throw upsertErr;
  }

  // 2. If user is an administrative role, also update shared_default_state
  if (user.role !== 'student') {
    await supabase.from('app_states').upsert({
      id: 'shared_default_state',
      state: finalStateToSave,
      updated_at: timestamp,
      updated_by: updater,
    });
  }

  // 3. Log audit event
  try {
    await logAuditEvent({
      actorUserId: user.userId,
      entityType: 'app_state',
      entityId: docId,
      action: 'update',
      newValues: {
        recordsCount: finalStateToSave?.records?.length || 0,
        paymentsCount: finalStateToSave?.payments?.length || 0,
        submissionsCount: finalStateToSave?.submissions?.length || 0,
        description: actionDescription || 'Authoritative state synchronized by authenticated user',
        updatedAt: timestamp,
      },
    });
  } catch (auditErr) {
    logger.warn("Audit log record warning (non-fatal):", auditErr);
  }

  return { success: true, updatedAt: timestamp };
}

/**
 * Saves authoritative application state to Supabase PostgreSQL and appends an audit record.
 */
export async function saveAuthoritativeState(
  state: any,
  actorUserId?: string | null,
  actionDescription?: string
): Promise<{ success: boolean; updatedAt: string }> {
  const supabase = getServerSupabase();
  const docId = actorUserId 
    ? (actorUserId.startsWith('user_') || actorUserId === 'shared_default_state' ? actorUserId : `user_${actorUserId.replace(/[^a-zA-Z0-9]/g, '_')}`)
    : 'shared_default_state';
  const timestamp = new Date().toISOString();
  const updater = actorUserId || 'system';

  // Guard: Demo state must never be saved to production databases
  if (state?.dataSource === 'demo' || state?.isDemo) {
    logger.warn(`Blocked attempt to automatically save demo data into production database for ${docId}`);
    return { success: false, updatedAt: new Date().toISOString() };
  }

  // Sanitize state to ensure no demo records, demo users, or demo payments leak into production
  const sanitizedState = sanitizeProductionState(state);

  // 1. Update user state or default state in app_states table
  const { error: upsertErr } = await supabase
    .from('app_states')
    .upsert({
      id: docId,
      state: sanitizedState,
      updated_at: timestamp,
      updated_by: updater,
    });

  if (upsertErr) {
    logger.error(`Failed to save authoritative state for ${docId}:`, upsertErr);
    throw upsertErr;
  }

  // 2. Also keep shared_default_state synced for global/guest views
  if (docId !== 'shared_default_state') {
    await supabase.from('app_states').upsert({
      id: 'shared_default_state',
      state: sanitizedState,
      updated_at: timestamp,
      updated_by: updater,
    });
  }

  // 3. Record in audit_history table
  try {
    await logAuditEvent({
      actorUserId: actorUserId || undefined,
      entityType: 'app_state',
      entityId: docId,
      action: 'update',
      newValues: {
        recordsCount: state?.records?.length || 0,
        paymentsCount: state?.payments?.length || 0,
        submissionsCount: state?.submissions?.length || 0,
        description: actionDescription || 'Authoritative state synchronized',
        updatedAt: timestamp,
      },
    });
  } catch (auditErr) {
    logger.warn("Audit log record warning (non-fatal):", auditErr);
  }

  return { success: true, updatedAt: timestamp };
}

/**
 * Logs an event into the authoritative audit_history PostgreSQL table.
 */
export async function logAuditEvent(entry: {
  actorUserId?: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'soft_delete' | 'restore' | 'grade_override' | 'attendance_override' | 'grade_recorded' | 'grade_override_approved' | string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<boolean> {
  try {
    const supabase = getServerSupabase();
    const { error } = await supabase.from('audit_history').insert({
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      action: entry.action,
      old_values: entry.oldValues || null,
      new_values: entry.newValues || null,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      logger.warn(`Failed to insert audit record: ${error.message}`);
      return false;
    }
    return true;
  } catch (err) {
    logger.warn(`Exception writing to audit_history:`, err);
    return false;
  }
}

/**
 * Retrieves audit history log records from PostgreSQL.
 */
export async function getAuditLogs(limit = 50, entityType?: string): Promise<any[]> {
  try {
    const supabase = getServerSupabase();
    let query = supabase
      .from('audit_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { data, error } = await query;
    if (error) {
      logger.warn(`Failed to fetch audit logs: ${error.message}`);
      return [];
    }
    return data || [];
  } catch (err) {
    logger.warn(`Exception fetching audit logs:`, err);
    return [];
  }
}

/**
 * Retrieves all registered users from PostgreSQL users table.
 */
export async function getDatabaseUsers(): Promise<any[]> {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      logger.warn(`Failed to fetch database users: ${error.message}`);
      return [];
    }
    return data || [];
  } catch (err) {
    logger.warn('Exception fetching database users:', err);
    return [];
  }
}

/**
 * Updates a user's role in the database and records an audit log.
 */
export async function updateUserRoleInDatabase(
  userId: string,
  newRole: string,
  actorEmail?: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, email, role, is_active, updated_at')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logAuditEvent({
      actorUserId: actorEmail,
      entityType: 'user_role',
      entityId: userId,
      action: 'update',
      newValues: { role: newRole, userEmail: data?.email },
    });

    return { success: true, user: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update user role' };
  }
}
