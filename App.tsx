import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import IkesPage from './pages/IkesPage'
import AssetsPage from './pages/AssetsPage'
import DonationsPage from './pages/DonationsPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import OfficePage from './pages/OfficePage'
import PortalPage from './pages/PortalPage'
import AdminPage from './pages/AdminPage'
import { Card } from './components/UI'
import { useUi } from './contexts/UiContext'

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
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/ikes" element={<IkesPage />} />
          <Route path="/e-aset" element={<AssetsPage />} />
          <Route path="/tabung-jumaat" element={<DonationsPage />} />
          <Route path="/pengumuman" element={<AnnouncementsPage />} />
          <Route path="/kenali-pejabat" element={<OfficePage />} />
          <Route path="/portal" element={<ProtectedRoute><PortalPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
