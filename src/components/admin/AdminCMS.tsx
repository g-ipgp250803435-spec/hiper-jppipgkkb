import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Button, Card, Notice } from '../UI'
import { Icon } from '../Icons'
import { isSupabaseConfigured } from '../../lib/config'
import { uploadPublicFile } from '../../lib/helpers'
import { notifyUser } from '../../lib/v3/notificationService'
import type {
  CmsPage,
  CmsPageBlock,
  CmsBlockType,
  CmsPageStatus,
  RichTextBlockContent,
  ImageBlockContent,
  ButtonBlockContent,
  LinkBlockContent,
  GalleryBlockContent,
  SpacerBlockContent,
} from '../../lib/types'

interface AdminCMSProps {
  t: (bm: string, en: string) => string
  language: 'bm' | 'en'
  pages: CmsPage[]
  blocks: CmsPageBlock[]
  busy: boolean
  supabaseClient: SupabaseClient
  setPages: React.Dispatch<React.SetStateAction<CmsPage[]>>
  setBlocks: React.Dispatch<React.SetStateAction<CmsPageBlock[]>>
  onSavePage: (
    pageForm: {
      id?: string
      title_bm: string
      title_en: string
      slug: string
      description_bm: string
      description_en: string
      status: CmsPageStatus
      is_public: boolean
      show_in_navigation: boolean
      navigation_order: number
    },
    notifySubscribers?: boolean
  ) => Promise<void>
  onDeletePage: (id: string, title: string) => Promise<void>
  onSaveBlocks: (pageId: string, pageBlocks: CmsPageBlock[]) => Promise<void>
}

