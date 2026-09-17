import { useMemo, useState, type FormEvent } from 'react'
import { Button, Card, EmptyState, Field, StatusBadge } from '../UI'
import { Icon } from '../Icons'
import { formatDate, formatMoney, openPrivateFile } from '../../lib/helpers'
import { generateAndPrintPdfReport, type PdfReportItem } from '../../lib/pdfExport'
import type { Donation, DonationSettings, FundDisbursement } from '../../lib/types'

interface AdminDonationsProps {
  t: (bm: string, en: string) => string
  language: 'bm' | 'en'
  mode: 'donations' | 'fund'
  donations: Donation[]
  disbursements: FundDisbursement[]
  donationSettings: DonationSettings | null
  busy: boolean
  supabaseClient: any
  setDonations: React.Dispatch<React.SetStateAction<Donation[]>>
  setDonationSettings: React.Dispatch<React.SetStateAction<DonationSettings | null>>
  onUpdateDonation: (item: Donation) => Promise<void>
  onDeleteDonation?: (id: string) => Promise<void>
  onAddCollection: (form: typeof initialCollection) => Promise<void>
  onAddDisbursement: (form: typeof initialDisbursement) => Promise<void>
  onSaveDonationSettings: (qrFile: File | null) => Promise<void>
  onDeleteRow: (table: string, id: string, label: string) => Promise<void>
}

const initialCollection = { donor_name: '', amount: '', collected_at: new Date().toISOString().slice(0, 10), reference_no: '', message: '' }
const initialDisbursement = { title_bm: '', title_en: '', description_bm: '', description_en: '', amount: '', disbursed_at: new Date().toISOString().slice(0, 10), is_public: true }

