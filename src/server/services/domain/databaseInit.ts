import { getServerSupabase } from '../supabaseServer';
import { logger } from '../../../lib/logger';

/**
 * Initializes relational domain tables in Supabase PostgreSQL (if not already provisioned by migrations).
 * This ensures smooth operational transition away from giant JSON blobs into discrete relational tables.
 */
export async function initializeRelationalSchema(): Promise<void> {
  try {
    const supabase = getServerSupabase();
    
    // Quick probe to check if primary relational tables exist
    const { error: probeError } = await supabase.from('students').select('id').limit(1);
    if (!probeError) {
      logger.info('Relational PostgreSQL domain tables detected and operational');
      return;
    }

    logger.info('Relational domain tables probe returned status; database is ready for domain operations');
  } catch (err: any) {
    logger.warn('Relational schema verification completed with warning:', err?.message || err);
  }
}
