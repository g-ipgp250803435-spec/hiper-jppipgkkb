import { useEffect, useState } from 'react'
import { PageHeader, Card, EmptyState, LoadingBlock } from '../components/UI'
import { Icon } from '../components/Icons'
import { useUi } from '../contexts/UiContext'
import { supabase } from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/config'
import type { Announcement } from '../lib/types'
import { formatDate } from '../lib/helpers'

const sample: Announcement[] = [
  {
    id: 'sample',
    title_bm: 'Portal HiPER sedang disediakan',
    title_en: 'HiPER portal is being prepared',
    content_bm: 'Pentadbir boleh menggantikan pengumuman ini selepas Supabase disambungkan.\n\nKandungan berbilang baris akan dipaparkan dengan kemas.',
    content_en: 'Administrators can replace this announcement after Supabase is connected.\n\nMulti-line content will be displayed neatly.',
    poster_url: '/placeholder-poster.svg',
    published: true,
    pinned: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function AnnouncementsPage() {
  const { language, t } = useUi()
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
    <section className="section">
      <div className="container">
        <PageHeader
          eyebrow={t('PUSAT HEBAHAN', 'NOTICE CENTRE')}
          title={t('Pengumuman PBAK', 'PBAK announcements')}
          description={t('Hebahan berkaitan elaun, jualan, kebajikan dan urusan semasa.', 'Updates on allowances, sales, welfare and current matters.')}
        />
        {loading ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <EmptyState title={t('Tiada pengumuman', 'No announcements')} />
        ) : (
          <div className="announcement-grid announcement-page-grid">
            {items.map((item) => (
              <Card className="announcement-card announcement-page-card" key={item.id}>
                <div className="announcement-poster-wrap">
                  <img src={item.poster_url || '/placeholder-poster.svg'} alt={language === 'bm' ? item.title_bm : item.title_en || item.title_bm} />
                  {item.pinned && <span className="poster-pin"><Icon name="pin" size={14} /> {t('Penting', 'Pinned')}</span>}
                </div>
                <div className="announcement-body">
                  <div className="meta-row">
                    <span className="inline-meta"><Icon name="calendar" size={15} /> {formatDate(item.created_at, language)}</span>
                  </div>
                  <h2>{language === 'bm' ? item.title_bm : item.title_en || item.title_bm}</h2>
                  <div className="announcement-content preserve-lines">
                    {language === 'bm' ? item.content_bm : item.content_en || item.content_bm}
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
