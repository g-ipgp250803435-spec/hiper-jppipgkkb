import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Field, LoadingBlock, Notice, PageHeader } from '../components/UI'
import { Icon } from '../components/Icons'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { isSupabaseConfigured } from '../lib/config'
import { supabase } from '../lib/supabase'
import type { KpkBureau } from '../lib/types'

const defaultBureaus: KpkBureau[] = [
  { id: 'b1', name: 'Biro Akademik', active: true, display_order: 1 },
  { id: 'b2', name: 'Biro Kerohanian', active: true, display_order: 2 },
  { id: 'b3', name: 'Biro Kebajikan', active: true, display_order: 3 },
  { id: 'b4', name: 'Biro Sukan', active: true, display_order: 4 },
  { id: 'b5', name: 'Biro Multimedia', active: true, display_order: 5 },
  { id: 'b6', name: 'Biro Protokol', active: true, display_order: 6 },
  { id: 'b7', name: 'Biro Keusahawanan', active: true, display_order: 7 },
  { id: 'b8', name: 'Biro Kebudayaan', active: true, display_order: 8 },
  { id: 'b9', name: 'Biro Pengantarabangsaan', active: true, display_order: 9 },
  { id: 'b10', name: 'Biro Khas', active: true, display_order: 10 },
]

