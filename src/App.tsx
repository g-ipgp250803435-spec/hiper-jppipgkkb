import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import IkesPage from './pages/IkesPage'
import KpkPage from './pages/KpkPage'
import TempahanPage from './pages/TempahanPage'
import AssetsPage from './pages/AssetsPage'
import DonationsPage from './pages/DonationsPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import OfficePage from './pages/OfficePage'
import PortalPage from './pages/PortalPage'
import AdminPage from './pages/AdminPage'
import DynamicPage from './pages/DynamicPage'
import { Card } from './components/UI'
import { useUi } from './contexts/UiContext'

function RouteMetaManager() {
  const location = useLocation()

  useEffect(() => {
    const routeTitles: Record<string, string> = {
      '/': 'HiPER | Hab Perbendaharaan Digital PBAK JPP IPGKKB',
      '/login': 'Log Masuk DELIMa | HiPER',
      '/ikes': 'iKES Care & Go-Home | HiPER',
      '/kpk': 'KPK+ Pinjaman Kecemasan | HiPER',
      '/tempahan': 'Tempahan Perkhidmatan | HiPER',
      '/tempahan/bilik-jpp': 'Kalendar & Tempahan Bilik JPP | HiPER',
      '/e-aset': 'Katalog e-Aset | HiPER',
      '/tabung-jumaat': 'Tabung Jumaat & Sumbangan | HiPER',
      '/pengumuman': 'Pengumuman Rasmi | HiPER',
      '/kenali-pejabat': 'Kenali Pejabat Bendahari | HiPER',
      '/organisasi': 'Carta Organisasi PBAK JPP | HiPER',
      '/portal': 'Portal Saya | HiPER',
      '/admin': 'Dashboard Pentadbir | HiPER',
    }

    const title = routeTitles[location.pathname] || 'HiPER | PBAK JPP IPGKKB'
    document.title = title

    let robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta')
      robotsMeta.name = 'robots'
      document.head.appendChild(robotsMeta)
    }

    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/portal')) {
      robotsMeta.content = 'noindex, nofollow'
    } else {
      robotsMeta.content = 'index, follow'
    }
  }, [location])

  return null
}

function NotFoundPage() {
  const { t } = useUi()
  return (
    <section className="section">
      <div className="container narrow-container">
        <Card>
          <div className="empty-state">
            <span className="empty-icon">404</span>
            <h1>{t('Halaman tidak ditemui', 'Page not found')}</h1>
            <a className="button button-primary" href="/">{t('Kembali ke utama', 'Return home')}</a>
          </div>
        </Card>
      </div>
    </section>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteMetaManager />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/ikes" element={<IkesPage />} />
          <Route path="/kpk" element={<KpkPage />} />
          <Route path="/tempahan" element={<TempahanPage />} />
          <Route path="/tempahan/bilik-jpp" element={<TempahanPage />} />
          <Route path="/e-aset" element={<AssetsPage />} />
          <Route path="/tabung-jumaat" element={<DonationsPage />} />
          <Route path="/pengumuman" element={<AnnouncementsPage />} />
          <Route path="/pengumuman/:id" element={<AnnouncementsPage />} />
          <Route path="/organisasi" element={<OfficePage />} />
          <Route path="/kenali-pejabat" element={<OfficePage />} />
          <Route path="/page/:slug" element={<DynamicPage />} />
          <Route path="/dasar-privasi" element={<DynamicPage />} />
          <Route path="/portal" element={<ProtectedRoute><PortalPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
