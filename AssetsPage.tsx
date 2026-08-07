import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, Field, LoadingBlock, Notice, PageHeader } from '../components/UI'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { isSupabaseConfigured } from '../lib/config'
import { supabase } from '../lib/supabase'
import type { AssetItem } from '../lib/types'

const sampleAssets: AssetItem[] = [
  { id: 'sample-projector', name_bm: 'Projektor', name_en: 'Projector', description_bm: 'Contoh aset. Gantikan melalui panel admin.', description_en: 'Sample asset. Replace through the admin panel.', stock_total: 2, stock_available: 2, active: true, image_url: null },
  { id: 'sample-extension', name_bm: 'Wayar Sambungan', name_en: 'Extension Cable', description_bm: 'Untuk kegunaan program dan aktiviti rasmi.', description_en: 'For official programmes and activities.', stock_total: 5, stock_available: 4, active: true, image_url: null },
]

export default function AssetsPage() {
  const { language, t } = useUi()
  const { user, profile, refreshProfile } = useAuth()
  const [assets, setAssets] = useState<AssetItem[]>(sampleAssets)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [assetId, setAssetId] = useState('')
  const [name, setName] = useState('')
  const [className, setClassName] = useState('')
  const [phone, setPhone] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [borrowDate, setBorrowDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [purpose, setPurpose] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  useEffect(() => {
    setName(profile?.full_name || user?.user_metadata?.full_name || '')
    setClassName(profile?.class_name || '')
    setPhone(profile?.phone || '')
  }, [profile, user])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void supabase.from('asset_items').select('*').eq('active', true).order('name_bm').then(({ data }) => {
      const rows = (data as AssetItem[]) || []
      setAssets(rows)
      setAssetId(rows[0]?.id || '')
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!assetId && assets.length && isSupabaseConfigured) setAssetId(assets[0].id)
  }, [assetId, assets])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    setMessage(null)
    if (!isSupabaseConfigured) {
      setMessage({ type: 'danger', text: 'Supabase belum dikonfigurasi.' })
      return
    }
    if (returnDate < borrowDate) {
      setMessage({ type: 'danger', text: 'Tarikh pulang mesti selepas tarikh pinjam.' })
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.from('asset_applications').insert({
        user_id: user.id,
        applicant_name: name,
        class_name: className,
        phone,
        asset_id: assetId,
        quantity: Number(quantity),
        borrow_date: borrowDate,
        return_date: returnDate,
        purpose,
      })
      if (error) throw error
      await supabase.from('profiles').update({ full_name: name, class_name: className, phone }).eq('id', user.id)
      await refreshProfile()
      setPurpose('')
      setMessage({ type: 'success', text: 'Permohonan e-Aset berjaya dihantar.' })
    } catch (error) {
      setMessage({ type: 'danger', text: error instanceof Error ? error.message : 'Permohonan gagal dihantar.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <PageHeader
          eyebrow={t('PINJAMAN ASET JPP', 'JPP ASSET LOAN')}
          title="e-Aset"
          description={t('Semak aset tersedia dan hantar permohonan pinjaman secara dalam talian.', 'Check available assets and submit an online borrowing request.')}
        />
        <div className="two-column-layout assets-layout">
          <div>
            <h2 className="subheading">{t('Katalog aset', 'Asset catalogue')}</h2>
            {loading ? <LoadingBlock /> : assets.length === 0 ? <EmptyState title={t('Tiada aset tersedia', 'No assets available')} /> : (
              <div className="asset-grid">
                {assets.map((asset) => (
                  <Card className="asset-card" key={asset.id}>
                    <div className="asset-image">
                      {asset.image_url ? <img src={asset.image_url} alt="" /> : <span>▣</span>}
                    </div>
                    <h3>{language === 'bm' ? asset.name_bm : asset.name_en || asset.name_bm}</h3>
                    <p>{language === 'bm' ? asset.description_bm : asset.description_en || asset.description_bm}</p>
                    <div className="stock-row">
                      <span>{t('Tersedia', 'Available')}</span>
                      <strong>{asset.stock_available} / {asset.stock_total}</strong>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <Card className="form-card" title={t('Borang pinjaman', 'Borrowing form')}>
            {!user ? (
              <div className="locked-panel">
                <span>🔒</span><h3>{t('Log masuk diperlukan', 'Sign in required')}</h3>
                <Link className="button button-primary" to="/login">{t('Log masuk DELIMa', 'DELIMa sign in')}</Link>
              </div>
            ) : (
              <form className="form-grid" onSubmit={submit}>
                {message && <div className="full-span"><Notice type={message.type}>{message.text}</Notice></div>}
                <div className="full-span"><Field label={t('Aset', 'Asset')} required>
                  <select value={assetId} onChange={(event) => setAssetId(event.target.value)} required>
                    <option value="">{t('Pilih aset', 'Select asset')}</option>
                    {assets.map((asset) => <option value={asset.id} key={asset.id}>{language === 'bm' ? asset.name_bm : asset.name_en || asset.name_bm}</option>)}
                  </select>
                </Field></div>
                <Field label={t('Nama penuh', 'Full name')} required><input value={name} onChange={(event) => setName(event.target.value)} required /></Field>
                <Field label={t('Kelas', 'Class')} required><input value={className} onChange={(event) => setClassName(event.target.value)} required /></Field>
                <Field label={t('Nombor telefon', 'Phone number')} required><input value={phone} onChange={(event) => setPhone(event.target.value)} required /></Field>
                <Field label={t('Kuantiti', 'Quantity')} required><input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></Field>
                <Field label={t('Tarikh pinjam', 'Borrow date')} required><input type="date" value={borrowDate} onChange={(event) => setBorrowDate(event.target.value)} required /></Field>
                <Field label={t('Tarikh pulang', 'Return date')} required><input type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} required /></Field>
                <div className="full-span"><Field label={t('Tujuan penggunaan', 'Purpose')} required><textarea rows={4} value={purpose} onChange={(event) => setPurpose(event.target.value)} required /></Field></div>
                <div className="full-span form-actions"><Button type="submit" disabled={busy || !assetId}>{busy ? t('Menghantar…', 'Submitting…') : t('Hantar permohonan', 'Submit request')}</Button></div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </section>
  )
}
