import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, LoadingBlock, Notice, PageHeader, StatusBadge } from '../components/UI'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { formatDate, formatMoney } from '../lib/helpers'
import { supabase } from '../lib/supabase'
import type { AssetApplication, Donation, IkesApplication, KpkApplication, Notification, RoomBooking } from '../lib/types'

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="portal-mobile-detail">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  )
}

export default function PortalPage() {
  const { user, profile } = useAuth()
  const { language, t } = useUi()
  const [tab, setTab] = useState<'ikes' | 'kpk' | 'tempahan' | 'assets' | 'donations' | 'notifications'>('ikes')
  const [ikes, setIkes] = useState<IkesApplication[]>([])
  const [kpk, setKpk] = useState<KpkApplication[]>([])
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([])
  const [assets, setAssets] = useState<AssetApplication[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cancellation & Detail Modal States
  const [cancelModal, setCancelModal] = useState<{ open: boolean; type: 'assets' | 'ikes' | 'kpk' | 'tempahan' | 'donations'; id: string; title: string } | null>(null)
  const [cancelBusy, setCancelBusy] = useState(false)
  const [detailModal, setDetailModal] = useState<{ title: string; content: ReactNode } | null>(null)
  const [noticeMsg, setNoticeMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  useEffect(() => {
    if (!user) return
    void Promise.all([
      supabase.from('ikes_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('kpk_applications').select('*, kpk_bureaus(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('room_bookings').select('*').eq('user_id', user.id).order('booking_date', { ascending: false }),
      supabase.from('asset_applications').select('*, asset_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('donations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('recipient_id', user.id).order('created_at', { ascending: false }),
    ]).then(([ikesResult, kpkResult, roomResult, assetResult, donationResult, notifResult]) => {
      if (ikesResult.error || kpkResult.error || roomResult.error || assetResult.error || donationResult.error || notifResult.error) {
        setError(ikesResult.error?.message || kpkResult.error?.message || roomResult.error?.message || assetResult.error?.message || donationResult.error?.message || notifResult.error?.message || 'Data gagal dimuatkan.')
      }
      setIkes((ikesResult.data as IkesApplication[]) || [])
      setKpk((kpkResult.data as KpkApplication[]) || [])
      setRoomBookings((roomResult.data as RoomBooking[]) || [])
      setAssets((assetResult.data as AssetApplication[]) || [])
      setDonations((donationResult.data as Donation[]) || [])
      setNotifications((notifResult.data as Notification[]) || [])
      setLoading(false)
    }).catch((requestError) => {
      setError(requestError instanceof Error ? requestError.message : 'Data gagal dimuatkan.')
      setLoading(false)
    })
  }, [user])

  const markNotificationRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    }
  }

  const handleCancelApplication = async () => {
    if (!cancelModal) return
    setCancelBusy(true)
    setNoticeMsg(null)

    const { type, id } = cancelModal
    let tableName = ''
    if (type === 'assets') tableName = 'asset_applications'
    else if (type === 'ikes') tableName = 'ikes_applications'
    else if (type === 'kpk') tableName = 'kpk_applications'
    else if (type === 'tempahan') tableName = 'room_bookings'
    else if (type === 'donations') tableName = 'donations'

    try {
      const { error } = await supabase.from(tableName).update({ status: 'cancelled' }).eq('id', id)
      if (error) throw error

      // Update local state
      if (type === 'assets') setAssets((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'cancelled' } : item)))
      else if (type === 'ikes') setIkes((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'cancelled' } : item)))
      else if (type === 'kpk') setKpk((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'cancelled' } : item)))
      else if (type === 'tempahan') setRoomBookings((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'cancelled' } : item)))
      else if (type === 'donations') setDonations((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'cancelled' } : item)))

      setNoticeMsg({
        type: 'success',
        text: t('Permohonan berjaya dibatalkan.', 'Application cancelled successfully.')
      })
    } catch (err) {
      setNoticeMsg({
        type: 'danger',
        text: err instanceof Error ? err.message : t('Gagal membatalkan permohonan.', 'Failed to cancel application.')
      })
    } finally {
      setCancelBusy(false)
      setCancelModal(null)
    }
  }

  const repaymentText = (item: IkesApplication) =>
    item.repaid_at
      ? t('Selesai', 'Paid')
      : item.repayment_due_at
        ? `${t('Sebelum', 'By')} ${formatDate(item.repayment_due_at, language)}`
        : '—'

  return (
    <section className="section portal-page-section">
      <div className="container">
        <PageHeader
          eyebrow={t('AKAUN SISWA GURU', 'STUDENT TEACHER ACCOUNT')}
          title={t(`Selamat datang, ${profile?.full_name || 'Siswa Guru'}`, `Welcome, ${profile?.full_name || 'Student Teacher'}`)}
          description={user?.email || ''}
          actions={
            <div className="button-row portal-header-actions">
              <Link className="button button-secondary" to="/ikes">+ iKES</Link>
              <Link className="button button-secondary" to="/kpk">+ KPK+</Link>
              <Link className="button button-secondary" to="/tempahan/bilik-jpp">+ Bilik JPP</Link>
              <Link className="button button-secondary" to="/e-aset">+ e-Aset</Link>
            </div>
          }
        />

        {error && <Notice type="danger">{error}</Notice>}

        <div className="portal-summary">
          <Card className="portal-summary-card"><span>{t('Kelas', 'Class')}</span><strong>{profile?.class_name || '—'}</strong></Card>
          <Card className="portal-summary-card"><span>{t('Permohonan iKES', 'iKES applications')}</span><strong>{ikes.length}</strong></Card>
          <Card className="portal-summary-card"><span>{t('Permohonan KPK+', 'KPK+ applications')}</span><strong>{kpk.length}</strong></Card>
          <Card className="portal-summary-card"><span>{t('Tempahan Bilik JPP', 'Room Bookings')}</span><strong>{roomBookings.length}</strong></Card>
          <Card className="portal-summary-card"><span>{t('Permohonan e-Aset', 'e-Asset applications')}</span><strong>{assets.length}</strong></Card>
          <Card className="portal-summary-card"><span>{t('Rekod derma', 'Donation records')}</span><strong>{donations.length}</strong></Card>
        </div>

        <div className="tabs portal-tabs" role="tablist" aria-label={t('Jenis rekod', 'Record type')}>
          <Button variant={tab === 'ikes' ? 'primary' : 'ghost'} onClick={() => setTab('ikes')}>iKES</Button>
          <Button variant={tab === 'kpk' ? 'primary' : 'ghost'} onClick={() => setTab('kpk')}>KPK+</Button>
          <Button variant={tab === 'tempahan' ? 'primary' : 'ghost'} onClick={() => setTab('tempahan')}>{t('Tempahan', 'Bookings')}</Button>
          <Button variant={tab === 'assets' ? 'primary' : 'ghost'} onClick={() => setTab('assets')}>e-Aset</Button>
          <Button variant={tab === 'donations' ? 'primary' : 'ghost'} onClick={() => setTab('donations')}>{t('Derma', 'Donations')}</Button>
          <Button variant={tab === 'notifications' ? 'primary' : 'ghost'} onClick={() => setTab('notifications')}>
            🔔 {t('Notifikasi', 'Notifications')} {notifications.filter((n) => !n.is_read).length > 0 ? `(${notifications.filter((n) => !n.is_read).length})` : ''}
          </Button>
        </div>

        {noticeMsg && <Notice type={noticeMsg.type}>{noticeMsg.text}</Notice>}

        {loading ? <LoadingBlock /> : (
          <div className="portal-records-wrap">
            {/* NOTIFICATIONS TAB */}
            {tab === 'notifications' ? (
              <Card className="table-card">
                {notifications.length === 0 ? <EmptyState title={t('Tiada notifikasi', 'No notifications')} /> : (
                  <div className="responsive-table">
                    <table>
                      <thead>
                        <tr>
                          <th>{t('Tajuk', 'Title')}</th>
                          <th>{t('Mesej', 'Message')}</th>
                          <th>{t('Tarikh', 'Date')}</th>
                          <th>{t('Tindakan', 'Action')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notifications.map((item) => (
                          <tr key={item.id} style={{ opacity: item.is_read ? 0.7 : 1, fontWeight: item.is_read ? 'normal' : 'bold' }}>
                            <td>{item.title}</td>
                            <td>{item.message}</td>
                            <td>{formatDate(item.created_at, language)}</td>
                            <td>
                              {!item.is_read && (
                                <Button variant="ghost" className="compact" onClick={() => void markNotificationRead(item.id)}>
                                  {t('Tanda Dibaca', 'Mark Read')}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ) : (
              /* PROFESSIONAL APPLICATION HISTORY CARDS GRID */
              <div className="application-cards-grid">
                {/* iKES APPLICATIONS */}
                {tab === 'ikes' && (
                  ikes.length === 0 ? <Card><EmptyState title={t('Belum ada permohonan iKES', 'No iKES applications yet')} /></Card> : (
                    ikes.map((item) => (
                      <article className="app-history-card" key={item.id}>
                        <div className="app-card-header">
                          <div>
                            <span className="app-card-kicker">{item.ikes_type === 'care' ? 'iKES Care' : 'iKES Go-Home'}</span>
                            <h3 className="app-card-title">{formatMoney(item.amount)}</h3>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                        <div className="app-card-body">
                          <p><strong>{t('Tarikh Mohon', 'Submitted')}:</strong> {formatDate(item.created_at, language)}</p>
                          <p><strong>{t('Sebab', 'Reason')}:</strong> {item.reason}</p>
                          <p><strong>{t('Bayaran Balik', 'Repayment')}:</strong> {repaymentText(item)}</p>
                          {item.admin_notes && <p className="app-admin-note"><strong>{t('Nota Admin', 'Admin Note')}:</strong> {item.admin_notes}</p>}
                        </div>
                        <div className="app-card-footer">
                          <Button variant="ghost" className="compact" onClick={() => setDetailModal({
                            title: t('Butiran Permohonan iKES', 'iKES Application Details'),
                            content: (
                              <div className="modal-detail-stack">
                                <p><b>Nama Pemohon:</b> {item.applicant_name}</p>
                                <p><b>Kelas / Unit:</b> {item.class_name}</p>
                                <p><b>No. Telefon:</b> {item.phone}</p>
                                <p><b>Jenis Bantuan:</b> {item.ikes_type === 'care' ? 'iKES Care' : 'iKES Go-Home'}</p>
                                <p><b>Amaun:</b> {formatMoney(item.amount)}</p>
                                <p><b>Sebab:</b> {item.reason}</p>
                                <p><b>Bayaran Balik:</b> {repaymentText(item)}</p>
                                <p><b>Status:</b> {item.status.toUpperCase()}</p>
                                {item.ticket_path && <p><b>Bukti / Tiket:</b> Ada dimuat naik</p>}
                                {item.admin_notes && <p><b>Nota Admin:</b> {item.admin_notes}</p>}
                              </div>
                            )
                          })}>
                            {t('Lihat Butiran', 'View Details')}
                          </Button>
                          {item.status === 'pending' && (
                            <Button variant="danger" className="compact" onClick={() => setCancelModal({
                              open: true,
                              type: 'ikes',
                              id: item.id,
                              title: `${item.ikes_type === 'care' ? 'iKES Care' : 'iKES Go-Home'} (${formatMoney(item.amount)})`
                            })}>
                              {t('Batal Permohonan', 'Cancel Application')}
                            </Button>
                          )}
                        </div>
                      </article>
                    ))
                  )
                )}

                {/* KPK+ LOAN APPLICATIONS */}
                {tab === 'kpk' && (
                  kpk.length === 0 ? <Card><EmptyState title={t('Belum ada permohonan KPK+', 'No KPK+ loan applications yet')} /></Card> : (
                    kpk.map((item) => (
                      <article className="app-history-card" key={item.id}>
                        <div className="app-card-header">
                          <div>
                            <span className="app-card-kicker">KPK+ Loan</span>
                            <h3 className="app-card-title">{item.club_name}</h3>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                        <div className="app-card-body">
                          <p><strong>{t('Amaun Pinjaman', 'Loan Amount')}:</strong> {formatMoney(item.loan_amount)}</p>
                          <p><strong>{t('Tarikh Mohon', 'Submitted')}:</strong> {formatDate(item.created_at, language)}</p>
                          <p><strong>{t('Tujuan', 'Purpose')}:</strong> {item.purpose}</p>
                          {item.admin_notes && <p className="app-admin-note"><strong>{t('Nota Admin', 'Admin Note')}:</strong> {item.admin_notes}</p>}
                        </div>
                        <div className="app-card-footer">
                          <Button variant="ghost" className="compact" onClick={() => setDetailModal({
                            title: t('Butiran Pinjaman KPK+', 'KPK+ Loan Application Details'),
                            content: (
                              <div className="modal-detail-stack">
                                <p><b>Kelab / Persatuan:</b> {item.club_name}</p>
                                <p><b>Nama Pemohon:</b> {item.applicant_name}</p>
                                <p><b>Jabatan / Unit:</b> {item.department_unit}</p>
                                <p><b>No. Telefon:</b> {item.phone}</p>
                                <p><b>Biro Angkat:</b> {item.kpk_bureaus?.name || '—'}</p>
                                <p><b>Amaun Pinjaman:</b> {formatMoney(item.loan_amount)}</p>
                                <p><b>Tujuan:</b> {item.purpose}</p>
                                <p><b>Status:</b> {item.status.toUpperCase()}</p>
                                {item.admin_notes && <p><b>Nota Admin:</b> {item.admin_notes}</p>}
                              </div>
                            )
                          })}>
                            {t('Lihat Butiran', 'View Details')}
                          </Button>
                          {item.status === 'pending' && (
                            <Button variant="danger" className="compact" onClick={() => setCancelModal({
                              open: true,
                              type: 'kpk',
                              id: item.id,
                              title: `Pinjaman KPK+ - ${item.club_name}`
                            })}>
                              {t('Batal Permohonan', 'Cancel Application')}
                            </Button>
                          )}
                        </div>
                      </article>
                    ))
                  )
                )}

                {/* TEMPAHAN BILIK JPP */}
                {tab === 'tempahan' && (
                  roomBookings.length === 0 ? <Card><EmptyState title={t('Belum ada tempahan bilik JPP', 'No JPP room bookings yet')} /></Card> : (
                    roomBookings.map((item) => (
                      <article className="app-history-card" key={item.id}>
                        <div className="app-card-header">
                          <div>
                            <span className="app-card-kicker">Tempahan Bilik JPP</span>
                            <h3 className="app-card-title">{formatDate(item.booking_date, language)}</h3>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                        <div className="app-card-body">
                          <p><strong>{t('Biro Angkat', 'Bureau')}:</strong> {item.bureau}</p>
                          <p><strong>{t('Tujuan', 'Purpose')}:</strong> {item.purpose}</p>
                          {item.remarks && <p><strong>{t('Catatan', 'Remarks')}:</strong> {item.remarks}</p>}
                          {item.admin_notes && <p className="app-admin-note"><strong>{t('Nota Admin', 'Admin Note')}:</strong> {item.admin_notes}</p>}
                        </div>
                        <div className="app-card-footer">
                          <Button variant="ghost" className="compact" onClick={() => setDetailModal({
                            title: t('Butiran Tempahan Bilik JPP', 'JPP Room Booking Details'),
                            content: (
                              <div className="modal-detail-stack">
                                <p><b>Tarikh Tempahan:</b> {formatDate(item.booking_date, language)}</p>
                                <p><b>Nama Pemohon:</b> {item.name}</p>
                                <p><b>Biro Angkat:</b> {item.bureau}</p>
                                <p><b>Tujuan:</b> {item.purpose}</p>
                                {item.remarks && <p><b>Catatan Tambahan:</b> {item.remarks}</p>}
                                <p><b>Status:</b> {item.status.toUpperCase()}</p>
                                {item.admin_notes && <p><b>Nota Admin:</b> {item.admin_notes}</p>}
                              </div>
                            )
                          })}>
                            {t('Lihat Butiran', 'View Details')}
                          </Button>
                          {item.status === 'pending' && (
                            <Button variant="danger" className="compact" onClick={() => setCancelModal({
                              open: true,
                              type: 'tempahan',
                              id: item.id,
                              title: `Tempahan Bilik JPP (${formatDate(item.booking_date, language)})`
                            })}>
                              {t('Batal Permohonan', 'Cancel Application')}
                            </Button>
                          )}
                        </div>
                      </article>
                    ))
                  )
                )}

                {/* e-ASET APPLICATIONS */}
                {tab === 'assets' && (
                  assets.length === 0 ? <Card><EmptyState title={t('Belum ada permohonan e-Aset', 'No e-Asset applications yet')} /></Card> : (
                    assets.map((item) => (
                      <article className="app-history-card" key={item.id}>
                        <div className="app-card-header">
                          <div>
                            <span className="app-card-kicker">e-Aset</span>
                            <h3 className="app-card-title">
                              {language === 'bm' ? item.asset_items?.name_bm : item.asset_items?.name_en || item.asset_items?.name_bm || 'Aset'} ({item.quantity} unit)
                            </h3>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                        <div className="app-card-body">
                          <p><strong>{t('Tarikh Mohon', 'Submitted')}:</strong> {formatDate(item.created_at, language)}</p>
                          <p><strong>{t('Tempoh Pinjaman', 'Borrow Period')}:</strong> {formatDate(item.borrow_date, language)} – {formatDate(item.return_date, language)}</p>
                          <p><strong>{t('Tujuan', 'Purpose')}:</strong> {item.purpose}</p>
                          {item.admin_notes && <p className="app-admin-note"><strong>{t('Nota Admin', 'Admin Note')}:</strong> {item.admin_notes}</p>}
                        </div>
                        <div className="app-card-footer">
                          <Button variant="ghost" className="compact" onClick={() => setDetailModal({
                            title: t('Butiran Permohonan e-Aset', 'e-Asset Application Details'),
                            content: (
                              <div className="modal-detail-stack">
                                <p><b>Nama Pemohon:</b> {item.applicant_name}</p>
                                <p><b>Jabatan / Unit / Kelas:</b> {item.class_name}</p>
                                <p><b>No. Telefon:</b> {item.phone}</p>
                                <p><b>Aset:</b> {language === 'bm' ? item.asset_items?.name_bm : item.asset_items?.name_en || item.asset_items?.name_bm}</p>
                                <p><b>Kuantiti:</b> {item.quantity} unit</p>
                                <p><b>Tarikh Pinjam:</b> {formatDate(item.borrow_date, language)}</p>
                                <p><b>Tarikh Pulang:</b> {formatDate(item.return_date, language)}</p>
                                <p><b>Tujuan:</b> {item.purpose}</p>
                                <p><b>Perakuan Aku Janji:</b> {item.aku_janji_agreed ? 'Disetujui' : '—'}</p>
                                <p><b>Status:</b> {item.status.toUpperCase()}</p>
                                {item.admin_notes && <p><b>Nota Admin:</b> {item.admin_notes}</p>}
                              </div>
                            )
                          })}>
                            {t('Lihat Butiran', 'View Details')}
                          </Button>
                          {item.status === 'pending' && (
                            <Button variant="danger" className="compact" onClick={() => setCancelModal({
                              open: true,
                              type: 'assets',
                              id: item.id,
                              title: language === 'bm' ? item.asset_items?.name_bm || 'Permohonan e-Aset' : item.asset_items?.name_en || item.asset_items?.name_bm || 'e-Asset Application'
                            })}>
                              {t('Batal Permohonan', 'Cancel Application')}
                            </Button>
                          )}
                        </div>
                      </article>
                    ))
                  )
                )}

                {/* TABUNG JUMAAT / DONATIONS */}
                {tab === 'donations' && (
                  donations.length === 0 ? <Card><EmptyState title={t('Belum ada rekod sumbangan', 'No donation records yet')} /></Card> : (
                    donations.map((item) => (
                      <article className="app-history-card" key={item.id}>
                        <div className="app-card-header">
                          <div>
                            <span className="app-card-kicker">{t('Sumbangan Tabung Jumaat', 'Friday Fund Contribution')}</span>
                            <h3 className="app-card-title">{formatMoney(item.amount)}</h3>
                          </div>
                          <StatusBadge status={item.status === 'verified' ? 'verified' : item.status} />
                        </div>
                        <div className="app-card-body">
                          <p><strong>{t('Tarikh Sumbangan', 'Donation Date')}:</strong> {formatDate(item.created_at, language)}</p>
                          <p><strong>{t('Kaedah', 'Method')}:</strong> {item.payment_method.replace('_', ' ').toUpperCase()}</p>
                          <p><strong>{t('No. Rujukan', 'Reference No')}:</strong> {item.reference_no || '—'}</p>
                        </div>
                        <div className="app-card-footer">
                          <Button variant="ghost" className="compact" onClick={() => setDetailModal({
                            title: t('Butiran Sumbangan Tabung Jumaat', 'Friday Fund Contribution Details'),
                            content: (
                              <div className="modal-detail-stack">
                                <p><b>Penyumbang:</b> {item.donor_name || 'Hamba Allah'}</p>
                                <p><b>Amaun:</b> {formatMoney(item.amount)}</p>
                                <p><b>Kaedah Pembayaran:</b> {item.payment_method.replace('_', ' ').toUpperCase()}</p>
                                <p><b>No. Rujukan:</b> {item.reference_no || '—'}</p>
                                <p><b>Hasrat / Mesej:</b> {item.message || '—'}</p>
                                <p><b>Tarikh:</b> {formatDate(item.created_at, language)}</p>
                                <p><b>Status Rekod:</b> {item.status.toUpperCase()}</p>
                              </div>
                            )
                          })}>
                            {t('Lihat Butiran', 'View Details')}
                          </Button>
                          {item.status === 'pending' && (
                            <Button variant="danger" className="compact" onClick={() => setCancelModal({
                              open: true,
                              type: 'donations',
                              id: item.id,
                              title: `Sumbangan ${formatMoney(item.amount)}`
                            })}>
                              {t('Batal Permohonan', 'Cancel Request')}
                            </Button>
                          )}
                        </div>
                      </article>
                    ))
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* CANCELLATION CONFIRMATION MODAL */}
        {cancelModal && cancelModal.open && (
          <div className="modal-backdrop" onClick={() => setCancelModal(null)}>
            <div className="modal-card cancel-confirmation-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '90%', margin: 'auto', background: 'var(--surface)', padding: '24px', borderRadius: '16px', boxShadow: '0 16px 40px rgba(0,0,0,0.25)', border: '1px solid var(--line)' }}>
              <h2 style={{ fontSize: '1.35rem', margin: '0 0 8px 0', color: 'var(--danger)' }}>
                {t('Batal Permohonan?', 'Cancel Application?')}
              </h2>
              <p style={{ fontSize: '.92rem', color: 'var(--ink-soft)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                {t(
                  `Adakah anda pasti mahu membatalkan permohonan "${cancelModal.title}"? Tindakan ini tidak boleh dibatalkan.`,
                  `Are you sure you want to cancel the application "${cancelModal.title}"? This action cannot be undone.`
                )}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifySelf: 'flex-end', marginTop: '16px' }}>
                <Button variant="secondary" className="compact" onClick={() => setCancelModal(null)} disabled={cancelBusy}>
                  {t('Kekalkan Permohonan', 'Keep Application')}
                </Button>
                <Button variant="danger" className="compact" onClick={handleCancelApplication} disabled={cancelBusy}>
                  {cancelBusy ? t('Membatalkan…', 'Cancelling…') : t('Ya, Batal Permohonan', 'Cancel Request')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* APPLICATION DETAIL MODAL */}
        {detailModal && (
          <div className="modal-backdrop" onClick={() => setDetailModal(null)}>
            <div className="modal-card application-detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '90%', margin: 'auto', background: 'var(--surface)', padding: '24px', borderRadius: '16px', boxShadow: '0 16px 40px rgba(0,0,0,0.25)', border: '1px solid var(--line)' }}>
              <h2 style={{ fontSize: '1.25rem', margin: '0 0 16px 0', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                {detailModal.title}
              </h2>
              {detailModal.content}
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <Button variant="primary" className="compact" onClick={() => setDetailModal(null)}>
                  {t('Tutup', 'Close')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
