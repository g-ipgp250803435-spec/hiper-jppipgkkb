import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button, Card, EmptyState, Field, LoadingBlock, Notice, PageHeader, StatCard, StatusBadge } from '../components/UI'
import { useUi } from '../contexts/UiContext'
import { formatDate, formatMoney, openPrivateFile, uploadPublicFile } from '../lib/helpers'
import { supabase } from '../lib/supabase'
import type {
  Announcement,
  AssetApplication,
  AssetItem,
  Donation,
  DonationSettings,
  FundDisbursement,
  IkesApplication,
  OrganizationMember,
  RequestStatus,
} from '../lib/types'

type AdminTab = 'overview' | 'ikes' | 'assets-requests' | 'donations' | 'announcements' | 'catalogue' | 'organization' | 'fund'

const initialAnnouncement = { title_bm: '', title_en: '', content_bm: '', content_en: '', published: true, pinned: false }
const initialAsset = { name_bm: '', name_en: '', description_bm: '', description_en: '', stock_total: 1, stock_available: 1, active: true }
const initialMember = { name: '', position_bm: '', position_en: '', unit_bm: '', unit_en: '', class_name: '', duties_bm: '', duties_en: '', sort_order: 1, active: true }
const initialDisbursement = { title_bm: '', title_en: '', description_bm: '', description_en: '', amount: '', disbursed_at: new Date().toISOString().slice(0, 10), is_public: true }

