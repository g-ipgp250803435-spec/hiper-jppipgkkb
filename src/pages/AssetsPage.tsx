import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, Field, LoadingBlock, Notice, PageHeader } from '../components/UI'
import { Icon } from '../components/Icons'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import { isSupabaseConfigured } from '../lib/config'
import { localise } from '../lib/siteSettings'
import { supabase } from '../lib/supabase'
import type { AssetItem } from '../lib/types'

const sampleAssets: AssetItem[] = [
  {
    id: 'sample-projector',
    asset_code: 'AST-001',
    category_bm: 'Audio Visual',
    category_en: 'Audio Visual',
    sort_order: 1,
    name_bm: 'Projektor',
    name_en: 'Projector',
    description_bm: 'Projektor mudah alih untuk program dan pembentangan rasmi.',
    description_en: 'Portable projector for official programmes and presentations.',
    stock_total: 2,
    stock_available: 2,
    active: true,
    image_url: null,
  },
  {
    id: 'sample-extension',
    asset_code: 'AST-002',
    category_bm: 'Elektrik',
    category_en: 'Electrical',
    sort_order: 2,
    name_bm: 'Wayar Sambungan',
    name_en: 'Extension Cable',
    description_bm: 'Untuk kegunaan program dan aktiviti rasmi.',
    description_en: 'For official programmes and activities.',
    stock_total: 5,
    stock_available: 4,
    active: true,
    image_url: null,
  },
]

