import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { config, isSupabaseConfigured } from '../lib/config'
import { useUi } from '../contexts/UiContext'
import { useAuth } from '../contexts/AuthContext'
import { Button, Notice } from './UI'
import { Icon } from './Icons'

const navItems = [
  { to: '/', bm: 'Utama', en: 'Home' },
  { to: '/ikes', bm: 'iKES', en: 'iKES' },
  { to: '/e-aset', bm: 'e-Aset', en: 'e-Asset' },
  { to: '/tabung-jumaat', bm: 'Tabung Jumaat', en: 'Friday Fund' },
  { to: '/pengumuman', bm: 'Pengumuman', en: 'Announcements' },
  { to: '/kenali-pejabat', bm: 'Kenali Pejabat', en: 'Our Office' },
]

export function Layout({ children }: { children: ReactNode }) {
  const { language, setLanguage, theme, toggleTheme, t } = useUi()
  const { user, profile, isAdmin, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen)
    return () => document.body.classList.remove('nav-open')
  }, [menuOpen])

  const handleSignOut = async () => {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" to="/" onClick={closeMenu} aria-label={t('Ke halaman utama HiPER', 'Go to HiPER home')}>
            <img src="/logo-mark.svg" alt="" />
            <span>
              <strong>{config.siteName}</strong>
              <small>{t('Hab Perbendaharaan Digital', 'Digital Treasury Hub')}</small>
            </span>
          </Link>

          <nav id="main-navigation" className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label={t('Navigasi utama', 'Main navigation')}>
            <div className="mobile-nav-heading">
              <span>{t('Menu HiPER', 'HiPER menu')}</span>
              <button className="mobile-nav-close" onClick={closeMenu} aria-label={t('Tutup menu', 'Close menu')}>
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="nav-links">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={closeMenu}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  {language === 'bm' ? item.bm : item.en}
                </NavLink>
              ))}
              {user && (
                <NavLink to="/portal" onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>
                  {t('Portal Saya', 'My Portal')}
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/admin" onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>
                  {t('Pentadbir', 'Admin')}
                </NavLink>
              )}
            </div>

            <div className="mobile-account-panel">
              {user ? (
                <>
                  <div className="mobile-account-copy">
                    <span>{t('Akaun aktif', 'Signed in')}</span>
                    <strong>{profile?.full_name || user.email}</strong>
                  </div>
                  <Button variant="secondary" onClick={() => void handleSignOut()} className="mobile-auth-button">
                    <Icon name="logout" size={18} />
                    {t('Log keluar', 'Sign out')}
                  </Button>
                </>
              ) : (
                <Link className="button button-primary mobile-auth-button" to="/login" onClick={closeMenu}>
                  <Icon name="login" size={18} />
                  {t('Log masuk DELIMa', 'DELIMa sign in')}
                </Link>
              )}
            </div>
          </nav>

          <div className="header-tools">
            <button
              className="language-switch"
              onClick={() => setLanguage(language === 'bm' ? 'en' : 'bm')}
              aria-label={t('Tukar bahasa ke English', 'Switch language to Bahasa Melayu')}
              role="switch"
              aria-checked={language === 'en'}
            >
              <span className={language === 'bm' ? 'active' : ''}>BM</span>
              <span className="language-switch-track" aria-hidden="true"><span /></span>
              <span className={language === 'en' ? 'active' : ''}>EN</span>
            </button>
            <button className="tool-button" onClick={toggleTheme} aria-label={t('Tukar tema', 'Switch theme')}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>
            {user ? (
              <div className="account-menu desktop-account-menu">
                <span className="account-name">{profile?.full_name || user.email}</span>
                <Button variant="ghost" onClick={() => void handleSignOut()} className="compact">
                  <Icon name="logout" size={17} />
                  {t('Log keluar', 'Sign out')}
                </Button>
              </div>
            ) : (
              <Link className="button button-primary compact desktop-login-button" to="/login">
                <Icon name="login" size={17} />
                {t('Log masuk DELIMa', 'DELIMa sign in')}
              </Link>
            )}
          </div>

          <button
            className="menu-toggle"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? t('Tutup menu', 'Close menu') : t('Buka menu', 'Open menu')}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={20} />
          </button>
        </div>
      </header>

      {menuOpen && <button className="nav-backdrop" onClick={closeMenu} aria-label={t('Tutup menu', 'Close menu')} />}

      {!isSupabaseConfigured && (
        <div className="container demo-notice-wrap">
          <Notice type="warning">
            <strong>Mod persediaan:</strong> Supabase belum disambungkan. Kandungan contoh dipaparkan dan borang belum boleh dihantar.
          </Notice>
        </div>
      )}

      <main>{children}</main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <div className="brand footer-brand">
              <img src="/logo-mark.svg" alt="" />
              <span>
                <strong>{config.siteName}</strong>
                <small>{t('Hab Perbendaharaan Digital', 'Digital Treasury Hub')}</small>
              </span>
            </div>
            <p>{t('Portal rasmi perbendaharaan, kebajikan dan perkhidmatan PBAK.', 'Official PBAK treasury, welfare and services portal.')}</p>
          </div>
          <div>
            <strong>{t('Pautan pantas', 'Quick links')}</strong>
            <Link to="/pengumuman">{t('Pengumuman', 'Announcements')}</Link>
            <Link to="/portal">{t('Semak permohonan', 'Check applications')}</Link>
            <Link to="/kenali-pejabat">{t('Kenali Pejabat', 'Our Office')}</Link>
          </div>
          <div>
            <strong>{t('Makluman', 'Notice')}</strong>
            <p>{t('Kelulusan tertakluk kepada semakan dan peraturan semasa PBAK.', 'Approval is subject to current PBAK review and rules.')}</p>
          </div>
        </div>
        <div className="container footer-bottom">© {new Date().getFullYear()} PBAK · JPP IPG Kampus Kota Bharu</div>
      </footer>
    </div>
  )
}
