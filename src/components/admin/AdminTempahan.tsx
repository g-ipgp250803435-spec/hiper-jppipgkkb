import { useState } from 'react'
import { Button, Card, EmptyState, Field } from '../UI'
import { Icon } from '../Icons'
import AdminRoomBookings from './AdminRoomBookings'
import type { BookingService, RoomBooking } from '../../lib/types'

interface AdminTempahanProps {
  t: (bm: string, en: string) => string
  language: 'bm' | 'en'
  services: BookingService[]
  roomBookings: RoomBooking[]
  busy: boolean
  supabaseClient: any
  setServices: React.Dispatch<React.SetStateAction<BookingService[]>>
  setRoomBookings: React.Dispatch<React.SetStateAction<RoomBooking[]>>
  onSaveService: (
    form: {
      title_bm: string
      title_en: string
      description_bm: string
      description_en: string
      instructions_bm: string
      instructions_en: string
      booking_type: string
      external_link: string | null
      active: boolean
      image_url: string | null
    },
    imageFile: File | null,
    editingId: string | null
  ) => Promise<void>
  onDeleteService: (id: string) => Promise<void>
  onUpdateRoomBooking: (item: RoomBooking) => Promise<void>
  onDeleteRoomBooking: (id: string) => Promise<void>
}

export default function AdminTempahan({
  t,
  services,
  roomBookings,
  busy,
  language,
  setServices,
  setRoomBookings,
  onSaveService,
  onDeleteService,
  onUpdateRoomBooking,
  onDeleteRoomBooking,
}: AdminTempahanProps) {
  const [subTab, setSubTab] = useState<'room_bookings' | 'services'>('room_bookings')

  // Booking Service Form State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [titleBm, setTitleBm] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [descBm, setDescBm] = useState('')
  const [descEn, setDescEn] = useState('')
  const [instrBm, setInstrBm] = useState('')
  const [instrEn, setInstrEn] = useState('')
  const [bookingType, setBookingType] = useState('custom')
  const [externalLink, setExternalLink] = useState('')
  const [active, setActive] = useState(true)
  const [imageUrl, setImageUrl] = useState('')
  const [serviceImage, setServiceImage] = useState<File | null>(null)

  const editService = (service: BookingService) => {
    setEditingServiceId(service.id)
    setTitleBm(service.title_bm)
    setTitleEn(service.title_en || '')
    setDescBm(service.description_bm || '')
    setDescEn(service.description_en || '')
    setInstrBm(service.instructions_bm || '')
    setInstrEn(service.instructions_en || '')
    setBookingType(service.booking_type || 'custom')
    setExternalLink(service.external_link || '')
    setActive(service.active)
    setImageUrl(service.image_url || '')
    setServiceImage(null)
  }

  const resetServiceForm = () => {
    setEditingServiceId(null)
    setTitleBm('')
    setTitleEn('')
    setDescBm('')
    setDescEn('')
    setInstrBm('')
    setInstrEn('')
    setBookingType('custom')
    setExternalLink('')
    setActive(true)
    setImageUrl('')
    setServiceImage(null)
  }

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titleBm.trim()) return

    await onSaveService(
      {
        title_bm: titleBm.trim(),
        title_en: titleEn.trim(),
        description_bm: descBm.trim(),
        description_en: descEn.trim(),
        instructions_bm: instrBm.trim(),
        instructions_en: instrEn.trim(),
        booking_type: bookingType,
        external_link: externalLink.trim() || null,
        active,
        image_url: imageUrl.trim() || null,
      },
      serviceImage,
      editingServiceId
    )
    resetServiceForm()
  }

  return (
    <div className="admin-tempahan-module">
      <div className="admin-sub-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Button variant={subTab === 'room_bookings' ? 'primary' : 'ghost'} onClick={() => setSubTab('room_bookings')}>
          <Icon name="calendar" size={17} />
          {t('Tempahan Bilik JPP', 'JPP Room Bookings')} ({roomBookings.filter((b) => b.status === 'pending').length} {t('Pending', 'Pending')})
        </Button>
        <Button variant={subTab === 'services' ? 'primary' : 'ghost'} onClick={() => setSubTab('services')}>
          <Icon name="box" size={17} />
          {t('Kategori Perkhidmatan Tempahan', 'Booking Services Categories')} ({services.length})
        </Button>
      </div>

      {subTab === 'room_bookings' && (
        <AdminRoomBookings
          t={t}
          language={language}
          roomBookings={roomBookings}
          busy={busy}
          supabaseClient={null}
          setRoomBookings={setRoomBookings}
          onUpdateRoomBooking={onUpdateRoomBooking}
          onDeleteRoomBooking={onDeleteRoomBooking}
        />
      )}

      {subTab === 'services' && (
        <div className="two-column-layout">
          <Card title={editingServiceId ? t('Edit Perkhidmatan Tempahan', 'Edit Booking Service') : t('Tambah Perkhidmatan Tempahan Baharu', 'Add New Booking Service')}>
            <form onSubmit={handleServiceSubmit} className="form-grid">
              <Field label={t('Tajuk (BM)', 'Title (BM)')} required>
                <input value={titleBm} onChange={(e) => setTitleBm(e.target.value)} required placeholder="Cth: Tempahan Baju Rasmi" />
              </Field>

              <Field label={t('Tajuk (EN)', 'Title (EN)')}>
                <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="E.g. Official Apparel Order" />
              </Field>

              <div className="full-span">
                <Field label={t('Penerangan (BM)', 'Description (BM)')}>
                  <textarea rows={2} value={descBm} onChange={(e) => setDescBm(e.target.value)} placeholder="Ringkasan perkhidmatan tempahan" />
                </Field>
              </div>

              <div className="full-span">
                <Field label={t('Penerangan (EN)', 'Description (EN)')}>
                  <textarea rows={2} value={descEn} onChange={(e) => setDescEn(e.target.value)} placeholder="Service description summary" />
                </Field>
              </div>

              <Field label={t('Jenis Tempahan', 'Booking Type')} required>
                <select value={bookingType} onChange={(e) => setBookingType(e.target.value)}>
                  <option value="room_booking">Tempahan Bilik (Room Booking)</option>
                  <option value="apparel">Baju / Corporate Shirt</option>
                  <option value="nametag">Tanda Nama / Name Tag</option>
                  <option value="custom">Lain-lain / Custom</option>
                </select>
              </Field>

              <Field label={t('Pautan Tempahan (Google Form URL)', 'Booking Link (Google Form URL)')} hint={t('Tidak terpakai untuk Tempahan Bilik JPP', 'Not applicable for JPP Room Booking')}>
                <input value={externalLink} onChange={(e) => setExternalLink(e.target.value)} placeholder="https://forms.google.com/..." />
              </Field>

              <div className="full-span">
                <Field label={editingServiceId ? t('Upload / Ganti Gambar', 'Upload / Replace Image') : t('Upload Gambar', 'Upload Image')}>
                  <input type="file" accept="image/*" onChange={(e) => setServiceImage(e.target.files?.[0] || null)} />
                </Field>
                {(imageUrl || serviceImage) && (
                  <div className="admin-media-preview" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {serviceImage ? (
                      <img src={URL.createObjectURL(serviceImage)} alt="Pratonton" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                    ) : imageUrl ? (
                      <img src={imageUrl} alt="Semasa" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                    ) : null}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                        {serviceImage ? t('Gambar baharu dipilih.', 'New image selected.') : t('Gambar semasa terpapar.', 'Current image displayed.')}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        className="compact danger"
                        onClick={() => {
                          setServiceImage(null)
                          setImageUrl('')
                        }}
                      >
                        <Icon name="trash" size={14} />
                        {t('Buang Gambar', 'Remove Image')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="full-span">
                <Field label={t('Arahan / Nota Khas (BM)', 'Instructions (BM)')}>
                  <input value={instrBm} onChange={(e) => setInstrBm(e.target.value)} placeholder="Cth: Tempahan dibuka sehingga 30 September" />
                </Field>
              </div>

              <Field label={t('Status Aktif', 'Active Status')}>
                <label className="checkbox-field" style={{ marginTop: '8px' }}>
                  <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                  <span>{t('Perkhidmatan Aktif (Dipaparkan)', 'Active Service (Visible)')}</span>
                </label>
              </Field>

              <div className="full-span form-actions button-row" style={{ marginTop: '12px' }}>
                <Button type="submit" disabled={busy}>
                  <Icon name="save" size={17} />
                  {editingServiceId ? t('Kemas Kini Perkhidmatan', 'Update Service') : t('Tambah Perkhidmatan', 'Add Service')}
                </Button>
                {editingServiceId && (
                  <Button type="button" variant="ghost" onClick={resetServiceForm}>
                    {t('Batal', 'Cancel')}
                  </Button>
                )}
              </div>
            </form>
          </Card>

          <Card title={t('Senarai Perkhidmatan Tempahan', 'Booking Service List')}>
            {services.length === 0 ? (
              <EmptyState title={t('Tiada perkhidmatan tempahan', 'No booking services found')} />
            ) : (
              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>{t('Perkhidmatan', 'Service')}</th>
                      <th>{t('Jenis', 'Type')}</th>
                      <th>{t('Status', 'Status')}</th>
                      <th>{t('Tindakan', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((svc) => (
                      <tr key={svc.id}>
                        <td>
                          <strong>{svc.title_bm}</strong>
                          <small style={{ display: 'block', color: 'var(--ink-muted)' }}>{svc.description_bm}</small>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{svc.booking_type}</span>
                        </td>
                        <td>
                          <span className={svc.active ? 'badge badge-approved' : 'badge badge-rejected'}>
                            {svc.active ? t('Aktif', 'Active') : t('Nyahaktif', 'Disabled')}
                          </span>
                        </td>
                        <td>
                          <div className="button-row">
                            <Button variant="ghost" className="compact" onClick={() => editService(svc)}>
                              <Icon name="edit" size={16} /> {t('Edit', 'Edit')}
                            </Button>
                            <Button variant="ghost" className="compact danger" onClick={() => void onDeleteService(svc.id)}>
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
