import { useMemo, useState, type FormEvent } from 'react'
import { Button, Card, EmptyState, Field, StatusBadge } from '../UI'
import { Icon } from '../Icons'
import { formatDate } from '../../lib/helpers'
import { generateAndPrintPdfReport, type PdfReportItem } from '../../lib/pdfExport'
import type { AssetApplication, AssetCategory, AssetItem, RequestStatus } from '../../lib/types'

interface AdminAssetsProps {
  t: (bm: string, en: string) => string
  language: 'bm' | 'en'
  mode: 'requests' | 'catalogue'
  assetRequests: AssetApplication[]
  catalogue: AssetItem[]
  categories?: AssetCategory[]
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
  onSaveCategory?: (
    form: { name_bm: string; name_en: string },
    editingId: string | null,
    resetForm: () => void
  ) => Promise<void>
  onDeleteCategory?: (id: string) => Promise<void>
  onReorderCatalogue?: (reorderedAssets: AssetItem[]) => Promise<void>
}

const initialAsset = {
  asset_code: '',
  category_bm: 'Elektronik',
  category_en: 'Electronics',
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

const initialCategoryForm = {
  name_bm: '',
  name_en: '',
}

export default function AdminAssets({
  t,
  language,
  mode,
  assetRequests,
  catalogue,
  categories = [],
  busy,
  setAssetRequests,
  onUpdateAssetRequest,
  onSaveAsset,
  onDeleteAsset,
  onSaveCategory,
  onDeleteCategory,
  onReorderCatalogue,
}: AdminAssetsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [assetForm, setAssetForm] = useState(initialAsset)
  const [assetImage, setAssetImage] = useState<File | null>(null)
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)

  // Sorting Mode State
  const [sortingMode, setSortingMode] = useState<'auto' | 'custom'>('auto')

  // Category Management State
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)

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

  // Ordered Catalogue based on sortingMode
  const orderedCatalogue = useMemo(() => {
    const list = [...catalogue]
    if (sortingMode === 'auto') {
      // Alphabetical order A → Z
      return list.sort((a, b) => (a.name_bm || '').localeCompare(b.name_bm || '', language === 'bm' ? 'ms' : 'en'))
    }
    // Custom Order based on sort_order
    return list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }, [catalogue, sortingMode, language])

  const resetAssetEditor = () => {
    setAssetForm(initialAsset)
    setAssetImage(null)
    setEditingAssetId(null)
  }

  const startAssetEdit = (item: AssetItem) => {
    setAssetForm({
      asset_code: item.asset_code || '',
      category_bm: item.category_bm || (categories[0]?.name_bm || 'Elektronik'),
      category_en: item.category_en || (categories[0]?.name_en || 'Electronics'),
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

  // Category Form Handlers
  const resetCategoryEditor = () => {
    setCategoryForm(initialCategoryForm)
    setEditingCategoryId(null)
  }

  const startCategoryEdit = (cat: AssetCategory) => {
    setCategoryForm({
      name_bm: cat.name_bm,
      name_en: cat.name_en || '',
    })
    setEditingCategoryId(cat.id)
  }

  const handleCategorySubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!onSaveCategory) return
    void onSaveCategory(categoryForm, editingCategoryId, resetCategoryEditor)
  }

  // Reorder Item Move Up / Move Down
  const moveAsset = (index: number, direction: 'up' | 'down') => {
    if (!onReorderCatalogue) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= orderedCatalogue.length) return

    const newList = [...orderedCatalogue]
    const temp = newList[index]
    newList[index] = newList[targetIndex]
    newList[targetIndex] = temp

    void onReorderCatalogue(newList)
  }

  if (mode === 'catalogue') {
    return (
      <div className="stack" style={{ gap: '28px' }}>
        <div className="admin-content-grid admin-editor-grid">
          {/* Asset Form Card - Removed Susunan paparan, Category dropdown used */}
          <Card
            title={editingAssetId ? t('Edit aset', 'Edit asset') : t('Tambah aset baharu', 'Add new asset')}
            className={editingAssetId ? 'admin-editor-active' : ''}
            action={
              editingAssetId ? (
                <span className="editor-mode-badge">
                  <Icon name="edit" size={15} /> {t('Mod edit', 'Edit mode')}
                </span>
              ) : undefined
            }
          >
            <form className="form-grid" onSubmit={handleSaveAssetSubmit}>
              <Field label={t('Kod aset', 'Asset code')} hint={t('Contoh: AST-0012', 'Example: AST-0012')}>
                <input
                  value={assetForm.asset_code}
                  placeholder="AST-0012"
                  onChange={(event) => setAssetForm({ ...assetForm, asset_code: event.target.value.toUpperCase() })}
                />
              </Field>

              {/* Category Dropdown Select */}
              <Field label={t('Kategori', 'Category')} required>
                <select
                  value={assetForm.category_bm}
                  onChange={(event) => {
                    const selectedBm = event.target.value
                    const matchedCat = categories.find((c) => c.name_bm === selectedBm)
                    setAssetForm({
                      ...assetForm,
                      category_bm: selectedBm,
                      category_en: matchedCat?.name_en || selectedBm,
                    })
                  }}
                  required
                >
                  <option value="">{t('Pilih kategori ▼', 'Select category ▼')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name_bm}>
                      {language === 'bm' ? cat.name_bm : cat.name_en || cat.name_bm}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Nama Aset (BM)" required>
                <input
                  value={assetForm.name_bm}
                  placeholder="Cth: Laptop Dell Inspiron"
                  onChange={(event) => setAssetForm({ ...assetForm, name_bm: event.target.value })}
                  required
                />
              </Field>
              <Field label="Asset Name (English)">
                <input
                  value={assetForm.name_en}
                  placeholder="e.g. Dell Inspiron Laptop"
                  onChange={(event) => setAssetForm({ ...assetForm, name_en: event.target.value })}
                />
              </Field>

              <Field label={t('Jumlah stok', 'Total stock')} required>
                <input
                  type="number"
                  min="0"
                  value={assetForm.stock_total}
                  onChange={(event) => setAssetForm({ ...assetForm, stock_total: Number(event.target.value) })}
                  required
                />
              </Field>
              <Field label={t('Stok tersedia', 'Available stock')} required hint={t('Tidak boleh melebihi jumlah stok.', 'Cannot exceed total stock.')}>
                <input
                  type="number"
                  min="0"
                  max={assetForm.stock_total}
                  value={assetForm.stock_available}
                  onChange={(event) => setAssetForm({ ...assetForm, stock_available: Number(event.target.value) })}
                  required
                />
              </Field>

              <div className="full-span">
                <Field label="Penerangan (BM)">
                  <textarea
                    rows={3}
                    value={assetForm.description_bm}
                    onChange={(event) => setAssetForm({ ...assetForm, description_bm: event.target.value })}
                  />
                </Field>
              </div>
              <div className="full-span">
                <Field label="Description (English)">
                  <textarea
                    rows={3}
                    value={assetForm.description_en}
                    onChange={(event) => setAssetForm({ ...assetForm, description_en: event.target.value })}
                  />
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

          {/* Current Catalogue List Card */}
          <Card title={t('Katalog Aset Semasa', 'Current Asset Catalogue')}>
            {/* Sorting Mode Bar */}
            <div className="sorting-mode-bar">
              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--ink)' }}>
                {t('Susunan Paparan:', 'Display Order:')}
              </span>
              <div className="sorting-mode-options">
                <button
                  type="button"
                  className={`sorting-mode-btn ${sortingMode === 'auto' ? 'active' : ''}`}
                  onClick={() => setSortingMode('auto')}
                >
                  {t('Abjad (A → Z)', 'Alphabetical (A → Z)')}
                </button>

                <button
                  type="button"
                  className={`sorting-mode-btn ${sortingMode === 'custom' ? 'active' : ''}`}
                  onClick={() => setSortingMode('custom')}
                >
                  {t('Susunan Kustom', 'Custom Order')}
                </button>
              </div>
            </div>

            {orderedCatalogue.length === 0 ? (
              <EmptyState title={t('Tiada aset', 'No assets')} />
            ) : (
              <div className="management-list">
                {orderedCatalogue.map((item, index) => (
                  <div className="management-item management-item-rich" key={item.id}>
                    <div className="management-thumb" style={{ position: 'relative' }}>
                      {item.image_url ? <img src={item.image_url} alt="" /> : <Icon name="box" size={24} />}
                    </div>

                    <div className="management-copy">
                      {/* Automatic Numbering Display */}
                      <strong>
                        <span className="asset-index-num">{index + 1}.</span> {language === 'bm' ? item.name_bm : item.name_en || item.name_bm}
                      </strong>
                      <small>
                        <code style={{ fontSize: '0.78rem', color: 'var(--gold-700)', fontWeight: 'bold', marginRight: '6px' }}>
                          {item.asset_code || `AST-${item.id.slice(0, 6).toUpperCase()}`}
                        </code>
                        · {item.category_bm || 'Aset'} · {item.stock_available}/{item.stock_total} {t('tersedia', 'available')} · {item.active ? t('Aktif', 'Active') : t('Tidak aktif', 'Inactive')}
                      </small>
                      {(item.description_bm || item.description_en) && (
                        <p className="management-excerpt">{language === 'bm' ? item.description_bm : item.description_en || item.description_bm}</p>
                      )}
                    </div>

                    <div className="management-actions">
                      {/* Custom Order Move Buttons */}
                      {sortingMode === 'custom' && (
                        <div style={{ display: 'flex', gap: '4px', marginRight: '4px' }}>
                          <button
                            type="button"
                            className="button button-secondary compact"
                            disabled={index === 0 || busy}
                            onClick={() => moveAsset(index, 'up')}
                            title={t('Anjak Ke Atas', 'Move Up')}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="button button-secondary compact"
                            disabled={index === orderedCatalogue.length - 1 || busy}
                            onClick={() => moveAsset(index, 'down')}
                            title={t('Anjak Ke Bawah', 'Move Down')}
                          >
                            ▼
                          </button>
                        </div>
                      )}

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

        {/* Asset Category Management Card */}
        <Card title={t('Pengurusan Kategori Aset', 'Asset Category Management')}>
          <div className="admin-content-grid" style={{ gridTemplateColumns: 'minmax(300px, 0.8fr) minmax(0, 1.2fr)', gap: '20px' }}>
            <form className="form-grid" onSubmit={handleCategorySubmit}>
              <div className="full-span">
                <Field label="Nama Kategori (BM)" required>
                  <input
                    value={categoryForm.name_bm}
                    placeholder="Cth: Elektronik, Perabot..."
                    onChange={(e) => setCategoryForm({ ...categoryForm, name_bm: e.target.value })}
                    required
                  />
                </Field>
              </div>
              <div className="full-span">
                <Field label="Category Name (English)">
                  <input
                    value={categoryForm.name_en}
                    placeholder="e.g. Electronics, Furniture..."
                    onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })}
                  />
                </Field>
              </div>

              <div className="full-span form-actions">
                <Button disabled={busy} type="submit" className="compact">
                  <Icon name="save" size={16} />
                  {editingCategoryId ? t('Simpan Kategori', 'Save Category') : t('Tambah Kategori', 'Add Category')}
                </Button>
                {editingCategoryId && (
                  <Button type="button" variant="secondary" className="compact" onClick={resetCategoryEditor}>
                    <Icon name="close" size={16} /> {t('Batal', 'Cancel')}
                  </Button>
                )}
              </div>
            </form>

            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', color: 'var(--gold-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('Senarai Kategori Tersedia', 'Available Categories List')} ({categories.length})
              </h4>
              <div className="management-list">
                {categories.map((cat, idx) => (
                  <div key={cat.id} className="management-item" style={{ padding: '10px 14px' }}>
                    <div>
                      <strong style={{ fontSize: '0.92rem' }}>
                        {idx + 1}. {cat.name_bm}
                      </strong>
                      {cat.name_en && <small style={{ color: 'var(--ink-soft)' }}>English: {cat.name_en}</small>}
                    </div>

                    <div className="management-actions">
                      <Button variant="secondary" className="compact" onClick={() => startCategoryEdit(cat)}>
                        <Icon name="edit" size={15} />
                      </Button>

                      {onDeleteCategory && (
                        <Button variant="danger" className="compact" onClick={() => void onDeleteCategory(cat.id)}>
                          <Icon name="trash" size={15} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <Card className="table-card" title={t('Semakan permohonan e-Aset', 'Review e-Asset requests')}>
      {assetRequests.length > 0 && (
        <div className="admin-v2-filter-toolbar">
          {selectedIds.length > 0 && (
            <Button
              variant="secondary"
              className="compact"
              onClick={() => {
                const selectedItems = assetRequests.filter((a) => selectedIds.includes(a.id))
                const pdfItems: PdfReportItem[] = selectedItems.map((item) => ({
                  id: item.id,
                  title: `Laporan Permohonan e-Aset #${item.id.slice(0, 8)}`,
                  status: item.status,
                  details: [
                    { label: 'Nama Pemohon', value: item.applicant_name },
                    { label: 'Jabatan / Unit', value: item.department_unit || item.class_name },
                    { label: 'No. Telefon', value: item.phone },
                    { label: 'Aset Dipinjam', value: `${item.asset_items?.name_bm || 'Aset'} (x${item.quantity})` },
                    { label: 'Tarikh Pinjam', value: formatDate(item.borrow_date, language) },
                    { label: 'Tarikh Pulang', value: formatDate(item.return_date, language) },
                    { label: 'Tujuan Pinjaman', value: item.purpose },
                    { label: 'Persetujuan Aku Janji', value: item.aku_janji_agreed ? 'Bersetuju' : 'Tidak' },
                    { label: 'Nota Admin', value: item.admin_notes || '—' },
                  ],
                }))
                generateAndPrintPdfReport('Laporan Permohonan e-Aset (Pukal)', pdfItems)
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
              {t(
                `Menunjukkan ${filteredAssetRequests.length} daripada ${assetRequests.length} rekod`,
                `Showing ${filteredAssetRequests.length} of ${assetRequests.length} records`
              )}
            </span>
            {(searchQuery !== '' || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                className="admin-v2-clear-btn compact"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
              >
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
                <th style={{ width: '36px' }}>
                  <input
                    type="checkbox"
                    checked={filteredAssetRequests.length > 0 && selectedIds.length === filteredAssetRequests.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(filteredAssetRequests.map((a) => a.id))
                      else setSelectedIds([])
                    }}
                  />
                </th>
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
                        setAssetRequests((rows) =>
                          rows.map((row) => (row.id === item.id ? { ...row, status: event.target.value as RequestStatus } : row))
                        )
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
                        setAssetRequests((rows) =>
                          rows.map((row) => (row.id === item.id ? { ...row, admin_notes: event.target.value } : row))
                        )
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
                    <div className="admin-action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <Button disabled={busy} onClick={() => void onUpdateAssetRequest(item)}>
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
                              title: `Laporan Permohonan e-Aset #${item.id.slice(0, 8)}`,
                              status: item.status,
                              details: [
                                { label: 'Nama Pemohon', value: item.applicant_name },
                                { label: 'Jabatan / Unit', value: item.department_unit || item.class_name },
                                { label: 'No. Telefon', value: item.phone },
                                { label: 'Aset Dipinjam', value: `${item.asset_items?.name_bm || 'Aset'} (x${item.quantity})` },
                                { label: 'Tarikh Pinjam', value: formatDate(item.borrow_date, language) },
                                { label: 'Tarikh Pulang', value: formatDate(item.return_date, language) },
                                { label: 'Tujuan Pinjaman', value: item.purpose },
                                { label: 'Persetujuan Aku Janji', value: item.aku_janji_agreed ? 'Bersetuju' : 'Tidak' },
                                { label: 'Nota Admin', value: item.admin_notes || '—' },
                              ],
                            },
                          ]
                          generateAndPrintPdfReport(`Permohonan e-Aset #${item.id.slice(0, 8)}`, pdfItems)
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
