import { useEffect, useState } from 'react'
import { PageHeader, Card, EmptyState, LoadingBlock, Notice } from '../components/UI'
import { Icon } from '../components/Icons'
import { RichTextContent } from '../components/RichText'
import { useUi } from '../contexts/UiContext'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import { supabase } from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/config'
import { localise } from '../lib/siteSettings'
import type { Announcement } from '../lib/types'
import { formatDate } from '../lib/helpers'

const sample: Announcement[] = [
  {
    id: 'sample',
    title_bm: 'Portal HiPER sedang disediakan',
    title_en: 'HiPER portal is being prepared',
    content_bm: '<p>Pentadbir boleh menggantikan pengumuman ini selepas Supabase disambungkan.</p><ul><li>Kandungan berbilang baris</li><li>Teks tebal dan condong</li><li>Senarai bernombor atau bullets</li></ul>',
    content_en: '<p>Administrators can replace this announcement after Supabase is connected.</p><ul><li>Multi-line content</li><li>Bold and italic text</li><li>Numbered or bulleted lists</li></ul>',
    poster_url: '/placeholder-poster.svg',
    published: true,
    pinned: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function AnnouncementsPage() {
  const { language, t } = useUi()
  const { settings } = useSiteSettings()
  const [items, setItems] = useState<Announcement[]>(isSupabaseConfigured ? [] : sample)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void supabase
      .from('announcements')
      .select('*')
      .eq('published', true)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message)
          setItems([])
        } else {
          setLoadError(null)
          setItems((data as Announcement[]) || [])
        }
        setLoading(false)
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : t('Pengumuman gagal dimuatkan.', 'Announcements could not be loaded.'))
        setItems([])
        setLoading(false)
      })
  }, [])

  return (
    <section className="section announcements-page-section">
      <div className="container">
        <PageHeader
          eyebrow={localise(settings.pages.announcements.eyebrow, language)}
          title={localise(settings.pages.announcements.title, language)}
          description={localise(settings.pages.announcements.description, language)}
        />
        {loadError && <Notice type="danger">{loadError}</Notice>}
        {loading ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <EmptyState title={t('Tiada pengumuman', 'No announcements')} />
        ) : (
          <div className="announcement-grid announcement-page-grid">
            {items.map((item) => (
              <Card className={`announcement-card announcement-page-card${item.pinned ? ' pinned' : ''}`} key={item.id}>
                <div className="announcement-poster-wrap">
                  <img
                    src={item.poster_url || '/placeholder-poster.svg'}
                    alt={language === 'bm' ? item.title_bm : item.title_en || item.title_bm}
                  />
                  {item.pinned && (
                    <span className="poster-pin">
                      <Icon name="pin" size={14} /> {t('Penting', 'Pinned')}
                    </span>
                  )}
                </div>
                <div className="announcement-body">
                  <div className="announcement-date">
                    <Icon name="calendar" size={15} />
                    <span>{formatDate(item.created_at, language)}</span>
                  </div>
                  <h2>{language === 'bm' ? item.title_bm : item.title_en || item.title_bm}</h2>
                  <div className="announcement-content">
                    <RichTextContent html={language === 'bm' ? item.content_bm : item.content_en || item.content_bm} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
