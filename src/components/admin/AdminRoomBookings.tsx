import { useMemo, useState } from 'react'
import { Button, Card, EmptyState, Field, StatusBadge } from '../UI'
import { Icon } from '../Icons'
import { formatDate } from '../../lib/helpers'
import { generateAndPrintPdfReport, type PdfReportItem } from '../../lib/pdfExport'
import type { RequestStatus, RoomBooking } from '../../lib/types'

interface AdminRoomBookingsProps {
  t: (bm: string, en: string) => string
  language: 'bm' | 'en'
  roomBookings: RoomBooking[]
  busy: boolean
  supabaseClient: any
  setRoomBookings: React.Dispatch<React.SetStateAction<RoomBooking[]>>
  onUpdateRoomBooking: (item: RoomBooking) => Promise<void>
  onDeleteRoomBooking: (id: string) => Promise<void>
}

export default function AdminRoomBookings({
  t,
  language,
  roomBookings,
  busy,
  setRoomBookings,
  onUpdateRoomBooking,
  onDeleteRoomBooking,
}: AdminRoomBookingsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const filteredBookings = useMemo(() => {
    return roomBookings.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (dateFilter && item.booking_date !== dateFilter) return false
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchName = item.name?.toLowerCase().includes(query)
        const matchBureau = item.bureau?.toLowerCase().includes(query)
        const matchPurpose = item.purpose?.toLowerCase().includes(query)
        return matchName || matchBureau || matchPurpose
      }
      return true
    })
  }, [roomBookings, searchQuery, statusFilter, dateFilter])

  return (
    <Card className="table-card" title={t('Pengurusan Tempahan Bilik JPP', 'JPP Room Booking Management')}>
      <div className="admin-v2-filter-toolbar">
        {selectedIds.length > 0 && (
          <Button
            variant="secondary"
            className="compact"
            onClick={() => {
              const selectedItems = roomBookings.filter((b) => selectedIds.includes(b.id))
              const pdfItems: PdfReportItem[] = selectedItems.map((item) => ({
                id: item.id,
                title: `Laporan Tempahan Bilik JPP #${item.id.slice(0, 8)}`,
                status: item.status,
                details: [
                  { label: 'Nama Pemohon', value: item.name },
                  { label: 'Biro / Unit', value: item.bureau },
                  { label: 'Tarikh Tempahan Bilik', value: formatDate(item.booking_date, language) },
                  { label: 'Tujuan Tempahan', value: item.purpose },
                  { label: 'Catatan Pemohon', value: item.remarks || '—' },
                  { label: 'Nota Admin', value: item.admin_notes || '—' },
                  { label: 'Tarikh Permohonan Dibuat', value: formatDate(item.created_at, language) },
                ],
              }))
              generateAndPrintPdfReport('Laporan Tempahan Bilik JPP (Pukal)', pdfItems)
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
            placeholder={t('Cari nama, biro, tujuan...', 'Search name, bureau, purpose...')}
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

        <div className="admin-v2-date-wrap">
          <input
            type="date"
            className="admin-v2-status-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        <div className="admin-v2-toolbar-right">
          <span className="admin-v2-results-count">
            {t(`Menunjukkan ${filteredBookings.length} daripada ${roomBookings.length} rekod`, `Showing ${filteredBookings.length} of ${roomBookings.length} records`)}
          </span>
          {(searchQuery !== '' || statusFilter !== 'all' || dateFilter !== '') && (
            <Button variant="ghost" className="admin-v2-clear-btn compact" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setDateFilter('') }}>
              {t('Kosongkan', 'Clear')}
            </Button>
          )}
        </div>
      </div>

      {roomBookings.length === 0 ? (
        <EmptyState title={t('Tiada rekod tempahan bilik JPP', 'No room booking records')} />
      ) : filteredBookings.length === 0 ? (
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
                    checked={filteredBookings.length > 0 && selectedIds.length === filteredBookings.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(filteredBookings.map((b) => b.id))
                      else setSelectedIds([])
                    }}
                  />
                </th>
                <th>{t('Tarikh & Pemohon', 'Date & Applicant')}</th>
                <th>{t('Biro & Tujuan', 'Bureau & Purpose')}</th>
                <th>{t('Catatan Pemohon', 'Applicant Remarks')}</th>
                <th>{t('Status & Nota Admin', 'Status & Admin Notes')}</th>
                <th>{t('Tindakan', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((item) => (
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
                    <div style={{ marginBottom: '4px' }}>
                      <Field label={t('Tarikh Tempahan', 'Booking Date')}>
                        <input
                          type="date"
                          value={item.booking_date}
                          style={{ padding: '4px 8px', fontSize: '13px' }}
                          onChange={(e) =>
                            setRoomBookings((rows) =>
                              rows.map((r) => (r.id === item.id ? { ...r, booking_date: e.target.value } : r))
                            )
                          }
                        />
                      </Field>
                    </div>
                    <strong style={{ fontSize: '15px' }}>{item.name}</strong>
                    <small style={{ display: 'block', color: 'var(--ink-muted)' }}>
                      {formatDate(item.created_at, language)}
                    </small>
                  </td>
                  <td>
                    <strong style={{ display: 'block', color: 'var(--gold-primary)' }}>{item.bureau}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', lineHeight: '1.4' }}>{item.purpose}</p>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
                      {item.remarks || '—'}
                    </span>
                  </td>
                  <td>
                    <select
                      value={item.status}
                      onChange={(e) =>
                        setRoomBookings((rows) =>
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
                      style={{ marginTop: '8px', fontSize: '13px', width: '100%' }}
                      placeholder={t('Catatan / Remarks admin', 'Admin remarks / notes')}
                      value={item.admin_notes || ''}
                      onChange={(e) =>
                        setRoomBookings((rows) =>
                          rows.map((r) => (r.id === item.id ? { ...r, admin_notes: e.target.value } : r))
                        )
                      }
                    />
                  </td>
                  <td>
                    <div className="admin-action-buttons button-row" style={{ flexDirection: 'column', gap: '6px' }}>
                      <Button disabled={busy} onClick={() => void onUpdateRoomBooking(item)}>
                        <Icon name="save" size={16} />
                        {t('Simpan', 'Save')}
                      </Button>
                      <Button
                        variant="secondary"
                        className="compact"
                        onClick={() => {
                          const pdfItems: PdfReportItem[] = [
                            {
                              id: item.id,
                              title: `Laporan Tempahan Bilik JPP #${item.id.slice(0, 8)}`,
                              status: item.status,
                              details: [
                                { label: 'Nama Pemohon', value: item.name },
                                { label: 'Biro / Unit', value: item.bureau },
                                { label: 'Tarikh Tempahan Bilik', value: formatDate(item.booking_date, language) },
                                { label: 'Tujuan Tempahan', value: item.purpose },
                                { label: 'Catatan Pemohon', value: item.remarks || '—' },
                                { label: 'Nota Admin', value: item.admin_notes || '—' },
                                { label: 'Tarikh Permohonan Dibuat', value: formatDate(item.created_at, language) },
                              ],
                            },
                          ]
                          generateAndPrintPdfReport(`Tempahan Bilik JPP #${item.id.slice(0, 8)}`, pdfItems)
                        }}
                      >
                        <Icon name="download" size={15} />
                        {t('Export PDF', 'Export PDF')}
                      </Button>
                      <Button variant="ghost" className="compact danger" disabled={busy} onClick={() => void onDeleteRoomBooking(item.id)}>
                        <Icon name="trash" size={16} />
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
  )
}
