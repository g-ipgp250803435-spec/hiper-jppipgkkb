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

const emailDomainAllowed = (
  email?: string | null,
): boolean => {
  if (!email) return false

  const domain = email
    .trim()
    .toLowerCase()
    .split('@')[1]

  if (!domain) return false

  const allowedDomains =
    config.allowedEmailDomains.map((allowedDomain) =>
      allowedDomain.trim().toLowerCase(),
    )

  return allowedDomains.includes(domain)
}

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [session, setSession] =
    useState<Session | null>(null)

  const [profile, setProfile] =
    useState<Profile | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [authError, setAuthError] =
    useState<string | null>(null)

  const loadProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error

      const nextProfile =
        (data as Profile | null) ?? null

      setProfile(nextProfile)

      return nextProfile
    },
    [],
  )

  const processSession = useCallback(
    async (nextSession: Session | null) => {
      setAuthError(null)

      if (!nextSession?.user) {
        setSession(null)
        setProfile(null)
        return
      }

      try {
        const nextProfile = await loadProfile(
          nextSession.user.id,
        )

        const allowedDomain =
          emailDomainAllowed(
            nextSession.user.email,
          )

        const appointedAdmin =
          nextProfile?.role === 'admin'

        const accessAllowed =
          allowedDomain || appointedAdmin

        if (!accessAllowed) {
          const rejectedEmail =
            nextSession.user.email ||
            'tidak diketahui'

          setSession(null)
          setProfile(null)

          setAuthError(
            `Akaun ${rejectedEmail} tidak dibenarkan mengakses portal ini.`,
          )

          const { error: signOutError } =
            await supabase.auth.signOut()

          if (signOutError) {
            console.error(
              'Gagal menamatkan sesi:',
              signOutError.message,
            )
          }

          return
        }

        setSession(nextSession)
      } catch (error) {
        setSession(null)
        setProfile(null)

        setAuthError(
          error instanceof Error
            ? error.message
            : 'Profil tidak dapat dimuatkan.',
        )
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

    const initialiseSession = async () => {
      const { data, error } =
        await supabase.auth.getSession()

      if (!active) return

      if (error) {
        setAuthError(error.message)
        setLoading(false)
        return
      }

      await processSession(data.session)

      if (active) {
        setLoading(false)
      }
    }

    void initialiseSession()

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, nextSession) => {
          if (!active) return

          setLoading(true)

          window.setTimeout(() => {
            if (!active) return

            void processSession(nextSession)
              .finally(() => {
                if (active) {
                  setLoading(false)
                }
              })
          }, 0)
        },
      )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [processSession])

  const signInWithGoogle =
    useCallback(async () => {
      setAuthError(null)

      if (!isSupabaseConfigured) {
        setAuthError(
          'Supabase belum dikonfigurasi. Isi pemboleh ubah persekitaran terlebih dahulu.',
        )
        return
      }

      setLoading(true)

      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo:
              `${window.location.origin}/auth/callback`,
            queryParams: {
              prompt: 'select_account',
            },
          },
        })

      if (error) {
        setAuthError(error.message)
        setLoading(false)
      }
    }, [])

  const signOut = useCallback(async () => {
    setLoading(true)
    setAuthError(null)

    const { error } =
      await supabase.auth.signOut()

    if (error) {
      setAuthError(error.message)
      setLoading(false)
      return
    }

    setSession(null)
    setProfile(null)
    setLoading(false)
  }, [])

  const refreshProfile =
    useCallback(async () => {
      if (!session?.user) return

      try {
        await loadProfile(session.user.id)
      } catch (error) {
        setAuthError(
          error instanceof Error
            ? error.message
            : 'Profil tidak dapat dikemas kini.',
        )
      }
    }, [session?.user, loadProfile])

  const hasPortalAccess =
    emailDomainAllowed(session?.user.email) ||
    profile?.role === 'admin'

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      loading,
      authError,
      isAdmin: profile?.role === 'admin',
      isAllowedDomain: hasPortalAccess,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }),
    [
      session,
      profile,
      loading,
      authError,
      hasPortalAccess,
      signInWithGoogle,
      signOut,
      refreshProfile,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    )
  }

  return context
}
