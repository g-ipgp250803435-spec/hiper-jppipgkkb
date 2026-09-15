import { useMemo, useState, type FormEvent } from 'react'
import { Button, Card, EmptyState, Field, StatusBadge } from '../UI'
import { Icon } from '../Icons'
import { formatDate } from '../../lib/helpers'
import type { AssetApplication, AssetItem, RequestStatus } from '../../lib/types'

interface AdminAssetsProps {
  t: (bm: string, en: string) => string
  language: 'bm' | 'en'
  mode: 'requests' | 'catalogue'
  assetRequests: AssetApplication[]
  catalogue: AssetItem[]
  busy: boolean
  setAssetRequests: React.Dispatch<React.SetStateAction<AssetApplication[]>>
  onUpdateAssetRequest: (item: AssetApplication) => Promise<void>
  onSaveAsset: (
    form: typeof initialAsset,
    imageFile: File | null,
    editingId: string | null,
    resetForm: () => void
  ) => Promise<void>
  onDeleteAsset: (id: string) => Promise<void>
}

const initialAsset = {
  asset_code: '',
  category_bm: 'Aset',
  category_en: 'Asset',
  sort_order: 1,
  name_bm: '',
  name_en: '',
  description_bm: '',
  description_en: '',
  stock_total: 1,
  stock_available: 1,
  active: true,
  image_url: null as string | null,
}

