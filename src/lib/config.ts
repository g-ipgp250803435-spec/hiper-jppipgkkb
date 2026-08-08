type HiPERImportMetaEnv = {
  readonly VITE_SITE_NAME?: string
  readonly VITE_INSTITUTION_NAME?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_ALLOWED_EMAIL_DOMAINS?: string
}

const env = (import.meta as ImportMeta & { readonly env: HiPERImportMetaEnv }).env

export const config = {
  siteName: env.VITE_SITE_NAME || 'HiPER',
  institutionName: env.VITE_INSTITUTION_NAME || 'IPG Kampus Kota Bharu',
  supabaseUrl: env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || '',
  allowedEmailDomains: (env.VITE_ALLOWED_EMAIL_DOMAINS || 'moe-dl.edu.my')
    .split(',')
    .map((value: string) => value.trim().toLowerCase())
    .filter(Boolean),
}

export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey)
