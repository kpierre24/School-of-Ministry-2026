import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mjaloptcpeytvecbxbza.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qYWxvcHRjcGV5dHZlY2J4YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MjQ1NjksImV4cCI6MjEwMTAwMDU2OX0.0eT8NJxGDMsPzh-y3w4LEt-oFxwkfiEIizBUY67DaFE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
