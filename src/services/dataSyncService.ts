/**
 * ============================================================================
 * PRIMARY DATA SYNC SERVICE (PostgreSQL / Supabase Authoritative)
 * HTEIM School of Ministry
 * ============================================================================
 * Establishes PostgreSQL/Supabase as the single authoritative source of truth
 * for all application state, academic records, and student profiles.
 *
 * Utilizes Supabase Realtime channels for multi-user synchronization,
 * with local browser storage functioning strictly as an offline PWA buffer cache.
 */

import { supabase } from '../lib/supabaseClient';
import { SyncedAppState } from '../lib/firebaseSync';
import { handleError } from '../lib/errorHandler';
import { logger } from '../lib/logger';

export interface DataSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;
}

/**
 * Loads the current workspace state from PostgreSQL / Supabase as authoritative source.
 */
export async function loadAuthoritativeState(userEmail: string | null | undefined): Promise<SyncedAppState | null> {
  try {
    const docId = userEmail 
      ? `user_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` 
      : 'shared_default_state';

    const { data, error } = await supabase
      .from('app_states')
      .select('state')
      .eq('id', docId)
      .single();

    if (error) {
      if (error.code === '42P01') {
        handleError(error, `loadAuthoritativeState - table app_states does not exist`, 'database');
        return null;
      }
      throw error;
    }

    if (data?.state) {
      // Save local offline snapshot cache
      try {
        localStorage.setItem('hteim_offline_state_snapshot', JSON.stringify(data.state));
      } catch (e) {
        // Cache warning
      }
      return data.state;
    }

    // Fallback to shared_default_state if user-specific record does not exist
    if (docId !== 'shared_default_state') {
      const fallback = await supabase
        .from('app_states')
        .select('state')
        .eq('id', 'shared_default_state')
        .single();

      if (fallback.error && fallback.error.code !== 'PGRST116') { // PGRST116 means no rows found, which is normal
        throw fallback.error;
      }

      if (fallback.data?.state) {
        return fallback.data.state;
      }
    }

    return null;
  } catch (err: any) {
    handleError(err, 'loadAuthoritativeState - PostgreSQL load failure', 'database');
    try {
      const cached = localStorage.getItem('hteim_offline_state_snapshot');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      // Return null if no offline snapshot
    }
    return null;
  }
}

/**
 * Saves state directly to PostgreSQL / Supabase as the single authoritative record.
 */
export async function saveAuthoritativeState(
  userEmail: string | null | undefined,
  state: SyncedAppState
): Promise<boolean> {
  try {
    const docId = userEmail 
      ? `user_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` 
      : 'shared_default_state';

    const timestamp = new Date().toISOString();
    const updater = userEmail || 'anonymous';

    // 1. Save local offline snapshot first for instant UI response
    try {
      localStorage.setItem('hteim_offline_state_snapshot', JSON.stringify(state));
    } catch (e) {
      // Buffer error
    }

    // 2. Persist to Supabase app_states PostgreSQL table
    const { error } = await supabase
      .from('app_states')
      .upsert({
        id: docId,
        state: state,
        updated_at: timestamp,
        updated_by: updater
      });

    if (error) {
      if (error.code === '42P01') {
        handleError(error, `saveAuthoritativeState - app_states table does not exist`, 'database');
        return false;
      }
      throw error;
    }

    // Always keep shared_default_state updated so published/guest views get the latest workspace state
    if (docId !== 'shared_default_state') {
      const fallbackRes = await supabase
        .from('app_states')
        .upsert({
          id: 'shared_default_state',
          state: state,
          updated_at: timestamp,
          updated_by: updater
        });
      if (fallbackRes.error) {
        throw fallbackRes.error;
      }
    }

    return true;
  } catch (err: any) {
    handleError(err, 'saveAuthoritativeState - PostgreSQL upsert failure', 'database');
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