export default function AdminCMS({
  t,
  language,
  pages,
  blocks,
  busy,
  supabaseClient,
  setPages,
  setBlocks,
  onSavePage,
  onDeletePage,
  onSaveBlocks,
}: AdminCMSProps) {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null)
  const [isCreatingPage, setIsCreatingPage] = useState(false)

  // Page Form State
  const [pageForm, setPageForm] = useState({
    title_bm: '',
    title_en: '',
    slug: '',
    description_bm: '',
    description_en: '',
    status: 'draft' as CmsPageStatus,
    is_public: true,
    show_in_navigation: false,
    navigation_order: 0,
  })
  const [notifySubscribers, setNotifySubscribers] = useState(false)

  // Blocks State for currently edited page
  const [localBlocks, setLocalBlocks] = useState<CmsPageBlock[]>([])
  const [activeTab, setActiveTab] = useState<'pages' | 'editor'>('pages')
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const selectedPage = pages.find((p) => p.id === selectedPageId)

  const openCreatePageModal = () => {
    setEditingPage(null)
    setIsCreatingPage(true)
    setPageForm({
      title_bm: '',
      title_en: '',
      slug: '',
      description_bm: '',
      description_en: '',
      status: 'draft',
      is_public: true,
      show_in_navigation: false,
      navigation_order: (pages.length + 1) * 10,
    })
    setNotifySubscribers(false)
  }

  const openEditPageModal = (page: CmsPage) => {
    setEditingPage(page)
    setIsCreatingPage(true)
    setPageForm({
      title_bm: page.title_bm,
      title_en: page.title_en || '',
      slug: page.slug,
      description_bm: page.description_bm || '',
      description_en: page.description_en || '',
      status: page.status,
      is_public: page.is_public,
      show_in_navigation: page.show_in_navigation,
      navigation_order: page.navigation_order,
    })
    setNotifySubscribers(false)
  }

  const handleSelectPageForBlocks = (page: CmsPage) => {
    setSelectedPageId(page.id)
    const pageBlocks = blocks
      .filter((b) => b.page_id === page.id)
      .sort((a, b) => a.display_order - b.display_order)
    setLocalBlocks(JSON.parse(JSON.stringify(pageBlocks)))
    setActiveTab('editor')
  }

  const handleSlugify = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handlePageTitleChange = (val: string) => {
    setPageForm((prev) => ({
      ...prev,
      title_bm: val,
      slug: !editingPage ? handleSlugify(val) : prev.slug,
    }))
  }

  const handleSavePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pageForm.title_bm || !pageForm.slug) {
      setNotice({ type: 'danger', text: t('Tajuk BM dan slug adalah wajib.', 'BM Title and slug are required.') })
      return
    }

    try {
      await onSavePage(
        {
          id: editingPage?.id,
          ...pageForm,
        },
        notifySubscribers
      )
      setIsCreatingPage(false)
      setNotice({ type: 'success', text: t('Halaman berjaya disimpan.', 'Page saved successfully.') })
    } catch (err) {
      setNotice({ type: 'danger', text: err instanceof Error ? err.message : 'Error saving page' })
    }
  }

  // Block Editing Helpers
  const addBlock = (type: CmsBlockType) => {
    if (!selectedPageId) return
    let initialContent: any = {}
    if (type === 'rich_text') {
      initialContent = { heading_bm: 'Tajuk Seksyen', heading_en: 'Section Title', body_bm: 'Kandungan teks di sini...', body_en: 'Text content here...' }
    } else if (type === 'image') {
      initialContent = { image_url: '', caption_bm: '', caption_en: '', alignment: 'center', size: 'full' }
    } else if (type === 'button') {
      initialContent = { label_bm: 'Muat Turun Borang', label_en: 'Download Form', url: '#', variant: 'primary', open_new_tab: true }
    } else if (type === 'link') {
      initialContent = { title_bm: 'Pautan Sumber', title_en: 'Resource Link', url: '#', description_bm: 'Penerangan ringkas pautan.', description_en: 'Short link description.' }
    } else if (type === 'gallery') {
      initialContent = { items: [] }
    } else if (type === 'spacer') {
      initialContent = { height_px: 24, show_line: true }
    }

    const newBlock: CmsPageBlock = {
      id: `block-temp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      page_id: selectedPageId,
      block_type: type,
      content: initialContent,
      display_order: localBlocks.length + 1,
    }
    setLocalBlocks([...localBlocks, newBlock])
  }

  const removeBlock = (id: string) => {
    const updated = localBlocks.filter((b) => b.id !== id).map((b, idx) => ({ ...b, display_order: idx + 1 }))
    setLocalBlocks(updated)
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === localBlocks.length - 1)) return
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    const copy = [...localBlocks]
    const temp = copy[index]
    copy[index] = copy[targetIdx]
    copy[targetIdx] = temp
    const reordered = copy.map((b, idx) => ({ ...b, display_order: idx + 1 }))
    setLocalBlocks(reordered)
  }

  const updateBlockContent = (id: string, updatedContent: any) => {
    setLocalBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...updatedContent } } : b))
    )
  }

  const handleBlockImageUpload = async (blockId: string, file: File) => {
    setUploadingImage(true)
    try {
      const url = await uploadPublicFile(supabaseClient, file, 'cms')
      updateBlockContent(blockId, { image_url: url })
      setNotice({ type: 'success', text: t('Imej berjaya dimuat naik.', 'Image uploaded successfully.') })
    } catch (err) {
      setNotice({ type: 'danger', text: err instanceof Error ? err.message : 'Muat naik imej gagal.' })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleGalleryImageUpload = async (blockId: string, currentItems: any[], file: File) => {
    setUploadingImage(true)
    try {
      const url = await uploadPublicFile(supabaseClient, file, 'cms')
      const newItem = {
        id: `gal-item-${Date.now()}`,
        image_url: url,
        caption_bm: '',
        caption_en: '',
      }
      updateBlockContent(blockId, { items: [...(currentItems || []), newItem] })
      setNotice({ type: 'success', text: t('Gambar galeri ditambah.', 'Gallery image added.') })
    } catch (err) {
      setNotice({ type: 'danger', text: err instanceof Error ? err.message : 'Muat naik imej gagal.' })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSaveAllBlocks = async () => {
    if (!selectedPageId) return
    try {
      await onSaveBlocks(selectedPageId, localBlocks)
      setNotice({ type: 'success', text: t('Blok kandungan berjaya disimpan.', 'Content blocks saved successfully.') })
    } catch (err) {
      setNotice({ type: 'danger', text: err instanceof Error ? err.message : 'Gagal menyimpan blok.' })
    }
  }

  return (
    <div className="admin-cms-wrapper">
      <div className="admin-cms-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3>{t('Pengurusan Kandungan Dinamik (CMS)', 'Dynamic Content Management (CMS)')}</h3>
          <p className="text-muted" style={{ margin: 0 }}>
            {t(
              'Cipta, susun dan selenggara halaman web serta blok kandungan secara fleksibel.',
              'Create, arrange and maintain website pages and content blocks flexibly.'
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant={activeTab === 'pages' ? 'primary' : 'ghost'} onClick={() => setActiveTab('pages')}>
            <Icon name="file-text" size={18} /> {t('Senarai Halaman', 'Pages List')}
          </Button>
          {selectedPageId && (
            <Button variant={activeTab === 'editor' ? 'primary' : 'ghost'} onClick={() => setActiveTab('editor')}>
              <Icon name="edit" size={18} /> {t('Editor Blok Page', 'Block Builder')}
            </Button>
          )}
          <Button variant="primary" onClick={openCreatePageModal}>
            <Icon name="plus" size={18} /> {t('Halaman Baharu', 'New Page')}
          </Button>
        </div>
      </div>

      {notice && (
        <div style={{ marginBottom: '16px' }}>
          <Notice type={notice.type}>
            {notice.text}
          </Notice>
        </div>
      )}

      {/* CREATE / EDIT PAGE MODAL */}
      {isCreatingPage && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
              <h4 style={{ margin: 0 }}>{editingPage ? t('Kemaskini Halaman', 'Edit Page') : t('Tambah Halaman CMS Baharu', 'Add New CMS Page')}</h4>
              <button type="button" className="button-icon" onClick={() => setIsCreatingPage(false)} aria-label="Close">
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePageSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div className="form-grid">
                <div>
                  <label className="form-label">{t('Tajuk Halaman (BM) *', 'Page Title (BM) *')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={pageForm.title_bm}
                    onChange={(e) => handlePageTitleChange(e.target.value)}
                    required
                    placeholder="Contoh: Dasar Privasi"
                  />
                </div>
                <div>
                  <label className="form-label">{t('Tajuk Halaman (EN)', 'Page Title (EN)')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={pageForm.title_en}
                    onChange={(e) => setPageForm({ ...pageForm, title_en: e.target.value })}
                    placeholder="e.g. Privacy Policy"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <label className="form-label">{t('Slug URL *', 'URL Slug *')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>/page/</span>
                    <input
                      type="text"
                      className="form-input"
                      value={pageForm.slug}
                      onChange={(e) => setPageForm({ ...pageForm, slug: handleSlugify(e.target.value) })}
                      required
                      placeholder="dasar-privasi"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">{t('Status Halaman', 'Page Status')}</label>
                  <select
                    className="form-select"
                    value={pageForm.status}
                    onChange={(e) => setPageForm({ ...pageForm, status: e.target.value as CmsPageStatus })}
                  >
                    <option value="draft">{t('Draf (Draft)', 'Draft')}</option>
                    <option value="published">{t('Diterbitkan (Published)', 'Published')}</option>
                    <option value="archived">{t('Diarsip (Archived)', 'Archived')}</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <label className="form-label">{t('Penerangan BM', 'Description BM')}</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={pageForm.description_bm}
                    onChange={(e) => setPageForm({ ...pageForm, description_bm: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">{t('Penerangan EN', 'Description EN')}</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={pageForm.description_en}
                    onChange={(e) => setPageForm({ ...pageForm, description_en: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', background: 'var(--canvas)', padding: '12px', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={pageForm.show_in_navigation}
                    onChange={(e) => setPageForm({ ...pageForm, show_in_navigation: e.target.checked })}
                  />
                  <span>{t('Papar di Navigasi Utama Header', 'Show in Main Header Navigation')}</span>
                </label>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('Susunan Navigasi', 'Navigation Order')}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={pageForm.navigation_order}
                    onChange={(e) => setPageForm({ ...pageForm, navigation_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {pageForm.status === 'published' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={notifySubscribers}
                    onChange={(e) => setNotifySubscribers(e.target.checked)}
                  />
                  <span>{t('Hantar Notifikasi Awam bahawa halaman ini telah diterbitkan', 'Send Public Notification that this page has been published')}</span>
                </label>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button type="button" variant="secondary" onClick={() => setIsCreatingPage(false)}>
                  {t('Batal', 'Cancel')}
                </Button>
                <Button type="submit" variant="primary" disabled={busy}>
                  {editingPage ? t('Simpan Perubahan', 'Save Changes') : t('Cipta Halaman', 'Create Page')}
                </Button>
              </div>
            </form>
          </Card>
          </div>
        </div>
      )}

      {/* TAB 1: LIST OF PAGES */}
      {activeTab === 'pages' && (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('Tajuk Halaman', 'Page Title')}</th>
                  <th>{t('Slug / URL', 'Slug / URL')}</th>
                  <th>{t('Status', 'Status')}</th>
                  <th>{t('Navigasi', 'In Nav')}</th>
                  <th>{t('Susunan', 'Order')}</th>
                  <th style={{ textAlign: 'right' }}>{t('Tindakan', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pages.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--ink-soft)' }}>
                      {t('Tiada halaman CMS dicipta lagi.', 'No CMS pages created yet.')}
                    </td>
                  </tr>
                ) : (
                  pages.map((page) => (
                    <tr key={page.id}>
                      <td>
                        <strong>{page.title_bm}</strong>
                        {page.title_en && <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>{page.title_en}</div>}
                      </td>
                      <td>
                        <a href={`/page/${page.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--brand-primary)' }}>
                          /page/{page.slug}
                        </a>
                      </td>
                      <td>
                        <span className={`status-badge status-${page.status}`}>
                          {page.status === 'published' ? t('Diterbitkan', 'Published') : page.status === 'draft' ? t('Draf', 'Draft') : t('Diarsip', 'Archived')}
                        </span>
                      </td>
                      <td>
                        {page.show_in_navigation ? (
                          <span style={{ color: 'green', fontWeight: 'bold' }}>✓ {t('Ya', 'Yes')}</span>
                        ) : (
                          <span style={{ color: 'var(--ink-soft)' }}>—</span>
                        )}
                      </td>
                      <td>{page.navigation_order}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <Button
                            variant="secondary"
                            onClick={() => handleSelectPageForBlocks(page)}
                            title={t('Edit Blok Kandungan', 'Edit Content Blocks')}
                          >
                            <Icon name="edit" size={15} /> {t('Kandungan', 'Content')}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => openEditPageModal(page)}
                            title={t('Edit Tetapan Halaman', 'Edit Page Settings')}
                          >
                            <Icon name="settings" size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => onDeletePage(page.id, page.title_bm)}
                            style={{ color: 'var(--danger)' }}
                            title={t('Padam Halaman', 'Delete Page')}
                          >
                            <Icon name="trash" size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: BLOCK CONTENT BUILDER */}
      {activeTab === 'editor' && selectedPage && (
        <div className="cms-block-builder" style={{ display: 'grid', gap: '20px' }}>
          <div style={{ background: 'var(--surface-alt)', borderLeft: '4px solid var(--brand-primary)', borderRadius: '12px' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0 }}>
                  {t('Menyunting Blok:', 'Editing Blocks for:')} <span style={{ color: 'var(--brand-primary)' }}>{selectedPage.title_bm}</span>
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                  URL: /page/{selectedPage.slug} · Status: <strong>{selectedPage.status}</strong>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={`/page/${selectedPage.slug}`} target="_blank" rel="noreferrer" className="button button-ghost button-sm">
                  <Icon name="external-link" size={16} /> {t('Pratonton Halaman', 'Preview Page')}
                </a>
                <Button variant="primary" onClick={handleSaveAllBlocks} disabled={busy}>
                  <Icon name="check" size={16} /> {t('Simpan Semua Blok', 'Save All Blocks')}
                </Button>
              </div>
            </div>
          </Card>
          </div>

          {/* ADD BLOCK BUTTONS */}
          <div style={{ background: 'var(--canvas)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--line)' }}>
            <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
              <Icon name="plus" size={16} /> {t('Tambah Seksyen / Blok Kandungan Baharu:', 'Add New Content Section / Block:')}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Button variant="secondary" onClick={() => addBlock('rich_text')}>
                + {t('Rich Text / Teks', 'Rich Text')}
              </Button>
              <Button variant="secondary" onClick={() => addBlock('image')}>
                + {t('Gambar / Poster', 'Image / Poster')}
              </Button>
              <Button variant="secondary" onClick={() => addBlock('button')}>
                + {t('Butang Aksi', 'Button CTA')}
              </Button>
              <Button variant="secondary" onClick={() => addBlock('link')}>
                + {t('Pautan / Kad', 'Link Card')}
              </Button>
              <Button variant="secondary" onClick={() => addBlock('gallery')}>
                + {t('Galeri Foto', 'Photo Gallery')}
              </Button>
              <Button variant="secondary" onClick={() => addBlock('spacer')}>
                + {t('Pemisah / Spacer', 'Divider / Spacer')}
              </Button>
            </div>
          </div>

          {/* LIST OF LOCAL BLOCKS WITH REORDER & EDITING */}
          {localBlocks.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-soft)' }}>
                <Icon name="file-text" size={32} />
                <p>{t('Halaman ini belum mempunyai sebarang blok kandungan. Pilih jenis blok di atas untuk memulakan.', 'This page has no content blocks yet. Select a block type above to start.')}</p>
              </div>
            </Card>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {localBlocks.map((block, index) => {
                const isFirst = index === 0
                const isLast = index === localBlocks.length - 1

                return (
                  <div key={block.id} style={{ borderLeft: '3px solid var(--brand-accent)', borderRadius: '12px' }}>
                    <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: 'var(--brand-primary)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 'bold' }}>
                          #{block.display_order}
                        </span>
                        <strong style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                          {block.block_type.replace('_', ' ')}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="button-icon"
                          disabled={isFirst}
                          onClick={() => moveBlock(index, 'up')}
                          title={t('Alih Ke Atas', 'Move Up')}
                        >
                          <Icon name="chevron-up" size={18} />
                        </button>
                        <button
                          type="button"
                          className="button-icon"
                          disabled={isLast}
                          onClick={() => moveBlock(index, 'down')}
                          title={t('Alih Ke Bawah', 'Move Down')}
                        >
                          <Icon name="chevron-down" size={18} />
                        </button>
                        <button
                          type="button"
                          className="button-icon"
                          onClick={() => removeBlock(block.id)}
                          style={{ color: 'var(--danger)' }}
                          title={t('Padam Blok', 'Delete Block')}
                        >
                          <Icon name="trash" size={18} />
                        </button>
                      </div>
                    </div>

                    {/* RICH TEXT EDITOR */}
                    {block.block_type === 'rich_text' && (
                      <div className="form-grid">
                        <div>
                          <label className="form-label">{t('Tajuk Seksyen (BM)', 'Section Heading (BM)')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={(block.content as RichTextBlockContent).heading_bm || ''}
                            onChange={(e) => updateBlockContent(block.id, { heading_bm: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">{t('Tajuk Seksyen (EN)', 'Section Heading (EN)')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={(block.content as RichTextBlockContent).heading_en || ''}
                            onChange={(e) => updateBlockContent(block.id, { heading_en: e.target.value })}
                          />
                        </div>
                        <div className="full-span">
                          <label className="form-label">{t('Kandungan Perenggan (BM)', 'Body Paragraphs (BM)')}</label>
                          <textarea
                            className="form-textarea"
                            rows={4}
                            value={(block.content as RichTextBlockContent).body_bm || ''}
                            onChange={(e) => updateBlockContent(block.id, { body_bm: e.target.value })}
                          />
                        </div>
                        <div className="full-span">
                          <label className="form-label">{t('Kandungan Perenggan (EN)', 'Body Paragraphs (EN)')}</label>
                          <textarea
                            className="form-textarea"
                            rows={4}
                            value={(block.content as RichTextBlockContent).body_en || ''}
                            onChange={(e) => updateBlockContent(block.id, { body_en: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {/* IMAGE BLOCK EDITOR */}
                    {block.block_type === 'image' && (
                      <div className="form-grid">
                        <div className="full-span" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                          {(block.content as ImageBlockContent).image_url ? (
                            <img
                              src={(block.content as ImageBlockContent).image_url}
                              alt="Preview"
                              style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--line)' }}
                            />
                          ) : (
                            <div style={{ width: '120px', height: '90px', background: 'var(--canvas)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}>
                              <Icon name="box" size={24} />
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <label className="form-label">{t('Muat Naik Gambar / URL', 'Upload Image / URL')}</label>
                            <input
                              type="file"
                              accept="image/*"
                              className="form-input"
                              disabled={uploadingImage}
                              onChange={(e) => e.target.files?.[0] && handleBlockImageUpload(block.id, e.target.files[0])}
                            />
                            <input
                              type="text"
                              className="form-input"
                              style={{ marginTop: '6px' }}
                              placeholder="https://..."
                              value={(block.content as ImageBlockContent).image_url || ''}
                              onChange={(e) => updateBlockContent(block.id, { image_url: e.target.value })}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="form-label">{t('Keterangan / Caption (BM)', 'Caption (BM)')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={(block.content as ImageBlockContent).caption_bm || ''}
                            onChange={(e) => updateBlockContent(block.id, { caption_bm: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">{t('Keterangan / Caption (EN)', 'Caption (EN)')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={(block.content as ImageBlockContent).caption_en || ''}
                            onChange={(e) => updateBlockContent(block.id, { caption_en: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="form-label">{t('Penjajaran (Alignment)', 'Alignment')}</label>
                          <select
                            className="form-select"
                            value={(block.content as ImageBlockContent).alignment || 'center'}
                            onChange={(e) => updateBlockContent(block.id, { alignment: e.target.value })}
                          >
                            <option value="left">{t('Kiri', 'Left')}</option>
                            <option value="center">{t('Tengah', 'Center')}</option>
                            <option value="right">{t('Kanan', 'Right')}</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label">{t('Saiz Paparan', 'Display Size')}</label>
                          <select
                            className="form-select"
                            value={(block.content as ImageBlockContent).size || 'full'}
                            onChange={(e) => updateBlockContent(block.id, { size: e.target.value })}
                          >
                            <option value="small">{t('Kecil (Small)', 'Small')}</option>
                            <option value="medium">{t('Sederhana (Medium)', 'Medium')}</option>
                            <option value="full">{t('Lebar Penuh (Full Width)', 'Full Width')}</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* BUTTON BLOCK EDITOR */}
                    {block.block_type === 'button' && (
                      <div className="form-grid">
                        <div>
                          <label className="form-label">{t('Teks Butang (BM)', 'Button Label (BM)')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={(block.content as ButtonBlockContent).label_bm || ''}
                            onChange={(e) => updateBlockContent(block.id, { label_bm: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">{t('Teks Butang (EN)', 'Button Label (EN)')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={(block.content as ButtonBlockContent).label_en || ''}
                            onChange={(e) => updateBlockContent(block.id, { label_en: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">{t('URL Sasaran', 'Target URL')}</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="https://... atau /e-aset"
                            value={(block.content as ButtonBlockContent).url || ''}
                            onChange={(e) => updateBlockContent(block.id, { url: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">{t('Gaya Butang', 'Button Style')}</label>
                          <select
                            className="form-select"
                            value={(block.content as ButtonBlockContent).variant || 'primary'}
                            onChange={(e) => updateBlockContent(block.id, { variant: e.target.value })}
                          >
                            <option value="primary">{t('Utama (Maroon)', 'Primary (Maroon)')}</option>
                            <option value="gold">{t('Emas (Gold)', 'Gold')}</option>
                            <option value="secondary">{t('Sekunder', 'Secondary')}</option>
                            <option value="outline">{t('Garis Luar (Outline)', 'Outline')}</option>
                          </select>
                        </div>
                        <div className="full-span">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                            <input
                              type="checkbox"
                              checked={(block.content as ButtonBlockContent).open_new_tab || false}
                              onChange={(e) => updateBlockContent(block.id, { open_new_tab: e.target.checked })}
                            />
                            <span>{t('Buka dalam tab baharu (_blank)', 'Open in new tab (_blank)')}</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* LINK BLOCK EDITOR */}
                    {block.block_type === 'link' && (
                      <div className="form-grid">
                        <div>
                          <label className="form-label">{t('Tajuk Pautan (BM)', 'Link Title (BM)')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={(block.content as LinkBlockContent).title_bm || ''}
                            onChange={(e) => updateBlockContent(block.id, { title_bm: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">{t('Tajuk Pautan (EN)', 'Link Title (EN)')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={(block.content as LinkBlockContent).title_en || ''}
                            onChange={(e) => updateBlockContent(block.id, { title_en: e.target.value })}
                          />
                        </div>
                        <div className="full-span">
                          <label className="form-label">{t('URL Sasaran', 'Target URL')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={(block.content as LinkBlockContent).url || ''}
                            onChange={(e) => updateBlockContent(block.id, { url: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">{t('Penerangan Ringkas (BM)', 'Short Description (BM)')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={(block.content as LinkBlockContent).description_bm || ''}
                            onChange={(e) => updateBlockContent(block.id, { description_bm: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">{t('Penerangan Ringkas (EN)', 'Short Description (EN)')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={(block.content as LinkBlockContent).description_en || ''}
                            onChange={(e) => updateBlockContent(block.id, { description_en: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {/* GALLERY BLOCK EDITOR */}
                    {block.block_type === 'gallery' && (
                      <div>
                        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{t('Senarai Gambar Galeri:', 'Gallery Image List:')}</span>
                          <label className="button button-secondary button-sm" style={{ cursor: 'pointer', margin: 0 }}>
                            + {t('Muat Naik Gambar Galeri', 'Upload Gallery Image')}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => e.target.files?.[0] && handleGalleryImageUpload(block.id, (block.content as GalleryBlockContent).items || [], e.target.files[0])}
                            />
                          </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                          {((block.content as GalleryBlockContent).items || []).map((galItem, gIdx) => (
                            <div key={galItem.id} style={{ border: '1px solid var(--line)', padding: '8px', borderRadius: '8px', background: 'var(--canvas)' }}>
                              <img src={galItem.image_url} alt="" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px' }} />
                              <input
                                type="text"
                                className="form-input"
                                style={{ marginTop: '6px', fontSize: '0.8rem' }}
                                placeholder="Caption BM"
                                value={galItem.caption_bm || ''}
                                onChange={(e) => {
                                  const items = [...((block.content as GalleryBlockContent).items || [])]
                                  items[gIdx].caption_bm = e.target.value
                                  updateBlockContent(block.id, { items })
                                }}
                              />
                              <button
                                type="button"
                                className="button button-ghost button-sm"
                                style={{ width: '100%', marginTop: '6px', color: 'var(--danger)' }}
                                onClick={() => {
                                  const items = ((block.content as GalleryBlockContent).items || []).filter((_, idx) => idx !== gIdx)
                                  updateBlockContent(block.id, { items })
                                }}
                              >
                                {t('Padam', 'Remove')}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SPACER BLOCK EDITOR */}
                    {block.block_type === 'spacer' && (
                      <div className="form-grid">
                        <div>
                          <label className="form-label">{t('Ketinggian (Pixels)', 'Height (Pixels)')}</label>
                          <input
                            type="number"
                            className="form-input"
                            value={(block.content as SpacerBlockContent).height_px || 24}
                            onChange={(e) => updateBlockContent(block.id, { height_px: parseInt(e.target.value) || 12 })}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                            <input
                              type="checkbox"
                              checked={(block.content as SpacerBlockContent).show_line ?? true}
                              onChange={(e) => updateBlockContent(block.id, { show_line: e.target.checked })}
                            />
                            <span>{t('Papar Garisan Pemisah (Divider Line)', 'Show Divider Line')}</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
                )
              })}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <Button variant="primary" onClick={handleSaveAllBlocks} disabled={busy}>
              <Icon name="check" size={18} /> {t('Simpan Semua Blok Kandungan', 'Save All Content Blocks')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
