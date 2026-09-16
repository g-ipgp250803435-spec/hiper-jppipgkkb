import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useUi } from '../contexts/UiContext'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import { supabase } from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/config'
import { localise } from '../lib/siteSettings'
import type { Announcement } from '../lib/types'
import { Card, PageHeader } from '../components/UI'
import { Icon } from '../components/Icons'
import { formatDate } from '../lib/helpers'

const sampleAnnouncements: Announcement[] = [
  {
    id: 'sample-1',
    title_bm: 'Selamat datang ke HiPER',
    title_en: 'Welcome to HiPER',
    content_bm: 'Semua perkhidmatan kebajikan PBAK kini dipusatkan dalam satu portal.',
    content_en: 'PBAK welfare services are now centralised in one portal.',
    poster_url: '/placeholder-poster.svg',
    published: true,
    pinned: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

type BookingStatus = 'available' | 'booked' | 'pending'

function RoomBookingCalendarSection() {
  const { language, t } = useUi()
  const [bookingMap, setBookingMap] = useState<Record<string, BookingStatus>>({})

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Mock calendar status for local offline testing
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      setBookingMap({
        [`${y}-${m}-02`]: 'booked',
        [`${y}-${m}-05`]: 'pending',
        [`${y}-${m}-12`]: 'booked',
        [`${y}-${m}-18`]: 'pending',
        [`${y}-${m}-22`]: 'booked',
      })
      return
    }

    const fetchRoomBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('room_bookings')
          .select('booking_date, status')
          .not('status', 'in', '("rejected","cancelled")')

        if (!error && data) {
          const map: Record<string, BookingStatus> = {}
          data.forEach((item: { booking_date: string; status: string }) => {
            if (item.status === 'pending') {
              map[item.booking_date] = 'pending'
            } else if (item.status === 'approved' || item.status === 'completed') {
              map[item.booking_date] = 'booked'
            }
          })
          setBookingMap(map)
        }
      } catch (err) {
        console.warn('Failed to fetch room bookings preview for homepage:', err)
      }
    }

    void fetchRoomBookings()
  }, [])

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthNamesBm = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember']
  const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const monthLabel = language === 'bm' ? `${monthNamesBm[month]} ${year}` : `${monthNamesEn[month]} ${year}`

  const daysGrid = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysGrid.push(<div key={`blank-${i}`} className="room-cal-day blank" />)
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const status = bookingMap[dateStr] || 'available'

    daysGrid.push(
      <div key={`day-${d}`} className={`room-cal-day ${status}`} title={status === 'booked' ? 'Booked' : status === 'pending' ? 'Pending' : 'Available'}>
        <span className="room-cal-num">{d}</span>
        <span className={`room-cal-symbol symbol-${status}`}>
          {status === 'available' ? '✓' : status === 'booked' ? '●' : '◐'}
        </span>
      </div>
    )
  }

  return (
    <section className="section room-booking-showcase-section">
      <div className="container">
        <PageHeader
          eyebrow={t('TEMPAHAN BILIK JPP', 'JPP ROOM BOOKING')}
          title={t('Tempahan Bilik JPP', 'JPP Room Booking')}
          description={t('Semak ketersediaan bilik JPP dan buat tempahan dengan mudah melalui sistem kalendar HiPER.', 'Check JPP room availability and book easily through the HiPER calendar system.')}
        />

        <div className="room-booking-showcase-grid">
          {/* Left Side: Information Card */}
          <div className="room-booking-info-card">
            <div className="room-booking-info-content">
              <span className="room-booking-card-icon"><Icon name="calendar" size={28} /></span>
              <h2>{t('Tempahan Bilik JPP', 'JPP Room Booking')}</h2>
              <p>
                {t(
                  'Gunakan kemudahan bilik JPP untuk mesyuarat, perbincangan, program, dan aktiviti rasmi.',
                  'Utilise the JPP room facilities for official meetings, discussions, programs, and activities.'
                )}
              </p>
            </div>
            <Link to="/tempahan/bilik-jpp" className="button button-primary room-booking-cta-btn">
              <Icon name="calendar" size={18} />
              {t('Semak Kalendar', 'Check Calendar')}
            </Link>
          </div>

          {/* Right Side: Compact Calendar Preview */}
          <div className="room-booking-calendar-card">
            <div className="room-calendar-header">
              <span className="room-calendar-month-title">{monthLabel}</span>
              <span className="room-calendar-privacy-badge">
                <Icon name="shield" size={14} /> {t('Status Sahaja', 'Status Only')}
              </span>
            </div>

            <div className="room-calendar-weekdays">
              <span>Aha</span>
              <span>Isn</span>
              <span>Sel</span>
              <span>Rab</span>
              <span>Kha</span>
              <span>Jum</span>
              <span>Sab</span>
            </div>

            <div className="room-calendar-days-grid">
              {daysGrid}
            </div>

            <div className="room-calendar-legend">
              <span className="legend-item available">
                <span className="legend-symbol">✓</span> {t('Tersedia', 'Available')}
              </span>
              <span className="legend-item pending">
                <span className="legend-symbol">◐</span> {t('Menunggu', 'Pending')}
              </span>
              <span className="legend-item booked">
                <span className="legend-symbol">●</span> {t('Ditempah', 'Booked')}
              </span>
            </div>
          </div>

          {/* Mobile Only Action Button */}
          <div className="room-booking-mobile-cta">
            <Link to="/tempahan/bilik-jpp" className="button button-primary room-booking-cta-btn">
              <Icon name="calendar" size={18} />
              {t('Semak Kalendar', 'Check Calendar')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { language, t } = useUi()
  const { settings } = useSiteSettings()
  const [announcements, setAnnouncements] = useState<Announcement[]>(isSupabaseConfigured ? [] : sampleAnnouncements)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('published', true)
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(3)

        if (error) {
          console.warn('HiPER announcements could not be loaded:', error.message)
          setAnnouncements([])
        } else {
          setAnnouncements((data as Announcement[]) || [])
        }
      } catch (err) {
        console.warn('HiPER homepage data request failed:', err)
        setAnnouncements([])
      }
    }
    void fetchAnnouncements()
  }, [])

  const services = settings.home.services

  return (
    <>
      <section className="premium-hero">
        <div className="container premium-hero-grid">
          <div className="premium-hero-copy">
            <p className="eyebrow">{localise(settings.home.eyebrow, language)}</p>
            <h1>{localise(settings.home.title, language)}</h1>
            <p className="hero-description">{localise(settings.home.description, language)}</p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" to={settings.home.primaryCtaUrl || '/e-aset'}>
                {localise(settings.home.primaryCtaLabel, language)} <Icon name="chevron-right" size={18} />
              </Link>
              <Link className="button button-secondary button-large" to={settings.home.secondaryCtaUrl || '/ikes'}>
                {localise(settings.home.secondaryCtaLabel, language)}
              </Link>
            </div>
            <div className="premium-trust-row">
              <span><Icon name="check" size={16} /> {localise(settings.home.trustOne, language)}</span>
              <span><Icon name="shield" size={16} /> {localise(settings.home.trustTwo, language)}</span>
              <span><Icon name="chart" size={16} /> {localise(settings.home.trustThree, language)}</span>
            </div>
          </div>
          <div className="premium-hero-mark" aria-hidden="true">
            <span className="hero-ring hero-ring-one" />
            <span className="hero-ring hero-ring-two" />
            <img src={settings.home.heroImageUrl || settings.branding.logoUrl || '/hiper-logo.png'} alt="" />
          </div>
        </div>
      </section>

      <section className="section premium-services-section">
        <div className="container">
          <PageHeader
            eyebrow={localise(settings.home.servicesEyebrow, language)}
            title={localise(settings.home.servicesTitle, language)}
            description={localise(settings.home.servicesDescription, language)}
          />
          <div className="premium-service-grid">
            {services.map((service) => (
              <Link to={service.href} className="premium-service-card" key={service.href}>
                <span className="premium-service-icon"><Icon name={service.icon} size={24} /></span>
                <span className="premium-service-eyebrow">{localise(service.eyebrow, language)}</span>
                <h2>{localise(service.title, language)}</h2>
                <p>{localise(service.description, language)}</p>
                <span className="premium-card-link">{t('Buka perkhidmatan', 'Open service')} <Icon name="chevron-right" size={17} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <RoomBookingCalendarSection />

      <section className="section premium-announcements-section">
        <div className="container">
          <PageHeader
            eyebrow={localise(settings.home.announcementsEyebrow, language)}
            title={localise(settings.home.announcementsTitle, language)}
            actions={
              <Link className="premium-text-link" to="/pengumuman">
                {t('Lihat semua', 'View all')} <Icon name="chevron-right" size={17} />
              </Link>
            }
          />
          {announcements.length === 0 ? (
            <Card><p>{t('Belum ada pengumuman diterbitkan.', 'No announcements have been published yet.')}</p></Card>
          ) : (
            <div className="premium-announcement-grid">
              {announcements.map((item) => (
                <Link to="/pengumuman" key={item.id} className="premium-announcement-card">
                  <div className="premium-announcement-poster">
                    <img src={item.poster_url || '/placeholder-poster.svg'} alt={language === 'bm' ? item.title_bm : item.title_en || item.title_bm} />
                    {item.pinned && <span><Icon name="pin" size={13} /> {t('Penting', 'Pinned')}</span>}
                  </div>
                  <div className="premium-announcement-copy">
                    <span><Icon name="calendar" size={14} /> {formatDate(item.created_at, language)}</span>
                    <h2>{language === 'bm' ? item.title_bm : item.title_en || item.title_bm}</h2>
                    <b>{t('Baca pengumuman', 'Read announcement')} <Icon name="chevron-right" size={16} /></b>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
