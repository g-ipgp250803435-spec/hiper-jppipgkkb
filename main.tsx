import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { UiProvider } from './contexts/UiContext'
import { AuthProvider } from './contexts/AuthContext'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UiProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </UiProvider>
  </StrictMode>,
)
