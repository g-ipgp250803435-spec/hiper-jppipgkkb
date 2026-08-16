import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured } from '../lib/config'
import { LoadingBlock } from './UI'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingBlock />
  if (!isSupabaseConfigured) return <>{children}</>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <LoadingBlock />
  if (!isSupabaseConfigured) return <>{children}</>
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/portal" replace />
  return <>{children}</>
}
