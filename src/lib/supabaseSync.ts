/**
 * ============================================================================
 * SUPABASE SYNC FACADE
 * HTEIM School of Ministry
 * ============================================================================
 * Redirects all state synchronization directly through the single authoritative
 * dataSyncService pipeline to eliminate duplicate sync mechanisms and bypasses.
 */

import {
  loadAuthoritativeState,
  saveAuthoritativeState,
  subscribeToRealtimeStateChanges,
  testDatabaseConnection
} from '../services/dataSyncService';
import { SyncedAppState } from './firebaseSync';

export const testSupabaseConnection = testDatabaseConnection;

export async function loadFromSupabase(userEmail: string | null | undefined): Promise<SyncedAppState | null> {
  return loadAuthoritativeState(userEmail);
}

export async function saveToSupabase(
  userEmail: string | null | undefined,
  state: SyncedAppState
): Promise<boolean> {
  return saveAuthoritativeState(userEmail, state);
}

export const subscribeToAppState = subscribeToRealtimeStateChanges;
