import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isSupabaseConfigured } from '../lib/config'
import { defaultSiteSettings, mergeSiteSettings } from '../lib/siteSettings'
import { supabase } from '../lib/supabase'
import type { SiteSettings, SiteSettingsRecord } from '../lib/types'

interface SiteSettingsContextValue {
  settings: SiteSettings
  loading: boolean
  error: string | null
  refreshSettings: () => Promise<void>
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null)

function applyDocumentSettings(settings: SiteSettings) {
  document.title = settings.branding.browserTitle || settings.branding.siteName

  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (description) description.content = settings.branding.metaDescription.bm

  let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!favicon) {
    favicon = document.createElement('link')
    favicon.rel = 'icon'
    document.head.appendChild(favicon)
  }
  favicon.href = settings.branding.faviconUrl || settings.branding.logoUrl || '/hiper-logo.png'
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const refreshSettings = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setSettings(defaultSiteSettings)
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error: queryError } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    if (queryError) {
      // The website remains usable with safe defaults before the CMS migration is applied.
      console.warn('HiPER site settings could not be loaded:', queryError.message)
      setError(queryError.message)
      setSettings(defaultSiteSettings)
    } else if (data) {
      const record = data as SiteSettingsRecord
      setSettings(mergeSiteSettings(defaultSiteSettings, record.settings))
      setError(null)
    } else {
      setSettings(defaultSiteSettings)
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refreshSettings()
  }, [refreshSettings])

  useEffect(() => {
    applyDocumentSettings(settings)
  }, [settings])

  const value = useMemo<SiteSettingsContextValue>(
    () => ({ settings, loading, error, refreshSettings }),
    [settings, loading, error, refreshSettings],
  )

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext)
  if (!context) throw new Error('useSiteSettings must be used inside SiteSettingsProvider')
  return context
}
