import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { Button, Card, Notice } from '../components/UI'
import { config } from '../lib/config'

export default function LoginPage() {
  const { user, signInWithGoogle, authError, loading } = useAuth()
  const { t } = useUi()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/portal'

  if (user) return <Navigate to={from} replace />

  return (
    <section className="section auth-section">
      <div className="container auth-grid">
        <div className="auth-copy">
          <p className="eyebrow">PBAK ONE</p>
          <h1>{t('Akses khas siswa guru IPGKKB', 'Exclusive access for IPGKKB student teachers')}</h1>
          <p>
            {t(
              'Gunakan akaun DELIMa untuk menghantar permohonan dan menyemak status secara selamat.',
              'Use your DELIMa account to submit applications and securely check their status.',
            )}
          </p>
          <ul className="check-list">
            <li>{t('Semak semua permohonan dalam satu paparan', 'Review all applications in one view')}</li>
            <li>{t('Terima status dan nota pentadbir', 'Receive status and admin notes')}</li>
            <li>{t('Akses panel admin bagi akaun yang dilantik', 'Admin access for assigned accounts')}</li>
          </ul>
        </div>
        <Card className="login-card">
          <img src="/logo-mark.svg" className="login-logo" alt="PBAK One" />
          <h2>{t('Log masuk DELIMa', 'DELIMa sign in')}</h2>
          <p>{t('Domain yang dibenarkan:', 'Allowed domain:')} <strong>{config.allowedEmailDomains.join(', ')}</strong></p>
          {authError && <Notice type="danger">{authError}</Notice>}
          <Button onClick={() => void signInWithGoogle()} disabled={loading} className="google-button">
            <span className="google-mark">G</span>
            {loading ? t('Memuatkan…', 'Loading…') : t('Teruskan dengan Google', 'Continue with Google')}
          </Button>
          <small>{t('Akaun Google peribadi akan ditolak oleh sistem.', 'Personal Google accounts will be rejected by the system.')}</small>
        </Card>
      </div>
    </section>
  )
}