export default function KpkPage() {
  const { t } = useUi()
  const { user, profile, refreshProfile } = useAuth()

  const [bureaus, setBureaus] = useState<KpkBureau[]>(defaultBureaus)
  const [loadingBureaus, setLoadingBureaus] = useState(isSupabaseConfigured)

  const [clubName, setClubName] = useState('')
  const [applicantName, setApplicantName] = useState('')
  const [phone, setPhone] = useState('')
  const [departmentUnit, setDepartmentUnit] = useState('')
  const [bureauId, setBureauId] = useState('')
  const [loanAmount, setLoanAmount] = useState('500')
  const [purpose, setPurpose] = useState('')
  const [supportingFile, setSupportingFile] = useState<File | null>(null)
  const [akuJanjiAgreed, setAkuJanjiAgreed] = useState(false)

  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  useEffect(() => {
    setApplicantName(profile?.full_name || user?.user_metadata?.full_name || '')
    setDepartmentUnit(profile?.class_name || '')
    setPhone(profile?.phone || '')
  }, [profile, user])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const fetchBureaus = async () => {
      try {
        const { data, error } = await supabase
          .from('kpk_bureaus')
          .select('*')
          .eq('active', true)
          .order('display_order', { ascending: true })

        if (error) {
          setBureaus(defaultBureaus)
        } else if (data && data.length > 0) {
          setBureaus(data as KpkBureau[])
          setBureauId(data[0].id)
        }
      } catch {
        setBureaus(defaultBureaus)
      } finally {
        setLoadingBureaus(false)
      }
    }
    void fetchBureaus()
  }, [])

  useEffect(() => {
    if (!bureauId && bureaus.length > 0) {
      setBureauId(bureaus[0].id)
    }
  }, [bureauId, bureaus])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    setMessage(null)

    if (!isSupabaseConfigured) {
      setMessage({ type: 'danger', text: 'Supabase belum dikonfigurasi.' })
      return
    }

    if (!akuJanjiAgreed) {
      setMessage({ type: 'danger', text: t('Sila tanda persetujuan Aku Janji.', 'Please agree to the Aku Janji declaration.') })
      return
    }

    setBusy(true)
    try {
      let documentPath: string | null = null
      if (supportingFile) {
        const fileExt = supportingFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-proposal.${fileExt}`
        const { error: uploadErr } = await supabase.storage.from('application-files').upload(fileName, supportingFile)
        if (uploadErr) throw uploadErr
        documentPath = fileName
      }

      const selectedBureau = bureaus.find((b) => b.id === bureauId)
      const selectedBureauName = selectedBureau ? selectedBureau.name : 'Biro'

      const { data: newApp, error: insertErr } = await supabase
        .from('kpk_applications')
        .insert({
          user_id: user.id,
          club_name: clubName.trim(),
          applicant_name: applicantName.trim(),
          phone: phone.trim(),
          department_unit: departmentUnit.trim(),
          bureau_id: bureauId || null,
          bureau_name: selectedBureauName,
          loan_amount: Number(loanAmount),
          purpose: purpose.trim(),
          supporting_document_path: documentPath,
          aku_janji_agreed: true,
          aku_janji_agreed_at: new Date().toISOString(),
          status: 'pending',
        })
        .select('id')
        .single()

      if (insertErr) throw insertErr

      if (newApp) {
        try {
          await supabase.from('notifications').insert({
            recipient_id: null,
            title: `Permohonan KPK+ Baharu: ${clubName.trim()}`,
            message: `${clubName.trim()} (${applicantName.trim()}) memohon pembiayaan RM${loanAmount} di bawah ${selectedBureauName}.`,
            notification_type: 'kpk',
            reference_id: newApp.id,
          })
        } catch {
          // ignore notification trigger failures
        }
      }

      await supabase.from('profiles').update({ full_name: applicantName.trim(), class_name: departmentUnit.trim(), phone: phone.trim() }).eq('id', user.id)
      await refreshProfile()

      setClubName('')
      setPurpose('')
      setSupportingFile(null)
      setAkuJanjiAgreed(false)
      setMessage({
        type: 'success',
        text: t('Permohonan KPK+ berjaya dihantar dan sedang menunggu semakan.', 'KPK+ loan application was submitted successfully and is under review.'),
      })
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err instanceof Error ? err.message : t('Gagal menghantar permohonan KPK+.', 'Failed to submit KPK+ loan application.'),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="section page-intro-section kpk-intro-section">
        <div className="container">
          <PageHeader
            eyebrow="KUMPULAN WANG KEMAJUAN KELAB (KPK+)"
            title={t('Pembiayaan & Tabung Kemajuan Kelab / Persatuan', 'Club & Society Progress Fund')}
            description={t(
              'Skim pinjaman kewangan perbendaharaan JPP bagi menyokong penganjuran program, aktiviti biro dan pembangunan persatuan di IPG Kampus Kota Bharu.',
              'JPP treasury financial loan scheme to support official programmes, bureau activities and society advancement at IPG Kampus Kota Bharu.'
            )}
          />
        </div>
      </section>

      <section className="section kpk-guide-section">
        <div className="container two-column-layout">
          <div className="kpk-details">
            <h2>{t('Mengenai Skim KPK+', 'About KPK+ Scheme')}</h2>
            <p>
              {t(
                'KPK+ (Kumpulan Wang Kemajuan Kelab Plus) direka khas untuk membantu kelab, persatuan, dan biro siswa guru mendapatkan pendahuluan kewangan bagi melancarkan program rasmi.',
                'KPK+ (Club Progress Fund Plus) is specially designed to assist student teacher clubs, societies, and bureaus in securing financial advances for official events.'
              )}
            </p>

            <h3>{t('Syarat Kelayakan', 'Eligibility Requirements')}</h3>
            <ul className="kpk-feature-list">
              <li><Icon name="check" size={18} /> {t('Berdaftar di bawah Jawatankuasa Perwakilan Pelajar (JPP) / IPG KKB.', 'Registered under the Student Representative Council (JPP) / IPG KKB.')}</li>
              <li><Icon name="check" size={18} /> {t('Mempunyai kertas kerja program yang diluluskan penasihat.', 'Possess an advisor-approved programme proposal.')}</li>
              <li><Icon name="check" size={18} /> {t('Permohonan dibuat melalui Biro Angkat yang berkaitan.', 'Applications submitted through the designated Foster Bureau.')}</li>
              <li><Icon name="check" size={18} /> {t('Bersetuju dengan terma bayaran balik yang ditetapkan.', 'Agree to the stipulated repayment terms and conditions.')}</li>
            </ul>

            <h3>{t('Aliran Permohonan', 'Application Process')}</h3>
            <ol className="numbered-process">
              <li><span>01</span>{t('Isi maklumat kelab, biro angkat dan jumlah pinjaman.', 'Fill club info, foster bureau, and loan amount.')}</li>
              <li><span>02</span>{t('Muat naik kertas kerja / dokumen sokongan.', 'Upload proposal or supporting documents.')}</li>
              <li><span>03</span>{t('Sah/Aku Janji dan hantar untuk semakan Bendahari.', 'Accept Aku Janji and submit for Treasurer review.')}</li>
            </ol>
          </div>

          <Card className="form-card premium-form-card" title={t('Borang Permohonan KPK+', 'KPK+ Application Form')}>
            {!user ? (
              <div className="locked-panel">
                <span><Icon name="lock" size={34} /></span>
                <h3>{t('Log masuk diperlukan', 'Sign in required')}</h3>
                <p>{t('Sila log masuk menggunakan akaun DELIMa untuk memohon KPK+.', 'Please sign in with your DELIMa account to apply for KPK+.')}</p>
                <Link className="button button-primary" to="/login">{t('Log masuk DELIMa', 'DELIMa sign in')}</Link>
              </div>
            ) : (
              <form className="form-grid" onSubmit={submit}>
                {message && <div className="full-span"><Notice type={message.type}>{message.text}</Notice></div>}

                <Field label={t('Nama Kelab / Persatuan', 'Club / Society Name')} required>
                  <input value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="Cth: Kelab Bahasa Melayu" required />
                </Field>

                <Field label={t('Nama Pemohon', 'Applicant Name')} required>
                  <input value={applicantName} onChange={(e) => setApplicantName(e.target.value)} required />
                </Field>

                <Field label={t('Jabatan / Unit / Kelas / Kelab', 'Department / Unit / Class / Club')} required>
                  <input value={departmentUnit} onChange={(e) => setDepartmentUnit(e.target.value)} placeholder="Cth: PISMP BM SK 1 / Unit Bahasa" required />
                </Field>

                <Field label={t('Nombor Telefon', 'Phone Number')} required>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </Field>

                <div className="full-span">
                  <Field label={t('Biro Angkat', 'Foster Bureau')} required hint={t('Pilih biro sokongan penganjuran.', 'Select supporting bureau.')}>
                    {loadingBureaus ? (
                      <LoadingBlock />
                    ) : (
                      <select value={bureauId} onChange={(e) => setBureauId(e.target.value)} required>
                        {bureaus.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    )}
                  </Field>
                </div>

                <div className="full-span">
                  <Field label={t('Jumlah Pinjaman (RM)', 'Loan Amount (RM)')} required>
                    <select value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} required>
                      <option value="500">RM 500.00</option>
                      <option value="800">RM 800.00</option>
                      <option value="1000">RM 1,000.00</option>
                    </select>
                  </Field>
                </div>

                <div className="full-span">
                  <Field label={t('Tujuan & Pelan Bayaran Balik', 'Purpose & Repayment Plan')} required>
                    <textarea rows={4} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder={t('Nyatakan tujuan program, perincian kegunaan kewangan dan perancangan bayaran balik.', 'State programme purpose, financial breakdown, and repayment plan.')} required />
                  </Field>
                </div>

                <div className="full-span">
                  <Field label={t('Dokumen Sokongan (Opsional)', 'Supporting Document (Optional)')} hint={t('Kertas kerja / sebut harga / surat sokongan (PDF / Gambar).', 'Proposal / quotation / supporting letter (PDF / Image).')}>
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => setSupportingFile(e.target.files?.[0] || null)} />
                  </Field>
                </div>

                <div className="full-span" style={{ marginTop: '12px', background: 'var(--bg-card-highlight, rgba(160,20,40,0.04))', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="shield" size={18} /> {t('Aku Janji Pembiayaan', 'Loan Aku Janji Declaration')}
                  </h4>
                  <p style={{ margin: '0 0 12px 0', fontSize: '13px', lineHeight: '1.5', color: 'var(--ink-body)' }}>
                    {t(
                      'Saya bagi pihak kelab/persatuan mengaku bahawa semua maklumat yang diberikan adalah benar dan bertanggungjawab sepenuhnya ke atas permohonan pinjaman wang ini.',
                      'I on behalf of the club/society declare that all details are true and take full responsibility for this loan application.'
                    )}
                  </p>
                  <label className="checkbox-field" style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                    <input type="checkbox" checked={akuJanjiAgreed} onChange={(e) => setAkuJanjiAgreed(e.target.checked)} required />
                    <span>{t('Saya bersetuju dengan Aku Janji di atas.', 'I agree to the above Aku Janji declaration.')}</span>
                  </label>
                </div>

                <div className="full-span form-actions">
                  <Button type="submit" disabled={busy || !akuJanjiAgreed}>
                    {busy ? t('Menghantar…', 'Submitting…') : t('Hantar Permohonan KPK+', 'Submit KPK+ Request')}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </section>
    </>
  )
}
