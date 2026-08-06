import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { config, isSupabaseConfigured } from '../lib/config'
import { useUi } from '../contexts/UiContext'
import { useAuth } from '../contexts/AuthContext'
import { Button, Notice } from './UI'
import { Icon, type IconName } from './Icons'

type NavigationItem = {
  to: string
  bm: string
  en: string
  icon: IconName
}

const publicNavItems: NavigationItem[] = [
  { to: '/', bm: 'Utama', en: 'Home', icon: 'dashboard' },
  { to: '/ikes', bm: 'iKES', en: 'iKES', icon: 'heart' },
  { to: '/e-aset', bm: 'e-Aset', en: 'e-Asset', icon: 'box' },
  { to: '/tabung-jumaat', bm: 'Tabung Jumaat', en: 'Friday Fund', icon: 'fund' },
  { to: '/pengumuman', bm: 'Pengumuman', en: 'Announcements', icon: 'megaphone' },
  { to: '/kenali-pejabat', bm: 'Kenali Pejabat', en: 'Our Office', icon: 'user' },
]

export function Layout({ children }: { children: ReactNode }) {
  const { language, setLanguage, theme, toggleTheme, t } = useUi()
  const { user, profile, isAdmin, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const accountNavItems: NavigationItem[] = [
    ...(user ? [{ to: '/portal', bm: 'Portal Saya', en: 'My Portal', icon: 'activity' as IconName }] : []),
    ...(isAdmin ? [{ to: '/admin', bm: 'Pentadbir', en: 'Admin', icon: 'dashboard' as IconName }] : []),
  ]

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen)

    if (menuOpen) {
      window.requestAnimationFrame(() => closeButtonRef.current?.focus())
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false)
        window.requestAnimationFrame(() => menuButtonRef.current?.focus())
      }
    }

    const closeBeyondMobile = () => {
      if (window.innerWidth > 820) setMenuOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', closeBeyondMobile)

    return () => {
      document.body.classList.remove('nav-open')
      window.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', closeBeyondMobile)
    }
  }, [menuOpen])

  const handleSignOut = async () => {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  const closeMenu = () => setMenuOpen(false)

  const renderDesktopLinks = () => (
    <>
      {publicNavItems.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
          {language === 'bm' ? item.bm : item.en}
        </NavLink>
      ))}
      {accountNavItems.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
          {language === 'bm' ? item.bm : item.en}
        </NavLink>
      ))}
    </>
  )

  const renderMobileLinks = (items: NavigationItem[]) =>
    items.map((item) => (
      <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="nav-v3-mobile-icon" aria-hidden="true">
          <Icon name={item.icon} size={19} />
        </span>
        <span className="nav-v3-mobile-label">{language === 'bm' ? item.bm : item.en}</span>
        <Icon name="chevron-right" size={18} className="nav-v3-mobile-chevron" />
      </NavLink>
    ))

  return (
    <div className="app-shell">
      <header className="site-header nav-v3-header">
        <div className="container header-inner nav-v3-inner">
          <Link className="brand nav-v3-brand" to="/" onClick={closeMenu} aria-label={t('Ke halaman utama HiPER', 'Go to HiPER home')}>
            <img src="/logo-mark.svg" alt="" />
            <span>
              <strong>{config.siteName}</strong>
              <small>{t('Hab Perbendaharaan Digital', 'Digital Treasury Hub')}</small>
            </span>
          </Link>

          <nav className="nav-v3-desktop" aria-label={t('Navigasi utama', 'Main navigation')}>
            {renderDesktopLinks()}
          </nav>

          <div className="nav-v3-actions">
            <button
              type="button"
              className="nav-v3-language"
              onClick={() => setLanguage(language === 'bm' ? 'en' : 'bm')}
              aria-label={t('Tukar bahasa ke English', 'Switch language to Bahasa Melayu')}
              role="switch"
              aria-checked={language === 'en'}
            >
              <span className={language === 'bm' ? 'active' : ''}>BM</span>
              <span className="nav-v3-language-track" aria-hidden="true"><span /></span>
              <span className={language === 'en' ? 'active' : ''}>EN</span>
            </button>

            <button type="button" className="nav-v3-icon-button" onClick={toggleTheme} aria-label={t('Tukar tema', 'Switch theme')}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>

            {user ? (
              <div className="nav-v3-desktop-account">
                <span className="nav-v3-account-name">{profile?.full_name || user.email}</span>
                <Button variant="ghost" onClick={() => void handleSignOut()} className="compact nav-v3-signout">
                  <Icon name="logout" size={17} />
                  {t('Log keluar', 'Sign out')}
                </Button>
              </div>
            ) : (
              <Link className="button button-primary compact nav-v3-desktop-login" to="/login">
                <Icon name="login" size={17} />
                {t('Log masuk DELIMa', 'DELIMa sign in')}
              </Link>
            )}

            <button
              ref={menuButtonRef}
              type="button"
              className="nav-v3-menu-button"
              onClick={() => setMenuOpen(true)}
              aria-label={t('Buka menu', 'Open menu')}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
            >
              <Icon name="menu" size={21} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <button type="button" className="nav-v3-backdrop" onClick={closeMenu} aria-label={t('Tutup menu', 'Close menu')} />

          <aside id="mobile-navigation" className="nav-v3-drawer" role="dialog" aria-modal="true" aria-label={t('Menu navigasi HiPER', 'HiPER navigation menu')}>
            <div className="nav-v3-drawer-header">
              <Link className="nav-v3-drawer-brand" to="/" onClick={closeMenu}>
                <img src="/logo-mark.svg" alt="" />
                <span>
                  <strong>HiPER</strong>
                  <small>{t('Hab Perbendaharaan Digital', 'Digital Treasury Hub')}</small>
                </span>
              </Link>
              <button ref={closeButtonRef} type="button" className="nav-v3-close-button" onClick={closeMenu} aria-label={t('Tutup menu', 'Close menu')}>
                <Icon name="close" size={21} />
              </button>
            </div>

            <div className="nav-v3-drawer-body">
              <span className="nav-v3-section-label">{t('Navigasi utama', 'Main navigation')}</span>
              <nav className="nav-v3-mobile-links" aria-label={t('Navigasi telefon', 'Mobile navigation')}>
                {renderMobileLinks(publicNavItems)}
              </nav>

              {accountNavItems.length > 0 && (
                <>
                  <span className="nav-v3-section-label nav-v3-account-section-label">{t('Akaun dan pengurusan', 'Account and management')}</span>
                  <nav className="nav-v3-mobile-links" aria-label={t('Navigasi akaun', 'Account navigation')}>
                    {renderMobileLinks(accountNavItems)}
                  </nav>
                </>
              )}
            </div>

            <div className="nav-v3-drawer-footer">
              {user ? (
                <>
                  <div className="nav-v3-mobile-account-copy">
                    <span>{t('Akaun aktif', 'Signed in')}</span>
                    <strong>{profile?.full_name || user.email}</strong>
                  </div>
                  <Button variant="secondary" onClick={() => void handleSignOut()} className="nav-v3-mobile-auth">
                    <Icon name="logout" size={18} />
                    {t('Log keluar', 'Sign out')}
                  </Button>
                </>
              ) : (
                <Link className="button button-primary nav-v3-mobile-auth" to="/login" onClick={closeMenu}>
                  <Icon name="login" size={18} />
                  {t('Log masuk DELIMa', 'DELIMa sign in')}
                </Link>
              )}
            </div>
          </aside>
        </>
      )}

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
