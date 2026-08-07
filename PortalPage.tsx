import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, LoadingBlock, Notice, PageHeader, StatusBadge } from '../components/UI'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { formatDate, formatMoney } from '../lib/helpers'
import { supabase } from '../lib/supabase'
import type { AssetApplication, Donation, IkesApplication } from '../lib/types'

export default function PortalPage() {
  const { user, profile } = useAuth()
  const { language, t } = useUi()
  const [tab, setTab] = useState<'ikes' | 'assets' | 'donations'>('ikes')
  const [ikes, setIkes] = useState<IkesApplication[]>([])
  const [assets, setAssets] = useState<AssetApplication[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    void Promise.all([
      supabase.from('ikes_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('asset_applications').select('*, asset_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('donations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]).then(([ikesResult, assetResult, donationResult]) => {
      if (ikesResult.error || assetResult.error || donationResult.error) {
        setError(ikesResult.error?.message || assetResult.error?.message || donationResult.error?.message || 'Data gagal dimuatkan.')
      }
      setIkes((ikesResult.data as IkesApplication[]) || [])
      setAssets((assetResult.data as AssetApplication[]) || [])
      setDonations((donationResult.data as Donation[]) || [])
      setLoading(false)
    })
  }, [user])

  return (
    <section className="section">
      <div className="container">
        <PageHeader
          eyebrow={t('AKAUN SISWA GURU', 'STUDENT TEACHER ACCOUNT')}
          title={t(`Selamat datang, ${profile?.full_name || 'Siswa Guru'}`, `Welcome, ${profile?.full_name || 'Student Teacher'}`)}
          description={user?.email || ''}
          actions={<div className="button-row"><Link className="button button-secondary" to="/ikes">+ iKES</Link><Link className="button button-secondary" to="/e-aset">+ e-Aset</Link></div>}
        />
        {error && <Notice type="danger">{error}</Notice>}
        <div className="portal-summary">
          <Card><span>{t('Kelas', 'Class')}</span><strong>{profile?.class_name || '—'}</strong></Card>
          <Card><span>{t('Permohonan iKES', 'iKES applications')}</span><strong>{ikes.length}</strong></Card>
          <Card><span>{t('Permohonan e-Aset', 'e-Asset applications')}</span><strong>{assets.length}</strong></Card>
          <Card><span>{t('Rekod derma', 'Donation records')}</span><strong>{donations.length}</strong></Card>
        </div>

        <div className="tabs" role="tablist">
          <Button variant={tab === 'ikes' ? 'primary' : 'ghost'} onClick={() => setTab('ikes')}>iKES</Button>
          <Button variant={tab === 'assets' ? 'primary' : 'ghost'} onClick={() => setTab('assets')}>e-Aset</Button>
          <Button variant={tab === 'donations' ? 'primary' : 'ghost'} onClick={() => setTab('donations')}>{t('Derma', 'Donations')}</Button>
        </div>

        {loading ? <LoadingBlock /> : (
          <Card className="table-card">
            {tab === 'ikes' && (ikes.length === 0 ? <EmptyState title={t('Belum ada permohonan iKES', 'No iKES applications yet')} /> : (
              <div className="responsive-table"><table><thead><tr><th>{t('Tarikh', 'Date')}</th><th>{t('Jenis', 'Type')}</th><th>{t('Amaun', 'Amount')}</th><th>{t('Status', 'Status')}</th><th>{t('Nota admin', 'Admin note')}</th><th>{t('Bayaran balik', 'Repayment')}</th></tr></thead><tbody>
                {ikes.map((item) => <tr key={item.id}><td>{formatDate(item.created_at, language)}</td><td>{item.ikes_type === 'care' ? 'iKES Care' : 'iKES Go-Home'}</td><td>{formatMoney(item.amount)}</td><td><StatusBadge status={item.status} /></td><td>{item.admin_notes || '—'}</td><td>{item.repaid_at ? t('Selesai', 'Paid') : item.repayment_due_at ? `${t('Sebelum', 'By')} ${formatDate(item.repayment_due_at, language)}` : '—'}</td></tr>)}
              </tbody></table></div>
            ))}
            {tab === 'assets' && (assets.length === 0 ? <EmptyState title={t('Belum ada permohonan e-Aset', 'No e-Asset applications yet')} /> : (
              <div className="responsive-table"><table><thead><tr><th>{t('Aset', 'Asset')}</th><th>{t('Kuantiti', 'Quantity')}</th><th>{t('Tempoh', 'Period')}</th><th>{t('Status', 'Status')}</th><th>{t('Nota admin', 'Admin note')}</th></tr></thead><tbody>
                {assets.map((item) => <tr key={item.id}><td>{language === 'bm' ? item.asset_items?.name_bm : item.asset_items?.name_en || item.asset_items?.name_bm}</td><td>{item.quantity}</td><td>{formatDate(item.borrow_date, language)} – {formatDate(item.return_date, language)}</td><td><StatusBadge status={item.status} /></td><td>{item.admin_notes || '—'}</td></tr>)}
              </tbody></table></div>
            ))}
            {tab === 'donations' && (donations.length === 0 ? <EmptyState title={t('Belum ada rekod sumbangan', 'No donation records yet')} /> : (
              <div className="responsive-table"><table><thead><tr><th>{t('Tarikh', 'Date')}</th><th>{t('Amaun', 'Amount')}</th><th>{t('Kaedah', 'Method')}</th><th>{t('Rujukan', 'Reference')}</th><th>{t('Status', 'Status')}</th></tr></thead><tbody>
                {donations.map((item) => <tr key={item.id}><td>{formatDate(item.created_at, language)}</td><td>{formatMoney(item.amount)}</td><td>{item.payment_method.replace('_', ' ')}</td><td>{item.reference_no || '—'}</td><td><StatusBadge status={item.status === 'verified' ? 'verified' : item.status} /></td></tr>)}
              </tbody></table></div>
            ))}
          </Card>
        )}
      </div>
    </section>
  )
}
