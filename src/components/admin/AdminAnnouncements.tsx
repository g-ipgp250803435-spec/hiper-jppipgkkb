import { useState, type FormEvent } from 'react'
import { Button, Card, EmptyState, Field } from '../UI'
import { Icon } from '../Icons'
import { RichTextEditor, richTextToPlainText } from '../RichText'
import { formatDate } from '../../lib/helpers'
import type { Announcement, AnnouncementPinType } from '../../lib/types'

interface AdminAnnouncementsProps {
  t: (bm: string, en: string) => string
  language: 'bm' | 'en'
  announcements: Announcement[]
  busy: boolean
  onSaveAnnouncement: (
    form: typeof initialAnnouncement,
    posterFile: File | null,
    editingId: string | null,
    resetForm: () => void
  ) => Promise<void>
  onDeleteAnnouncement: (id: string) => Promise<void>
}

const initialAnnouncement = {
  title_bm: '',
  title_en: '',
  content_bm: '',
  content_en: '',
  published: true,
  pinned: false,
  pin_type: 'none' as AnnouncementPinType,
  expiry_at: '',
  poster_url: null as string | null,
}

export default function AdminAnnouncements({
  t,
  language,
  announcements,
  busy,
  onSaveAnnouncement,
  onDeleteAnnouncement,
}: AdminAnnouncementsProps) {
  const [announcementForm, setAnnouncementForm] = useState(initialAnnouncement)
  const [announcementPoster, setAnnouncementPoster] = useState<File | null>(null)
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null)

  const resetAnnouncementEditor = () => {
    setAnnouncementForm(initialAnnouncement)
    setAnnouncementPoster(null)
    setEditingAnnouncementId(null)
  }

  const startAnnouncementEdit = (item: Announcement) => {
    setAnnouncementForm({
      title_bm: item.title_bm,
      title_en: item.title_en || '',
      content_bm: item.content_bm,
      content_en: item.content_en || '',
      published: item.published,
      pinned: item.pinned,
      pin_type: item.pin_type || (item.pinned ? 'penting' : 'none'),
      expiry_at: item.expiry_at ? item.expiry_at.slice(0, 10) : '',
      poster_url: item.poster_url,
    })
    setAnnouncementPoster(null)
    setEditingAnnouncementId(item.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    void onSaveAnnouncement(announcementForm, announcementPoster, editingAnnouncementId, resetAnnouncementEditor)
  }

  return (
    <div className="admin-content-grid admin-editor-grid">
      <Card
        title={editingAnnouncementId ? t('Edit pengumuman', 'Edit announcement') : t('Tambah pengumuman', 'Add announcement')}
        className={editingAnnouncementId ? 'admin-editor-active' : ''}
        action={editingAnnouncementId ? <span className="editor-mode-badge"><Icon name="edit" size={15} /> {t('Mod edit', 'Edit mode')}</span> : undefined}
      >
        <form className="form-grid" onSubmit={handleFormSubmit}>
          <Field label="Tajuk BM" required>
            <input value={announcementForm.title_bm} onChange={(event) => setAnnouncementForm({ ...announcementForm, title_bm: event.target.value })} required />
          </Field>
          <Field label="English title">
            <input value={announcementForm.title_en} onChange={(event) => setAnnouncementForm({ ...announcementForm, title_en: event.target.value })} />
          </Field>
          <div className="full-span">
            <Field label="Kandungan BM" required hint={t('Gunakan toolbar untuk bold, italic, bullets dan numbering.', 'Use the toolbar for bold, italic, bullets and numbering.')}>
              <RichTextEditor value={announcementForm.content_bm} onChange={(value) => setAnnouncementForm({ ...announcementForm, content_bm: value })} ariaLabel="Kandungan pengumuman Bahasa Melayu" />
            </Field>
          </div>
          <div className="full-span">
            <Field label="English content" hint={t('Gunakan toolbar untuk bold, italic, bullets dan numbering.', 'Use the toolbar for bold, italic, bullets and numbering.')}>
              <RichTextEditor value={announcementForm.content_en} onChange={(value) => setAnnouncementForm({ ...announcementForm, content_en: value })} ariaLabel="English announcement content" />
            </Field>
          </div>
          <Field label={t('Status Pin & Keutamaan', 'Pin & Priority Status')}>
            <select
              value={announcementForm.pin_type}
              onChange={(e) =>
                setAnnouncementForm({
                  ...announcementForm,
                  pin_type: e.target.value as AnnouncementPinType,
                  pinned: e.target.value !== 'none',
                })
              }
            >
              <option value="none">{t('Biasa (Tiada Pin)', 'Normal (No Pin)')}</option>
              <option value="penting">PENTING (Important Alert)</option>
              <option value="terkini">TERKINI (Latest Highlight)</option>
            </select>
          </Field>
          <Field label={t('Tarikh Luput (Opsional)', 'Expiry Date (Optional)')}>
            <input
              type="date"
              value={announcementForm.expiry_at}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, expiry_at: e.target.value })}
            />
          </Field>
          <div className="full-span">
            <Field label={editingAnnouncementId ? t('Ganti poster', 'Replace poster') : t('Poster', 'Poster')}>
              <input type="file" accept="image/*" onChange={(event) => setAnnouncementPoster(event.target.files?.[0] || null)} />
            </Field>
            {announcementForm.poster_url && !announcementPoster && (
              <div className="admin-media-preview">
                <img src={announcementForm.poster_url} alt="" />
                <span>{t('Poster semasa akan dikekalkan.', 'Current poster will be retained.')}</span>
              </div>
            )}
          </div>
          <label className="checkbox-field full-span">
            <input type="checkbox" checked={announcementForm.published} onChange={(event) => setAnnouncementForm({ ...announcementForm, published: event.target.checked })} />
            {t('Terbitkan Pengumuman', 'Publish Announcement')}
          </label>
          <div className="full-span form-actions">
            <Button disabled={busy} type="submit">
              <Icon name="save" size={18} />
              {editingAnnouncementId ? t('Simpan perubahan', 'Save changes') : t('Tambah pengumuman', 'Add announcement')}
            </Button>
            {editingAnnouncementId && (
              <Button type="button" variant="secondary" onClick={resetAnnouncementEditor}>
                <Icon name="close" size={18} />
                {t('Batal edit', 'Cancel edit')}
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card title={t('Senarai pengumuman', 'Announcement list')}>
        {announcements.length === 0 ? (
          <EmptyState title={t('Tiada pengumuman', 'No announcements')} />
        ) : (
          <div className="management-list">
            {announcements.map((item) => (
              <div className="management-item management-item-rich" key={item.id}>
                <div className="management-thumb">
                  {item.poster_url ? <img src={item.poster_url} alt="" /> : <Icon name="image" size={24} />}
                </div>
                <div className="management-copy">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>{language === 'bm' ? item.title_bm : item.title_en || item.title_bm}</strong>
                    {item.pin_type === 'penting' && <span className="badge badge-danger" style={{ fontSize: '10px' }}>PENTING</span>}
                    {item.pin_type === 'terkini' && <span className="badge badge-primary" style={{ fontSize: '10px' }}>TERKINI</span>}
                  </div>
                  <small>
                    {item.published ? t('Diterbitkan', 'Published') : t('Draf', 'Draft')} · {formatDate(item.created_at, language)}
                  </small>
                  <p className="management-excerpt">{richTextToPlainText(language === 'bm' ? item.content_bm : item.content_en || item.content_bm)}</p>
                </div>
                <div className="management-actions">
                  <Button variant="secondary" className="compact" onClick={() => startAnnouncementEdit(item)}>
                    <Icon name="edit" size={17} /> {t('Edit', 'Edit')}
                  </Button>
                  <Button variant="danger" className="compact" onClick={() => void onDeleteAnnouncement(item.id)}>
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
