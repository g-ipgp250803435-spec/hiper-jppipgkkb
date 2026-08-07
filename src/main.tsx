import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { UiProvider } from './contexts/UiContext'
import { AuthProvider } from './contexts/AuthContext'
import { SiteSettingsProvider } from './contexts/SiteSettingsContext'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UiProvider>
      <SiteSettingsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SiteSettingsProvider>
    </UiProvider>
  </StrictMode>,
)
