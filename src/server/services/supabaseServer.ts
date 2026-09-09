import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { logger } from '../../lib/logger';
import { sanitizeProductionState, isDemoRecord, isDemoUser } from '../../data/guards';
import { AuthenticatedUser } from '../../types/rbac';

let serverSupabaseClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(supabaseUrl && serviceRoleKey);
}

/**
 * Validates that authoritative privileged server credentials are configured.
 * Fails fast without silently downgrading to anonymous browser credentials.
 */
export function validateSupabaseServerConfig(): void {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "FATAL: Missing required Supabase URL (SUPABASE_URL or VITE_SUPABASE_URL). Server cannot start."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "FATAL: Missing required privileged server credential: SUPABASE_SERVICE_ROLE_KEY. " +
      "Server domain operations, database management, and authoritative audit logging require privileged service role access and will not downgrade to anonymous client credentials."
    );
  }
}

export function getServerSupabase(): SupabaseClient {
  if (serverSupabaseClient) {
    return serverSupabaseClient;
  }

  validateSupabaseServerConfig();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  serverSupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  logger.info("Initialized authoritative server-side Supabase client with SUPABASE_SERVICE_ROLE_KEY");
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
      actorRole: user.role,
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
      reason: actionDescription || 'Authoritative user state synchronization',
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
      actorRole: 'system',
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
      reason: actionDescription || 'Authoritative state synchronization',
    });
  } catch (auditErr) {
    logger.warn("Audit log record warning (non-fatal):", auditErr);
  }

  return { success: true, updatedAt: timestamp };
}

export interface AuditEventEntry {
  auditId?: string;
  audit_id?: string;
  actorUserId?: string | null;
  actor_user_id?: string | null;
  actorRole?: string | null;
  actor_role?: string | null;
  action: string;
  entityType: string;
  entity_type?: string;
  entityId: string;
  entity_id?: string;
  oldValues?: any;
  old_values?: any;
  newValues?: any;
  new_values?: any;
  changedFields?: string[] | any;
  changed_fields?: string[] | any;
  reason?: string | null;
  ipAddress?: string | null;
  ip_address?: string | null;
  userAgent?: string | null;
  user_agent?: string | null;
  requestId?: string | null;
  request_id?: string | null;
  timestamp?: string;
}

/**
 * Logs an event into the authoritative audit_history PostgreSQL table.
 * Strictly guarantees all 14 audit fields are populated:
 * audit_id, actor_user_id, actor_role, action, entity_type, entity_id,
 * old_values, new_values, changed_fields, reason, ip_address, user_agent,
 * request_id, timestamp.
 */
export async function logAuditEvent(entry: AuditEventEntry): Promise<boolean> {
  try {
    const supabase = getServerSupabase();
    
    // 1. Resolve audit_id (UUID)
    const auditId = entry.auditId || entry.audit_id || randomUUID();
    
    // 2. Resolve actor_user_id (UUID)
    const rawActor = entry.actorUserId !== undefined ? entry.actorUserId : (entry.actor_user_id !== undefined ? entry.actor_user_id : null);
    let resolvedUserId: string | null = null;
    
    const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    if (rawActor) {
      if (isUuid(rawActor)) {
        resolvedUserId = rawActor;
      } else {
        // If an email/username is passed, query users table to retrieve the canonical UUID
        try {
          const { data: userRecord } = await supabase
            .from('users')
            .select('id')
            .eq('email', rawActor.toLowerCase().trim())
            .single();
          
          if (userRecord?.id) {
            resolvedUserId = userRecord.id;
          }
        } catch {
          // Non-blocking lookup fallback
        }
      }
    }
    
    // 3. Resolve actor_role
    const actorRole = entry.actorRole || entry.actor_role || 'system';
    
    // 4. Resolve action, entity_type, entity_id
    const action = entry.action;
    const entityType = entry.entityType || entry.entity_type || 'unknown';
    const entityId = String(entry.entityId || entry.entity_id || 'system');
    
    // 5. Resolve old_values and new_values
    const oldValues = entry.oldValues !== undefined ? entry.oldValues : (entry.old_values !== undefined ? entry.old_values : null);
    const newValues = entry.newValues !== undefined ? entry.newValues : (entry.new_values !== undefined ? entry.new_values : null);
    
    // 6. Compute changed_fields if not explicitly passed
    let changedFields: any = entry.changedFields || entry.changed_fields;
    if (!changedFields && oldValues && newValues && typeof oldValues === 'object' && typeof newValues === 'object') {
      const keys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
      const diffKeys: string[] = [];
      for (const k of keys) {
        if (JSON.stringify(oldValues[k]) !== JSON.stringify(newValues[k])) {
          diffKeys.push(k);
        }
      }
      changedFields = diffKeys;
    } else if (!changedFields) {
      changedFields = [];
    }
    
    // 7. Resolve reason
    const reason = entry.reason || 
      newValues?.reason || 
      newValues?.overrideReason || 
      newValues?.notes || 
      newValues?.description || 
      null;
      
    // 8. Resolve request metadata
    const ipAddress = entry.ipAddress || entry.ip_address || null;
    const userAgent = entry.userAgent || entry.user_agent || null;
    const requestId = entry.requestId || entry.request_id || randomUUID();
    const timestamp = entry.timestamp || new Date().toISOString();
    
    // 9. Authoritative Insert storing all 14 columns
    const { error } = await supabase.from('audit_history').insert({
      audit_id: auditId,
      actor_user_id: resolvedUserId,
      actor_role: actorRole,
      action: action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      changed_fields: Array.isArray(changedFields) ? changedFields : [changedFields],
      reason: reason,
      ip_address: ipAddress,
      user_agent: userAgent,
      request_id: requestId,
      timestamp: timestamp,
    });

    if (error) {
      logger.warn(`Failed to insert authoritative audit record: ${error.message}`);
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
    
    return (data || []).map((row: any) => ({
      audit_id: row.audit_id || row.id,
      id: row.audit_id || row.id,
      actor_user_id: row.actor_user_id,
      actorUserId: row.actor_user_id,
      actor_role: row.actor_role || 'system',
      actorRole: row.actor_role || 'system',
      action: row.action,
      entity_type: row.entity_type,
      entityType: row.entity_type,
      entity_id: row.entity_id,
      entityId: row.entity_id,
      old_values: row.old_values,
      oldValues: row.old_values,
      new_values: row.new_values,
      newValues: row.new_values,
      changed_fields: row.changed_fields || [],
      changedFields: row.changed_fields || [],
      reason: row.reason || null,
      ip_address: row.ip_address,
      ipAddress: row.ip_address,
      user_agent: row.user_agent,
      userAgent: row.user_agent,
      request_id: row.request_id,
      requestId: row.request_id,
      timestamp: row.timestamp,
    }));
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
  actorUserId?: string,
  actorRole?: string,
  reason?: string,
  requestId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const supabase = getServerSupabase();
    
    // Fetch previous user info for old_values in audit
    const { data: previousUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

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
      actorUserId: actorUserId || null,
      actorRole: actorRole || 'super_admin',
      entityType: 'user_role',
      entityId: userId,
      action: 'update',
      oldValues: { role: previousUser?.role || 'unknown' },
      newValues: { role: newRole, userEmail: data?.email },
      changedFields: ['role'],
      reason: reason || `Updated role to ${newRole}`,
      requestId,
      ipAddress,
      userAgent,
    });

    return { success: true, user: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update user role' };
  }
}
