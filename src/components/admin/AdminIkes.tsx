import { useMemo, useState } from 'react'
import { Button, Card, EmptyState, StatusBadge } from '../UI'
import { Icon } from '../Icons'
import { formatDate, formatMoney, openPrivateFile } from '../../lib/helpers'
import { generateAndPrintPdfReport, type PdfReportItem } from '../../lib/pdfExport'
import type { IkesApplication, RequestStatus } from '../../lib/types'

interface AdminIkesProps {
  t: (bm: string, en: string) => string
  language: 'bm' | 'en'
  ikes: IkesApplication[]
  busy: boolean
  supabaseClient: any
  setIkes: React.Dispatch<React.SetStateAction<IkesApplication[]>>
  onUpdateIkes: (item: IkesApplication) => Promise<void>
}

export default function AdminIkes({
  t,
  language,
  ikes,
  busy,
  supabaseClient,
  setIkes,
  onUpdateIkes,
}: AdminIkesProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const filteredIkes = useMemo(() => {
    return ikes.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchName = item.applicant_name?.toLowerCase().includes(query)
        const matchClass = item.class_name?.toLowerCase().includes(query)
        const matchPhone = item.phone?.toLowerCase().includes(query)
        const matchReason = item.reason?.toLowerCase().includes(query)
        const matchType = item.ikes_type?.toLowerCase().includes(query)
        return matchName || matchClass || matchPhone || matchReason || matchType
      }
      return true
    })
  }, [ikes, searchQuery, statusFilter])

  return (
    <Card className="table-card" title={t('Semakan permohonan iKES', 'Review iKES applications')}>
      {ikes.length > 0 && (
        <div className="admin-v2-filter-toolbar">
          {selectedIds.length > 0 && (
            <Button
              variant="secondary"
              className="compact"
              onClick={() => {
                const selectedItems = ikes.filter((i) => selectedIds.includes(i.id))
                const pdfItems: PdfReportItem[] = selectedItems.map((item) => ({
                  id: item.id,
                  title: `Laporan Permohonan iKES #${item.id.slice(0, 8)}`,
                  status: item.status,
                  details: [
                    { label: 'Nama Pemohon', value: item.applicant_name },
                    { label: 'Kelas / Unit', value: item.class_name },
                    { label: 'No. Telefon', value: item.phone },
                    { label: 'Jenis iKES', value: item.ikes_type === 'care' ? 'iKES Care' : 'iKES Go-Home' },
                    { label: 'Jumlah (RM)', value: formatMoney(item.amount) },
                    { label: 'Sebab Permohonan', value: item.reason },
                    { label: 'Tarikh Permohonan', value: formatDate(item.created_at, language) },
                    { label: 'Nota Admin', value: item.admin_notes || '—' },
                  ],
                }))
                generateAndPrintPdfReport('Laporan Permohonan iKES (Pukal)', pdfItems)
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
              placeholder={t('Cari permohonan...', 'Search applications...')}
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
              {t(`Menunjukkan ${filteredIkes.length} daripada ${ikes.length} rekod`, `Showing ${filteredIkes.length} of ${ikes.length} records`)}
            </span>
            {(searchQuery !== '' || statusFilter !== 'all') && (
              <Button variant="ghost" className="admin-v2-clear-btn compact" onClick={() => { setSearchQuery(''); setStatusFilter('all') }}>
                {t('Kosongkan', 'Clear')}
              </Button>
            )}
          </div>
        </div>
      )}

      {ikes.length === 0 ? (
        <EmptyState title={t('Tiada permohonan', 'No applications')} />
      ) : filteredIkes.length === 0 ? (
        <EmptyState
          title={t('Tiada rekod sepadan', 'No matching records')}
          description={t('Tiada rekod sepadan dengan carian atau penapis.', 'No records match the current search or filter.')}
        />
      ) : (
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th style={{ width: '36px' }}>
                  <input
                    type="checkbox"
                    checked={filteredIkes.length > 0 && selectedIds.length === filteredIkes.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(filteredIkes.map((i) => i.id))
                      else setSelectedIds([])
                    }}
                  />
                </th>
                <th>{t('Pemohon', 'Applicant')}</th>
                <th>{t('Butiran', 'Details')}</th>
                <th>{t('Status', 'Status')}</th>
                <th>{t('Nota & bayaran balik', 'Notes & repayment')}</th>
                <th>{t('Tindakan', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredIkes.map((item) => (
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
                    <strong>{item.applicant_name}</strong>
                    <small style={{ display: 'block', marginTop: '4px', lineHeight: '1.4' }}>
                      {item.class_name}
                      <br />
                      {item.phone}
                      <br />
                      {formatDate(item.created_at, language)}
                    </small>
                  </td>
                  <td>
                    <strong>
                      {item.ikes_type === 'care' ? 'iKES Care' : 'iKES Go-Home'} · {formatMoney(item.amount)}
                    </strong>
                    <p className="admin-record-details">{item.reason}</p>
                    {item.ticket_path && (
                      <div style={{ marginTop: '8px' }}>
                        <Button variant="ghost" className="compact" onClick={() => void openPrivateFile(supabaseClient, item.ticket_path!)}>
                          {t('Buka resit', 'Open receipt')}
                        </Button>
                      </div>
                    )}
                  </td>
                  <td>
                    <select
                      value={item.status}
                      onChange={(event) =>
                        setIkes((rows) => rows.map((row) => (row.id === item.id ? { ...row, status: event.target.value as RequestStatus } : row)))
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
                      placeholder={t('Nota admin', 'Admin note')}
                      value={item.admin_notes || ''}
                      onChange={(event) =>
                        setIkes((rows) => rows.map((row) => (row.id === item.id ? { ...row, admin_notes: event.target.value } : row)))
                      }
                    />
                    <label className="mini-field">
                      <span>{t('Tarikh akhir bayar', 'Repayment due')}</span>
                      <input
                        type="date"
                        value={item.repayment_due_at?.slice(0, 10) || ''}
                        onChange={(event) =>
                          setIkes((rows) =>
                            rows.map((row) => (row.id === item.id ? { ...row, repayment_due_at: event.target.value || null } : row))
                          )
                        }
                      />
                    </label>
                    <label className="mini-field">
                      <span>{t('Tarikh dibayar', 'Paid date')}</span>
                      <input
                        type="date"
                        value={item.repaid_at?.slice(0, 10) || ''}
                        onChange={(event) =>
                          setIkes((rows) => rows.map((row) => (row.id === item.id ? { ...row, repaid_at: event.target.value || null } : row)))
                        }
                      />
                    </label>
                  </td>
                  <td>
                    <div className="admin-action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <Button disabled={busy} onClick={() => void onUpdateIkes(item)}>
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
                              title: `Laporan Permohonan iKES #${item.id.slice(0, 8)}`,
                              status: item.status,
                              details: [
                                { label: 'Nama Pemohon', value: item.applicant_name },
                                { label: 'Kelas / Unit', value: item.class_name },
                                { label: 'No. Telefon', value: item.phone },
                                { label: 'Jenis iKES', value: item.ikes_type === 'care' ? 'iKES Care' : 'iKES Go-Home' },
                                { label: 'Jumlah (RM)', value: formatMoney(item.amount) },
                                { label: 'Sebab Permohonan', value: item.reason },
                                { label: 'Tarikh Permohonan', value: formatDate(item.created_at, language) },
                                { label: 'Nota Admin', value: item.admin_notes || '—' },
                              ],
                            },
                          ]
                          generateAndPrintPdfReport(`Permohonan iKES #${item.id.slice(0, 8)}`, pdfItems)
                        }}
                      >
                        <Icon name="download" size={15} />
                        {t('Export PDF', 'Export PDF')}
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
  )
}
