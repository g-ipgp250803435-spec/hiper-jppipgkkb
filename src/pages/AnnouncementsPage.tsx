import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
    announcement_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function AnnouncementsPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
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
          .order('announcement_date', { ascending: false })

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
  }, [t])

  const handleWhatsAppShare = (item: Announcement, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    const title = language === 'bm' ? item.title_bm : item.title_en || item.title_bm
    const htmlContent = language === 'bm' ? item.content_bm : item.content_en || item.content_bm
    const plainText = convertHtmlToWhatsAppText(htmlContent)
    const displayDate = item.announcement_date || item.created_at
    const dateFormatted = formatDate(displayDate, language)
    const detailUrl = `${window.location.origin}/pengumuman/${item.id}`

    const messageParts = [
      `*${title.trim()}*`,
      plainText,
      `📌 Tarikh:\n${dateFormatted}`,
      `🔗 Lihat maklumat lanjut:\n${detailUrl}`,
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

      const dateA = new Date(a.announcement_date || a.created_at).getTime()
      const dateB = new Date(b.announcement_date || b.created_at).getTime()
      return dateB - dateA
    })
  }, [rawItems])

  const selectedItem = useMemo(() => {
    if (!id) return null
    return sortedItems.find((item) => item.id === id) || rawItems.find((item) => item.id === id) || null
  }, [id, sortedItems, rawItems])

  if (id) {
    const isPenting = selectedItem?.pin_type === 'penting'
    const isTerkini = selectedItem?.pin_type === 'terkini' || (!selectedItem?.pin_type && selectedItem?.pinned)

    return (
      <section className="section announcements-page-section">
        <div className="container">
          <div className="announcement-detail-container">
            <Button
              variant="ghost"
              onClick={() => navigate('/pengumuman')}
              style={{ marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Icon name="chevron-left" size={18} />
              {t('Kembali ke Pengumuman', 'Back to Announcements')}
            </Button>

            {loading ? (
              <LoadingBlock />
            ) : !selectedItem ? (
              <Card>
                <EmptyState title={t('Pengumuman tidak ditemui', 'Announcement not found')} />
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Button variant="primary" onClick={() => navigate('/pengumuman')}>
                    {t('Kembali ke Senarai Pengumuman', 'Return to Announcements List')}
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="announcement-detail-card">
                {selectedItem.poster_url && (
                  <div className="announcement-detail-poster">
                    <img
                      src={selectedItem.poster_url}
                      alt={language === 'bm' ? selectedItem.title_bm : selectedItem.title_en || selectedItem.title_bm}
                    />
                  </div>
                )}
                <div className="announcement-detail-header">
                  <div className="announcement-meta">
                    <span className="announcement-date">
                      <Icon name="calendar" size={15} />
                      {formatDate(selectedItem.announcement_date || selectedItem.created_at, language)}
                    </span>
                    {isPenting && (
                      <span className="poster-pin poster-pin-danger" style={{ position: 'static' }}>
                        <Icon name="pin" size={14} /> PENTING
                      </span>
                    )}
                    {!isPenting && isTerkini && (
                      <span className="poster-pin poster-pin-primary" style={{ position: 'static' }}>
                        <Icon name="pin" size={14} /> TERKINI
                      </span>
                    )}
                  </div>
                  <h1 className="announcement-detail-title">
                    {language === 'bm' ? selectedItem.title_bm : selectedItem.title_en || selectedItem.title_bm}
                  </h1>
                </div>
                <div className="announcement-detail-body">
                  <RichTextContent html={language === 'bm' ? selectedItem.content_bm : selectedItem.content_en || selectedItem.content_bm} />
                </div>
                <div className="announcement-detail-footer">
                  <Button
                    variant="secondary"
                    onClick={(e) => handleWhatsAppShare(selectedItem, e)}
                    style={{ color: '#25D366', borderColor: '#25D366', fontWeight: 600 }}
                  >
                    <Icon name="whatsapp" size={18} />
                    {t('Kongsi ke WhatsApp', 'Share to WhatsApp')}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>
    )
  }

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
          <div className="announcement-compact-grid">
            {sortedItems.map((item) => {
              const isPenting = item.pin_type === 'penting'
              const isTerkini = item.pin_type === 'terkini' || (!item.pin_type && item.pinned)
              const displayDate = item.announcement_date || item.created_at

              return (
                <div
                  key={item.id}
                  className={`announcement-compact-card${isPenting ? ' pinned-danger' : isTerkini ? ' pinned-primary' : ''}`}
                  onClick={() => navigate(`/pengumuman/${item.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(`/pengumuman/${item.id}`)
                  }}
                >
                  {item.poster_url ? (
                    <div className="announcement-compact-poster">
                      <img src={item.poster_url} alt="" />
                    </div>
                  ) : (
                    <div className="announcement-compact-poster placeholder">
                      <Icon name="megaphone" size={32} />
                    </div>
                  )}
                  <div className="announcement-compact-content">
                    <div className="announcement-compact-meta">
                      <span className="announcement-date">
                        <Icon name="calendar" size={13} />
                        {formatDate(displayDate, language)}
                      </span>
                      {isPenting && <span className="badge badge-danger">PENTING</span>}
                      {!isPenting && isTerkini && <span className="badge badge-primary">TERKINI</span>}
                    </div>
                    <h3 className="announcement-compact-title">
                      {language === 'bm' ? item.title_bm : item.title_en || item.title_bm}
                    </h3>
                    <div className="announcement-compact-footer">
                      <span className="read-more-link">
                        {t('Baca pengumuman', 'Read announcement')} <Icon name="chevron-right" size={14} />
                      </span>
                      <button
                        type="button"
                        className="wa-share-mini-btn"
                        title={t('Kongsi ke WhatsApp', 'Share to WhatsApp')}
                        onClick={(e) => handleWhatsAppShare(item, e)}
                      >
                        <Icon name="whatsapp" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
