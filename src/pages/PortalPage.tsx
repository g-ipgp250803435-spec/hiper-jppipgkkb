import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, LoadingBlock, Notice, PageHeader, StatusBadge } from '../components/UI'
import StatusTimeline from '../components/v3/StatusTimeline'
import { Icon } from '../components/Icons'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { formatDate, formatMoney } from '../lib/helpers'
import { supabase } from '../lib/supabase'
import type { AssetApplication, Donation, IkesApplication, KpkApplication, Notification } from '../lib/types'

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
  const [tab, setTab] = useState<'ikes' | 'assets' | 'kpk' | 'donations' | 'notifications'>('ikes')
  const [ikes, setIkes] = useState<IkesApplication[]>([])
  const [assets, setAssets] = useState<AssetApplication[]>([])
  const [kpk, setKpk] = useState<KpkApplication[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    void Promise.all([
      supabase.from('ikes_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('asset_applications').select('*, asset_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('kpk_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('donations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('recipient_id', user.id).order('created_at', { ascending: false }),
    ])
      .then(([ikesRes, assetRes, kpkRes, donationRes, notifRes]) => {
        if (ikesRes.error || assetRes.error || kpkRes.error || donationRes.error || notifRes.error) {
          setError(
            ikesRes.error?.message ||
              assetRes.error?.message ||
              kpkRes.error?.message ||
              donationRes.error?.message ||
              notifRes.error?.message ||
              'Data gagal dimuatkan.'
          )
        }
        setIkes((ikesRes.data as IkesApplication[]) || [])
        setAssets((assetRes.data as AssetApplication[]) || [])
        setKpk((kpkRes.data as KpkApplication[]) || [])
        setDonations((donationRes.data as Donation[]) || [])
        setNotifications((notifRes.data as Notification[]) || [])
        setLoading(false)
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : 'Data gagal dimuatkan.')
        setLoading(false)
      })
  }, [user])

  const markRead = async (notifId: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notifId)
      setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n)))
    } catch {
      // ignore update errors
    }
  }

  const repaymentText = (item: IkesApplication) =>
    item.repaid_at
      ? t('Selesai', 'Paid')
      : item.repayment_due_at
        ? `${t('Sebelum', 'By')} ${formatDate(item.repayment_due_at, language)}`
        : '—'

  const unreadCount = notifications.filter((n) => !n.is_read).length

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
              <Link className="button button-secondary" to="/e-aset">+ e-Aset</Link>
              <Link className="button button-secondary" to="/kpk">+ KPK+</Link>
            </div>
          }
        />

        {error && <Notice type="danger">{error}</Notice>}

        <div className="portal-summary">
          <Card className="portal-summary-card"><span>{t('Kelas', 'Class')}</span><strong>{profile?.class_name || '—'}</strong></Card>
          <Card className="portal-summary-card"><span>{t('Permohonan iKES', 'iKES applications')}</span><strong>{ikes.length}</strong></Card>
          <Card className="portal-summary-card"><span>{t('Permohonan e-Aset', 'e-Asset applications')}</span><strong>{assets.length}</strong></Card>
          <Card className="portal-summary-card"><span>{t('Permohonan KPK+', 'KPK+ loans')}</span><strong>{kpk.length}</strong></Card>
          <Card className="portal-summary-card"><span>{t('Rekod derma', 'Donation records')}</span><strong>{donations.length}</strong></Card>
        </div>

        <div className="tabs portal-tabs" role="tablist" aria-label={t('Jenis rekod', 'Record type')}>
          <Button variant={tab === 'ikes' ? 'primary' : 'ghost'} onClick={() => setTab('ikes')}>iKES</Button>
          <Button variant={tab === 'assets' ? 'primary' : 'ghost'} onClick={() => setTab('assets')}>e-Aset</Button>
          <Button variant={tab === 'kpk' ? 'primary' : 'ghost'} onClick={() => setTab('kpk')}>KPK+</Button>
          <Button variant={tab === 'donations' ? 'primary' : 'ghost'} onClick={() => setTab('donations')}>{t('Derma', 'Donations')}</Button>
          <Button variant={tab === 'notifications' ? 'primary' : 'ghost'} onClick={() => setTab('notifications')}>
            🔔 {t('Pemberitahuan', 'Notifications')} {unreadCount > 0 ? `(${unreadCount})` : ''}
          </Button>
        </div>

        {loading ? <LoadingBlock /> : (
          <>
            <Card className="table-card portal-desktop-records">
              {tab === 'ikes' && (ikes.length === 0 ? <EmptyState title={t('Belum ada permohonan iKES', 'No iKES applications yet')} /> : (
                <div className="responsive-table"><table><thead><tr><th>{t('Tarikh', 'Date')}</th><th>{t('Jenis', 'Type')}</th><th>{t('Amaun', 'Amount')}</th><th>{t('Status', 'Status')}</th><th>{t('Nota admin', 'Admin note')}</th><th>{t('Bayaran balik', 'Repayment')}</th></tr></thead><tbody>
                  {ikes.map((item) => <tr key={item.id}><td>{formatDate(item.created_at, language)}</td><td>{item.ikes_type === 'care' ? 'iKES Care' : 'iKES Go-Home'}</td><td>{formatMoney(item.amount)}</td><td><StatusBadge status={item.status} /></td><td>{item.admin_notes || '—'}</td><td>{repaymentText(item)}</td></tr>)}
                </tbody></table></div>
              ))}

              {tab === 'assets' && (assets.length === 0 ? <EmptyState title={t('Belum ada permohonan e-Aset', 'No e-Asset applications yet')} /> : (
                <div className="responsive-table"><table><thead><tr><th>{t('Aset', 'Asset')}</th><th>{t('Kuantiti', 'Quantity')}</th><th>{t('Tempoh', 'Period')}</th><th>{t('Status', 'Status')}</th><th>{t('Nota admin', 'Admin note')}</th></tr></thead><tbody>
                  {assets.map((item) => <tr key={item.id}><td>{language === 'bm' ? item.asset_items?.name_bm : item.asset_items?.name_en || item.asset_items?.name_bm}</td><td>{item.quantity}</td><td>{formatDate(item.borrow_date, language)} – {formatDate(item.return_date, language)}</td><td><StatusBadge status={item.status} /></td><td>{item.admin_notes || '—'}</td></tr>)}
                </tbody></table></div>
              ))}

              {tab === 'kpk' && (kpk.length === 0 ? <EmptyState title={t('Belum ada permohonan KPK+', 'No KPK+ applications yet')} /> : (
                <div className="responsive-table"><table><thead><tr><th>{t('Kelab / Biro', 'Club / Bureau')}</th><th>{t('Amaun', 'Amount')}</th><th>{t('Tujuan', 'Purpose')}</th><th>{t('Status & Talian Masa', 'Status & Timeline')}</th><th>{t('Nota Bendahari', 'Treasurer Notes')}</th></tr></thead><tbody>
                  {kpk.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.club_name}</strong>
                        <small style={{ display: 'block', color: 'var(--ink-soft)' }}>{item.bureau_name || 'Biro'} · {formatDate(item.created_at, language)}</small>
                      </td>
                      <td><strong>{formatMoney(item.loan_amount)}</strong></td>
                      <td><p style={{ margin: 0, fontSize: '13px' }}>{item.purpose}</p></td>
                      <td>
                        <StatusTimeline status={item.status} />
                      </td>
                      <td>{item.admin_notes || '—'}</td>
                    </tr>
                  ))}
                </tbody></table></div>
              ))}

              {tab === 'donations' && (donations.length === 0 ? <EmptyState title={t('Belum ada rekod sumbangan', 'No donation records yet')} /> : (
                <div className="responsive-table"><table><thead><tr><th>{t('Tarikh', 'Date')}</th><th>{t('Amaun', 'Amount')}</th><th>{t('Kaedah', 'Method')}</th><th>{t('Rujukan', 'Reference')}</th><th>{t('Status', 'Status')}</th></tr></thead><tbody>
                  {donations.map((item) => <tr key={item.id}><td>{formatDate(item.created_at, language)}</td><td>{formatMoney(item.amount)}</td><td>{item.payment_method.replace('_', ' ')}</td><td>{item.reference_no || '—'}</td><td><StatusBadge status={item.status === 'verified' ? 'verified' : item.status} /></td></tr>)}
                </tbody></table></div>
              ))}

              {tab === 'notifications' && (notifications.length === 0 ? <EmptyState title={t('Tiada pemberitahuan baharu', 'No notifications')} /> : (
                <div className="management-list" style={{ padding: '16px' }}>
                  {notifications.map((item) => (
                    <div key={item.id} className="management-item management-item-rich" style={{ background: item.is_read ? 'transparent' : 'rgba(160,20,40,0.04)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                      <div className="management-thumb"><Icon name="bell" size={24} /></div>
                      <div className="management-copy">
                        <strong style={{ fontSize: '15px' }}>{item.title}</strong>
                        <p className="management-excerpt" style={{ color: 'var(--ink-body)', marginTop: '4px' }}>{item.message}</p>
                        <small style={{ color: 'var(--ink-soft)' }}>{formatDate(item.created_at, language)}</small>
                      </div>
                      {!item.is_read && (
                        <Button variant="secondary" className="compact" onClick={() => void markRead(item.id)}>
                          {t('Tanda dibaca', 'Mark read')}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </Card>

            <div className="portal-mobile-records" aria-live="polite">
              {tab === 'ikes' && (ikes.length === 0 ? <EmptyState title={t('Belum ada permohonan iKES', 'No iKES applications yet')} /> : ikes.map((item) => (
                <article className="portal-mobile-card" key={item.id}>
                  <div className="portal-mobile-card-head">
                    <div>
                      <span className="portal-mobile-kicker">{item.ikes_type === 'care' ? 'iKES Care' : 'iKES Go-Home'}</span>
                      <strong className="portal-mobile-value">{formatMoney(item.amount)}</strong>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="portal-mobile-details">
                    <Detail label={t('Tarikh permohonan', 'Application date')}>{formatDate(item.created_at, language)}</Detail>
                    <Detail label={t('Bayaran balik', 'Repayment')}>{repaymentText(item)}</Detail>
                    <Detail label={t('Nota admin', 'Admin note')}>{item.admin_notes || '—'}</Detail>
                  </div>
                </article>
              )))}

              {tab === 'assets' && (assets.length === 0 ? <EmptyState title={t('Belum ada permohonan e-Aset', 'No e-Asset applications yet')} /> : assets.map((item) => (
                <article className="portal-mobile-card" key={item.id}>
                  <div className="portal-mobile-card-head">
                    <div>
                      <span className="portal-mobile-kicker">e-Aset</span>
                      <strong className="portal-mobile-value portal-mobile-asset-name">
                        {language === 'bm' ? item.asset_items?.name_bm : item.asset_items?.name_en || item.asset_items?.name_bm || '—'}
                      </strong>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="portal-mobile-details portal-mobile-details-two">
                    <Detail label={t('Kuantiti', 'Quantity')}>{item.quantity}</Detail>
                    <Detail label={t('Tempoh', 'Period')}>{formatDate(item.borrow_date, language)} – {formatDate(item.return_date, language)}</Detail>
                    <Detail label={t('Nota admin', 'Admin note')}>{item.admin_notes || '—'}</Detail>
                  </div>
                </article>
              )))}

              {tab === 'kpk' && (kpk.length === 0 ? <EmptyState title={t('Belum ada permohonan KPK+', 'No KPK+ applications yet')} /> : kpk.map((item) => (
                <article className="portal-mobile-card" key={item.id}>
                  <div className="portal-mobile-card-head">
                    <div>
                      <span className="portal-mobile-kicker">KPK+ · {item.club_name}</span>
                      <strong className="portal-mobile-value">{formatMoney(item.loan_amount)}</strong>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="portal-mobile-details">
                    <Detail label={t('Biro', 'Bureau')}>{item.bureau_name || 'Biro'}</Detail>
                    <Detail label={t('Tujuan', 'Purpose')}>{item.purpose}</Detail>
                    <Detail label={t('Nota Bendahari', 'Treasurer Notes')}>{item.admin_notes || '—'}</Detail>
                  </div>
                </article>
              )))}

              {tab === 'donations' && (donations.length === 0 ? <EmptyState title={t('Belum ada rekod sumbangan', 'No donation records yet')} /> : donations.map((item) => (
                <article className="portal-mobile-card" key={item.id}>
                  <div className="portal-mobile-card-head">
                    <div>
                      <span className="portal-mobile-kicker">{t('Sumbangan', 'Donation')}</span>
                      <strong className="portal-mobile-value">{formatMoney(item.amount)}</strong>
                    </div>
                    <StatusBadge status={item.status === 'verified' ? 'verified' : item.status} />
                  </div>
                  <div className="portal-mobile-details portal-mobile-details-two">
                    <Detail label={t('Tarikh', 'Date')}>{formatDate(item.created_at, language)}</Detail>
                    <Detail label={t('Kaedah', 'Method')}>{item.payment_method.replace('_', ' ')}</Detail>
                    <Detail label={t('Rujukan', 'Reference')}>{item.reference_no || '—'}</Detail>
                  </div>
                </article>
              )))}

              {tab === 'notifications' && (notifications.length === 0 ? <EmptyState title={t('Tiada pemberitahuan baharu', 'No notifications')} /> : notifications.map((item) => (
                <article className="portal-mobile-card" key={item.id}>
                  <div className="portal-mobile-card-head">
                    <div>
                      <span className="portal-mobile-kicker">🔔 {item.notification_type}</span>
                      <strong className="portal-mobile-value">{item.title}</strong>
                    </div>
                  </div>
                  <p style={{ margin: '8px 0', fontSize: '13px' }}>{item.message}</p>
                </article>
              )))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
