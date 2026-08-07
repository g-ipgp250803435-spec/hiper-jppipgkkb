import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, Field, LoadingBlock, Notice, PageHeader } from '../components/UI'
import { Icon } from '../components/Icons'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import { isSupabaseConfigured } from '../lib/config'
import { formatDate, formatMoney, uploadPrivateFile } from '../lib/helpers'
import { localise } from '../lib/siteSettings'
import { supabase } from '../lib/supabase'
import type { DonationSettings, FundDisbursement, FundSummary } from '../lib/types'

const emptySettings: DonationSettings = {
  id: 1,
  bank_name: 'Nama Bank Rasmi JPP',
  account_name: 'JPP IPG Kampus Kota Bharu',
  account_number: 'Tetapkan melalui panel admin',
  qr_url: null,
  note_bm: 'Sila gunakan akaun rasmi yang dipaparkan sahaja.',
  note_en: 'Please use only the official account displayed here.',
  updated_at: new Date().toISOString(),
}

const presetAmounts = [5, 10, 20, 50, 100, 200]

export default function DonationsPage() {
  const { language, t } = useUi()
  const { settings: siteSettings } = useSiteSettings()
  const { user } = useAuth()
  const [summary, setSummary] = useState<FundSummary>({ total_verified: 0, total_disbursed: 0, balance: 0 })
  const [settings, setSettings] = useState<DonationSettings>(emptySettings)
  const [disbursements, setDisbursements] = useState<FundDisbursement[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [amount, setAmount] = useState('5')
  const [method, setMethod] = useState<'qr' | 'bank_transfer' | 'cash'>('qr')
  const [donorName, setDonorName] = useState('')
  const [referenceNo, setReferenceNo] = useState('')
  const [messageText, setMessageText] = useState('')
  const [proof, setProof] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)

  const loadData = async () => {
    if (!isSupabaseConfigured) return
    const [summaryResult, settingsResult, disbursementResult] = await Promise.all([
      supabase.rpc('get_public_fund_summary'),
      supabase.from('donation_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('fund_disbursements').select('*').eq('is_public', true).order('disbursed_at', { ascending: false }),
    ])
    const summaryData = Array.isArray(summaryResult.data) ? summaryResult.data[0] : summaryResult.data
    if (summaryData) setSummary(summaryData as FundSummary)
    if (settingsResult.data) setSettings(settingsResult.data as DonationSettings)
    setDisbursements((disbursementResult.data as FundDisbursement[]) || [])
    setLoading(false)
  }

  useEffect(() => { void loadData() }, [])

  const latestDisbursement = disbursements[0]
  const balanceRatio = useMemo(() => summary.total_verified > 0 ? Math.max(0, Math.min(100, (summary.balance / summary.total_verified) * 100)) : 0, [summary])

  const copyAccount = async () => {
    if (!settings.account_number) return
    await navigator.clipboard.writeText(settings.account_number)
    setNotice({ type: 'success', text: t('Nombor akaun telah disalin.', 'Account number copied.') })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    setNotice(null)
    if (!isSupabaseConfigured) {
      setNotice({ type: 'danger', text: 'Supabase belum dikonfigurasi.' })
      return
    }
    const numericAmount = Number(amount)
    if (numericAmount <= 0) {
      setNotice({ type: 'danger', text: t('Amaun mestilah melebihi RM0.', 'Amount must be greater than RM0.') })
      return
    }
    if (method !== 'cash' && !proof) {
      setNotice({ type: 'danger', text: t('Sila muat naik bukti pembayaran.', 'Please upload payment proof.') })
      return
    }

    setBusy(true)
    try {
      let proofPath: string | null = null
      if (proof) proofPath = await uploadPrivateFile(supabase, user.id, proof, 'donation-proofs')
      const { error } = await supabase.from('donations').insert({
        user_id: user.id,
        donor_name: donorName.trim() || null,
        amount: numericAmount,
        payment_method: method,
        proof_path: proofPath,
        reference_no: referenceNo.trim() || null,
        message: messageText.trim() || null,
      })
      if (error) throw error
      setReferenceNo('')
      setMessageText('')
      setProof(null)
      setNotice({ type: 'success', text: t('Rekod sumbangan dihantar untuk semakan pentadbir.', 'Your contribution record was submitted for administrator review.') })
    } catch (error) {
      setNotice({ type: 'danger', text: error instanceof Error ? error.message : t('Rekod sumbangan gagal dihantar.', 'The contribution record could not be submitted.') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="section page-intro-section fund-page-intro">
        <div className="container">
          <PageHeader
            eyebrow={localise(siteSettings.pages.donations.eyebrow, language)}
            title={localise(siteSettings.pages.donations.title, language)}
            description={localise(siteSettings.pages.donations.description, language)}
          />
        </div>
      </section>

      <section className="section fund-overview-section">
        <div className="container">
          <div className="fund-overview-grid">
            <div className="fund-overview-primary">
              <span>{t('BAKI SEMASA', 'CURRENT BALANCE')}</span>
              <strong>{formatMoney(summary.balance)}</strong>
              <p>{t('Baki selepas kutipan disahkan dan agihan direkodkan.', 'Balance after verified collections and recorded distributions.')}</p>
              <div className="fund-progress"><span style={{ width: `${balanceRatio}%` }} /></div>
              <small>{Math.round(balanceRatio)}% {t('daripada jumlah kutipan disahkan', 'of verified collections')}</small>
            </div>
            <div className="fund-overview-metric"><Icon name="chart" size={22} /><span>{t('KUTIPAN · DISAHKAN', 'COLLECTIONS · VERIFIED')}</span><strong>{formatMoney(summary.total_verified)}</strong></div>
            <div className="fund-overview-metric"><Icon name="wallet" size={22} /><span>{t('AGIHAN · DIREKODKAN', 'DISTRIBUTIONS · RECORDED')}</span><strong>{formatMoney(summary.total_disbursed)}</strong></div>
            <div className="fund-overview-metric"><Icon name="shield" size={22} /><span>{t('REKOD AWAM', 'PUBLIC RECORD')}</span><strong>{disbursements.length}</strong></div>
          </div>
        </div>
      </section>

      <section className="section fund-content-section">
        <div className="container fund-public-grid">
          <Card className="donation-channel-card">
            <div className="card-kicker"><span />{t('Ketelusan awam', 'Public transparency')}</div>
            <div className="donation-channel-layout">
              <div className="donation-channel-copy">
                <h2>{t('Sumbang kepada Tabung Jumaat', 'Contribute to the Friday Fund')}</h2>
                <p>{t('Sumbangan anda membantu kebajikan pelajar dan inisiatif komuniti kampus.', 'Your contribution supports student welfare and campus community initiatives.')}</p>
                <span className="field-label">{t('Pilih jumlah sumbangan', 'Choose a contribution amount')}</span>
                <div className="amount-choice-grid">
                  {presetAmounts.map((value) => <button type="button" key={value} className={amount === String(value) ? 'active' : ''} onClick={() => setAmount(String(value))}>RM{value.toFixed(2)}</button>)}
                  <button type="button" className="amount-other" onClick={() => { setAmount(''); setShowForm(true) }}><Icon name="wallet" size={16} /> {t('Amaun lain', 'Other amount')}</button>
                </div>
                {user ? (
                  <Button className="button-large" onClick={() => setShowForm((current) => !current)}>
                    <Icon name="external-link" size={17} /> {showForm ? t('Tutup borang', 'Close form') : t('Sumbang sekarang', 'Contribute now')}
                  </Button>
                ) : (
                  <Link className="button button-primary button-large" to="/login"><Icon name="login" size={17} /> {t('Log masuk untuk merekod', 'Sign in to record')}</Link>
                )}
              </div>

              <div className="donation-channel-bank">
                {loading ? <LoadingBlock /> : (
                  <>
                    <div className="qr-box premium-qr-box">
                      {settings.qr_url ? <img src={settings.qr_url} alt={t('Kod QR rasmi Tabung Jumaat', 'Official Friday Fund QR code')} /> : <span>QR</span>}
                    </div>
                    <strong>DuitNow QR</strong>
                    <div className="official-bank-card">
                      <small>{settings.bank_name || '—'}</small>
                      <b>{settings.account_name || '—'}</b>
                      <div><code>{settings.account_number || '—'}</code><button type="button" onClick={() => void copyAccount()} aria-label={t('Salin nombor akaun', 'Copy account number')}><Icon name="copy" size={17} /></button></div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {notice && <Notice type={notice.type}>{notice.text}</Notice>}
            {showForm && user && (
              <form className="form-grid donation-inline-form" onSubmit={submit}>
                <Field label={t('Amaun (RM)', 'Amount (RM)')} required><input type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></Field>
                <Field label={t('Kaedah', 'Method')} required>
                  <select value={method} onChange={(event) => setMethod(event.target.value as typeof method)}>
                    <option value="qr">QR</option><option value="bank_transfer">{t('Pindahan bank', 'Bank transfer')}</option><option value="cash">{t('Tunai', 'Cash')}</option>
                  </select>
                </Field>
                <Field label={t('Nama penderma', 'Donor name')} hint={t('Boleh dikosongkan untuk rekod tanpa nama.', 'May be left blank for an anonymous record.')}><input value={donorName} onChange={(event) => setDonorName(event.target.value)} /></Field>
                <Field label={t('Nombor rujukan', 'Reference number')}><input value={referenceNo} onChange={(event) => setReferenceNo(event.target.value)} /></Field>
                {method !== 'cash' && <div className="full-span"><Field label={t('Bukti pembayaran', 'Payment proof')} required><input type="file" accept=".pdf,image/jpeg,image/png" onChange={(event) => setProof(event.target.files?.[0] || null)} required /></Field></div>}
                <div className="full-span"><Field label={t('Pesanan ringkas', 'Short message')}><textarea rows={3} value={messageText} onChange={(event) => setMessageText(event.target.value)} /></Field></div>
                <div className="full-span form-actions"><Button type="submit" disabled={busy}>{busy ? t('Menghantar…', 'Submitting…') : t('Hantar untuk semakan', 'Submit for review')}</Button></div>
              </form>
            )}
            {(language === 'bm' ? settings.note_bm : settings.note_en || settings.note_bm) && <Notice type="warning">{language === 'bm' ? settings.note_bm : settings.note_en || settings.note_bm}</Notice>}
          </Card>

          <Card className="latest-disbursement-card">
            <div className="card-kicker"><span />{t('Agihan', 'Distribution')}</div>
            <h2>{t('Agihan terkini', 'Latest distribution')}</h2>
            {!latestDisbursement ? (
              <EmptyState title={t('Belum ada rekod dipaparkan', 'No records are displayed yet')} />
            ) : (
              <div className="latest-disbursement-item">
                <div>
                  <strong>{language === 'bm' ? latestDisbursement.title_bm : latestDisbursement.title_en || latestDisbursement.title_bm}</strong>
                  <small>{formatDate(latestDisbursement.disbursed_at, language)}</small>
                  <p>{language === 'bm' ? latestDisbursement.description_bm : latestDisbursement.description_en || latestDisbursement.description_bm}</p>
                </div>
                <b>− {formatMoney(latestDisbursement.amount)}</b>
              </div>
            )}
            {disbursements.length > 1 && (
              <div className="compact-disbursement-list">
                {disbursements.slice(1, 5).map((item) => (
                  <div key={item.id}><span>{language === 'bm' ? item.title_bm : item.title_en || item.title_bm}</span><b>{formatMoney(item.amount)}</b></div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>
    </>
  )
}
