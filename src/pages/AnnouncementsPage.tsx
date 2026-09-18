import { useEffect, useMemo, useState } from 'react'
import { PageHeader, Card, EmptyState, LoadingBlock, Notice, Button } from '../components/UI'
import { Icon } from '../components/Icons'
import { RichTextContent } from '../components/RichText'
import { useUi } from '../contexts/UiContext'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import { supabase } from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/config'
import { localise } from '../lib/siteSettings'
import type { Announcement } from '../lib/types'
import { formatDate, convertHtmlToWhatsAppText } from '../lib/helpers'

const sample: Announcement[] = [
  {
    id: 'sample-1',
    title_bm: 'Pengumuman Pentadbir HiPER',
    title_en: 'HiPER Portal Announcement',
    content_bm: '<p>Selamat datang ke Portal Perbendaharaan HiPER. Pengumuman penting akan dipaparkan di bahagian ini.</p>',
    content_en: '<p>Welcome to HiPER Treasury Portal. Important announcements will be highlighted here.</p>',
    poster_url: '/placeholder-poster.svg',
    published: true,
    pinned: true,
    pin_type: 'penting',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function AnnouncementsPage() {
  const { language, t } = useUi()
  const { settings } = useSiteSettings()
  const [rawItems, setRawItems] = useState<Announcement[]>(isSupabaseConfigured ? [] : sample)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })

        if (error) {
          setLoadError(error.message)
          setRawItems([])
        } else {
          setLoadError(null)
          setRawItems((data as Announcement[]) || [])
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : t('Pengumuman gagal dimuatkan.', 'Announcements could not be loaded.'))
        setRawItems([])
      } finally {
        setLoading(false)
      }
    }
    void fetchAnnouncements()
  }, [])

  const handleWhatsAppShare = (item: Announcement) => {
    const title = language === 'bm' ? item.title_bm : item.title_en || item.title_bm
    const htmlContent = language === 'bm' ? item.content_bm : item.content_en || item.content_bm
    const plainText = convertHtmlToWhatsAppText(htmlContent)
    const dateFormatted = formatDate(item.created_at, language)
    const pageUrl = window.location.href

    const messageParts = [
      `*${title.trim()}*`,
      plainText,
      `📌 Tarikh:\n${dateFormatted}`,
      `🔗 Lihat maklumat lanjut:\n${pageUrl}`,
    ]
    
    const fullText = messageParts.filter(Boolean).join('\n\n')
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  const sortedItems = useMemo(() => {
    const now = new Date().getTime()
    const active = rawItems.filter((item) => {
      if (!item.expiry_at) return true
      return new Date(item.expiry_at).getTime() >= now
    })

    return active.sort((a, b) => {
      const getPriorityScore = (item: Announcement) => {
        if (item.pin_type === 'penting') return 3
        if (item.pin_type === 'terkini') return 2
        if (item.pinned) return 1
        return 0
      }

      const scoreA = getPriorityScore(a)
      const scoreB = getPriorityScore(b)

      if (scoreA !== scoreB) {
        return scoreB - scoreA
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [rawItems])

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
        ) : sortedItems.length === 0 ? (
          <EmptyState title={t('Tiada pengumuman', 'No announcements')} />
        ) : (
          <div className="announcement-grid announcement-page-grid">
            {sortedItems.map((item) => {
              const isPenting = item.pin_type === 'penting'
              const isTerkini = item.pin_type === 'terkini' || (!item.pin_type && item.pinned)

              return (
                <Card className={`announcement-card announcement-page-card${isPenting ? ' pinned' : ''}`} key={item.id}>
                  <div className="announcement-poster-wrap">
                    <img
                      src={item.poster_url || '/placeholder-poster.svg'}
                      alt={language === 'bm' ? item.title_bm : item.title_en || item.title_bm}
                    />
                    {isPenting && (
                      <span className="poster-pin poster-pin-danger">
                        <Icon name="pin" size={14} /> PENTING
                      </span>
                    )}
                    {!isPenting && isTerkini && (
                      <span className="poster-pin poster-pin-primary">
                        <Icon name="pin" size={14} /> TERKINI
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
                    <div className="announcement-actions" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color, #eaeaea)' }}>
                      <Button
                        variant="secondary"
                        className="compact"
                        onClick={() => handleWhatsAppShare(item)}
                        style={{ color: '#25D366', borderColor: '#25D366', fontWeight: 600 }}
                      >
                        <Icon name="whatsapp" size={18} />
                        {t('Kongsi ke WhatsApp', 'Share to WhatsApp')}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
