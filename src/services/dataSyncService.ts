/**
 * ============================================================================
 * PRIMARY DATA SYNC SERVICE (React -> Express API -> Supabase PostgreSQL)
 * HTEIM School of Ministry
 * ============================================================================
 * Establishes Supabase PostgreSQL as the primary single source of truth
 * for all business data (Students, Courses, Enrollments, Attendance,
 * Assignments, Grades, Payments, and Audit Logs).
 *
 * All business operations flow through the Express API layer.
 * Local browser storage functions strictly as a temporary offline buffer/cache,
 * not as an authoritative data store.
 */

import { portalApi } from './api/portalApiClient';
import { supabase } from '../lib/supabaseClient';
import { SyncedAppState } from '../lib/firebaseSync';
import { handleError } from '../lib/errorHandler';
import { logger } from '../lib/logger';
import { sanitizeProductionState } from '../data/guards';

export interface DataSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;
}

/**
 * Loads the current workspace state from Express API / Supabase PostgreSQL as authoritative source.
 */
export async function loadAuthoritativeState(userEmail: string | null | undefined): Promise<SyncedAppState | null> {
  try {
    // 1. Primary path: Fetch authoritative state via Express API -> Supabase PostgreSQL
    const apiState = await portalApi.loadAuthoritativeState(userEmail || undefined);
    if (apiState) {
      try {
        localStorage.setItem('hteim_offline_state_snapshot', JSON.stringify(apiState));
      } catch {
        // Safe ignore for storage quota
      }
      return apiState;
    }

    // 2. Direct Supabase fallback if Express endpoint returned empty/null
    const docId = userEmail 
      ? `user_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` 
      : 'shared_default_state';

    const { data, error } = await supabase
      .from('app_states')
      .select('state')
      .eq('id', docId)
      .single();

    if (error && error.code !== 'PGRST116') {
      if (error.code === '42P01') {
        handleError(error, `loadAuthoritativeState - table app_states does not exist`, 'database');
        return null;
      }
    }

    if (data?.state) {
      try {
        localStorage.setItem('hteim_offline_state_snapshot', JSON.stringify(data.state));
      } catch {}
      return data.state;
    }

    // Fallback to shared_default_state if user-specific record does not exist
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
  } catch (err: any) {
    handleError(err, 'loadAuthoritativeState - PostgreSQL load failure', 'database');
    // Read-only offline cache fallback
    try {
      const cached = localStorage.getItem('hteim_offline_state_snapshot');
      if (cached) return JSON.parse(cached);
    } catch {
      // Return null if no offline snapshot
    }
    return null;
  }
}

/**
 * Saves state authoritatively via Express API -> Supabase PostgreSQL.
 */
export async function saveAuthoritativeState(
  userEmail: string | null | undefined,
  state: SyncedAppState,
  actionDescription?: string
): Promise<boolean> {
  try {
    // Guard: Demo state must never be saved to production database
    if (state.dataSource === 'demo' || (state as any).isDemo === true) {
      logger.warn('[DataSync] Blocked attempt to save demo state into production database.');
      return false;
    }

    const cleanState = sanitizeProductionState(state);

    // 1. Update temporary offline snapshot cache
    try {
      localStorage.setItem('hteim_offline_state_snapshot', JSON.stringify(cleanState));
    } catch {
      // Quota exceeded ignore
    }

    // 2. Authoritative save through Express API layer -> Supabase PostgreSQL
    const savedViaApi = await portalApi.saveAuthoritativeState(
      cleanState,
      userEmail || undefined,
      actionDescription || 'State updated from portal'
    );

    if (savedViaApi) {
      return true;
    }

    // 3. Fallback direct client write to Supabase app_states if Express API had an issue
    const docId = userEmail 
      ? `user_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` 
      : 'shared_default_state';
    const timestamp = new Date().toISOString();
    const updater = userEmail || 'anonymous';

    const { error } = await supabase
      .from('app_states')
      .upsert({
        id: docId,
        state: cleanState,
        updated_at: timestamp,
        updated_by: updater,
      });

    if (error) {
      handleError(error, 'saveAuthoritativeState - Supabase direct upsert failure', 'database');
      return false;
    }

    if (docId !== 'shared_default_state') {
      await supabase.from('app_states').upsert({
        id: 'shared_default_state',
        state,
        updated_at: timestamp,
        updated_by: updater,
      });
    }

    return true;
  } catch (err: any) {
    handleError(err, 'saveAuthoritativeState - Persistence failure', 'database');
    return false;
  }
}

/**
 * Subscribes to Supabase Realtime changes for PostgreSQL postgres_changes events.
 */
export function subscribeToRealtimeStateChanges(
  userEmail: string | null | undefined,
  onRemoteStateChange: (newState: SyncedAppState) => void
): () => void {
  const docId = userEmail
    ? `user_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`
    : 'shared_default_state';

  const channel = supabase
    .channel(`app_state_realtime_${docId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'app_states',
        filter: `id=eq.${docId}`,
      },
      (payload) => {
        const newState = (payload.new as any)?.state as SyncedAppState | null;
        if (newState) {
          logger.info(`[Realtime Sync] Received PostgreSQL state update for ${docId}`);
          onRemoteStateChange(newState);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.info(`[Supabase Realtime] Subscribed to PostgreSQL updates for ${docId}`);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Tests database connectivity
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    return res.ok;
  } catch {
    return false;
  }
}
