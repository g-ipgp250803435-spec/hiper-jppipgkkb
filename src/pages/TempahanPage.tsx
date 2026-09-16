import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button, Card, Field, Notice, PageHeader, StatusBadge } from '../components/UI'
import { Icon } from '../components/Icons'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { isSupabaseConfigured } from '../lib/config'
import { formatDate } from '../lib/helpers'
import { supabase } from '../lib/supabase'
import { notifyAdmins } from '../lib/v3/notificationService'
import type { BookingService, RoomBooking } from '../lib/types'

const defaultServices: BookingService[] = [
  {
    id: 's-1',
    title_bm: 'Tempahan Baju Rasmi',
    title_en: 'Official Apparel Order',
    description_bm: 'Tempahan baju korporat, t-shirt rasmi dan pakaian perwakilan JPP IPGKKB.',
    description_en: 'Official corporate shirts, t-shirts, and apparel orders for JPP IPGKKB.',
    image_url: null,
    booking_type: 'apparel',
    active: true,
    instructions_bm: 'Tempahan dibuat mengikut saiz dan senarai nama unit.',
    instructions_en: 'Orders are processed based on unit sizes and roster.',
  },
  {
    id: 's-2',
    title_bm: 'Tempahan Tanda Nama',
    title_en: 'Name Tag Order',
    description_bm: 'Tempahan tanda nama rasmi berlogo IPGKKB untuk siswa guru dan ahli JPP.',
    description_en: 'Official IPGKKB logo name tag orders for student teachers and JPP members.',
    image_url: null,
    booking_type: 'nametag',
    active: true,
    instructions_bm: 'Sertakan ejaan nama mengikut Kad Pengenalan.',
    instructions_en: 'Provide full name spelling as in NRIC.',
  },
  {
    id: 's-3',
    title_bm: 'Tempahan Bilik JPP',
    title_en: 'JPP Room Booking',
    description_bm: 'Sistem tempahan dan kalendar ketersediaan Bilik Mesyuarat / Perbincangan JPP.',
    description_en: 'Booking system and availability calendar for JPP Meeting / Discussion Room.',
    image_url: null,
    booking_type: 'room_booking',
    active: true,
    instructions_bm: 'Pilih tarikh pada kalendar untuk membuat tempahan.',
    instructions_en: 'Select an available date on the calendar to book.',
  },
]

const OFFICIAL_BUREAUS = [
  'Biro Perhubungan Domestik dan Antarabangsa',
  'Biro Akademik',
  'Biro Kediaman Pelajar',
  'Biro Kebajikan dan Sosial',
  'Biro Kerohanian, Moral dan Disiplin',
  'Biro Kebudayaan dan Kesenian',
  'Biro Teknologi Maklumat dan Penerbitan',
  'Biro Sukan dan Rekreasi',
  'Biro Hal Ehwal Wanita',
  'Biro Keusahawanan',
]

