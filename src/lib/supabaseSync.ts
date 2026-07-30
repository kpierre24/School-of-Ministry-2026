import { supabase } from './supabaseClient';
import { SyncedAppState } from './firebaseSync';

export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('app_states').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        console.warn("app_states table does not exist in Supabase yet.");
        return false;
      }
      throw error;
    }
    return true;
  } catch (err) {
    console.error("Error testing Supabase connection:", err);
    return false;
  }
}

export async function loadFromSupabase(userEmail: string | null | undefined): Promise<SyncedAppState | null> {
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
      if (error.code === 'PGRST116') {
        // Record not found
        return null;
      }
      if (error.code === '42P01') {
        throw new Error('TABLE_NOT_FOUND');
      }
      throw error;
    }

    return data?.state || null;
  } catch (error: any) {
    if (error.message === 'TABLE_NOT_FOUND') {
      throw error;
    }
    console.error("Error loading state from Supabase:", error);
    return null;
  }
}

export async function saveToSupabase(
  userEmail: string | null | undefined,
  state: SyncedAppState
): Promise<boolean> {
  try {
    const docId = userEmail 
      ? `user_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` 
      : 'shared_default_state';

    const timestamp = new Date().toISOString();
    const updater = userEmail || 'anonymous';

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
        throw new Error('TABLE_NOT_FOUND');
      }
      throw error;
    }

    return true;
  } catch (error: any) {
    if (error.message === 'TABLE_NOT_FOUND') {
      throw error;
    }
    console.error("Error saving state to Supabase:", error);
    return false;
  }
}