export default function AdminAssets({
  t,
  language,
  mode,
  assetRequests,
  catalogue,
  busy,
  setAssetRequests,
  onUpdateAssetRequest,
  onSaveAsset,
  onDeleteAsset,
}: AdminAssetsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [assetForm, setAssetForm] = useState(initialAsset)
  const [assetImage, setAssetImage] = useState<File | null>(null)
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)

  const filteredAssetRequests = useMemo(() => {
    return assetRequests.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchName = item.applicant_name?.toLowerCase().includes(query)
        const matchClass = item.class_name?.toLowerCase().includes(query)
        const matchDept = item.department_unit?.toLowerCase().includes(query)
        const matchPhone = item.phone?.toLowerCase().includes(query)
        const matchPurpose = item.purpose?.toLowerCase().includes(query)
        const matchAssetBm = item.asset_items?.name_bm?.toLowerCase().includes(query)
        const matchAssetEn = item.asset_items?.name_en?.toLowerCase().includes(query)
        return matchName || matchClass || matchDept || matchPhone || matchPurpose || !!matchAssetBm || !!matchAssetEn
      }
      return true
    })
  }, [assetRequests, searchQuery, statusFilter])

  const resetAssetEditor = () => {
    setAssetForm(initialAsset)
    setAssetImage(null)
    setEditingAssetId(null)
  }

  const startAssetEdit = (item: AssetItem) => {
    setAssetForm({
      asset_code: item.asset_code || '',
      category_bm: item.category_bm || 'Aset',
      category_en: item.category_en || 'Asset',
      sort_order: item.sort_order || 1,
      name_bm: item.name_bm,
      name_en: item.name_en || '',
      description_bm: item.description_bm || '',
      description_en: item.description_en || '',
      stock_total: item.stock_total,
      stock_available: item.stock_available,
      active: item.active,
      image_url: item.image_url,
    })
    setAssetImage(null)
    setEditingAssetId(item.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSaveAssetSubmit = (e: FormEvent) => {
    e.preventDefault()
    void onSaveAsset(assetForm, assetImage, editingAssetId, resetAssetEditor)
  }

  if (mode === 'catalogue') {
    return (
      <div className="admin-content-grid admin-editor-grid">
        <Card
          title={editingAssetId ? t('Edit aset', 'Edit asset') : t('Tambah aset', 'Add asset')}
          className={editingAssetId ? 'admin-editor-active' : ''}
          action={editingAssetId ? <span className="editor-mode-badge"><Icon name="edit" size={15} /> {t('Mod edit', 'Edit mode')}</span> : undefined}
        >
          <form className="form-grid" onSubmit={handleSaveAssetSubmit}>
            <Field label={t('Kod aset', 'Asset code')} hint={t('Contoh: AST-001', 'Example: AST-001')}>
              <input value={assetForm.asset_code} onChange={(event) => setAssetForm({ ...assetForm, asset_code: event.target.value.toUpperCase() })} />
            </Field>
            <Field label={t('Susunan paparan', 'Display order')} required>
              <input type="number" min="0" value={assetForm.sort_order} onChange={(event) => setAssetForm({ ...assetForm, sort_order: Number(event.target.value) })} required />
            </Field>
            <Field label="Kategori BM">
              <input value={assetForm.category_bm} onChange={(event) => setAssetForm({ ...assetForm, category_bm: event.target.value })} />
            </Field>
            <Field label="English category">
              <input value={assetForm.category_en} onChange={(event) => setAssetForm({ ...assetForm, category_en: event.target.value })} />
            </Field>
            <Field label="Nama BM" required>
              <input value={assetForm.name_bm} onChange={(event) => setAssetForm({ ...assetForm, name_bm: event.target.value })} required />
            </Field>
            <Field label="English name">
              <input value={assetForm.name_en} onChange={(event) => setAssetForm({ ...assetForm, name_en: event.target.value })} />
            </Field>
            <Field label={t('Jumlah stok', 'Total stock')} required>
              <input type="number" min="0" value={assetForm.stock_total} onChange={(event) => setAssetForm({ ...assetForm, stock_total: Number(event.target.value) })} required />
            </Field>
            <Field label={t('Stok tersedia', 'Available stock')} required hint={t('Tidak boleh melebihi jumlah stok.', 'Cannot exceed total stock.')}>
              <input type="number" min="0" max={assetForm.stock_total} value={assetForm.stock_available} onChange={(event) => setAssetForm({ ...assetForm, stock_available: Number(event.target.value) })} required />
            </Field>
            <div className="full-span">
              <Field label="Penerangan BM">
                <textarea rows={4} value={assetForm.description_bm} onChange={(event) => setAssetForm({ ...assetForm, description_bm: event.target.value })} />
              </Field>
            </div>
            <div className="full-span">
              <Field label="English description">
                <textarea rows={4} value={assetForm.description_en} onChange={(event) => setAssetForm({ ...assetForm, description_en: event.target.value })} />
              </Field>
            </div>
            <div className="full-span">
              <Field label={editingAssetId ? t('Ganti gambar aset', 'Replace asset image') : t('Gambar aset', 'Asset image')}>
                <input type="file" accept="image/*" onChange={(event) => setAssetImage(event.target.files?.[0] || null)} />
              </Field>
              {assetForm.image_url && !assetImage && (
                <div className="admin-media-preview">
                  <img src={assetForm.image_url} alt="" />
                  <span>{t('Gambar semasa akan dikekalkan.', 'Current image will be retained.')}</span>
                </div>
              )}
            </div>
            <label className="checkbox-field full-span">
              <input type="checkbox" checked={assetForm.active} onChange={(event) => setAssetForm({ ...assetForm, active: event.target.checked })} />
              {t('Aset aktif dan dipaparkan dalam katalog', 'Asset is active and shown in the catalogue')}
            </label>
            <div className="full-span form-actions">
              <Button disabled={busy} type="submit">
                <Icon name="save" size={18} />
                {editingAssetId ? t('Simpan perubahan', 'Save changes') : t('Tambah aset', 'Add asset')}
              </Button>
              {editingAssetId && (
                <Button type="button" variant="secondary" onClick={resetAssetEditor}>
                  <Icon name="close" size={18} /> {t('Batal edit', 'Cancel edit')}
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card title={t('Katalog semasa', 'Current catalogue')}>
          {catalogue.length === 0 ? (
            <EmptyState title={t('Tiada aset', 'No assets')} />
          ) : (
            <div className="management-list">
              {catalogue.map((item) => (
                <div className="management-item management-item-rich" key={item.id}>
                  <div className="management-thumb">
                    {item.image_url ? <img src={item.image_url} alt="" /> : <Icon name="box" size={24} />}
                  </div>
                  <div className="management-copy">
                    <strong>{language === 'bm' ? item.name_bm : item.name_en || item.name_bm}</strong>
                    <small>{item.stock_available}/{item.stock_total} {t('tersedia', 'available')} · {item.active ? t('Aktif', 'Active') : t('Tidak aktif', 'Inactive')}</small>
                    {(item.description_bm || item.description_en) && <p className="management-excerpt">{language === 'bm' ? item.description_bm : item.description_en || item.description_bm}</p>}
                  </div>
                  <div className="management-actions">
                    <Button variant="secondary" className="compact" onClick={() => startAssetEdit(item)}>
                      <Icon name="edit" size={17} /> {t('Edit', 'Edit')}
                    </Button>
                    <Button variant="danger" className="compact" onClick={() => void onDeleteAsset(item.id)}>
                      <Icon name="trash" size={17} /> {t('Padam', 'Delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    )
  }

  return (
    <Card className="table-card" title={t('Semakan permohonan e-Aset', 'Review e-Asset requests')}>
      {assetRequests.length > 0 && (
        <div className="admin-v2-filter-toolbar">
          <div className="admin-v2-search-wrap">
            <Icon name="search" size={18} className="admin-v2-search-icon" />
            <input
              type="text"
              className="admin-v2-search-field"
              placeholder={t('Cari permohonan...', 'Search requests...')}
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
              {t(`Menunjukkan ${filteredAssetRequests.length} daripada ${assetRequests.length} rekod`, `Showing ${filteredAssetRequests.length} of ${assetRequests.length} records`)}
            </span>
            {(searchQuery !== '' || statusFilter !== 'all') && (
              <Button variant="ghost" className="admin-v2-clear-btn compact" onClick={() => { setSearchQuery(''); setStatusFilter('all') }}>
                {t('Kosongkan', 'Clear')}
              </Button>
            )}
          </div>
        </div>
      )}

      {assetRequests.length === 0 ? (
        <EmptyState title={t('Tiada permohonan', 'No requests')} />
      ) : filteredAssetRequests.length === 0 ? (
        <EmptyState
          title={t('Tiada rekod sepadan', 'No matching records')}
          description={t('Tiada rekod sepadan dengan carian atau penapis.', 'No records match the current search or filter.')}
        />
      ) : (
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>{t('Pemohon', 'Applicant')}</th>
                <th>{t('Aset & tempoh', 'Asset & period')}</th>
                <th>{t('Status', 'Status')}</th>
                <th>{t('Nota', 'Notes')}</th>
                <th>{t('Tindakan', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssetRequests.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.applicant_name}</strong>
                    <small style={{ display: 'block', marginTop: '4px', lineHeight: '1.4' }}>
                      {item.department_unit || item.class_name}
                      <br />
                      {item.phone}
                    </small>
                    {item.aku_janji_agreed && (
                      <span className="badge badge-success" style={{ marginTop: '4px', display: 'inline-block', fontSize: '10px' }}>
                        ✓ Aku Janji
                      </span>
                    )}
                  </td>
                  <td>
                    <strong>
                      {language === 'bm' ? item.asset_items?.name_bm : item.asset_items?.name_en || item.asset_items?.name_bm} × {item.quantity}
                    </strong>
                    <p className="admin-record-details" style={{ marginBottom: '4px' }}>
                      {formatDate(item.borrow_date, language)} – {formatDate(item.return_date, language)}
                    </p>
                    <small>{item.purpose}</small>
                  </td>
                  <td>
                    <select
                      value={item.status}
                      onChange={(event) =>
                        setAssetRequests((rows) => rows.map((row) => (row.id === item.id ? { ...row, status: event.target.value as RequestStatus } : row)))
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
                      value={item.admin_notes || ''}
                      onChange={(event) =>
                        setAssetRequests((rows) => rows.map((row) => (row.id === item.id ? { ...row, admin_notes: event.target.value } : row)))
                      }
                    />
                    <label className="mini-field">
                      <span>{t('Tarikh dipulangkan', 'Returned date')}</span>
                      <input
                        type="date"
                        value={item.returned_at?.slice(0, 10) || ''}
                        onChange={(event) =>
                          setAssetRequests((rows) =>
                            rows.map((row) => (row.id === item.id ? { ...row, returned_at: event.target.value || null } : row))
                          )
                        }
                      />
                    </label>
                  </td>
                  <td>
                    <div className="admin-action-buttons">
                      <Button disabled={busy} onClick={() => void onUpdateAssetRequest(item)}>
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
  )
}
