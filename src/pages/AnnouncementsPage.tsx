import { useEffect, useState } from 'react'
import { PageHeader, Card, EmptyState, LoadingBlock } from '../components/UI'
import { useUi } from '../contexts/UiContext'
import { supabase } from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/config'
import type { Announcement } from '../lib/types'
import { formatDate } from '../lib/helpers'

const sample: Announcement[] = [
  {
    id: 'sample',
    title_bm: 'Portal PBAK One sedang disediakan',
    title_en: 'PBAK One portal is being prepared',
    content_bm: 'Pentadbir boleh menggantikan pengumuman ini selepas Supabase disambungkan.',
    content_en: 'Administrators can replace this announcement after Supabase is connected.',
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
          <div className="announcement-grid">
            {items.map((item) => (
              <Card className="announcement-card" key={item.id}>
                <img src={item.poster_url || '/placeholder-poster.svg'} alt="" />
                <div className="announcement-body">
                  <div className="meta-row">
                    <span>{formatDate(item.created_at, language)}</span>
                    {item.pinned && <span className="pin-label">{t('Penting', 'Pinned')}</span>}
                  </div>
                  <h2>{language === 'bm' ? item.title_bm : item.title_en || item.title_bm}</h2>
                  <p className="preserve-lines">{language === 'bm' ? item.content_bm : item.content_en || item.content_bm}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
