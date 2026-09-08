import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../../lib/logger';
import { sanitizeProductionState, isDemoRecord, isDemoUser } from '../../data/guards';

let serverSupabaseClient: SupabaseClient | null = null;

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
 * Loads authoritative application state from Supabase PostgreSQL.
 */
export async function getAuthoritativeState(userEmail?: string | null): Promise<any | null> {
  const supabase = getServerSupabase();
  const docId = userEmail 
    ? `user_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` 
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
 * Saves authoritative application state to Supabase PostgreSQL and appends an audit record.
 */
export async function saveAuthoritativeState(
  state: any,
  userEmail?: string | null,
  actionDescription?: string
): Promise<{ success: boolean; updatedAt: string }> {
  const supabase = getServerSupabase();
  const docId = userEmail 
    ? `user_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` 
    : 'shared_default_state';
  const timestamp = new Date().toISOString();
  const updater = userEmail || 'system';

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
      actorUserId: userEmail || undefined,
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
  action: 'create' | 'update' | 'delete' | 'soft_delete' | 'restore' | 'grade_override' | 'attendance_override';
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
