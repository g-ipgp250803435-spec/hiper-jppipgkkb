import { useState, type FormEvent } from 'react'
import { Button, Card, EmptyState, Field } from '../UI'
import { Icon } from '../Icons'
import { OrganizationTree } from '../OrganizationTree'
import type { OrganizationMember } from '../../lib/types'

interface AdminOrganizationProps {
  t: (bm: string, en: string) => string
  language: 'bm' | 'en'
  members: OrganizationMember[]
  busy: boolean
  onSaveMember: (
    form: typeof initialMember,
    photoFile: File | null,
    editingId: string | null,
    resetForm: () => void
  ) => Promise<void>
  onDeleteMember: (id: string) => Promise<void>
}

const initialMember = {
  parent_id: '',
  node_type: 'member' as OrganizationMember['node_type'],
  node_category: '',
  name: '',
  position_bm: '',
  position_en: '',
  unit_bm: '',
  unit_en: '',
  class_name: '',
  duties_bm: '',
  duties_en: '',
  description: '',
  sort_order: 1,
  active: true,
  photo_url: null as string | null,
}

export default function AdminOrganization({
  t,
  language,
  members,
  busy,
  onSaveMember,
  onDeleteMember,
}: AdminOrganizationProps) {
  const [memberForm, setMemberForm] = useState(initialMember)
  const [memberPhoto, setMemberPhoto] = useState<File | null>(null)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)

  const resetMemberEditor = () => {
    setMemberForm(initialMember)
    setMemberPhoto(null)
    setEditingMemberId(null)
  }

  const startMemberEdit = (item: OrganizationMember) => {
    setMemberForm({
      parent_id: item.parent_id || '',
      node_type: item.node_type,
      node_category: item.node_category || '',
      name: item.name,
      position_bm: item.position_bm,
      position_en: item.position_en || '',
      unit_bm: item.unit_bm || '',
      unit_en: item.unit_en || '',
      class_name: item.class_name || '',
      duties_bm: item.duties_bm || '',
      duties_en: item.duties_en || '',
      description: item.description || '',
      sort_order: item.sort_order,
      active: item.active,
      photo_url: item.photo_url,
    })
    setMemberPhoto(null)
    setEditingMemberId(item.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    void onSaveMember(memberForm, memberPhoto, editingMemberId, resetMemberEditor)
  }

  return (
    <div className="stack">
      <div className="admin-content-grid admin-editor-grid">
        <Card
          title={editingMemberId ? t('Edit ahli organisasi', 'Edit organisation member') : t('Tambah ahli', 'Add member')}
          className={editingMemberId ? 'admin-editor-active' : ''}
          action={editingMemberId ? <span className="editor-mode-badge"><Icon name="edit" size={15} /> {t('Mod edit', 'Edit mode')}</span> : undefined}
        >
          <form className="form-grid" onSubmit={handleFormSubmit}>
            <Field label={t('Nama / nama unit', 'Name / unit name')} required>
              <input value={memberForm.name} onChange={(event) => setMemberForm({ ...memberForm, name: event.target.value })} required />
            </Field>

            <Field label={t('Jenis nod', 'Node type')} required>
              <select
                value={memberForm.node_type}
                onChange={(event) =>
                  setMemberForm({
                    ...memberForm,
                    node_type: event.target.value as 'leadership' | 'unit' | 'member',
                    parent_id: '',
                  })
                }
              >
                <option value="leadership">{t('Kepimpinan Utama', 'Main Leadership')}</option>
                <option value="unit">{t('Unit Bahagian', 'Unit / Department')}</option>
                <option value="member">{t('Ahli / Exco', 'Member / Officer')}</option>
              </select>
            </Field>

            <Field label={t('Induk dalam hierarki', 'Parent in hierarchy')} hint={t('Pilih jawatan atasan untuk laporan.', 'Select superior position for reporting line.')}>
              <select value={memberForm.parent_id} onChange={(event) => setMemberForm({ ...memberForm, parent_id: event.target.value })}>
                <option value="">{t('Tiada induk (Atasan)', 'No parent (Top level)')}</option>
                {members
                  .filter((member) => member.id !== editingMemberId)
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} — {member.position_bm}
                    </option>
                  ))}
              </select>
            </Field>

            <Field label={t('Susunan Paparan', 'Sort Order')} required>
              <input type="number" min="0" value={memberForm.sort_order} onChange={(event) => setMemberForm({ ...memberForm, sort_order: Number(event.target.value) })} required />
            </Field>

            <Field label="Jawatan BM" required>
              <input value={memberForm.position_bm} onChange={(event) => setMemberForm({ ...memberForm, position_bm: event.target.value })} required />
            </Field>

            <Field label="English position">
              <input value={memberForm.position_en} onChange={(event) => setMemberForm({ ...memberForm, position_en: event.target.value })} />
            </Field>

            <Field label="Unit / Bahagian BM">
              <input value={memberForm.unit_bm} onChange={(event) => setMemberForm({ ...memberForm, unit_bm: event.target.value })} placeholder="Cth: Unit Perancangan & Kesatuan" />
            </Field>

            <Field label="English unit">
              <input value={memberForm.unit_en} onChange={(event) => setMemberForm({ ...memberForm, unit_en: event.target.value })} />
            </Field>

            <Field label={t('Kelas / Opsyen', 'Class / Option')}>
              <input value={memberForm.class_name} onChange={(event) => setMemberForm({ ...memberForm, class_name: event.target.value })} />
            </Field>

            <Field label={editingMemberId ? t('Ganti gambar', 'Replace photo') : t('Gambar', 'Photo')}>
              <input type="file" accept="image/*" onChange={(event) => setMemberPhoto(event.target.files?.[0] || null)} />
            </Field>

            {memberForm.photo_url && !memberPhoto && (
              <div className="full-span admin-media-preview">
                <img src={memberForm.photo_url} alt="" />
                <span>{t('Gambar semasa akan dikekalkan.', 'Current photo will be retained.')}</span>
              </div>
            )}

            <div className="full-span">
              <Field label="Bidang tugas BM">
                <textarea rows={3} value={memberForm.duties_bm} onChange={(event) => setMemberForm({ ...memberForm, duties_bm: event.target.value })} />
              </Field>
            </div>

            <div className="full-span">
              <Field label="Penerangan / Ringkasan (Opsional)">
                <textarea rows={2} value={memberForm.description} onChange={(event) => setMemberForm({ ...memberForm, description: event.target.value })} />
              </Field>
            </div>

            <label className="checkbox-field full-span">
              <input type="checkbox" checked={memberForm.active} onChange={(event) => setMemberForm({ ...memberForm, active: event.target.checked })} />
              {t('Ahli aktif dan dipaparkan di halaman Kenali Pejabat', 'Active member shown on the Our Office page')}
            </label>

            <div className="full-span form-actions">
              <Button disabled={busy} type="submit">
                <Icon name="save" size={18} />
                {editingMemberId ? t('Simpan perubahan', 'Save changes') : t('Tambah ahli', 'Add member')}
              </Button>
              {editingMemberId && (
                <Button type="button" variant="secondary" onClick={resetMemberEditor}>
                  <Icon name="close" size={18} /> {t('Batal edit', 'Cancel edit')}
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card title={t('Ahli carta organisasi', 'Organisation chart members')}>
          {members.length === 0 ? (
            <EmptyState title={t('Tiada ahli organisasi', 'No organisation members')} />
          ) : (
            <div className="management-list">
              {members.map((item) => (
                <div className="management-item management-item-rich" key={item.id}>
                  <div className="management-thumb management-avatar">
                    {item.photo_url ? <img src={item.photo_url} alt="" /> : <Icon name="user" size={24} />}
                  </div>
                  <div className="management-copy">
                    <strong>
                      {item.sort_order}. {item.name}
                    </strong>
                    <small>
                      {language === 'bm' ? item.position_bm : item.position_en || item.position_bm} · {item.class_name || '—'}
                    </small>
                    <p className="management-excerpt">{language === 'bm' ? item.unit_bm || item.duties_bm : item.unit_en || item.unit_bm || item.duties_en || item.duties_bm}</p>
                  </div>
                  <div className="management-actions">
                    <Button variant="secondary" className="compact" onClick={() => startMemberEdit(item)}>
                      <Icon name="edit" size={17} /> {t('Edit', 'Edit')}
                    </Button>
                    <Button variant="danger" className="compact" onClick={() => void onDeleteMember(item.id)}>
                      <Icon name="trash" size={17} /> {t('Padam', 'Delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title={t('Pratonton Carta Organisasi', 'Organisation Chart Preview')} className="admin-tree-preview-card">
        {members.length === 0 ? (
          <EmptyState title={t('Tiada ahli organisasi', 'No organisation members')} />
        ) : (
          <OrganizationTree members={members} language={language} />
        )}
      </Card>
    </div>
  )
}
