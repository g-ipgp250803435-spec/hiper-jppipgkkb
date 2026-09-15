import { useMemo, useState, type FormEvent } from 'react'
import { Button, Card, EmptyState, Field, StatusBadge } from '../UI'
import { Icon } from '../Icons'
import { formatDate, formatMoney, openPrivateFile } from '../../lib/helpers'
import type { KpkApplication, KpkBureau, RequestStatus } from '../../lib/types'

interface AdminKpkProps {
  t: (bm: string, en: string) => string
  language: 'bm' | 'en'
  kpkApplications: KpkApplication[]
  bureaus: KpkBureau[]
  busy: boolean
  supabaseClient: any
  setKpkApplications: React.Dispatch<React.SetStateAction<KpkApplication[]>>
  onUpdateKpkApplication: (item: KpkApplication) => Promise<void>
  onSaveBureau: (name: string, displayOrder: number, active: boolean, editingId: string | null, resetForm: () => void) => Promise<void>
  onToggleBureauActive: (bureau: KpkBureau) => Promise<void>
}

export default function AdminKpk({
  t,
  language,
  kpkApplications,
  bureaus,
  busy,
  supabaseClient,
  setKpkApplications,
  onUpdateKpkApplication,
  onSaveBureau,
  onToggleBureauActive,
}: AdminKpkProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [bureauName, setBureauName] = useState('')
  const [bureauOrder, setBureauOrder] = useState('1')
  const [bureauActive, setBureauActive] = useState(true)
  const [editingBureauId, setEditingBureauId] = useState<string | null>(null)

  const filteredApplications = useMemo(() => {
    return kpkApplications.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchClub = item.club_name?.toLowerCase().includes(query)
        const matchApplicant = item.applicant_name?.toLowerCase().includes(query)
        const matchDept = item.department_unit?.toLowerCase().includes(query)
        const matchBureau = item.bureau_name?.toLowerCase().includes(query)
        const matchPurpose = item.purpose?.toLowerCase().includes(query)
        return matchClub || matchApplicant || matchDept || matchBureau || matchPurpose
      }
      return true
    })
  }, [kpkApplications, searchQuery, statusFilter])

  const resetBureauForm = () => {
    setBureauName('')
    setBureauOrder('1')
    setBureauActive(true)
    setEditingBureauId(null)
  }

  const startBureauEdit = (bureau: KpkBureau) => {
    setBureauName(bureau.name)
    setBureauOrder(String(bureau.display_order))
    setBureauActive(bureau.active)
    setEditingBureauId(bureau.id)
  }

  const handleBureauSubmit = (e: FormEvent) => {
    e.preventDefault()
    void onSaveBureau(bureauName, Number(bureauOrder), bureauActive, editingBureauId, resetBureauForm)
  }

  return (
    <div className="stack">
      <Card title={t('Tetapan Biro Angkat KPK+', 'KPK+ Bureau Settings')} className="admin-editor-card">
        <form className="form-grid" onSubmit={handleBureauSubmit}>
          <Field label={t('Nama Biro', 'Bureau Name')} required>
            <input value={bureauName} onChange={(e) => setBureauName(e.target.value)} placeholder="Cth: Biro Akademik" required />
          </Field>
          <Field label={t('Susunan Paparan', 'Display Order')} required>
            <input type="number" min="1" value={bureauOrder} onChange={(e) => setBureauOrder(e.target.value)} required />
          </Field>
          <label className="checkbox-field full-span" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={bureauActive} onChange={(e) => setBureauActive(e.target.checked)} />
            <span>{t('Biro Aktif (Boleh Dipilih Pemohon)', 'Bureau Active (Selectable by applicants)')}</span>
          </label>
          <div className="full-span form-actions">
            <Button disabled={busy} type="submit">
              <Icon name="save" size={18} />
              {editingBureauId ? t('Simpan Kemaskini Biro', 'Save Bureau Changes') : t('Tambah Biro Baharu', 'Add New Bureau')}
            </Button>
            {editingBureauId && (
              <Button type="button" variant="secondary" onClick={resetBureauForm}>
                <Icon name="close" size={18} /> {t('Batal Edit', 'Cancel Edit')}
              </Button>
            )}
          </div>
        </form>

        <div style={{ marginTop: '20px' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>{t('Senarai Biro Terkini', 'Current Bureau List')}</h4>
          <div className="management-list">
            {bureaus.map((b) => (
              <div className="management-item" key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '8px' }}>
                <div>
                  <strong>{b.display_order}. {b.name}</strong>
                  <small style={{ display: 'block', color: 'var(--ink-soft)' }}>
                    {b.active ? t('Aktif', 'Active') : t('Tidak Aktif', 'Inactive')}
                  </small>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" className="compact" onClick={() => startBureauEdit(b)}>
                    <Icon name="edit" size={16} /> {t('Edit', 'Edit')}
                  </Button>
                  <Button variant="ghost" className="compact" onClick={() => void onToggleBureauActive(b)}>
                    {b.active ? t('Nyahaktif', 'Deactivate') : t('Aktifkan', 'Activate')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="table-card" title={t('Semakan Permohonan Pinjaman KPK+', 'Review KPK+ Loan Applications')}>
        {kpkApplications.length > 0 && (
          <div className="admin-v2-filter-toolbar">
            <div className="admin-v2-search-wrap">
              <Icon name="search" size={18} className="admin-v2-search-icon" />
              <input
                type="text"
                className="admin-v2-search-field"
                placeholder={t('Cari permohonan KPK+...', 'Search KPK+ applications...')}
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
                {t(`Menunjukkan ${filteredApplications.length} daripada ${kpkApplications.length} rekod`, `Showing ${filteredApplications.length} of ${kpkApplications.length} records`)}
              </span>
              {(searchQuery !== '' || statusFilter !== 'all') && (
                <Button variant="ghost" className="admin-v2-clear-btn compact" onClick={() => { setSearchQuery(''); setStatusFilter('all') }}>
                  {t('Kosongkan', 'Clear')}
                </Button>
              )}
            </div>
          </div>
        )}

        {kpkApplications.length === 0 ? (
          <EmptyState title={t('Tiada permohonan KPK+', 'No KPK+ applications')} />
        ) : filteredApplications.length === 0 ? (
          <EmptyState title={t('Tiada rekod sepadan', 'No matching records')} description={t('Tiada rekod sepadan dengan carian.', 'No records match search criteria.')} />
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>{t('Kelab & Pemohon', 'Club & Applicant')}</th>
                  <th>{t('Biro & Pinjaman', 'Bureau & Loan')}</th>
                  <th>{t('Status', 'Status')}</th>
                  <th>{t('Nota Admin', 'Admin Notes')}</th>
                  <th>{t('Tindakan', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.club_name}</strong>
                      <small style={{ display: 'block', marginTop: '4px', lineHeight: '1.4' }}>
                        {item.applicant_name} ({item.department_unit})
                        <br />
                        {item.phone} · {formatDate(item.created_at, language)}
                      </small>
                    </td>
                    <td>
                      <strong>
                        {item.bureau_name || 'Biro'} · {formatMoney(item.loan_amount)}
                      </strong>
                      <p className="admin-record-details">{item.purpose}</p>
                      {item.supporting_document_path && (
                        <div style={{ marginTop: '8px' }}>
                          <Button variant="ghost" className="compact" onClick={() => void openPrivateFile(supabaseClient, item.supporting_document_path!)}>
                            {t('Buka kertas kerja', 'Open document')}
                          </Button>
                        </div>
                      )}
                    </td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(event) =>
                          setKpkApplications((rows) => rows.map((row) => (row.id === item.id ? { ...row, status: event.target.value as RequestStatus } : row)))
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <textarea
                        rows={3}
                        placeholder={t('Catatan keputusan Bendahari', 'Treasurer review notes')}
                        value={item.admin_notes || ''}
                        onChange={(event) =>
                          setKpkApplications((rows) => rows.map((row) => (row.id === item.id ? { ...row, admin_notes: event.target.value } : row)))
                        }
                      />
                    </td>
                    <td>
                      <div className="admin-action-buttons">
                        <Button disabled={busy} onClick={() => void onUpdateKpkApplication(item)}>
                          <Icon name="save" size={17} />
                          {t('Simpan', 'Save')}
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
