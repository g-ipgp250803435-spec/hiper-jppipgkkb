import {
  Navigate,
  useLocation,
} from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import {
  Button,
  Card,
  Notice,
} from '../components/UI'
import { config } from '../lib/config'
import { localise } from '../lib/siteSettings'

export default function LoginPage() {
  const {
    user,
    signInWithGoogle,
    authError,
    loading,
  } = useAuth()

  const { language, t } = useUi()
  const { settings } = useSiteSettings()
  const location = useLocation()

  const from =
    (
      location.state as {
        from?: string
      } | null
    )?.from || '/portal'

  const allowedDomains =
    config.allowedEmailDomains.join(', ')

  if (!loading && user) {
    return <Navigate to={from} replace />
  }

  return (
    <section className="section auth-section">
      <div className="container auth-grid">
        <div className="auth-copy">
          <p className="eyebrow">{localise(settings.pages.login.eyebrow, language)}</p>

          <h1>{localise(settings.pages.login.title, language)}</h1>

          <p>{localise(settings.pages.login.description, language)}</p>

          <ul className="check-list">
            <li>
              {t(
                'Semak semua permohonan dalam satu paparan',
                'Review all applications in one view',
              )}
            </li>

            <li>
              {t(
                'Terima status dan nota pentadbir',
                'Receive status and administrator notes',
              )}
            </li>

            <li>
              {t(
                'Akses panel admin bagi akaun yang dilantik',
                'Administrator access for appointed accounts',
              )}
            </li>
          </ul>
        </div>

        <Card className="login-card">
          <img
            src={settings.branding.logoUrl || '/hiper-logo.png'}
            className="login-logo"
            alt="HiPER"
          />

          <h2>
            {t(
              'Log masuk portal',
              'Portal sign in',
            )}
          </h2>

          <p>
            {t(
              'Domain siswa guru:',
              'Student teacher domain:',
            )}{' '}

            <strong>
              {allowedDomains ||
                t(
                  'Belum ditetapkan',
                  'Not configured',
                )}
            </strong>
          </p>

          {authError && (
            <Notice type="danger">
              {authError}
            </Notice>
          )}

          <Button
            onClick={() => {
              void signInWithGoogle()
            }}
            disabled={loading}
            className="google-button"
          >
            <span className="google-mark">
              G
            </span>

            {loading
              ? t(
                  'Memuatkan…',
                  'Loading…',
                )
              : t(
                  'Teruskan dengan Google',
                  'Continue with Google',
                )}
          </Button>

          <small>
            {t(
              'Akses dibenarkan untuk akaun DELIMa dan akaun pentadbir yang dilantik.',
              'Access is limited to DELIMa accounts and appointed administrator accounts.',
            )}
          </small>
        </Card>
      </div>
    </section>
  )
}