export default function AssetsPage() {
  const { language, t } = useUi()
  const { settings } = useSiteSettings()
  const { user, profile, refreshProfile } = useAuth()
  const formRef = useRef<HTMLDivElement>(null)
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
    void supabase.from('asset_items').select('*').eq('active', true).order('sort_order', { ascending: true }).order('name_bm').then(({ data, error }) => {
      if (error) {
        // Older database versions do not have sort_order on asset_items.
        void supabase.from('asset_items').select('*').eq('active', true).order('name_bm').then(({ data: fallbackData }) => {
          const rows = (fallbackData as AssetItem[]) || []
          setAssets(rows)
          setAssetId(rows[0]?.id || '')
          setLoading(false)
        })
        return
      }
      const rows = (data as AssetItem[]) || []
      setAssets(rows)
      setAssetId(rows[0]?.id || '')
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!assetId && assets.length && isSupabaseConfigured) setAssetId(assets[0].id)
  }, [assetId, assets])

  const selectedAsset = assets.find((item) => item.id === assetId)

  const chooseAsset = (id: string) => {
    setAssetId(id)
    setQuantity('1')
    window.requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    setMessage(null)
    if (!isSupabaseConfigured) {
      setMessage({ type: 'danger', text: 'Supabase belum dikonfigurasi.' })
      return
    }
    if (!borrowDate || !returnDate || returnDate < borrowDate) {
      setMessage({ type: 'danger', text: t('Tarikh pulang mesti selepas atau sama dengan tarikh pinjam.', 'Return date must be on or after the borrowing date.') })
      return
    }
    const numericQuantity = Number(quantity)
    if (!selectedAsset || numericQuantity < 1 || numericQuantity > selectedAsset.stock_available) {
      setMessage({ type: 'danger', text: t('Kuantiti melebihi stok yang tersedia.', 'Quantity exceeds available stock.') })
      return
    }

    setBusy(true)
    try {
      const { error } = await supabase.from('asset_applications').insert({
        user_id: user.id,
        applicant_name: name.trim(),
        class_name: className.trim(),
        phone: phone.trim(),
        asset_id: assetId,
        quantity: numericQuantity,
        borrow_date: borrowDate,
        return_date: returnDate,
        purpose: purpose.trim(),
      })
      if (error) throw error
      await supabase.from('profiles').update({ full_name: name.trim(), class_name: className.trim(), phone: phone.trim() }).eq('id', user.id)
      await refreshProfile()
      setPurpose('')
      setQuantity('1')
      setMessage({ type: 'success', text: t('Permohonan e-Aset berjaya dihantar. Semak status dalam Permohonan Saya.', 'Your e-Asset request was submitted. Check its status under My Applications.') })
    } catch (error) {
      setMessage({ type: 'danger', text: error instanceof Error ? error.message : t('Permohonan gagal dihantar.', 'The request could not be submitted.') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="section page-intro-section asset-intro-section">
        <div className="container">
          <PageHeader
            eyebrow={localise(settings.pages.assets.eyebrow, language)}
            title={localise(settings.pages.assets.title, language)}
            description={localise(settings.pages.assets.description, language)}
          />
        </div>
      </section>

      <section className="section asset-catalogue-section">
        <div className="container">
          {loading ? <LoadingBlock /> : assets.length === 0 ? <EmptyState title={t('Tiada aset tersedia', 'No assets available')} /> : (
            <div className="premium-asset-grid">
              {assets.map((asset) => {
                const available = asset.stock_available > 0
                return (
                  <article className="premium-asset-card" key={asset.id}>
                    <div className="premium-asset-image">
                      {asset.image_url ? <img src={asset.image_url} alt={language === 'bm' ? asset.name_bm : asset.name_en || asset.name_bm} /> : <span><Icon name="box" size={54} /></span>}
                    </div>
                    <div className="premium-asset-copy">
                      <div className="asset-card-meta">
                        <span>{language === 'bm' ? asset.category_bm || 'Aset' : asset.category_en || asset.category_bm || 'Asset'}</span>
                        <b className={available ? 'available' : 'unavailable'}>{available ? t('Tersedia', 'Available') : t('Tiada stok', 'Out of stock')}</b>
                      </div>
                      <h2>{language === 'bm' ? asset.name_bm : asset.name_en || asset.name_bm}</h2>
                      <p>{language === 'bm' ? asset.description_bm : asset.description_en || asset.description_bm}</p>
                      <div className="asset-card-footer">
                        <span>{asset.asset_code || `AST-${asset.id.slice(0, 6).toUpperCase()}`}</span>
                        <button type="button" onClick={() => chooseAsset(asset.id)} disabled={!available}>
                          {available ? t('Mohon sekarang', 'Request now') : t('Tidak tersedia', 'Unavailable')} <Icon name="chevron-right" size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="section asset-application-section" ref={formRef}>
        <div className="container two-column-layout assets-application-layout">
          <div className="application-guide">
            <p className="eyebrow">{t('Permohonan Dalam Talian', 'Online Application')}</p>
            <h2>{t('Tempah aset dengan aliran yang jelas.', 'Reserve an asset through a clear workflow.')}</h2>
            <p>{t('Pilih aset, nyatakan tempoh penggunaan dan tunggu semakan pentadbir. Stok hanya ditolak selepas permohonan diluluskan.', 'Choose an asset, specify the usage period and await administrator review. Stock is deducted only after approval.')}</p>
            <ol className="numbered-process">
              <li><span>01</span>{t('Pilih aset dan kuantiti.', 'Choose an asset and quantity.')}</li>
              <li><span>02</span>{t('Lengkapkan tarikh serta tujuan.', 'Complete the dates and purpose.')}</li>
              <li><span>03</span>{t('Semak status dalam Permohonan Saya.', 'Track the status under My Applications.')}</li>
            </ol>
          </div>

          <Card className="form-card premium-form-card" title={t('Borang pinjaman aset', 'Asset borrowing form')}>
            {!user ? (
              <div className="locked-panel">
                <span><Icon name="lock" size={34} /></span>
                <h3>{t('Log masuk diperlukan', 'Sign in required')}</h3>
                <p>{t('Gunakan akaun DELIMa untuk menghantar permohonan.', 'Use your DELIMa account to submit a request.')}</p>
                <Link className="button button-primary" to="/login">{t('Log masuk DELIMa', 'DELIMa sign in')}</Link>
              </div>
            ) : (
              <form className="form-grid" onSubmit={submit}>
                {message && <div className="full-span"><Notice type={message.type}>{message.text}</Notice></div>}
                <div className="full-span">
                  <Field label={t('Aset', 'Asset')} required>
                    <select value={assetId} onChange={(event) => { setAssetId(event.target.value); setQuantity('1') }} required>
                      <option value="">{t('Pilih aset', 'Select asset')}</option>
                      {assets.map((asset) => <option value={asset.id} key={asset.id} disabled={asset.stock_available < 1}>{language === 'bm' ? asset.name_bm : asset.name_en || asset.name_bm} ({asset.stock_available} {t('tersedia', 'available')})</option>)}
                    </select>
                  </Field>
                </div>
                <Field label={t('Nama penuh', 'Full name')} required><input value={name} onChange={(event) => setName(event.target.value)} required /></Field>
                <Field label={t('Kelas', 'Class')} required><input value={className} onChange={(event) => setClassName(event.target.value)} required /></Field>
                <Field label={t('Nombor telefon', 'Phone number')} required><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required /></Field>
                <Field label={t('Kuantiti', 'Quantity')} hint={selectedAsset ? `${selectedAsset.stock_available} ${t('unit tersedia', 'units available')}` : undefined} required>
                  <input type="number" min="1" max={selectedAsset?.stock_available || 1} value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
                </Field>
                <Field label={t('Tarikh pinjam', 'Borrow date')} required><input type="date" value={borrowDate} onChange={(event) => setBorrowDate(event.target.value)} required /></Field>
                <Field label={t('Tarikh pulang', 'Return date')} required><input type="date" min={borrowDate || undefined} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} required /></Field>
                <div className="full-span"><Field label={t('Tujuan penggunaan', 'Purpose')} required><textarea rows={4} value={purpose} onChange={(event) => setPurpose(event.target.value)} required /></Field></div>
                <div className="full-span form-actions"><Button type="submit" disabled={busy || !assetId || (selectedAsset?.stock_available || 0) < 1}>{busy ? t('Menghantar…', 'Submitting…') : t('Hantar permohonan', 'Submit request')}</Button></div>
              </form>
            )}
          </Card>
        </div>
      </section>
    </>
  )
}
