import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingBlock, Notice } from '../components/UI'

export default function AuthCallbackPage() {
  const { user, authError, loading, isAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) navigate(isAdmin ? '/admin' : '/portal', { replace: true })
  }, [loading, user, isAdmin, navigate])

  return (
    <section className="section">
      <div className="container narrow-container">
        {authError ? <Notice type="danger">{authError}</Notice> : <LoadingBlock label="Mengesahkan akaun DELIMa…" />}
      </div>
    </section>
  )
}
