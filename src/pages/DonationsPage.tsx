import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, Field, LoadingBlock, Notice, PageHeader, StatCard } from '../components/UI'
import { Icon } from '../components/Icons'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { isSupabaseConfigured } from '../lib/config'
import { formatDate, formatMoney, uploadPrivateFile } from '../lib/helpers'
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

export default function DonationsPage() {
  const { language, t } = useUi()
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

  useEffect(() => {
    void loadData()
  }, [])

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
      setNotice({ type: 'danger', text: 'Amaun mestilah melebihi RM0.' })
      return
    }
    if (method !== 'cash' && !proof) {
      setNotice({ type: 'danger', text: 'Sila muat naik bukti pembayaran.' })
      return
    }

    setBusy(true)
    try {
      let proofPath: string | null = null
      if (proof) proofPath = await uploadPrivateFile(supabase, user.id, proof, 'donation-proofs')
      const { error } = await supabase.from('donations').insert({
        user_id: user.id,
        donor_name: donorName || null,
        amount: numericAmount,
        payment_method: method,
        proof_path: proofPath,
        reference_no: referenceNo || null,
        message: messageText || null,
      })
      if (error) throw error
      setReferenceNo('')
      setMessageText('')
      setProof(null)
      setNotice({ type: 'success', text: 'Rekod sumbangan dihantar untuk semakan pentadbir.' })
    } catch (error) {
      setNotice({ type: 'danger', text: error instanceof Error ? error.message : 'Rekod sumbangan gagal dihantar.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <PageHeader
          eyebrow={t('SUMBANGAN & KETELUSAN', 'CONTRIBUTION & TRANSPARENCY')}
          title={t('Tabung Jumaat', 'Friday Fund')}
          description={t('Sumbangan kecil, manfaat besar. Lihat kutipan, agihan dan baki semasa.', 'Small contributions, meaningful impact. View collections, distributions and current balance.')}
        />

        <div className="stats-grid">
          <StatCard label={t('Jumlah kutipan disahkan', 'Verified collections')} value={formatMoney(summary.total_verified)} />
          <StatCard label={t('Jumlah disalurkan', 'Total distributed')} value={formatMoney(summary.total_disbursed)} />
          <StatCard label={t('Baki semasa', 'Current balance')} value={formatMoney(summary.balance)} />
        </div>

        <div className="two-column-layout donation-layout">
          <div className="stack">
            <Card title={t('Saluran rasmi sumbangan', 'Official donation channel')}>
              {loading ? <LoadingBlock /> : (
                <div className="bank-card">
                  <div className="qr-box">
                    {settings.qr_url ? <img src={settings.qr_url} alt="Kod QR rasmi Tabung Jumaat" /> : <span>QR</span>}
                  </div>
                  <div>
                    <span className="meta">{t('Nama bank', 'Bank name')}</span>
                    <strong>{settings.bank_name || '—'}</strong>
                    <span className="meta">{t('Nama akaun', 'Account name')}</span>
                    <strong>{settings.account_name || '—'}</strong>
                    <span className="meta">{t('Nombor akaun', 'Account number')}</span>
                    <strong className="account-number">{settings.account_number || '—'}</strong>
                  </div>
                </div>
              )}
              <Notice type="warning">{language === 'bm' ? settings.note_bm : settings.note_en || settings.note_bm}</Notice>
            </Card>

            <Card title={t('Rekod agihan awam', 'Public distribution record')}>
              {disbursements.length === 0 ? (
                <EmptyState title={t('Belum ada rekod dipaparkan', 'No records are displayed yet')} />
              ) : (
                <div className="timeline">
                  {disbursements.map((item) => (
                    <div className="timeline-item" key={item.id}>
                      <div className="timeline-dot" />
                      <div>
                        <div className="meta-row"><span>{formatDate(item.disbursed_at, language)}</span><strong>{formatMoney(item.amount)}</strong></div>
                        <h3>{language === 'bm' ? item.title_bm : item.title_en || item.title_bm}</h3>
                        <p>{language === 'bm' ? item.description_bm : item.description_en || item.description_bm}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card className="form-card" title={t('Rekodkan sumbangan anda', 'Record your contribution')}>
            {!user ? (
              <div className="locked-panel">
                <span><Icon name="lock" size={34} /></span>
                <h3>{t('Log masuk untuk menghantar bukti', 'Sign in to submit proof')}</h3>
                <p>{t('Anda masih boleh membuat pindahan menggunakan butiran rasmi di sebelah.', 'You may still transfer using the official details shown alongside.')}</p>
                <Link className="button button-primary" to="/login">{t('Log masuk DELIMa', 'DELIMa sign in')}</Link>
              </div>
            ) : (
              <form className="form-grid" onSubmit={submit}>
                {notice && <div className="full-span"><Notice type={notice.type}>{notice.text}</Notice></div>}
                <Field label={t('Amaun (RM)', 'Amount (RM)')} required><input type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></Field>
                <Field label={t('Kaedah', 'Method')} required>
                  <select value={method} onChange={(event) => setMethod(event.target.value as typeof method)}>
                    <option value="qr">QR</option><option value="bank_transfer">{t('Pindahan bank', 'Bank transfer')}</option><option value="cash">{t('Tunai', 'Cash')}</option>
                  </select>
                </Field>
                <Field label={t('Nama penderma', 'Donor name')} hint={t('Boleh dikosongkan untuk paparan tanpa nama.', 'May be left blank for an anonymous record.')}><input value={donorName} onChange={(event) => setDonorName(event.target.value)} /></Field>
                <Field label={t('Nombor rujukan', 'Reference number')}><input value={referenceNo} onChange={(event) => setReferenceNo(event.target.value)} /></Field>
                {method !== 'cash' && <div className="full-span"><Field label={t('Bukti pembayaran', 'Payment proof')} required><input type="file" accept=".pdf,image/jpeg,image/png" onChange={(event) => setProof(event.target.files?.[0] || null)} required /></Field></div>}
                <div className="full-span"><Field label={t('Pesanan ringkas', 'Short message')}><textarea rows={3} value={messageText} onChange={(event) => setMessageText(event.target.value)} /></Field></div>
                <div className="full-span form-actions"><Button type="submit" disabled={busy}>{busy ? t('Menghantar…', 'Submitting…') : t('Hantar untuk semakan', 'Submit for review')}</Button></div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </section>
  )
}
