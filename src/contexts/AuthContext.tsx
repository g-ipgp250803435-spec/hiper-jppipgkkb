import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { config, isSupabaseConfigured } from '../lib/config'
import type { Profile } from '../lib/types'

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  authError: string | null
  isAdmin: boolean
  isAllowedDomain: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const emailDomainAllowed = (email?: string | null) => {
  if (!email) return false
  const domain = email.split('@')[1]?.toLowerCase()
  return config.allowedEmailDomains.length === 0 || config.allowedEmailDomains.includes(domain)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) throw error
    setProfile((data as Profile | null) ?? null)
  }, [])

  const processSession = useCallback(
    async (nextSession: Session | null) => {
      setSession(nextSession)
      setAuthError(null)

      if (!nextSession?.user) {
        setProfile(null)
        return
      }

      if (!emailDomainAllowed(nextSession.user.email)) {
        setProfile(null)
        setAuthError(
          `Akaun ${nextSession.user.email || ''} tidak menggunakan domain DELIMa yang dibenarkan.`,
        )
        await supabase.auth.signOut()
        return
      }

      try {
        await loadProfile(nextSession.user.id)
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Profil tidak dapat dimuatkan.')
      }
    },
    [loadProfile],
  )

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setAuthError(error.message)
      void processSession(data.session).finally(() => setLoading(false))
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void processSession(nextSession)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [processSession])

  const signInWithGoogle = async () => {
    setAuthError(null)
    if (!isSupabaseConfigured) {
      setAuthError('Supabase belum dikonfigurasi. Isi pemboleh ubah persekitaran terlebih dahulu.')
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
          ...(config.allowedEmailDomains[0] ? { hd: config.allowedEmailDomains[0] } : {}),
        },
      },
    })
    if (error) setAuthError(error.message)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      loading,
      authError,
      isAdmin: profile?.role === 'admin',
      isAllowedDomain: emailDomainAllowed(session?.user.email),
      signInWithGoogle,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, authError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
