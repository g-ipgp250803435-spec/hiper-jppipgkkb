import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Field, Notice, PageHeader } from '../components/UI'
import { Icon } from '../components/Icons'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import { isSupabaseConfigured } from '../lib/config'
import { localise } from '../lib/siteSettings'
import { uploadPrivateFile } from '../lib/helpers'
import { supabase } from '../lib/supabase'

export default function IkesPage() {
  const { language, t } = useUi()
  const { settings } = useSiteSettings()
  const { user, profile, refreshProfile } = useAuth()
  const [type, setType] = useState<'care' | 'go_home'>('care')
  const [amount, setAmount] = useState('30')
  const [name, setName] = useState('')
  const [className, setClassName] = useState('')
  const [phone, setPhone] = useState('')
  const [reason, setReason] = useState('')
  const [ticket, setTicket] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  useEffect(() => {
    setName(profile?.full_name || user?.user_metadata?.full_name || '')
    setClassName(profile?.class_name || '')
    setPhone(profile?.phone || '')
  }, [profile, user])

  useEffect(() => {
    setAmount(type === 'care' ? '30' : '100')
    setTicket(null)
  }, [type])

  const rules = useMemo(
    () => [
      t('iKES Care: RM30 atau RM50 sahaja.', 'iKES Care: RM30 or RM50 only.'),
      t('iKES Go-Home: maksimum RM100 dan resit tiket diperlukan.', 'iKES Go-Home: maximum RM100 and a ticket receipt is required.'),
      t('Bayaran balik penuh dalam tiga hari selepas elaun bulan berikutnya dikreditkan.', 'Full repayment within three days after the following month’s allowance is credited.'),
    ],
    [t],
  )

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    if (!user) return
    if (!isSupabaseConfigured) {
      setMessage({ type: 'danger', text: 'Supabase belum dikonfigurasi.' })
      return
    }

    const numericAmount = Number(amount)
    if (type === 'care' && ![30, 50].includes(numericAmount)) {
      setMessage({ type: 'danger', text: 'Amaun iKES Care mesti RM30 atau RM50.' })
      return
    }
    if (type === 'go_home' && (numericAmount <= 0 || numericAmount > 100)) {
      setMessage({ type: 'danger', text: 'Amaun iKES Go-Home mestilah antara RM1 hingga RM100.' })
      return
    }
    if (type === 'go_home' && !ticket) {
      setMessage({ type: 'danger', text: 'Sila sertakan resit tiket.' })
      return
    }

    setBusy(true)
    try {
      let ticketPath: string | null = null
      if (ticket) ticketPath = await uploadPrivateFile(supabase, user.id, ticket, 'ikes-tickets')

      const { error } = await supabase.from('ikes_applications').insert({
        user_id: user.id,
        applicant_name: name,
        class_name: className,
        phone,
        ikes_type: type,
        amount: numericAmount,
        reason,
        ticket_path: ticketPath,
      })
      if (error) throw error

      await supabase
        .from('profiles')
        .update({ full_name: name, class_name: className, phone })
        .eq('id', user.id)
      await refreshProfile()

      setReason('')
      setTicket(null)
      setMessage({ type: 'success', text: 'Permohonan berjaya dihantar. Semak status di Portal Saya.' })
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
          eyebrow={localise(settings.pages.ikes.eyebrow, language)}
          title={localise(settings.pages.ikes.title, language)}
          description={localise(settings.pages.ikes.description, language)}
        />

        <div className="two-column-layout">
          <div className="stack">
            <Card title="iKES Care">
              <p>{t('Bantuan tunai sementara sebanyak RM30 atau RM50 ketika elaun masih belum dikreditkan.', 'Temporary RM30 or RM50 assistance while the allowance has not been credited.')}</p>
            </Card>
            <Card title="iKES Go-Home">
              <p>{t('Bantuan perjalanan pulang sehingga RM100. Resit atau bukti tiket wajib disertakan.', 'Travel-home assistance up to RM100. A ticket receipt or proof is required.')}</p>
            </Card>
            <Card title={t('Peraturan penting', 'Important rules')}>
              <ul className="rules-list">
                {rules.map((rule) => <li key={rule}>{rule}</li>)}
              </ul>
            </Card>
          </div>

          <Card className="form-card" title={t('Borang permohonan', 'Application form')}>
            {!user ? (
              <div className="locked-panel">
                <span><Icon name="lock" size={34} /></span>
                <h3>{t('Log masuk diperlukan', 'Sign in required')}</h3>
                <p>{t('Gunakan akaun DELIMa untuk membuat dan menyemak permohonan.', 'Use your DELIMa account to submit and review applications.')}</p>
                <Link className="button button-primary" to="/login">{t('Log masuk DELIMa', 'DELIMa sign in')}</Link>
              </div>
            ) : (
              <form className="form-grid" onSubmit={handleSubmit}>
                {message && <div className="full-span"><Notice type={message.type}>{message.text}</Notice></div>}
                <Field label={t('Jenis iKES', 'iKES type')} required>
                  <select value={type} onChange={(event) => setType(event.target.value as 'care' | 'go_home')}>
                    <option value="care">iKES Care</option>
                    <option value="go_home">iKES Go-Home</option>
                  </select>
                </Field>
                <Field label={t('Amaun (RM)', 'Amount (RM)')} required>
                  {type === 'care' ? (
                    <select value={amount} onChange={(event) => setAmount(event.target.value)}>
                      <option value="30">RM30</option>
                      <option value="50">RM50</option>
                    </select>
                  ) : (
                    <input type="number" min="1" max="100" value={amount} onChange={(event) => setAmount(event.target.value)} required />
                  )}
                </Field>
                <Field label={t('Nama penuh', 'Full name')} required>
                  <input value={name} onChange={(event) => setName(event.target.value)} required />
                </Field>
                <Field label={t('Kelas', 'Class')} required>
                  <input value={className} onChange={(event) => setClassName(event.target.value)} required />
                </Field>
                <Field label={t('Nombor telefon', 'Phone number')} required>
                  <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
                </Field>
                {type === 'go_home' && (
                  <Field label={t('Resit tiket', 'Ticket receipt')} hint={t('PDF, JPG atau PNG; maksimum 5MB.', 'PDF, JPG or PNG; maximum 5MB.')} required>
                    <input type="file" accept=".pdf,image/jpeg,image/png" onChange={(event) => setTicket(event.target.files?.[0] || null)} required />
                  </Field>
                )}
                <div className="full-span">
                  <Field label={t('Sebab permohonan', 'Reason for application')} required>
                    <textarea rows={5} value={reason} onChange={(event) => setReason(event.target.value)} required />
                  </Field>
                </div>
                <div className="full-span form-actions">
                  <Button type="submit" disabled={busy}>{busy ? t('Menghantar…', 'Submitting…') : t('Hantar permohonan', 'Submit application')}</Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </section>
  )
}