export default function AdminDonations({
  t,
  language,
  mode,
  donations,
  disbursements,
  donationSettings,
  busy,
  supabaseClient,
  setDonations,
  setDonationSettings,
  onUpdateDonation,
  onDeleteDonation,
  onAddCollection,
  onAddDisbursement,
  onSaveDonationSettings,
  onDeleteRow,
}: AdminDonationsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [collectionForm, setCollectionForm] = useState(initialCollection)
  const [disbursementForm, setDisbursementForm] = useState(initialDisbursement)
  const [qrFile, setQrFile] = useState<File | null>(null)

  const filteredDonations = useMemo(() => {
    return donations.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchDonor = item.donor_name?.toLowerCase().includes(query)
        const matchRef = item.reference_no?.toLowerCase().includes(query)
        const matchMsg = item.message?.toLowerCase().includes(query)
        const matchMethod = item.payment_method?.toLowerCase().includes(query)
        return matchDonor || matchRef || matchMsg || matchMethod
      }
      return true
    })
  }, [donations, searchQuery, statusFilter])

  const handleCollectionSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onAddCollection(collectionForm)
    setCollectionForm(initialCollection)
  }

  const handleDisbursementSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onAddDisbursement(disbursementForm)
    setDisbursementForm(initialDisbursement)
  }

  const handleDonationSettingsSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onSaveDonationSettings(qrFile)
    setQrFile(null)
  }

  if (mode === 'fund') {
    return (
      <div className="stack">
        {donationSettings && (
          <Card title={t('Maklumat akaun rasmi', 'Official account information')}>
            <form className="form-grid" onSubmit={handleDonationSettingsSubmit}>
              <Field label={t('Nama bank', 'Bank name')}>
                <input value={donationSettings.bank_name || ''} onChange={(e) => setDonationSettings({ ...donationSettings, bank_name: e.target.value })} />
              </Field>
              <Field label={t('Nama akaun', 'Account name')}>
                <input value={donationSettings.account_name || ''} onChange={(e) => setDonationSettings({ ...donationSettings, account_name: e.target.value })} />
              </Field>
              <Field label={t('Nombor akaun', 'Account number')}>
                <input value={donationSettings.account_number || ''} onChange={(e) => setDonationSettings({ ...donationSettings, account_number: e.target.value })} />
              </Field>
              <Field label={t('Kod QR', 'QR code')}>
                <input type="file" accept="image/*" onChange={(e) => setQrFile(e.target.files?.[0] || null)} />
              </Field>
              <div className="full-span">
                <Field label="Nota BM">
                  <textarea rows={2} value={donationSettings.note_bm || ''} onChange={(e) => setDonationSettings({ ...donationSettings, note_bm: e.target.value })} />
                </Field>
              </div>
              <div className="full-span">
                <Field label="English note">
                  <textarea rows={2} value={donationSettings.note_en || ''} onChange={(e) => setDonationSettings({ ...donationSettings, note_en: e.target.value })} />
                </Field>
              </div>
              <div className="full-span form-actions">
                <Button disabled={busy} type="submit">{t('Simpan maklumat', 'Save information')}</Button>
              </div>
            </form>
          </Card>
        )}

        <div className="admin-content-grid">
          <Card title={t('Tambah rekod agihan', 'Add distribution record')}>
            <form className="form-grid" onSubmit={handleDisbursementSubmit}>
              <Field label="Tajuk BM" required>
                <input value={disbursementForm.title_bm} onChange={(e) => setDisbursementForm({ ...disbursementForm, title_bm: e.target.value })} required />
              </Field>
              <Field label="English title">
                <input value={disbursementForm.title_en} onChange={(e) => setDisbursementForm({ ...disbursementForm, title_en: e.target.value })} />
              </Field>
              <Field label={t('Amaun (RM)', 'Amount (RM)')} required>
                <input type="number" min="0.01" step="0.01" value={disbursementForm.amount} onChange={(e) => setDisbursementForm({ ...disbursementForm, amount: e.target.value })} required />
              </Field>
              <Field label={t('Tarikh agihan', 'Distribution date')} required>
                <input type="date" value={disbursementForm.disbursed_at} onChange={(e) => setDisbursementForm({ ...disbursementForm, disbursed_at: e.target.value })} required />
              </Field>
              <div className="full-span">
                <Field label="Penerangan BM">
                  <textarea rows={3} value={disbursementForm.description_bm} onChange={(e) => setDisbursementForm({ ...disbursementForm, description_bm: e.target.value })} />
                </Field>
              </div>
              <div className="full-span">
                <Field label="English description">
                  <textarea rows={3} value={disbursementForm.description_en} onChange={(e) => setDisbursementForm({ ...disbursementForm, description_en: e.target.value })} />
                </Field>
              </div>
              <label className="checkbox-field full-span">
                <input type="checkbox" checked={disbursementForm.is_public} onChange={(e) => setDisbursementForm({ ...disbursementForm, is_public: e.target.checked })} />
                {t('Paparkan kepada umum', 'Display publicly')}
              </label>
              <div className="full-span form-actions">
                <Button disabled={busy} type="submit">{t('Tambah rekod', 'Add record')}</Button>
              </div>
            </form>
          </Card>

          <Card title={t('Rekod agihan', 'Distribution records')}>
            <div className="management-list">
              {disbursements.map((item) => (
                <div className="management-item" key={item.id}>
                  <div>
                    <strong>{item.title_bm} · {formatMoney(item.amount)}</strong>
                    <small>{formatDate(item.disbursed_at, language)} · {item.is_public ? t('Awam', 'Public') : t('Tersembunyi', 'Hidden')}</small>
                  </div>
                  <Button variant="danger" onClick={() => void onDeleteRow('fund_disbursements', item.id, t('rekod agihan', 'distribution record'))}>
                    {t('Padam', 'Delete')}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      <Card title={t('Tambah rekod kutipan', 'Add collection record')} className="admin-manual-collection-card">
        <form className="form-grid" onSubmit={handleCollectionSubmit}>
          <Field label={t('Nama penderma / sumber', 'Donor / source name')} hint={t('Boleh dikosongkan untuk rekod tanpa nama.', 'May be left blank for an anonymous record.')}>
            <input value={collectionForm.donor_name} onChange={(event) => setCollectionForm({ ...collectionForm, donor_name: event.target.value })} placeholder={t('Contoh: Kutipan Jumaat Minggu 1', 'Example: Friday collection Week 1')} />
          </Field>
          <Field label={t('Amaun kutipan (RM)', 'Collection amount (RM)')} required>
            <input type="number" min="0.01" step="0.01" value={collectionForm.amount} onChange={(event) => setCollectionForm({ ...collectionForm, amount: event.target.value })} required />
          </Field>
          <Field label={t('Tarikh kutipan', 'Collection date')} required>
            <input type="date" value={collectionForm.collected_at} onChange={(event) => setCollectionForm({ ...collectionForm, collected_at: event.target.value })} required />
          </Field>
          <Field label={t('Nombor rujukan', 'Reference number')}>
            <input value={collectionForm.reference_no} onChange={(event) => setCollectionForm({ ...collectionForm, reference_no: event.target.value })} />
          </Field>
          <div className="full-span">
            <Field label={t('Catatan', 'Notes')}>
              <textarea rows={3} value={collectionForm.message} onChange={(event) => setCollectionForm({ ...collectionForm, message: event.target.value })} />
            </Field>
          </div>
          <div className="full-span form-actions">
            <Button type="submit" disabled={busy}>
              <Icon name="plus" size={18} />
              {t('Tambah sebagai kutipan disahkan', 'Add as verified collection')}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="table-card" title={t('Pengesahan sumbangan', 'Donation verification')}>
        {donations.length > 0 && (
          <div className="admin-v2-filter-toolbar">
            {selectedIds.length > 0 && (
              <Button
                variant="secondary"
                className="compact"
                onClick={() => {
                  const selectedItems = donations.filter((d) => selectedIds.includes(d.id))
                  const pdfItems: PdfReportItem[] = selectedItems.map((item) => ({
                    id: item.id,
                    title: `Laporan Sumbangan Tabung Jumaat #${item.id.slice(0, 8)}`,
                    status: item.status,
                    details: [
                    { label: 'Nama Penderma', value: item.donor_name || 'Tanpa Nama (Hamba Allah)' },
                      { label: 'Jumlah Sumbangan (RM)', value: formatMoney(item.amount) },
                      { label: 'Kaedah Pembayaran', value: item.payment_method.toUpperCase() },
                      { label: 'No. Rujukan', value: item.reference_no || '—' },
                    { label: 'Mesej / Doa Penderma', value: item.message || '—' },
                      { label: 'Tarikh Sumbangan', value: formatDate(item.created_at, language) },
                    { label: 'Dokumen Sokongan / Resit', value: item.proof_path ? 'Ada (Bukti Pembayaran Disertakan)' : 'Tiada (Tunai / Manual)' },
                    ],
                  }))
                  generateAndPrintPdfReport('Laporan Sumbangan Tabung Jumaat (Pukal)', pdfItems)
                }}
              >
                <Icon name="download" size={16} />
                {t(`Export Selected PDF (${selectedIds.length})`, `Export Selected PDF (${selectedIds.length})`)}
              </Button>
            )}

            <div className="admin-v2-search-wrap">
              <Icon name="search" size={18} className="admin-v2-search-icon" />
              <input
                type="text"
                className="admin-v2-search-field"
                placeholder={t('Cari sumbangan...', 'Search donations...')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="admin-v2-status-wrap">
              <select className="admin-v2-status-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">{t('Semua status', 'All statuses')}</option>
                <option value="pending">{t('Menunggu', 'Pending')}</option>
                <option value="verified">{t('Disahkan', 'Verified')}</option>
                <option value="rejected">{t('Ditolak', 'Rejected')}</option>
              </select>
            </div>
            <div className="admin-v2-toolbar-right">
              <span className="admin-v2-results-count">
                {t(`Menunjukkan ${filteredDonations.length} daripada ${donations.length} rekod`, `Showing ${filteredDonations.length} of ${donations.length} records`)}
              </span>
              {(searchQuery || statusFilter !== 'all') && (
                <Button variant="ghost" className="admin-v2-clear-btn compact" onClick={() => { setSearchQuery(''); setStatusFilter('all') }}>
                  {t('Kosongkan', 'Clear')}
                </Button>
              )}
            </div>
          </div>
        )}

        {donations.length === 0 ? (
          <EmptyState title={t('Tiada rekod derma', 'No donation records')} />
        ) : filteredDonations.length === 0 ? (
          <EmptyState title={t('Tiada rekod sepadan', 'No matching records')} description={t('Tiada rekod sepadan dengan carian atau penapis.', 'No records match the current search or filter.')} />
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '36px' }}>
                    <input
                      type="checkbox"
                      checked={filteredDonations.length > 0 && selectedIds.length === filteredDonations.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(filteredDonations.map((d) => d.id))
                        else setSelectedIds([])
                      }}
                    />
                  </th>
                  <th>{t('Tarikh', 'Date')}</th>
                  <th>{t('Penderma', 'Donor')}</th>
                  <th>{t('Bayaran', 'Payment')}</th>
                  <th>{t('Status', 'Status')}</th>
                  <th>{t('Tindakan', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonations.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds([...selectedIds, item.id])
                          else setSelectedIds(selectedIds.filter((id) => id !== item.id))
                        }}
                      />
                    </td>
                    <td>
                      <small style={{ display: 'block', whiteSpace: 'nowrap' }}>{formatDate(item.created_at, language)}</small>
                    </td>
                    <td>
                      <strong>{item.donor_name || t('Tanpa nama', 'Anonymous')}</strong>
                      {item.message && <small className="preserve-lines" style={{ display: 'block', marginTop: '4px', color: 'var(--ink-soft)' }}>{item.message}</small>}
                    </td>
                    <td>
                      <strong>{formatMoney(item.amount)}</strong>
                      <small style={{ display: 'block', marginTop: '4px', color: 'var(--ink-soft)' }}>{item.payment_method.replace('_', ' ')} · {item.reference_no || '—'}</small>
                      {item.proof_path && (
                        <div style={{ marginTop: '8px' }}>
                          <Button variant="ghost" className="compact" onClick={() => void openPrivateFile(supabaseClient, item.proof_path!)}>
                            {t('Buka bukti', 'Open proof')}
                          </Button>
                        </div>
                      )}
                    </td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(event) => setDonations((rows) => rows.map((row) => row.id === item.id ? { ...row, status: event.target.value as Donation['status'] } : row))}
                      >
                        <option value="pending">{t('Menunggu', 'Pending')}</option>
                        <option value="verified">{t('Disahkan', 'Verified')}</option>
                        <option value="rejected">{t('Ditolak', 'Rejected')}</option>
                      </select>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <div className="admin-action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <Button disabled={busy} onClick={() => void onUpdateDonation(item)}>
                          <Icon name="save" size={17} />
                          {t('Simpan', 'Save')}
                        </Button>
                        <Button
                          variant="secondary"
                          className="compact"
                          onClick={() => {
                            const pdfItems: PdfReportItem[] = [
                              {
                                id: item.id,
                                title: `Laporan Sumbangan Tabung Jumaat #${item.id.slice(0, 8)}`,
                                status: item.status,
                                details: [
                                { label: 'Nama Penderma', value: item.donor_name || 'Tanpa Nama (Hamba Allah)' },
                                  { label: 'Jumlah Sumbangan (RM)', value: formatMoney(item.amount) },
                                  { label: 'Kaedah Pembayaran', value: item.payment_method.toUpperCase() },
                                  { label: 'No. Rujukan', value: item.reference_no || '—' },
                                { label: 'Mesej / Doa Penderma', value: item.message || '—' },
                                  { label: 'Tarikh Sumbangan', value: formatDate(item.created_at, language) },
                                { label: 'Dokumen Sokongan / Resit', value: item.proof_path ? 'Ada (Bukti Pembayaran Disertakan)' : 'Tiada (Tunai / Manual)' },
                                ],
                              },
                            ]
                            generateAndPrintPdfReport(`Sumbangan Tabung Jumaat #${item.id.slice(0, 8)}`, pdfItems)
                          }}
                        >
                          <Icon name="download" size={15} />
                          {t('Export PDF', 'Export PDF')}
                        </Button>
                      <Button
                        variant="ghost"
                        className="compact danger"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              t(
                                'Padam permohonan ini secara kekal?\n\nTindakan ini tidak boleh dibatalkan.',
                                'Delete this application permanently?\n\nThis action cannot be undone.'
                              )
                            )
                          ) {
                            if (onDeleteDonation) {
                              void onDeleteDonation(item.id)
                            } else {
                              void onDeleteRow('donations', item.id, t('rekod derma', 'donation record'))
                            }
                          }
                        }}
                      >
                        <Icon name="trash" size={15} />
                        {t('Padam', 'Delete')}
                      </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
