import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PROJECT_URL || '';
const supabaseAnonKey = process.env.ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

