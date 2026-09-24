import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { LoadingBlock, Notice, Button, Card } from '../components/UI'
import { Icon } from '../components/Icons'

export default function AuthCallbackPage() {
  const { user, authError, loading, isAdmin } = useAuth()
  const { t } = useUi()
  const navigate = useNavigate()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      navigate(isAdmin ? '/admin' : '/portal', { replace: true })
    }
  }, [loading, user, isAdmin, navigate])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) setTimedOut(true)
    }, 6000)
    return () => clearTimeout(timer)
  }, [user])

  return (
    <section className="section align-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container narrow-container" style={{ maxWidth: '500px', width: '100%' }}>
        <Card>
          {authError ? (
            <div className="stack align-center text-center" style={{ gap: '16px', padding: '16px 8px' }}>
              <div style={{ background: 'var(--danger-bg, #fee2e2)', color: 'var(--danger, #dc2626)', padding: '14px', borderRadius: '50%' }}>
                <Icon name="alert" size={32} />
              </div>
              <h3>{t('Pengesahan Akses Gagal', 'Authentication Failed')}</h3>
              <Notice type="danger">{authError}</Notice>
              <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
                {t('Sila pastikan anda menggunakan akaun Google DELIMa rasmi (@ipgm.edu.my atau @moe-dl.edu.my).', 'Please ensure you sign in with an official Google DELIMa account (@ipgm.edu.my or @moe-dl.edu.my).')}
              </p>
              <div style={{ marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link className="button button-primary" to="/login">
                  <Icon name="user" size={16} />
                  {t('Cuba Log Masuk Semula', 'Try Signing In Again')}
                </Link>
                <Link className="button button-secondary" to="/">
                  {t('Halaman Utama', 'Home Page')}
                </Link>
              </div>
            </div>
          ) : timedOut && !user ? (
            <div className="stack align-center text-center" style={{ gap: '16px', padding: '16px 8px' }}>
              <Icon name="alert" size={32} style={{ color: 'var(--gold-primary)' }} />
              <h3>{t('Proses Log Masuk Mengambil Masa', 'Sign In Taking Longer Than Expected')}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
                {t('Sesi log masuk belum dapat disahkan. Sila kembali ke halaman log masuk.', 'Sign in session could not be verified yet. Please return to the sign in page.')}
              </p>
              <div style={{ marginTop: '12px' }}>
                <Link className="button button-primary" to="/login">
                  {t('Kembali ke Halaman Log Masuk', 'Return to Login Page')}
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ padding: '24px 8px' }}>
              <LoadingBlock label={t('Mengesahkan akaun DELIMa dan menyediakan sesi…', 'Verifying DELIMa account and preparing session…')} />
            </div>
          )}
        </Card>
      </div>
    </section>
  )
}
