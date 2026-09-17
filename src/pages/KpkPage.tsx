import { useEffect, useState, type FormEvent } from 'react'
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
import { notifyAdmins } from '../lib/v3/notificationService'
import type { KpkBureau } from '../lib/types'

const defaultBureaus: KpkBureau[] = [
  { id: 'b-1', name: 'Biro Akademik', active: true, display_order: 1 },
  { id: 'b-2', name: 'Biro Kerohanian', active: true, display_order: 2 },
  { id: 'b-3', name: 'Biro Kebajikan', active: true, display_order: 3 },
  { id: 'b-4', name: 'Biro Sukan', active: true, display_order: 4 },
  { id: 'b-5', name: 'Biro Multimedia', active: true, display_order: 5 },
  { id: 'b-6', name: 'Biro Protokol', active: true, display_order: 6 },
  { id: 'b-7', name: 'Biro Keusahawanan', active: true, display_order: 7 },
  { id: 'b-8', name: 'Biro Kebudayaan', active: true, display_order: 8 },
  { id: 'b-9', name: 'Biro Pengantarabangsaan', active: true, display_order: 9 },
  { id: 'b-10', name: 'Biro Khas', active: true, display_order: 10 },
]

export default function KpkPage() {
  const { language, t } = useUi()
  const { settings } = useSiteSettings()
  const { user, profile, refreshProfile } = useAuth()

  const [bureaus, setBureaus] = useState<KpkBureau[]>(defaultBureaus)
  const [clubName, setClubName] = useState('')
  const [applicantName, setApplicantName] = useState('')
  const [phone, setPhone] = useState('')
  const [departmentUnit, setDepartmentUnit] = useState('')
  const [bureauId, setBureauId] = useState('')
  const [loanAmount, setLoanAmount] = useState('500')
  const [purpose, setPurpose] = useState('')
  const [supportingDocument, setSupportingDocument] = useState<File | null>(null)

  const MAX_DOC_SIZE = 20 * 1024 * 1024 // 20MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file && file.size > MAX_DOC_SIZE) {
      setMessage({
        type: 'danger',
        text: t('Saiz fail dokumen sokongan melebihi had maksimum 20MB.', 'Supporting document size exceeds maximum limit of 20MB.')
      })
      e.target.value = ''
      setSupportingDocument(null)
      return
    }
    setSupportingDocument(file)
  }

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

        if (!error && data && data.length > 0) {
          setBureaus(data as KpkBureau[])
        }
      } catch (err) {
        console.warn('Failed to fetch KPK bureaus:', err)
      }
    }
    void fetchBureaus()
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    if (!user) return
    if (!isSupabaseConfigured) {
      setMessage({ type: 'danger', text: 'Supabase belum dikonfigurasi.' })
      return
    }

    if (!clubName.trim() || !applicantName.trim() || !phone.trim() || !departmentUnit.trim() || !purpose.trim()) {
      setMessage({ type: 'danger', text: t('Sila lengkapkan semua medan wajib.', 'Please complete all required fields.') })
      return
    }

    if (!bureauId) {
      setMessage({ type: 'danger', text: t('Sila pilih Biro Angkat.', 'Please select an endorsing bureau.') })
      return
    }

    const numericAmount = Number(loanAmount)
    if (![500, 800, 1000].includes(numericAmount)) {
      setMessage({ type: 'danger', text: t('Amaun pinjaman yang sah ialah RM500, RM800 atau RM1,000.', 'Valid loan amounts are RM500, RM800 or RM1,000.') })
      return
    }

    setBusy(true)
    try {
      let docPath: string | null = null
      if (supportingDocument) {
        docPath = await uploadPrivateFile(supabase, user.id, supportingDocument, 'kpk-documents')
      }

      const selectedBureau = bureaus.find((b) => b.id === bureauId)

      const { data: newApplication, error } = await supabase.from('kpk_applications').insert({
        user_id: user.id,
        club_name: clubName.trim(),
        applicant_name: applicantName.trim(),
        phone: phone.trim(),
        department_unit: departmentUnit.trim(),
        bureau_id: bureauId || null,
        loan_amount: numericAmount,
        purpose: purpose.trim(),
        supporting_document_path: docPath,
        status: 'pending',
      }).select('id').single()

      if (error) throw error

      // Post admin notification
      await notifyAdmins(
        `🔔 Permohonan KPK+ Baharu: ${clubName.trim()}`,
        `${applicantName.trim()} (${clubName.trim()} - ${selectedBureau?.name || 'Biro'}) telah menghantar permohonan pinjaman RM${numericAmount}.`,
        'kpk',
        newApplication?.id || null
      )

      await supabase
        .from('profiles')
        .update({ full_name: applicantName.trim(), class_name: departmentUnit.trim(), phone: phone.trim() })
        .eq('id', user.id)
      await refreshProfile()

      setClubName('')
      setPurpose('')
      setSupportingDocument(null)
      setMessage({
        type: 'success',
        text: t('Permohonan KPK+ berjaya dihantar dan sedang menunggu semakan.', 'KPK+ application successfully submitted and is pending review.'),
      })
    } catch (error) {
      setMessage({ type: 'danger', text: error instanceof Error ? error.message : t('Permohonan KPK+ gagal dihantar.', 'KPK+ application failed to submit.') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section kpk-page-section">
      <div className="container">
        <PageHeader
          eyebrow={localise(settings.pages.kpk.eyebrow, language)}
          title={localise(settings.pages.kpk.title, language)}
          description={localise(settings.pages.kpk.description, language)}
        />

        <div className="two-column-layout">
          {/* Section 1: Introduction */}
          <div className="stack">
            <Card title={t('Tujuan KPK+', 'Purpose of KPK+')}>
              <p>
                {t(
                  'KPK+ (Skim Pinjaman Kelab & Persatuan) menyediakan sokongan pinjaman kewangan pendahuluan bagi membantu kelab dan persatuan siswa guru menjayakan program rasmi kampus.',
                  'KPK+ (Club & Association Loan Scheme) provides advance financial loan support to assist student teacher clubs and associations in executing official campus programmes.'
                )}
              </p>
            </Card>

            <Card title={t('Penerangan & Kelayakan Pinjaman', 'Loan Explanation & Eligibility')}>
              <ul className="rules-list">
                <li>{t('Terbuka kepada semua Kelab/Persatuan dan Biro JPP yang berdaftar di IPGKKB.', 'Open to all registered Clubs/Associations and JPP Bureaus in IPGKKB.')}</li>
                <li>{t('Pilihan amaun pinjaman: RM500.00, RM800.00, dan RM1,000.00.', 'Loan amount options: RM500.00, RM800.00, and RM1,000.00.')}</li>
                <li>{t('Permohonan mesti disokong oleh Biro Angkat yang berkaitan.', 'Applications must be endorsed by the respective parent Bureau (Biro Angkat).')}</li>
              </ul>
            </Card>

            <Card title={t('Proses Permohonan & Syarat', 'Application Process & Terms')}>
              <ol className="numbered-process">
                <li><span>01</span>{t('Isi borang permohonan dalam talian lengkap dengan rancangan pemulangan.', 'Fill up the online application form complete with repayment plan.')}</li>
                <li><span>02</span>{t('Muat naik kertas kerja atau dokumen sokongan (jika ada).', 'Upload project proposal or supporting documents (if available).')}</li>
                <li><span>03</span>{t('Semakan dan kelulusan oleh Pentadbiran Perbendaharaan JPP.', 'Review and approval by the JPP Treasury Administration.')}</li>
              </ol>
            </Card>
          </div>

          {/* Section 2: Application Form */}
          <Card className="form-card" title={t('Borang permohonan KPK+', 'KPK+ Loan Application Form')}>
            {!user ? (
              <div className="locked-panel">
                <span><Icon name="lock" size={34} /></span>
                <h3>{t('Log masuk diperlukan', 'Sign in required')}</h3>
                <p>{t('Gunakan akaun DELIMa untuk membuat dan menyemak permohonan pinjaman KPK+.', 'Use your DELIMa account to submit and review KPK+ loan applications.')}</p>
                <Link className="button button-primary" to="/login">{t('Log masuk DELIMa', 'DELIMa sign in')}</Link>
              </div>
            ) : (
              <form className="form-grid" onSubmit={handleSubmit}>
                {message && <div className="full-span"><Notice type={message.type}>{message.text}</Notice></div>}

                <div className="full-span">
                  <Field label={t('Nama Kelab / Persatuan', 'Name of Club / Association')} required>
                    <input
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      placeholder="Cth: Kelab Bahasa Melayu / Persatuan Sukan"
                      required
                    />
                  </Field>
                </div>

                <Field label={t('Nama Pemohon', 'Applicant Name')} required>
                  <input value={applicantName} onChange={(e) => setApplicantName(e.target.value)} required />
                </Field>

                <Field label={t('No. Telefon', 'Phone Number')} required>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </Field>

                <div className="full-span">
                  <Field label={t('Jabatan / Unit / Kelas / Kelab', 'Department / Unit / Class / Club')} required>
                    <input
                      value={departmentUnit}
                      onChange={(e) => setDepartmentUnit(e.target.value)}
                      placeholder="Cth: Jabatan Bahasa / PISMP BM SK 1"
                      required
                    />
                  </Field>
                </div>

                <Field label={t('Biro Angkat', 'Endorsing Bureau')} required>
                  <select value={bureauId} onChange={(e) => setBureauId(e.target.value)} required>
                    <option value="">{t('Pilih biro', 'Select bureau')}</option>
                    {bureaus.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label={t('Amaun Pinjaman (RM)', 'Loan Amount Requested (RM)')} required>
                  <select value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} required>
                    <option value="500">RM500.00</option>
                    <option value="800">RM800.00</option>
                    <option value="1000">RM1,000.00</option>
                  </select>
                </Field>

                <div className="full-span">
                  <Field label={t('Tujuan Pinjaman & Pelan Pemulangan', 'Purpose of Loan & Repayment Plan')} required>
                    <textarea
                      rows={4}
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Nyatakan tujuan program, butiran penggunaan dana, dan perancangan bayaran balik."
                      required
                    />
                  </Field>
                </div>

                <div className="full-span">
                  <Field
                    label={t('Dokumen Sokongan (Pilihan)', 'Supporting Document (Optional)')}
                    hint={t('Kertas kerja, sebut harga atau surat sokongan (PDF, Imej, Dokumen Office, maks 20MB).', 'Proposal, quotation or supporting letter (PDF, Images, Office documents, max 20MB).')}
                  >
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                      onChange={handleFileChange}
                    />
                  </Field>
                </div>

                <div className="full-span form-actions">
                  <Button type="submit" disabled={busy}>
                    {busy ? t('Menghantar…', 'Submitting…') : t('Hantar permohonan', 'Submit application')}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </section>
  )
}
