import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '../lib/config'
import { localise } from '../lib/siteSettings'
import { useUi } from '../contexts/UiContext'
import { useAuth } from '../contexts/AuthContext'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import { Button, Notice } from './UI'
import { Icon, type IconName } from './Icons'

type NavigationItem = {
  to: string
  label: { bm: string; en: string }
  icon: IconName
}

export function Layout({ children }: { children: ReactNode }) {
  const { language, setLanguage, theme, toggleTheme, t } = useUi()
  const { settings } = useSiteSettings()
  const { user, isAdmin, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const publicNavItems: NavigationItem[] = [
    { to: '/', label: settings.navigation.home, icon: 'dashboard' },
    { to: '/e-aset', label: settings.navigation.assets, icon: 'box' },
    { to: '/ikes', label: settings.navigation.ikes, icon: 'heart' },
    { to: '/tabung-jumaat', label: settings.navigation.fund, icon: 'fund' },
    { to: '/pengumuman', label: settings.navigation.announcements, icon: 'megaphone' },
    { to: '/kenali-pejabat', label: settings.navigation.office, icon: 'building' },
  ]

  const accountNavItems: NavigationItem[] = [
    ...(user ? [{ to: '/portal', label: settings.navigation.portal, icon: 'briefcase' as IconName }] : []),
    ...(isAdmin ? [{ to: '/admin', label: settings.navigation.admin, icon: 'user' as IconName }] : []),
  ]

  useEffect(() => setMenuOpen(false), [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen)
    if (menuOpen) window.requestAnimationFrame(() => closeButtonRef.current?.focus())

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

  const renderMobileLinks = (items: NavigationItem[]) =>
    items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/'}
        onClick={() => setMenuOpen(false)}
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        <span className="nav-mobile-icon"><Icon name={item.icon} size={19} /></span>
        <span>{localise(item.label, language)}</span>
        <Icon name="chevron-right" size={17} className="nav-mobile-chevron" />
      </NavLink>
    ))

  return (
    <div className="app-shell">
      {settings.announcementBar.enabled && (
        <div className="announcement-strip">
          <div className="container announcement-strip-inner">
            <div className="announcement-strip-copy">
              <span className="announcement-strip-badge">{localise(settings.announcementBar.badge, language)}</span>
              <span>{localise(settings.announcementBar.text, language)}</span>
            </div>
            {settings.announcementBar.linkUrl && (
              <Link to={settings.announcementBar.linkUrl} className="announcement-strip-link">
                {localise(settings.announcementBar.linkLabel, language)}
                <Icon name="chevron-right" size={15} />
              </Link>
            )}
          </div>
        </div>
      )}

      <header className="site-header premium-header">
        <div className="container premium-header-main">
          <Link className="premium-brand" to="/" aria-label={t('Ke halaman utama HiPER', 'Go to HiPER home')}>
            <img src={settings.branding.logoUrl || '/hiper-logo.png'} alt="" />
            <span>
              <strong>{settings.branding.siteName}</strong>
              <small>{localise(settings.branding.tagline, language)}</small>
            </span>
          </Link>

          <div className="premium-header-actions">
            <button
              type="button"
              className="language-toggle"
              onClick={() => setLanguage(language === 'bm' ? 'en' : 'bm')}
              aria-label={t('Tukar bahasa ke English', 'Switch language to Bahasa Melayu')}
              role="switch"
              aria-checked={language === 'en'}
            >
              <span className={language === 'bm' ? 'active' : ''}>BM</span>
              <span className={language === 'en' ? 'active' : ''}>EN</span>
            </button>

            <button type="button" className="header-icon-button" onClick={toggleTheme} aria-label={t('Tukar tema', 'Switch theme')}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
            </button>

            {user ? (
              <>
                <Link className="header-pill header-portal-pill" to="/portal">
                  <Icon name="briefcase" size={17} />
                  <span>{localise(settings.navigation.portal, language)}</span>
                </Link>
                {isAdmin && (
                  <Link className="header-pill header-admin-pill" to="/admin">
                    <Icon name="user" size={17} />
                    <span>{localise(settings.navigation.admin, language)}</span>
                  </Link>
                )}
                <button type="button" className="header-icon-button desktop-signout" onClick={() => void handleSignOut()} aria-label={t('Log keluar', 'Sign out')} title={t('Log keluar', 'Sign out')}>
                  <Icon name="logout" size={18} />
                </button>
              </>
            ) : (
              <Link className="header-pill header-login-pill" to="/login">
                <Icon name="login" size={17} />
                <span>{t('Log masuk DELIMa', 'DELIMa sign in')}</span>
              </Link>
            )}

            <button
              ref={menuButtonRef}
              type="button"
              className="mobile-menu-button"
              onClick={() => setMenuOpen(true)}
              aria-label={t('Buka menu', 'Open menu')}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
            >
              <Icon name="menu" size={21} />
            </button>
          </div>
        </div>

        <div className="premium-nav-row">
          <nav className="container premium-desktop-nav" aria-label={t('Navigasi utama', 'Main navigation')}>
            {publicNavItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
                {localise(item.label, language)}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {menuOpen && (
        <>
          <button type="button" className="mobile-nav-backdrop" onClick={() => setMenuOpen(false)} aria-label={t('Tutup menu', 'Close menu')} />
          <aside id="mobile-navigation" className="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label={t('Menu navigasi HiPER', 'HiPER navigation menu')}>
            <div className="mobile-nav-header">
              <Link className="mobile-nav-brand" to="/" onClick={() => setMenuOpen(false)}>
                <img src={settings.branding.logoUrl || '/hiper-logo.png'} alt="" />
                <span>
                  <strong>{settings.branding.siteName}</strong>
                  <small>{localise(settings.branding.fullName, language)}</small>
                </span>
              </Link>
              <button ref={closeButtonRef} type="button" className="mobile-nav-close" onClick={() => setMenuOpen(false)} aria-label={t('Tutup menu', 'Close menu')}>
                <Icon name="close" size={21} />
              </button>
            </div>

            <div className="mobile-nav-body">
              <span className="mobile-nav-label">{t('Navigasi utama', 'Main navigation')}</span>
              <nav className="mobile-nav-links">{renderMobileLinks(publicNavItems)}</nav>
              {accountNavItems.length > 0 && (
                <>
                  <span className="mobile-nav-label mobile-nav-account-label">{t('Akaun dan pengurusan', 'Account and management')}</span>
                  <nav className="mobile-nav-links">{renderMobileLinks(accountNavItems)}</nav>
                </>
              )}
            </div>

            <div className="mobile-nav-footer">
              {user ? (
                <Button variant="secondary" onClick={() => void handleSignOut()} className="mobile-auth-button">
                  <Icon name="logout" size={18} /> {t('Log keluar', 'Sign out')}
                </Button>
              ) : (
                <Link className="button button-primary mobile-auth-button" to="/login" onClick={() => setMenuOpen(false)}>
                  <Icon name="login" size={18} /> {t('Log masuk DELIMa', 'DELIMa sign in')}
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

      <section className="footer-band">
        <div className="container footer-band-inner">
          <div>
            <p className="eyebrow light-eyebrow">{localise(location.pathname === '/' ? settings.home.officeEyebrow : settings.footer.bandEyebrow, language)}</p>
            <h2>{localise(location.pathname === '/' ? settings.home.officeTitle : settings.footer.bandTitle, language)}</h2>
            <p>{localise(location.pathname === '/' ? settings.home.officeDescription : settings.footer.bandDescription, language)}</p>
          </div>
          <Link className="button button-gold" to="/kenali-pejabat">
            {localise(location.pathname === '/' ? settings.home.officeCtaLabel : settings.footer.bandCtaLabel, language)} <Icon name="chevron-right" size={17} />
          </Link>
        </div>
      </section>

      <footer className="site-footer premium-footer">
        <div className="container premium-footer-grid">
          <div className="premium-footer-brand-block">
            <div className="premium-footer-brand">
              <img src={settings.branding.logoUrl || '/hiper-logo.png'} alt="" />
              <div>
                <strong>{localise(settings.branding.fullName, language)}</strong>
                <p>{localise(settings.footer.brandDescription, language)}</p>
              </div>
            </div>
          </div>
          <div className="premium-footer-links">
            <strong>{t('Pautan', 'Links')}</strong>
            <Link to={settings.footer.privacyUrl || '#'}>{localise(settings.footer.privacyLabel, language)}</Link>
            {isAdmin && <Link to="/admin">{localise(settings.navigation.admin, language)}</Link>}
            <Link to="/pengumuman">{localise(settings.navigation.announcements, language)}</Link>
          </div>
          <div className="premium-footer-contact">
            <strong>{localise(settings.footer.contactTitle, language)}</strong>
            <b>{localise(settings.footer.officeName, language)}</b>
            <p className="preserve-lines">{settings.footer.address}</p>
            {settings.footer.email && <a href={`mailto:${settings.footer.email}`}>{settings.footer.email}</a>}
          </div>
        </div>
        <div className="container premium-footer-bottom">
          <span>© {new Date().getFullYear()} {localise(settings.footer.copyright, language)}</span>
          <span className="system-status">HiPER Operations · {t('Sistem beroperasi', 'System operational')}</span>
          <span>{settings.footer.versionLabel}</span>
        </div>
      </footer>
    </div>
  )
}