export default function AdminPage() {
  const { language, t } = useUi()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [ikes, setIkes] = useState<IkesApplication[]>([])
  const [assetRequests, setAssetRequests] = useState<AssetApplication[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [catalogue, setCatalogue] = useState<AssetItem[]>([])
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [disbursements, setDisbursements] = useState<FundDisbursement[]>([])
  const [donationSettings, setDonationSettings] = useState<DonationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  const [announcementForm, setAnnouncementForm] = useState(initialAnnouncement)
  const [announcementPoster, setAnnouncementPoster] = useState<File | null>(null)
  const [assetForm, setAssetForm] = useState(initialAsset)
  const [assetImage, setAssetImage] = useState<File | null>(null)
  const [memberForm, setMemberForm] = useState(initialMember)
  const [memberPhoto, setMemberPhoto] = useState<File | null>(null)
  const [disbursementForm, setDisbursementForm] = useState(initialDisbursement)
  const [qrFile, setQrFile] = useState<File | null>(null)

  const loadAll = async () => {
    setLoading(true)
    const results = await Promise.all([
      supabase.from('ikes_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('asset_applications').select('*, asset_items(*)').order('created_at', { ascending: false }),
      supabase.from('donations').select('*').order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('asset_items').select('*').order('name_bm'),
      supabase.from('organization_members').select('*').order('sort_order'),
      supabase.from('fund_disbursements').select('*').order('disbursed_at', { ascending: false }),
      supabase.from('donation_settings').select('*').eq('id', 1).maybeSingle(),
    ])
    const firstError = results.find((result) => result.error)?.error
    if (firstError) setNotice({ type: 'danger', text: firstError.message })
    setIkes((results[0].data as IkesApplication[]) || [])
    setAssetRequests((results[1].data as AssetApplication[]) || [])
    setDonations((results[2].data as Donation[]) || [])
    setAnnouncements((results[3].data as Announcement[]) || [])
    setCatalogue((results[4].data as AssetItem[]) || [])
    setMembers((results[5].data as OrganizationMember[]) || [])
    setDisbursements((results[6].data as FundDisbursement[]) || [])
    setDonationSettings((results[7].data as DonationSettings | null) || null)
    setLoading(false)
  }

  useEffect(() => {
    void loadAll()
  }, [])

  const counts = useMemo(() => ({
    pendingIkes: ikes.filter((item) => item.status === 'pending').length,
    pendingAssets: assetRequests.filter((item) => item.status === 'pending').length,
    pendingDonations: donations.filter((item) => item.status === 'pending').length,
    verifiedDonations: donations.filter((item) => item.status === 'verified').reduce((sum, item) => sum + Number(item.amount), 0),
  }), [ikes, assetRequests, donations])

  const runAction = async (action: () => Promise<void>, successText: string) => {
    setBusy(true)
    setNotice(null)
    try {
      await action()
      setNotice({ type: 'success', text: successText })
      await loadAll()
    } catch (error) {
      setNotice({ type: 'danger', text: error instanceof Error ? error.message : 'Tindakan gagal.' })
    } finally {
      setBusy(false)
    }
  }

  const updateIkes = async (item: IkesApplication) => {
    await runAction(async () => {
      const { error } = await supabase.from('ikes_applications').update({
        status: item.status,
        admin_notes: item.admin_notes,
        repayment_due_at: item.repayment_due_at || null,
        repaid_at: item.repaid_at || null,
      }).eq('id', item.id)
      if (error) throw error
    }, 'Permohonan iKES dikemas kini.')
  }

  const updateAssetRequest = async (item: AssetApplication) => {
    await runAction(async () => {
      const { error } = await supabase.from('asset_applications').update({
        status: item.status,
        admin_notes: item.admin_notes,
        returned_at: item.returned_at || null,
      }).eq('id', item.id)
      if (error) throw error
    }, 'Permohonan e-Aset dikemas kini.')
  }

  const updateDonation = async (item: Donation) => {
    await runAction(async () => {
      const { error } = await supabase.from('donations').update({ status: item.status }).eq('id', item.id)
      if (error) throw error
    }, 'Rekod derma dikemas kini.')
  }

  const addAnnouncement = async (event: FormEvent) => {
    event.preventDefault()
    await runAction(async () => {
      let posterUrl: string | null = null
      if (announcementPoster) posterUrl = await uploadPublicFile(supabase, announcementPoster, 'announcements')
      const { error } = await supabase.from('announcements').insert({ ...announcementForm, poster_url: posterUrl })
      if (error) throw error
      setAnnouncementForm(initialAnnouncement)
      setAnnouncementPoster(null)
    }, 'Pengumuman ditambah.')
  }

  const addAsset = async (event: FormEvent) => {
    event.preventDefault()
    await runAction(async () => {
      let imageUrl: string | null = null
      if (assetImage) imageUrl = await uploadPublicFile(supabase, assetImage, 'assets')
      const { error } = await supabase.from('asset_items').insert({ ...assetForm, image_url: imageUrl })
      if (error) throw error
      setAssetForm(initialAsset)
      setAssetImage(null)
    }, 'Aset ditambah.')
  }

  const addMember = async (event: FormEvent) => {
    event.preventDefault()
    await runAction(async () => {
      let photoUrl: string | null = null
      if (memberPhoto) photoUrl = await uploadPublicFile(supabase, memberPhoto, 'organization')
      const { error } = await supabase.from('organization_members').insert({ ...memberForm, photo_url: photoUrl })
      if (error) throw error
      setMemberForm(initialMember)
      setMemberPhoto(null)
    }, 'Ahli organisasi ditambah.')
  }

  const addDisbursement = async (event: FormEvent) => {
    event.preventDefault()
    await runAction(async () => {
      const { error } = await supabase.from('fund_disbursements').insert({
        ...disbursementForm,
        amount: Number(disbursementForm.amount),
      })
      if (error) throw error
      setDisbursementForm(initialDisbursement)
    }, 'Rekod agihan ditambah.')
  }

  const saveDonationSettings = async (event: FormEvent) => {
    event.preventDefault()
    if (!donationSettings) return
    await runAction(async () => {
      let qrUrl = donationSettings.qr_url
      if (qrFile) qrUrl = await uploadPublicFile(supabase, qrFile, 'donation')
      const { error } = await supabase.from('donation_settings').upsert({ ...donationSettings, id: 1, qr_url: qrUrl })
      if (error) throw error
      setQrFile(null)
    }, 'Maklumat Tabung Jumaat dikemas kini.')
  }

  const deleteRow = async (table: string, id: string, label: string) => {
    if (!window.confirm(`Padam ${label}?`)) return
    await runAction(async () => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    }, `${label} dipadam.`)
  }

  if (loading) return <section className="section"><div className="container"><LoadingBlock label="Memuatkan panel pentadbir…" /></div></section>

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: t('Ringkasan', 'Overview') },
    { id: 'ikes', label: `iKES (${counts.pendingIkes})` },
    { id: 'assets-requests', label: `${t('Permohonan Aset', 'Asset Requests')} (${counts.pendingAssets})` },
    { id: 'donations', label: `${t('Derma', 'Donations')} (${counts.pendingDonations})` },
    { id: 'announcements', label: t('Pengumuman', 'Announcements') },
    { id: 'catalogue', label: t('Katalog Aset', 'Asset Catalogue') },
    { id: 'organization', label: t('Organisasi', 'Organisation') },
    { id: 'fund', label: t('Tabung', 'Fund') },
  ]

  return (
    <section className="section admin-section">
      <div className="container">
        <PageHeader eyebrow="ADMIN" title={t('Panel Pentadbir PBAK', 'PBAK Admin Panel')} description={t('Urus permohonan, kandungan dan rekod kewangan portal.', 'Manage applications, content and portal financial records.')} />
        {notice && <Notice type={notice.type}>{notice.text}</Notice>}
        <div className="admin-tabs">
          {tabs.map((item) => <Button key={item.id} variant={tab === item.id ? 'primary' : 'ghost'} onClick={() => setTab(item.id)}>{item.label}</Button>)}
        </div>

        {tab === 'overview' && (
          <>
            <div className="stats-grid">
              <StatCard label={t('iKES menunggu', 'Pending iKES')} value={String(counts.pendingIkes)} />
              <StatCard label={t('e-Aset menunggu', 'Pending e-Asset')} value={String(counts.pendingAssets)} />
              <StatCard label={t('Derma menunggu', 'Pending donations')} value={String(counts.pendingDonations)} />
              <StatCard label={t('Derma disahkan', 'Verified donations')} value={formatMoney(counts.verifiedDonations)} />
            </div>
            <div className="admin-overview-grid">
              <Card title={t('Tindakan segera', 'Immediate actions')}>
                <div className="action-list">
                  <button onClick={() => setTab('ikes')}>{counts.pendingIkes} {t('permohonan iKES menunggu', 'iKES applications pending')} →</button>
                  <button onClick={() => setTab('assets-requests')}>{counts.pendingAssets} {t('permohonan aset menunggu', 'asset requests pending')} →</button>
                  <button onClick={() => setTab('donations')}>{counts.pendingDonations} {t('derma perlu disahkan', 'donations to verify')} →</button>
                </div>
              </Card>
              <Card title={t('Kandungan portal', 'Portal content')}>
                <div className="overview-list"><span>{announcements.length} {t('pengumuman', 'announcements')}</span><span>{catalogue.length} {t('aset', 'assets')}</span><span>{members.length} {t('ahli organisasi', 'organisation members')}</span><span>{disbursements.length} {t('rekod agihan', 'distribution records')}</span></div>
              </Card>
            </div>
          </>
        )}

        {tab === 'ikes' && (
          <Card className="table-card" title={t('Semakan permohonan iKES', 'Review iKES applications')}>
            {ikes.length === 0 ? <EmptyState title={t('Tiada permohonan', 'No applications')} /> : <div className="responsive-table"><table><thead><tr><th>{t('Pemohon', 'Applicant')}</th><th>{t('Butiran', 'Details')}</th><th>{t('Status', 'Status')}</th><th>{t('Nota & bayaran balik', 'Notes & repayment')}</th><th>{t('Tindakan', 'Action')}</th></tr></thead><tbody>
              {ikes.map((item, index) => <tr key={item.id}><td><strong>{item.applicant_name}</strong><small>{item.class_name}<br />{item.phone}<br />{formatDate(item.created_at, language)}</small></td><td><strong>{item.ikes_type === 'care' ? 'iKES Care' : 'iKES Go-Home'} · {formatMoney(item.amount)}</strong><p>{item.reason}</p>{item.ticket_path && <Button variant="ghost" onClick={() => void openPrivateFile(supabase, item.ticket_path!)}>{t('Buka resit', 'Open receipt')}</Button>}</td><td><select value={item.status} onChange={(event) => setIkes((rows) => rows.map((row, i) => i === index ? { ...row, status: event.target.value as RequestStatus } : row))}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><StatusBadge status={item.status} /></td><td><textarea rows={3} placeholder={t('Nota admin', 'Admin note')} value={item.admin_notes || ''} onChange={(event) => setIkes((rows) => rows.map((row, i) => i === index ? { ...row, admin_notes: event.target.value } : row))} /><label className="mini-field"><span>{t('Tarikh akhir bayar', 'Repayment due')}</span><input type="date" value={item.repayment_due_at?.slice(0, 10) || ''} onChange={(event) => setIkes((rows) => rows.map((row, i) => i === index ? { ...row, repayment_due_at: event.target.value || null } : row))} /></label><label className="mini-field"><span>{t('Tarikh dibayar', 'Paid date')}</span><input type="date" value={item.repaid_at?.slice(0, 10) || ''} onChange={(event) => setIkes((rows) => rows.map((row, i) => i === index ? { ...row, repaid_at: event.target.value || null } : row))} /></label></td><td><Button disabled={busy} onClick={() => void updateIkes(item)}>{t('Simpan', 'Save')}</Button></td></tr>)}
            </tbody></table></div>}
          </Card>
        )}

        {tab === 'assets-requests' && (
          <Card className="table-card" title={t('Semakan permohonan e-Aset', 'Review e-Asset requests')}>
            {assetRequests.length === 0 ? <EmptyState title={t('Tiada permohonan', 'No requests')} /> : <div className="responsive-table"><table><thead><tr><th>{t('Pemohon', 'Applicant')}</th><th>{t('Aset & tempoh', 'Asset & period')}</th><th>{t('Status', 'Status')}</th><th>{t('Nota', 'Notes')}</th><th>{t('Tindakan', 'Action')}</th></tr></thead><tbody>
              {assetRequests.map((item, index) => <tr key={item.id}><td><strong>{item.applicant_name}</strong><small>{item.class_name}<br />{item.phone}</small></td><td><strong>{language === 'bm' ? item.asset_items?.name_bm : item.asset_items?.name_en || item.asset_items?.name_bm} × {item.quantity}</strong><p>{formatDate(item.borrow_date, language)} – {formatDate(item.return_date, language)}</p><small>{item.purpose}</small></td><td><select value={item.status} onChange={(event) => setAssetRequests((rows) => rows.map((row, i) => i === index ? { ...row, status: event.target.value as RequestStatus } : row))}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td><td><textarea rows={3} value={item.admin_notes || ''} onChange={(event) => setAssetRequests((rows) => rows.map((row, i) => i === index ? { ...row, admin_notes: event.target.value } : row))} /><label className="mini-field"><span>{t('Tarikh dipulangkan', 'Returned date')}</span><input type="date" value={item.returned_at?.slice(0, 10) || ''} onChange={(event) => setAssetRequests((rows) => rows.map((row, i) => i === index ? { ...row, returned_at: event.target.value || null } : row))} /></label></td><td><Button disabled={busy} onClick={() => void updateAssetRequest(item)}>{t('Simpan', 'Save')}</Button></td></tr>)}
            </tbody></table></div>}
          </Card>
        )}

        {tab === 'donations' && (
          <Card className="table-card" title={t('Pengesahan sumbangan', 'Donation verification')}>
            {donations.length === 0 ? <EmptyState title={t('Tiada rekod derma', 'No donation records')} /> : <div className="responsive-table"><table><thead><tr><th>{t('Tarikh', 'Date')}</th><th>{t('Penderma', 'Donor')}</th><th>{t('Bayaran', 'Payment')}</th><th>{t('Status', 'Status')}</th><th>{t('Tindakan', 'Action')}</th></tr></thead><tbody>
              {donations.map((item, index) => <tr key={item.id}><td>{formatDate(item.created_at, language)}</td><td><strong>{item.donor_name || t('Tanpa nama', 'Anonymous')}</strong><small>{item.message || '—'}</small></td><td><strong>{formatMoney(item.amount)}</strong><small>{item.payment_method.replace('_', ' ')} · {item.reference_no || '—'}</small>{item.proof_path && <Button variant="ghost" onClick={() => void openPrivateFile(supabase, item.proof_path!)}>{t('Buka bukti', 'Open proof')}</Button>}</td><td><select value={item.status} onChange={(event) => setDonations((rows) => rows.map((row, i) => i === index ? { ...row, status: event.target.value as Donation['status'] } : row))}><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select></td><td><Button disabled={busy} onClick={() => void updateDonation(item)}>{t('Simpan', 'Save')}</Button></td></tr>)}
            </tbody></table></div>}
          </Card>
        )}

        {tab === 'announcements' && (
          <div className="admin-content-grid">
            <Card title={t('Tambah pengumuman', 'Add announcement')}><form className="form-grid" onSubmit={addAnnouncement}>
              <Field label="Tajuk BM" required><input value={announcementForm.title_bm} onChange={(e) => setAnnouncementForm({ ...announcementForm, title_bm: e.target.value })} required /></Field><Field label="English title"><input value={announcementForm.title_en} onChange={(e) => setAnnouncementForm({ ...announcementForm, title_en: e.target.value })} /></Field>
              <div className="full-span"><Field label="Kandungan BM" required><textarea rows={5} value={announcementForm.content_bm} onChange={(e) => setAnnouncementForm({ ...announcementForm, content_bm: e.target.value })} required /></Field></div><div className="full-span"><Field label="English content"><textarea rows={5} value={announcementForm.content_en} onChange={(e) => setAnnouncementForm({ ...announcementForm, content_en: e.target.value })} /></Field></div>
              <div className="full-span"><Field label={t('Poster', 'Poster')}><input type="file" accept="image/*" onChange={(e) => setAnnouncementPoster(e.target.files?.[0] || null)} /></Field></div>
              <label className="checkbox-field"><input type="checkbox" checked={announcementForm.published} onChange={(e) => setAnnouncementForm({ ...announcementForm, published: e.target.checked })} /> {t('Terbitkan', 'Publish')}</label><label className="checkbox-field"><input type="checkbox" checked={announcementForm.pinned} onChange={(e) => setAnnouncementForm({ ...announcementForm, pinned: e.target.checked })} /> {t('Sematkan', 'Pin')}</label>
              <div className="full-span form-actions"><Button disabled={busy} type="submit">{t('Tambah pengumuman', 'Add announcement')}</Button></div>
            </form></Card>
            <Card title={t('Senarai pengumuman', 'Announcement list')}><div className="management-list">{announcements.map((item) => <div className="management-item" key={item.id}><div><strong>{item.title_bm}</strong><small>{item.published ? t('Diterbitkan', 'Published') : t('Draf', 'Draft')} · {formatDate(item.created_at, language)}</small></div><Button variant="danger" onClick={() => void deleteRow('announcements', item.id, 'pengumuman')}>{t('Padam', 'Delete')}</Button></div>)}</div></Card>
          </div>
        )}

        {tab === 'catalogue' && (
          <div className="admin-content-grid">
            <Card title={t('Tambah aset', 'Add asset')}><form className="form-grid" onSubmit={addAsset}>
              <Field label="Nama BM" required><input value={assetForm.name_bm} onChange={(e) => setAssetForm({ ...assetForm, name_bm: e.target.value })} required /></Field><Field label="English name"><input value={assetForm.name_en} onChange={(e) => setAssetForm({ ...assetForm, name_en: e.target.value })} /></Field>
              <Field label={t('Jumlah stok', 'Total stock')} required><input type="number" min="0" value={assetForm.stock_total} onChange={(e) => setAssetForm({ ...assetForm, stock_total: Number(e.target.value) })} required /></Field><Field label={t('Stok tersedia', 'Available stock')} required><input type="number" min="0" value={assetForm.stock_available} onChange={(e) => setAssetForm({ ...assetForm, stock_available: Number(e.target.value) })} required /></Field>
              <div className="full-span"><Field label="Penerangan BM"><textarea rows={3} value={assetForm.description_bm} onChange={(e) => setAssetForm({ ...assetForm, description_bm: e.target.value })} /></Field></div><div className="full-span"><Field label="English description"><textarea rows={3} value={assetForm.description_en} onChange={(e) => setAssetForm({ ...assetForm, description_en: e.target.value })} /></Field></div>
              <div className="full-span"><Field label={t('Gambar aset', 'Asset image')}><input type="file" accept="image/*" onChange={(e) => setAssetImage(e.target.files?.[0] || null)} /></Field></div>
              <div className="full-span form-actions"><Button disabled={busy} type="submit">{t('Tambah aset', 'Add asset')}</Button></div>
            </form></Card>
            <Card title={t('Katalog semasa', 'Current catalogue')}><div className="management-list">{catalogue.map((item) => <div className="management-item" key={item.id}><div><strong>{item.name_bm}</strong><small>{item.stock_available}/{item.stock_total} {t('tersedia', 'available')}</small></div><Button variant="danger" onClick={() => void deleteRow('asset_items', item.id, 'aset')}>{t('Padam', 'Delete')}</Button></div>)}</div></Card>
          </div>
        )}

        {tab === 'organization' && (
          <div className="admin-content-grid">
            <Card title={t('Tambah ahli', 'Add member')}><form className="form-grid" onSubmit={addMember}>
              <Field label={t('Nama penuh', 'Full name')} required><input value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} required /></Field><Field label={t('Susunan', 'Order')}><input type="number" min="1" value={memberForm.sort_order} onChange={(e) => setMemberForm({ ...memberForm, sort_order: Number(e.target.value) })} /></Field>
              <Field label="Jawatan BM" required><input value={memberForm.position_bm} onChange={(e) => setMemberForm({ ...memberForm, position_bm: e.target.value })} required /></Field><Field label="English position"><input value={memberForm.position_en} onChange={(e) => setMemberForm({ ...memberForm, position_en: e.target.value })} /></Field>
              <Field label="Unit BM"><input value={memberForm.unit_bm} onChange={(e) => setMemberForm({ ...memberForm, unit_bm: e.target.value })} /></Field><Field label="English unit"><input value={memberForm.unit_en} onChange={(e) => setMemberForm({ ...memberForm, unit_en: e.target.value })} /></Field>
              <Field label={t('Kelas', 'Class')}><input value={memberForm.class_name} onChange={(e) => setMemberForm({ ...memberForm, class_name: e.target.value })} /></Field><Field label={t('Gambar', 'Photo')}><input type="file" accept="image/*" onChange={(e) => setMemberPhoto(e.target.files?.[0] || null)} /></Field>
              <div className="full-span"><Field label="Bidang tugas BM"><textarea rows={3} value={memberForm.duties_bm} onChange={(e) => setMemberForm({ ...memberForm, duties_bm: e.target.value })} /></Field></div><div className="full-span"><Field label="English duties"><textarea rows={3} value={memberForm.duties_en} onChange={(e) => setMemberForm({ ...memberForm, duties_en: e.target.value })} /></Field></div>
              <div className="full-span form-actions"><Button disabled={busy} type="submit">{t('Tambah ahli', 'Add member')}</Button></div>
            </form></Card>
            <Card title={t('Carta organisasi', 'Organisation chart')}><div className="management-list">{members.map((item) => <div className="management-item" key={item.id}><div><strong>{item.sort_order}. {item.name}</strong><small>{item.position_bm} · {item.class_name || '—'}</small></div><Button variant="danger" onClick={() => void deleteRow('organization_members', item.id, 'ahli')}>{t('Padam', 'Delete')}</Button></div>)}</div></Card>
          </div>
        )}

        {tab === 'fund' && (
          <div className="stack">
            {donationSettings && <Card title={t('Maklumat akaun rasmi', 'Official account information')}><form className="form-grid" onSubmit={saveDonationSettings}>
              <Field label={t('Nama bank', 'Bank name')}><input value={donationSettings.bank_name || ''} onChange={(e) => setDonationSettings({ ...donationSettings, bank_name: e.target.value })} /></Field><Field label={t('Nama akaun', 'Account name')}><input value={donationSettings.account_name || ''} onChange={(e) => setDonationSettings({ ...donationSettings, account_name: e.target.value })} /></Field>
              <Field label={t('Nombor akaun', 'Account number')}><input value={donationSettings.account_number || ''} onChange={(e) => setDonationSettings({ ...donationSettings, account_number: e.target.value })} /></Field><Field label={t('Kod QR', 'QR code')}><input type="file" accept="image/*" onChange={(e) => setQrFile(e.target.files?.[0] || null)} /></Field>
              <div className="full-span"><Field label="Nota BM"><textarea rows={2} value={donationSettings.note_bm || ''} onChange={(e) => setDonationSettings({ ...donationSettings, note_bm: e.target.value })} /></Field></div><div className="full-span"><Field label="English note"><textarea rows={2} value={donationSettings.note_en || ''} onChange={(e) => setDonationSettings({ ...donationSettings, note_en: e.target.value })} /></Field></div>
              <div className="full-span form-actions"><Button disabled={busy} type="submit">{t('Simpan maklumat', 'Save information')}</Button></div>
            </form></Card>}
            <div className="admin-content-grid"><Card title={t('Tambah rekod agihan', 'Add distribution record')}><form className="form-grid" onSubmit={addDisbursement}>
              <Field label="Tajuk BM" required><input value={disbursementForm.title_bm} onChange={(e) => setDisbursementForm({ ...disbursementForm, title_bm: e.target.value })} required /></Field><Field label="English title"><input value={disbursementForm.title_en} onChange={(e) => setDisbursementForm({ ...disbursementForm, title_en: e.target.value })} /></Field>
              <Field label={t('Amaun (RM)', 'Amount (RM)')} required><input type="number" min="0.01" step="0.01" value={disbursementForm.amount} onChange={(e) => setDisbursementForm({ ...disbursementForm, amount: e.target.value })} required /></Field><Field label={t('Tarikh agihan', 'Distribution date')} required><input type="date" value={disbursementForm.disbursed_at} onChange={(e) => setDisbursementForm({ ...disbursementForm, disbursed_at: e.target.value })} required /></Field>
              <div className="full-span"><Field label="Penerangan BM"><textarea rows={3} value={disbursementForm.description_bm} onChange={(e) => setDisbursementForm({ ...disbursementForm, description_bm: e.target.value })} /></Field></div><div className="full-span"><Field label="English description"><textarea rows={3} value={disbursementForm.description_en} onChange={(e) => setDisbursementForm({ ...disbursementForm, description_en: e.target.value })} /></Field></div>
              <label className="checkbox-field full-span"><input type="checkbox" checked={disbursementForm.is_public} onChange={(e) => setDisbursementForm({ ...disbursementForm, is_public: e.target.checked })} /> {t('Paparkan kepada umum', 'Display publicly')}</label>
              <div className="full-span form-actions"><Button disabled={busy} type="submit">{t('Tambah rekod', 'Add record')}</Button></div>
            </form></Card><Card title={t('Rekod agihan', 'Distribution records')}><div className="management-list">{disbursements.map((item) => <div className="management-item" key={item.id}><div><strong>{item.title_bm} · {formatMoney(item.amount)}</strong><small>{formatDate(item.disbursed_at, language)} · {item.is_public ? t('Awam', 'Public') : t('Tersembunyi', 'Hidden')}</small></div><Button variant="danger" onClick={() => void deleteRow('fund_disbursements', item.id, 'rekod agihan')}>{t('Padam', 'Delete')}</Button></div>)}</div></Card></div>
          </div>
        )}
      </div>
    </section>
  )
}
