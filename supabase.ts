import { createClient } from '@supabase/supabase-js'
import { config, isSupabaseConfigured } from './config'

const fallbackUrl = 'https://placeholder.supabase.co'
const fallbackKey = 'placeholder-anon-key'

export const supabase = createClient(
  isSupabaseConfigured ? config.supabaseUrl : fallbackUrl,
  isSupabaseConfigured ? config.supabaseAnonKey : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
