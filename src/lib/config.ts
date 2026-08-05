export const config = {
  siteName: import.meta.env.VITE_SITE_NAME || 'PBAK One',
  institutionName: import.meta.env.VITE_INSTITUTION_NAME || 'IPG Kampus Kota Bharu',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  allowedEmailDomains: (import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS || 'moe-dl.edu.my')
    .split(',')
    .map((value: string) => value.trim().toLowerCase())
    .filter(Boolean),
}

export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey)
