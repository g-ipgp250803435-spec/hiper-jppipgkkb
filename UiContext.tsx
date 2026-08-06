import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Language, Theme } from '../lib/types'

interface UiContextValue {
  language: Language
  setLanguage: (language: Language) => void
  theme: Theme
  toggleTheme: () => void
  t: (bm: string, en: string) => string
}

const UiContext = createContext<UiContextValue | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('pbak-language') as Language) || 'bm'
  })
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('pbak-theme') as Theme | null
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    localStorage.setItem('pbak-language', language)
    document.documentElement.lang = language === 'bm' ? 'ms' : 'en'
  }, [language])

  useEffect(() => {
    localStorage.setItem('pbak-theme', theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  const value = useMemo<UiContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      theme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
      t: (bm, en) => (language === 'bm' ? bm : en),
    }),
    [language, theme],
  )

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi() {
  const context = useContext(UiContext)
  if (!context) throw new Error('useUi must be used inside UiProvider')
  return context
}
