import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';
import { logger } from '../utils/logger';

const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export let supabaseAdmin: SupabaseClient | null = null;
export let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && serviceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  logger.info('Supabase Admin Client initialized (Service Role)');
} else if (!serviceRoleKey) {
  logger.warn('SUPABASE_SERVICE_ROLE_KEY missing; admin client disabled');
}

if (supabaseUrl && anonKey) {
  supabaseClient = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
    },
  });
  logger.info('Supabase Public Client initialized (Anon)');
} else if (!anonKey) {
  logger.warn('SUPABASE_ANON_KEY missing; public client disabled');
}