const mockRoomBookings: RoomBooking[] = [
  {
    id: 'rb-mock-1',
    user_id: 'mock-u-1',
    booking_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    name: 'Muhammad Azim Bin Hakimi',
    bureau: 'Biro Keusahawanan',
    purpose: 'Mesyuarat Persiapan Minggu Keusahawanan',
    remarks: 'Memerlukan sistem pembesar suara dan projektor',
    status: 'approved',
    admin_notes: 'Diluluskan. Kunci boleh diambil dari AMT Angkat.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rb-mock-2',
    user_id: 'mock-u-2',
    booking_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    name: 'Tan Wei Jin',
    bureau: 'Biro Teknologi Maklumat dan Penerbitan',
    purpose: 'Bengkel Rekabentuk Poster & Publisiti',
    remarks: null,
    status: 'pending',
    admin_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function TempahanPage() {
  const { language, t } = useUi()
  const { user, profile } = useAuth()
  const location = useLocation()

  const isRoomBookingModule = location.pathname.includes('/bilik-jpp')

  const [services, setServices] = useState<BookingService[]>(defaultServices)
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>(mockRoomBookings)

  // Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Booking Form State
  const [applicantName, setApplicantName] = useState('')
  const [bureauName, setBureauName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [remarks, setRemarks] = useState('')

  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<BookingService | null>(null)

  // Populate form with user profile info
  useEffect(() => {
    if (profile) {
      setApplicantName(profile.full_name || '')
      if (OFFICIAL_BUREAUS.includes(profile.class_name || '')) {
        setBureauName(profile.class_name || '')
      }
    } else if (user) {
      setApplicantName(user.user_metadata?.full_name || '')
    }
  }, [profile, user])

  // Load services and room bookings from Supabase
  const loadData = async () => {
    if (!isSupabaseConfigured) return
    try {
      const [svcRes, roomRes] = await Promise.all([
        supabase.from('booking_services').select('*').eq('active', true).order('created_at', { ascending: true }),
        supabase.from('room_bookings').select('*').order('booking_date', { ascending: true }),
      ])

      if (svcRes.data && svcRes.data.length > 0) {
        setServices(svcRes.data as BookingService[])
      }
      if (roomRes.data) {
        setRoomBookings(roomRes.data as RoomBooking[])
      }
    } catch (err) {
      console.warn('Failed to fetch tempahan data:', err)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Calendar helper calculations
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthNamesBm = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ]
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const currentMonthLabel = language === 'bm'
    ? `${monthNamesBm[month]} ${year}`
    : `${monthNamesEn[month]} ${year}`

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }

  const getBookingForDate = (dateStr: string): RoomBooking | undefined => {
    return roomBookings.find((b) => b.booking_date === dateStr && !['rejected', 'cancelled'].includes(b.status))
  }

  const handleDateClick = (dateStr: string) => {
    setMessage(null)
    const existing = getBookingForDate(dateStr)
    if (existing) {
      setMessage({
        type: 'danger',
        text: t('Maaf, Bilik JPP telah ditempah pada tarikh tersebut.', 'Sorry, JPP Room is already booked on that date.')
      })
      setSelectedDate(dateStr)
      return
    }
    setSelectedDate(dateStr)
  }

  const handleRoomBookingSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!user) {
      setMessage({ type: 'danger', text: t('Sila log masuk terlebih dahulu.', 'Please sign in first.') })
      return
    }

    if (!selectedDate) {
      setMessage({ type: 'danger', text: t('Sila pilih tarikh tempahan pada kalendar.', 'Please select a booking date on the calendar.') })
      return
    }

    if (!applicantName.trim() || !bureauName.trim() || !purpose.trim()) {
      setMessage({ type: 'danger', text: t('Sila lengkapkan semua medan wajib.', 'Please complete all required fields.') })
      return
    }

    // Double Booking Prevention Check
    const existingBooking = roomBookings.find(
      (b) => b.booking_date === selectedDate && !['rejected', 'cancelled'].includes(b.status)
    )
    if (existingBooking) {
      setMessage({
        type: 'danger',
        text: 'Maaf, Bilik JPP telah ditempah pada tarikh tersebut.'
      })
      return
    }

    setBusy(true)

    if (!isSupabaseConfigured) {
      const newMockBooking: RoomBooking = {
        id: `rb-mock-${Date.now()}`,
        user_id: user.id,
        booking_date: selectedDate,
        name: applicantName.trim(),
        bureau: bureauName.trim(),
        purpose: purpose.trim(),
        remarks: remarks.trim() || null,
        status: 'pending',
        admin_notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setRoomBookings((prev) => [...prev, newMockBooking])
      setMessage({
        type: 'success',
        text: t('Permohonan tempahan Bilik JPP berjaya dihantar!', 'JPP Room booking request submitted successfully!')
      })
      setPurpose('')
      setRemarks('')
      setBusy(false)
      return
    }

    try {
      const { data: newRec, error } = await supabase.from('room_bookings').insert({
        user_id: user.id,
        booking_date: selectedDate,
        name: applicantName.trim(),
        bureau: bureauName.trim(),
        purpose: purpose.trim(),
        remarks: remarks.trim() || null,
        status: 'pending',
      }).select().single()

      if (error) throw error

      // Send admin notification
      await notifyAdmins(
        `🔔 Permohonan Tempahan Bilik JPP Baharu`,
        `Tempahan Bilik JPP untuk tarikh ${formatDate(selectedDate, language)} telah dihantar oleh ${applicantName.trim()} (${bureauName.trim()}).`,
        'tempahan',
        newRec?.id || null
      )

      setMessage({
        type: 'success',
        text: t('Permohonan tempahan Bilik JPP berjaya dihantar dan sedang menunggu kelulusan admin.', 'JPP Room booking request submitted and pending admin approval.')
      })
      setPurpose('')
      setRemarks('')
      await loadData()
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err instanceof Error ? err.message : t('Gagal menghantar tempahan.', 'Failed to submit booking.')
      })
    } finally {
      setBusy(false)
    }
  }

  // Render Calendar Grid Days
  const calendarDays = []
  // Blank days before first day
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`blank-${i}`} className="calendar-day blank" />)
  }
  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const booking = getBookingForDate(dateStr)
    const isSelected = selectedDate === dateStr
    const isPast = dayDate < new Date(new Date().setHours(0,0,0,0))

    let statusClass = 'available'
    let statusBadgeText = t('Sedia', 'Available')

    if (booking) {
      if (booking.status === 'pending') {
        statusClass = 'pending'
        statusBadgeText = t('Menunggu', 'Pending')
      } else if (booking.status === 'approved') {
        statusClass = 'approved'
        statusBadgeText = t('Ditempah', 'Reserved')
      } else if (booking.status === 'completed') {
        statusClass = 'completed'
        statusBadgeText = t('Selesai', 'Completed')
      }
    } else if (isPast) {
      statusClass = 'past'
      statusBadgeText = t('Lalu', 'Past')
    }

    calendarDays.push(
      <button
        type="button"
        key={`day-${day}`}
        className={`calendar-day ${statusClass} ${isSelected ? 'selected' : ''}`}
        onClick={() => handleDateClick(dateStr)}
      >
        <span className="calendar-day-number">{day}</span>
        <span className={`calendar-status-dot status-dot-${statusClass}`} title={statusBadgeText}>
          {statusBadgeText}
        </span>
      </button>
    )
  }

  return (
    <section className="section tempahan-page-section">
      <div className="container">
        <PageHeader
          eyebrow={isRoomBookingModule ? t('TEMPAHAN BILIK JPP', 'JPP ROOM BOOKING') : t('PERKHIDMATAN TEMPAHAN', 'BOOKING SERVICES')}
          title={isRoomBookingModule ? t('Kalendar & Tempahan Bilik JPP', 'JPP Room Calendar & Booking') : t('Tempahan Pejabat Bendahari Agung Kehormat', 'Honorary Treasurer-General Office Bookings')}
          description={isRoomBookingModule
            ? t('Semak ketersediaan tarikh dan hantar permohonan tempahan bilik mesyuarat / perbincangan JPP.', 'Check date availability and submit booking request for JPP meeting / discussion room.')
            : t('Pusat perkhidmatan tempahan rasmi PBAK JPP IPGKKB – Tempahan baju korporat, tanda nama dan bilik mesyuarat.', 'Official PBAK JPP IPGKKB booking service centre – Corporate apparel, name tags and meeting room bookings.')
          }
          actions={
            isRoomBookingModule ? (
              <Link className="button button-secondary" to="/tempahan">
                <Icon name="chevron-right" size={17} style={{ transform: 'rotate(180deg)' }} />
                {t('Kembali ke Tempahan Utama', 'Back to Main Bookings')}
              </Link>
            ) : null
          }
        />

        {/* View 1: Main Tempahan Service Hub */}
        {!isRoomBookingModule && (
          <div>
            <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '16px' }}>
              {services.map((svc) => (
                <Card key={svc.id} className="service-card-item" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <div className="service-card-image-wrap" style={{ height: '160px', width: '100%', background: 'var(--maroon-dark)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-primary)', marginBottom: '16px', overflow: 'hidden' }}>
                      {svc.image_url ? (
                        <img src={svc.image_url} alt={svc.title_bm} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Icon name={svc.booking_type === 'room_booking' ? 'calendar' : svc.booking_type === 'apparel' ? 'box' : 'user'} size={48} />
                      )}
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--ink)' }}>
                      {language === 'bm' ? svc.title_bm : svc.title_en || svc.title_bm}
                    </h3>
                    <p style={{ color: 'var(--ink-muted)', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px', minHeight: '60px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {language === 'bm' ? svc.description_bm : svc.description_en || svc.description_bm}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                    {svc.booking_type === 'room_booking' ? (
                      <Link className="button button-primary" to="/tempahan/bilik-jpp" style={{ width: '100%', justifyContent: 'center' }}>
                        <Icon name="calendar" size={18} />
                        {t('Buat Tempahan', 'Make Booking')}
                      </Link>
                    ) : svc.external_link ? (
                      <a href={svc.external_link} target="_blank" rel="noopener noreferrer" className="button button-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        <Icon name="external-link" size={18} />
                        {t('Buat Tempahan', 'Make Booking')}
                      </a>
                    ) : (
                      <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setSelectedServiceDetail(svc)}>
                        <Icon name="calendar" size={18} />
                        {t('Buat Tempahan', 'Make Booking')}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Service Detail Modal */}
            {selectedServiceDetail && (
              <div className="modal-backdrop" onClick={() => setSelectedServiceDetail(null)}>
                <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', margin: 'auto', background: 'var(--card-bg, #fff)', padding: '24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                  <h2>{language === 'bm' ? selectedServiceDetail.title_bm : selectedServiceDetail.title_en || selectedServiceDetail.title_bm}</h2>
                  <p style={{ marginTop: '12px', lineHeight: '1.6' }}>
                    {language === 'bm' ? selectedServiceDetail.description_bm : selectedServiceDetail.description_en || selectedServiceDetail.description_bm}
                  </p>
                  {selectedServiceDetail.instructions_bm && (
                    <div style={{ marginTop: '16px', background: 'var(--surface-muted)', padding: '12px', borderRadius: '8px' }}>
                      <strong>{t('Arahan Tempahan:', 'Booking Instructions:')}</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
                        {language === 'bm' ? selectedServiceDetail.instructions_bm : selectedServiceDetail.instructions_en || selectedServiceDetail.instructions_bm}
                      </p>
                    </div>
                  )}
                  <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <Button variant="primary" onClick={() => setSelectedServiceDetail(null)}>
                      {t('Tutup', 'Close')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View 2: Tempahan Bilik JPP Calendar & Booking Module */}
        {isRoomBookingModule && (
          <div className="two-column-layout">
            {/* Calendar Column */}
            <div className="stack">
              <Card title={t('Kalendar Ketersediaan Bilik JPP', 'JPP Room Availability Calendar')}>
                {/* Month Navigator */}
                <div className="calendar-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <Button variant="ghost" className="compact" onClick={prevMonth}>
                    <Icon name="chevron-right" size={18} style={{ transform: 'rotate(180deg)' }} />
                    {t('Sebelum', 'Prev')}
                  </Button>
                  <strong style={{ fontSize: '18px', color: 'var(--gold-primary)' }}>{currentMonthLabel}</strong>
                  <Button variant="ghost" className="compact" onClick={nextMonth}>
                    {t('Seterusnya', 'Next')}
                    <Icon name="chevron-right" size={18} />
                  </Button>
                </div>

                {/* Days Header */}
                <div className="calendar-week-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
                  <span>Aha</span>
                  <span>Isn</span>
                  <span>Sel</span>
                  <span>Rab</span>
                  <span>Kha</span>
                  <span>Jum</span>
                  <span>Sab</span>
                </div>

                {/* Days Grid */}
                <div className="calendar-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                  {calendarDays}
                </div>

                {/* Calendar Status Colours & Legend */}
                <div className="calendar-legend-box" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px' }}>
                  <span className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} /> {t('Sedia (Available)', 'Available')}
                  </span>
                  <span className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} /> {t('Menunggu (Pending)', 'Pending')}
                  </span>
                  <span className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} /> {t('Ditempah (Approved)', 'Reserved')}
                  </span>
                  <span className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} /> {t('Ditolak (Rejected)', 'Rejected')}
                  </span>
                  <span className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6b7280' }} /> {t('Selesai (Completed)', 'Completed')}
                  </span>
                </div>
              </Card>

              {/* Day Selected Details Card */}
              {selectedDate && (
                <Card title={t(`Butiran Tarikh: ${formatDate(selectedDate, language)}`, `Date Details: ${formatDate(selectedDate, language)}`)}>
                  {(() => {
                    const booking = getBookingForDate(selectedDate)
                    if (!booking) {
                      return (
                        <div style={{ color: 'var(--success-color, #10b981)' }}>
                          <Icon name="check" size={20} />
                          <strong> {t('Tarikh ini sedia untuk ditempah.', 'This date is available for booking.')}</strong>
                        </div>
                      )
                    }
                    return (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong>{booking.name}</strong>
                          <StatusBadge status={booking.status} />
                        </div>
                        <p style={{ margin: '4px 0', fontSize: '14px' }}><b>Biro:</b> {booking.bureau}</p>
                        <p style={{ margin: '4px 0', fontSize: '14px' }}><b>Tujuan:</b> {booking.purpose}</p>
                        {booking.remarks && <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--ink-muted)' }}><b>Catatan:</b> {booking.remarks}</p>}
                      </div>
                    )
                  })()}
                </Card>
              )}
            </div>

            {/* Form Column */}
            <Card className="form-card" title={t('Borang Tempahan Bilik JPP', 'JPP Room Booking Form')}>
              {!user ? (
                <div className="locked-panel">
                  <Icon name="lock" size={34} />
                  <h3>{t('Log masuk diperlukan', 'Sign in required')}</h3>
                  <p>{t('Sila log masuk menggunakan akaun DELIMa untuk membuat tempahan Bilik JPP.', 'Please sign in with your DELIMa account to book the JPP Room.')}</p>
                  <Link className="button button-primary" to="/login">{t('Log masuk DELIMa', 'DELIMa sign in')}</Link>
                </div>
              ) : (
                <form className="form-grid" onSubmit={handleRoomBookingSubmit}>
                  {message && <div className="full-span"><Notice type={message.type}>{message.text}</Notice></div>}

                  <div className="full-span">
                    <Field label={t('Tarikh Dipilih', 'Selected Booking Date')} required hint={t('Pilih tarikh pada kalendar di sebelah kiri.', 'Select date from calendar on the left.')}>
                      <input
                        type="date"
                        value={selectedDate || ''}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        required
                      />
                    </Field>
                  </div>

                  <Field label={t('Nama Pemohon', 'Applicant Name')} required>
                    <input
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="Cth: Muhammad Azim Bin Hakimi"
                      required
                    />
                  </Field>

                  <Field label={t('Biro', 'Bureau')} required>
                    <select
                      value={bureauName}
                      onChange={(e) => setBureauName(e.target.value)}
                      required
                    >
                      <option value="">{t('Pilih Biro', 'Select Bureau')}</option>
                      {OFFICIAL_BUREAUS.map((bureau) => (
                        <option value={bureau} key={bureau}>
                          {bureau}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="full-span" style={{ marginTop: '-6px', marginBottom: '4px' }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink-soft)', fontStyle: 'italic', lineHeight: 1.4 }}>
                      {t(
                        'Nota: Sebarang Kelab / Persatuan yang ingin membuat tempahan Bilik JPP hendaklah membuat tempahan menggunakan nama Biro Angkat yang telah ditetapkan.',
                        'Note: Any Club / Association wishing to book the JPP Room must submit the reservation using the appointed Bureau name.'
                      )}
                    </p>
                  </div>

                  <div className="full-span">
                    <Field label={t('Tujuan Tempahan Bilik', 'Purpose of Room Booking')} required>
                      <textarea
                        rows={3}
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="Cth: Mesyuarat persediaan Minggu Keusahawanan"
                        required
                      />
                    </Field>
                  </div>

                  <div className="full-span">
                    <Field label={t('Catatan Tambahan (Pilihan)', 'Additional Remarks (Optional)')}>
                      <input
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Cth: Perlukan sokongan pembesar suara dan LCD projector"
                      />
                    </Field>
                  </div>

                  <div className="full-span form-actions">
                    <Button type="submit" disabled={busy || !selectedDate}>
                      <Icon name="calendar" size={18} />
                      {busy ? t('Menghantar…', 'Submitting…') : t('Hantar Tempahan Bilik', 'Submit Room Booking')}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        )}
      </div>
    </section>
  )
}
