import { useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { config, isSupabaseConfigured } from '../lib/config'
import { useUi } from '../contexts/UiContext'
import { useAuth } from '../contexts/AuthContext'
import { Button, Notice } from './UI'

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

  const handleSignOut = async () => {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
            <img src="/logo-mark.svg" alt="" />
            <span>
              <strong>{config.siteName}</strong>
              <small>PBAK · JPP IPGKKB</small>
            </span>
          </Link>

          <button
            className="menu-toggle"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={t('Buka menu', 'Open menu')}
            aria-expanded={menuOpen}
          >
            ☰
          </button>

          <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {language === 'bm' ? item.bm : item.en}
              </NavLink>
            ))}
            {user && (
              <NavLink to="/portal" onClick={() => setMenuOpen(false)}>
                {t('Portal Saya', 'My Portal')}
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" onClick={() => setMenuOpen(false)}>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="header-tools">
            <button
              className="tool-button"
              onClick={() => setLanguage(language === 'bm' ? 'en' : 'bm')}
              aria-label={t('Tukar bahasa', 'Switch language')}
            >
              {language === 'bm' ? 'EN' : 'BM'}
            </button>
            <button className="tool-button" onClick={toggleTheme} aria-label={t('Tukar tema', 'Switch theme')}>
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            {user ? (
              <div className="account-menu">
                <span className="account-name">{profile?.full_name || user.email}</span>
                <Button variant="ghost" onClick={handleSignOut}>
                  {t('Log keluar', 'Sign out')}
                </Button>
              </div>
            ) : (
              <Link className="button button-primary compact" to="/login">
                {t('Log masuk DELIMa', 'DELIMa sign in')}
              </Link>
            )}
          </div>
        </div>
      </header>

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
                <small>{config.institutionName}</small>
              </span>
            </div>
            <p>{t('Portal rasmi kebajikan dan perkhidmatan PBAK.', 'Official PBAK welfare and services portal.')}</p>
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
        <div className="container footer-bottom">© {new Date().getFullYear()} JPP IPG Kampus Kota Bharu</div>
      </footer>
    </div>
  )
}
