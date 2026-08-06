import { useEffect, useState } from 'react'
import { PageHeader, Card, EmptyState, LoadingBlock } from '../components/UI'
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
  const [items, setItems] = useState<Announcement[]>(sample)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void supabase
      .from('announcements')
      .select('*')
      .eq('published', true)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems((data as Announcement[]) || [])
        setLoading(false)
      })
  }, [])

  return (
    <section className="section page-intro-section announcements-page-section">
      <div className="container">
        <PageHeader
          eyebrow={localise(settings.pages.announcements.eyebrow, language)}
          title={localise(settings.pages.announcements.title, language)}
          description={localise(settings.pages.announcements.description, language)}
        />
        {loading ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <EmptyState title={t('Tiada pengumuman', 'No announcements')} />
        ) : (
          <div className="announcement-feed">
            {items.map((item) => (
              <Card className={`announcement-feed-card${item.pinned ? ' pinned' : ''}`} key={item.id}>
                <div className="announcement-feed-poster">
                  <img src={item.poster_url || '/placeholder-poster.svg'} alt={language === 'bm' ? item.title_bm : item.title_en || item.title_bm} />
                  {item.pinned && <span><Icon name="pin" size={14} /> {t('Pengumuman penting', 'Important announcement')}</span>}
                </div>
                <div className="announcement-feed-copy">
                  <span className="meta"><Icon name="calendar" size={14} /> {formatDate(item.created_at, language)}</span>
                  <h2>{language === 'bm' ? item.title_bm : item.title_en || item.title_bm}</h2>
                  <RichTextContent html={language === 'bm' ? item.content_bm : item.content_en || item.content_bm} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
