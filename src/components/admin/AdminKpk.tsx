import { useMemo, useState } from 'react'
import { Button, Card, EmptyState, Field, StatusBadge } from '../UI'
import { Icon } from '../Icons'
import { formatDate, formatMoney, openPrivateFile } from '../../lib/helpers'
import { generateAndPrintPdfReport, type PdfReportItem } from '../../lib/pdfExport'
import type { KpkApplication, KpkBureau, RequestStatus } from '../../lib/types'

interface AdminKpkProps {
  t: (bm: string, en: string) => string
  language: 'bm' | 'en'
  applications: KpkApplication[]
  bureaus: KpkBureau[]
  busy: boolean
  supabaseClient: any
  setApplications: React.Dispatch<React.SetStateAction<KpkApplication[]>>
  setBureaus: React.Dispatch<React.SetStateAction<KpkBureau[]>>
  onUpdateApplication: (item: KpkApplication) => Promise<void>
  onSaveBureau: (form: { id?: string; name: string; active: boolean; display_order: number }) => Promise<void>
  onDeleteBureau: (id: string) => Promise<void>
}

export default function AdminKpk({
  t,
  language,
  applications,
  bureaus,
  busy,
  supabaseClient,
  setApplications,
  setBureaus,
  onUpdateApplication,
  onSaveBureau,
  onDeleteBureau,
}: AdminKpkProps) {
  const [subTab, setSubTab] = useState<'applications' | 'bureaus'>('applications')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Bureau Form State
  const [editingBureauId, setEditingBureauId] = useState<string | null>(null)
  const [bureauName, setBureauName] = useState('')
  const [bureauActive, setBureauActive] = useState(true)
  const [bureauOrder, setBureauOrder] = useState('1')

  const filteredApplications = useMemo(() => {
    return applications.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchClub = item.club_name?.toLowerCase().includes(query)
        const matchApplicant = item.applicant_name?.toLowerCase().includes(query)
        const matchPhone = item.phone?.toLowerCase().includes(query)
        const matchDept = item.department_unit?.toLowerCase().includes(query)
        const matchPurpose = item.purpose?.toLowerCase().includes(query)
        return matchClub || matchApplicant || matchPhone || matchDept || matchPurpose
      }
      return true
    })
  }, [applications, searchQuery, statusFilter])

  const editBureau = (bureau: KpkBureau) => {
    setEditingBureauId(bureau.id)
    setBureauName(bureau.name)
    setBureauActive(bureau.active)
    setBureauOrder(String(bureau.display_order))
  }

  const resetBureauForm = () => {
    setEditingBureauId(null)
    setBureauName('')
    setBureauActive(true)
    setBureauOrder(String(bureaus.length + 1))
  }

  const handleBureauSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bureauName.trim()) return
    await onSaveBureau({
      id: editingBureauId || undefined,
      name: bureauName.trim(),
      active: bureauActive,
      display_order: Number(bureauOrder) || 1,
    })
    resetBureauForm()
  }

  return (
    <div className="admin-kpk-module">
      <div className="admin-sub-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Button variant={subTab === 'applications' ? 'primary' : 'ghost'} onClick={() => setSubTab('applications')}>
          <Icon name="briefcase" size={17} />
          {t('Permohonan KPK+', 'KPK+ Applications')} ({applications.filter((a) => a.status === 'pending').length} {t('Pending', 'Pending')})
        </Button>
        <Button variant={subTab === 'bureaus' ? 'primary' : 'ghost'} onClick={() => setSubTab('bureaus')}>
          <Icon name="dashboard" size={17} />
          {t('Pengurusan Biro Angkat', 'Bureau Management')} ({bureaus.length})
        </Button>
      </div>

      {subTab === 'applications' && (
        <Card className="table-card" title={t('Pengurusan Permohonan KPK+', 'KPK+ Loan Application Management')}>
          {applications.length > 0 && (
            <div className="admin-v2-filter-toolbar">
              {selectedIds.length > 0 && (
                <Button
                  variant="secondary"
                  className="compact"
                  onClick={() => {
                    const selectedItems = applications.filter((k) => selectedIds.includes(k.id))
                    const pdfItems: PdfReportItem[] = selectedItems.map((item) => ({
                      id: item.id,
                      title: `Laporan Permohonan KPK+ #${item.id.slice(0, 8)}`,
                      status: item.status,
                      details: [
                        { label: 'Nama Kelab / Persatuan', value: item.club_name },
                        { label: 'Nama Pemohon', value: item.applicant_name },
                        { label: 'No. Telefon', value: item.phone },
                        { label: 'Jabatan / Unit', value: item.department_unit },
                        { label: 'Biro Angkat', value: item.kpk_bureaus?.name || 'Biro Khas' },
                        { label: 'Amaun Pinjaman (RM)', value: formatMoney(item.loan_amount) },
                        { label: 'Tujuan Pinjaman', value: item.purpose },
                        { label: 'Nota Admin', value: item.admin_notes || '—' },
                        { label: 'Tarikh Permohonan', value: formatDate(item.created_at, language) },
                      ],
                    }))
                    generateAndPrintPdfReport('Laporan Permohonan KPK+ (Pukal)', pdfItems)
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
                  placeholder={t('Cari kelab, pemohon, tujuan...', 'Search club, applicant, purpose...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="admin-v2-status-wrap">
                <select className="admin-v2-status-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">{t('Semua Status', 'All Statuses')}</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="admin-v2-toolbar-right">
                <span className="admin-v2-results-count">
                  {t(`Menunjukkan ${filteredApplications.length} daripada ${applications.length} rekod`, `Showing ${filteredApplications.length} of ${applications.length} records`)}
                </span>
                {(searchQuery !== '' || statusFilter !== 'all') && (
                  <Button variant="ghost" className="admin-v2-clear-btn compact" onClick={() => { setSearchQuery(''); setStatusFilter('all') }}>
                    {t('Kosongkan', 'Clear')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {applications.length === 0 ? (
            <EmptyState title={t('Tiada permohonan KPK+', 'No KPK+ applications')} />
          ) : filteredApplications.length === 0 ? (
            <EmptyState
              title={t('Tiada rekod sepadan', 'No matching records')}
              description={t('Tiada rekod sepadan dengan carian atau penapis.', 'No records match current search or filter.')}
            />
          ) : (
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '36px' }}>
                      <input
                        type="checkbox"
                        checked={filteredApplications.length > 0 && selectedIds.length === filteredApplications.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(filteredApplications.map((k) => k.id))
                          else setSelectedIds([])
                        }}
                      />
                    </th>
                    <th>{t('Kelab / Pemohon', 'Club / Applicant')}</th>
                    <th>{t('Biro & Amaun', 'Bureau & Amount')}</th>
                    <th>{t('Tujuan & Dokumen', 'Purpose & Document')}</th>
                    <th>{t('Status & Remarks', 'Status & Remarks')}</th>
                    <th>{t('Tindakan', 'Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((item) => {
                    const bureau = item.kpk_bureaus || bureaus.find((b) => b.id === item.bureau_id)
                    return (
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
                          <strong style={{ fontSize: '15px' }}>{item.club_name}</strong>
                          <small style={{ display: 'block', marginTop: '4px', lineHeight: '1.4' }}>
                            <b>{item.applicant_name}</b> ({item.phone})
                            <br />
                            {item.department_unit}
                            <br />
                            {formatDate(item.created_at, language)}
                          </small>
                        </td>
                        <td>
                          <strong>{formatMoney(item.loan_amount)}</strong>
                          <small style={{ display: 'block', color: 'var(--ink-muted)', marginTop: '2px' }}>
                            {bureau?.name || t('Biro Khas', 'Special Bureau')}
                          </small>
                        </td>
                        <td>
                          <p className="admin-record-details" style={{ maxWidth: '280px', margin: 0 }}>
                            {item.purpose}
                          </p>
                          {item.supporting_document_path && (
                            <div style={{ marginTop: '8px' }}>
                              <Button
                                variant="ghost"
                                className="compact"
                                onClick={() => void openPrivateFile(supabaseClient, item.supporting_document_path!)}
                              >
                                <Icon name="copy" size={15} /> {t('Buka dokumen', 'Open document')}
                              </Button>
                            </div>
                          )}
                        </td>
                        <td>
                          <select
                            value={item.status}
                            onChange={(e) =>
                              setApplications((rows) =>
                                rows.map((r) => (r.id === item.id ? { ...r, status: e.target.value as RequestStatus } : r))
                              )
                            }
                            style={{ marginBottom: '6px', width: '100%' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <StatusBadge status={item.status} />
                          <textarea
                            rows={2}
                            style={{ marginTop: '8px', fontSize: '13px' }}
                            placeholder={t('Catatan / Remarks admin', 'Admin remarks / notes')}
                            value={item.admin_notes || ''}
                            onChange={(e) =>
                              setApplications((rows) =>
                                rows.map((r) => (r.id === item.id ? { ...r, admin_notes: e.target.value } : r))
                              )
                            }
                          />
                        </td>
                        <td>
                          <div className="admin-action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <Button disabled={busy} onClick={() => void onUpdateApplication(item)}>
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
                                    title: `Laporan Permohonan KPK+ #${item.id.slice(0, 8)}`,
                                    status: item.status,
                                    details: [
                                      { label: 'Nama Kelab / Persatuan', value: item.club_name },
                                      { label: 'Nama Pemohon', value: item.applicant_name },
                                      { label: 'No. Telefon', value: item.phone },
                                      { label: 'Jabatan / Unit', value: item.department_unit },
                                      { label: 'Biro Angkat', value: bureau?.name || 'Biro Khas' },
                                      { label: 'Amaun Pinjaman (RM)', value: formatMoney(item.loan_amount) },
                                      { label: 'Tujuan Pinjaman', value: item.purpose },
                                      { label: 'Nota Admin', value: item.admin_notes || '—' },
                                      { label: 'Tarikh Permohonan', value: formatDate(item.created_at, language) },
                                    ],
                                  },
                                ]
                                generateAndPrintPdfReport(`Permohonan KPK+ #${item.id.slice(0, 8)}`, pdfItems)
                              }}
                            >
                              <Icon name="download" size={15} />
                              {t('Export PDF', 'Export PDF')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {subTab === 'bureaus' && (
        <div className="two-column-layout">
          <Card title={editingBureauId ? t('Edit Biro Angkat', 'Edit Bureau') : t('Tambah Biro Angkat Baharu', 'Add New Bureau')}>
            <form onSubmit={handleBureauSubmit} className="form-grid">
              <div className="full-span">
                <Field label={t('Nama Biro', 'Bureau Name')} required>
                  <input value={bureauName} onChange={(e) => setBureauName(e.target.value)} required placeholder="Cth: Biro Multimedia" />
                </Field>
              </div>

              <Field label={t('Urutan Susunan', 'Display Order')} required>
                <input type="number" min="1" value={bureauOrder} onChange={(e) => setBureauOrder(e.target.value)} required />
              </Field>

              <Field label={t('Status Aktif', 'Active Status')}>
                <label className="checkbox-field" style={{ marginTop: '8px' }}>
                  <input type="checkbox" checked={bureauActive} onChange={(e) => setBureauActive(e.target.checked)} />
                  <span>{t('Biro Aktif (Boleh Dipilih)', 'Active Bureau (Selectable)')}</span>
                </label>
              </Field>

              <div className="full-span form-actions button-row" style={{ marginTop: '12px' }}>
                <Button type="submit" disabled={busy}>
                  <Icon name="save" size={17} />
                  {editingBureauId ? t('Kemas kini Biro', 'Update Bureau') : t('Tambah Biro', 'Add Bureau')}
                </Button>
                {editingBureauId && (
                  <Button type="button" variant="ghost" onClick={resetBureauForm}>
                    {t('Batal', 'Cancel')}
                  </Button>
                )}
              </div>
            </form>
          </Card>

          <Card title={t('Senarai Biro Angkat KPK+', 'KPK+ Bureau List')}>
            {bureaus.length === 0 ? (
              <EmptyState title={t('Tiada biro', 'No bureaus found')} />
            ) : (
              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>{t('Urutan', 'Order')}</th>
                      <th>{t('Nama Biro', 'Bureau Name')}</th>
                      <th>{t('Status', 'Status')}</th>
                      <th>{t('Tindakan', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bureaus
                      .slice()
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((bureau) => (
                        <tr key={bureau.id}>
                          <td><strong>{bureau.display_order}</strong></td>
                          <td><strong>{bureau.name}</strong></td>
                          <td>
                            <span className={bureau.active ? 'badge badge-approved' : 'badge badge-rejected'}>
                              {bureau.active ? t('Aktif', 'Active') : t('Tidak Aktif', 'Disabled')}
                            </span>
                          </td>
                          <td>
                            <div className="button-row">
                              <Button variant="ghost" className="compact" onClick={() => editBureau(bureau)}>
                                <Icon name="edit" size={16} /> {t('Edit', 'Edit')}
                              </Button>
                              <Button variant="ghost" className="compact danger" onClick={() => void onDeleteBureau(bureau.id)}>
                                <Icon name="trash" size={16} />
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
      )}
    </div>
  )
}
