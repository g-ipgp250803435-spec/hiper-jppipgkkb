import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSiteSettings } from '../../contexts/SiteSettingsContext'
import { useUi } from '../../contexts/UiContext'
import { uploadPublicFile } from '../../lib/helpers'
import { supabase } from '../../lib/supabase'
import type { LocalisedText, SiteSettings } from '../../lib/types'
import { Button, Card, Field, Notice } from '../UI'
import { Icon } from '../Icons'

type PageKey = keyof SiteSettings['pages']

function LocalisedFields({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string
  value: LocalisedText
  onChange: (value: LocalisedText) => void
  multiline?: boolean
}) {
  return (
    <div className="cms-localised-grid full-span">
      <Field label={`${label} · BM`}>
        {multiline
          ? <textarea rows={3} value={value.bm} onChange={(event) => onChange({ ...value, bm: event.target.value })} />
          : <input value={value.bm} onChange={(event) => onChange({ ...value, bm: event.target.value })} />}
      </Field>
      <Field label={`${label} · English`}>
        {multiline
          ? <textarea rows={3} value={value.en} onChange={(event) => onChange({ ...value, en: event.target.value })} />
          : <input value={value.en} onChange={(event) => onChange({ ...value, en: event.target.value })} />}
      </Field>
    </div>
  )
}

export function SiteSettingsEditor() {
  const { t } = useUi()
  const { user } = useAuth()
  const { settings, refreshSettings } = useSiteSettings()
  const [draft, setDraft] = useState<SiteSettings>(settings)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  useEffect(() => setDraft(settings), [settings])

  const updatePage = (page: PageKey, field: 'eyebrow' | 'title' | 'description', value: LocalisedText) => {
    setDraft((current) => ({
      ...current,
      pages: { ...current.pages, [page]: { ...current.pages[page], [field]: value } },
    }))
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    setBusy(true)
    setNotice(null)
    try {
      const next = structuredClone(draft)
      if (logoFile) next.branding.logoUrl = await uploadPublicFile(supabase, logoFile, 'site-branding')
      if (faviconFile) next.branding.faviconUrl = await uploadPublicFile(supabase, faviconFile, 'site-branding')
      if (heroFile) next.home.heroImageUrl = await uploadPublicFile(supabase, heroFile, 'site-branding')

      const { error } = await supabase.from('site_settings').upsert({
        id: 1,
        settings: next,
        updated_by: user.id,
      })
      if (error) throw error
      setLogoFile(null)
      setFaviconFile(null)
      setHeroFile(null)
      await refreshSettings()
      setNotice({ type: 'success', text: t('Identiti dan kandungan website berjaya dikemas kini.', 'Website identity and content updated successfully.') })
    } catch (error) {
      setNotice({ type: 'danger', text: error instanceof Error ? error.message : t('Tetapan gagal disimpan.', 'Settings could not be saved.') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="cms-settings-form" onSubmit={save}>
      {notice && <Notice type={notice.type}>{notice.text}</Notice>}

      <Card title={t('Identiti jenama', 'Brand identity')}>
        <div className="form-grid">
          <Field label={t('Nama ringkas portal', 'Short portal name')} required>
            <input value={draft.branding.siteName} onChange={(event) => setDraft({ ...draft, branding: { ...draft.branding, siteName: event.target.value } })} required />
          </Field>
          <Field label={t('Tajuk tab pelayar', 'Browser tab title')}>
            <input value={draft.branding.browserTitle} onChange={(event) => setDraft({ ...draft, branding: { ...draft.branding, browserTitle: event.target.value } })} />
          </Field>
          <LocalisedFields label={t('Nama penuh', 'Full name')} value={draft.branding.fullName} onChange={(value) => setDraft({ ...draft, branding: { ...draft.branding, fullName: value } })} />
          <LocalisedFields label={t('Tagline', 'Tagline')} value={draft.branding.tagline} onChange={(value) => setDraft({ ...draft, branding: { ...draft.branding, tagline: value } })} />
          <LocalisedFields label={t('Penerangan SEO', 'SEO description')} value={draft.branding.metaDescription} multiline onChange={(value) => setDraft({ ...draft, branding: { ...draft.branding, metaDescription: value } })} />
          <Field label={t('Logo baharu', 'New logo')} hint={t('PNG, JPG, WebP atau SVG. Logo semasa dikekalkan jika tiada fail dipilih.', 'PNG, JPG, WebP or SVG. Current logo is retained if no file is selected.')}>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => setLogoFile(event.target.files?.[0] || null)} />
          </Field>
          <Field label={t('Favicon baharu', 'New favicon')}>
            <input type="file" accept="image/png,image/x-icon,image/svg+xml" onChange={(event) => setFaviconFile(event.target.files?.[0] || null)} />
          </Field>
          <div className="cms-brand-previews full-span">
            <div><span>{t('Logo semasa', 'Current logo')}</span><img src={draft.branding.logoUrl || '/hiper-logo.png'} alt="" /></div>
            <div><span>{t('Favicon semasa', 'Current favicon')}</span><img src={draft.branding.faviconUrl || '/hiper-logo.png'} alt="" /></div>
          </div>
        </div>
      </Card>

      <Card title={t('Bar makluman dan header', 'Notice bar and header')}>
        <div className="form-grid">
          <label className="checkbox-field full-span"><input type="checkbox" checked={draft.announcementBar.enabled} onChange={(event) => setDraft({ ...draft, announcementBar: { ...draft.announcementBar, enabled: event.target.checked } })} /> {t('Paparkan bar makluman di bahagian atas', 'Show the notice bar at the top')}</label>
          <LocalisedFields label={t('Label makluman', 'Notice badge')} value={draft.announcementBar.badge} onChange={(value) => setDraft({ ...draft, announcementBar: { ...draft.announcementBar, badge: value } })} />
          <LocalisedFields label={t('Teks makluman', 'Notice text')} value={draft.announcementBar.text} onChange={(value) => setDraft({ ...draft, announcementBar: { ...draft.announcementBar, text: value } })} />
          <LocalisedFields label={t('Label pautan', 'Link label')} value={draft.announcementBar.linkLabel} onChange={(value) => setDraft({ ...draft, announcementBar: { ...draft.announcementBar, linkLabel: value } })} />
          <Field label={t('Pautan makluman', 'Notice link')}><input value={draft.announcementBar.linkUrl} onChange={(event) => setDraft({ ...draft, announcementBar: { ...draft.announcementBar, linkUrl: event.target.value } })} /></Field>
        </div>
      </Card>

      <Card title={t('Navigasi utama', 'Main navigation')}>
        <div className="form-grid">
          {(Object.keys(draft.navigation) as Array<keyof SiteSettings['navigation']>).map((key) => (
            <LocalisedFields
              key={key}
              label={key}
              value={draft.navigation[key]}
              onChange={(value) => setDraft({ ...draft, navigation: { ...draft.navigation, [key]: value } })}
            />
          ))}
        </div>
      </Card>

      <Card title={t('Halaman utama', 'Homepage')}>
        <div className="form-grid">
          <LocalisedFields label={t('Label hero', 'Hero eyebrow')} value={draft.home.eyebrow} onChange={(value) => setDraft({ ...draft, home: { ...draft.home, eyebrow: value } })} />
          <LocalisedFields label={t('Tajuk hero', 'Hero title')} value={draft.home.title} multiline onChange={(value) => setDraft({ ...draft, home: { ...draft.home, title: value } })} />
          <LocalisedFields label={t('Penerangan hero', 'Hero description')} value={draft.home.description} multiline onChange={(value) => setDraft({ ...draft, home: { ...draft.home, description: value } })} />
          <LocalisedFields label={t('Butang utama', 'Primary button')} value={draft.home.primaryCtaLabel} onChange={(value) => setDraft({ ...draft, home: { ...draft.home, primaryCtaLabel: value } })} />
          <Field label={t('Pautan butang utama', 'Primary button URL')}><input value={draft.home.primaryCtaUrl} onChange={(event) => setDraft({ ...draft, home: { ...draft.home, primaryCtaUrl: event.target.value } })} /></Field>
          <LocalisedFields label={t('Butang kedua', 'Secondary button')} value={draft.home.secondaryCtaLabel} onChange={(value) => setDraft({ ...draft, home: { ...draft.home, secondaryCtaLabel: value } })} />
          <Field label={t('Pautan butang kedua', 'Secondary button URL')}><input value={draft.home.secondaryCtaUrl} onChange={(event) => setDraft({ ...draft, home: { ...draft.home, secondaryCtaUrl: event.target.value } })} /></Field>
          <Field label={t('Gambar hero baharu', 'New hero image')}><input type="file" accept="image/*,.svg" onChange={(event) => setHeroFile(event.target.files?.[0] || null)} /></Field>
          <div className="cms-brand-previews full-span"><div><span>{t('Gambar hero semasa', 'Current hero image')}</span><img src={draft.home.heroImageUrl || draft.branding.logoUrl} alt="" /></div></div>
          <LocalisedFields label={t('Penanda keyakinan 1', 'Trust marker 1')} value={draft.home.trustOne} onChange={(value) => setDraft({ ...draft, home: { ...draft.home, trustOne: value } })} />
          <LocalisedFields label={t('Penanda keyakinan 2', 'Trust marker 2')} value={draft.home.trustTwo} onChange={(value) => setDraft({ ...draft, home: { ...draft.home, trustTwo: value } })} />
          <LocalisedFields label={t('Penanda keyakinan 3', 'Trust marker 3')} value={draft.home.trustThree} onChange={(value) => setDraft({ ...draft, home: { ...draft.home, trustThree: value } })} />
          <LocalisedFields label={t('Label perkhidmatan', 'Services eyebrow')} value={draft.home.servicesEyebrow} onChange={(value) => setDraft({ ...draft, home: { ...draft.home, servicesEyebrow: value } })} />
          <LocalisedFields label={t('Tajuk perkhidmatan', 'Services title')} value={draft.home.servicesTitle} multiline onChange={(value) => setDraft({ ...draft, home: { ...draft.home, servicesTitle: value } })} />
          <LocalisedFields label={t('Penerangan perkhidmatan', 'Services description')} value={draft.home.servicesDescription} multiline onChange={(value) => setDraft({ ...draft, home: { ...draft.home, servicesDescription: value } })} />
          <div className="full-span cms-service-editor-list">
            {draft.home.services.map((service, index) => (
              <details className="cms-page-copy" key={`${service.icon}-${index}`}>
                <summary>{t('Kad perkhidmatan', 'Service card')} {index + 1} · {service.title.bm}</summary>
                <div className="form-grid">
                  <LocalisedFields label={t('Label kecil', 'Eyebrow')} value={service.eyebrow} onChange={(value) => setDraft((current) => ({ ...current, home: { ...current.home, services: current.home.services.map((item, itemIndex) => itemIndex === index ? { ...item, eyebrow: value } : item) } }))} />
                  <LocalisedFields label={t('Tajuk kad', 'Card title')} value={service.title} onChange={(value) => setDraft((current) => ({ ...current, home: { ...current.home, services: current.home.services.map((item, itemIndex) => itemIndex === index ? { ...item, title: value } : item) } }))} />
                  <LocalisedFields label={t('Penerangan kad', 'Card description')} value={service.description} multiline onChange={(value) => setDraft((current) => ({ ...current, home: { ...current.home, services: current.home.services.map((item, itemIndex) => itemIndex === index ? { ...item, description: value } : item) } }))} />
                  <Field label={t('Pautan kad', 'Card URL')}><input value={service.href} onChange={(event) => setDraft((current) => ({ ...current, home: { ...current.home, services: current.home.services.map((item, itemIndex) => itemIndex === index ? { ...item, href: event.target.value } : item) } }))} /></Field>
                </div>
              </details>
            ))}
          </div>
          <LocalisedFields label={t('Label ketelusan', 'Transparency eyebrow')} value={draft.home.transparencyEyebrow} onChange={(value) => setDraft({ ...draft, home: { ...draft.home, transparencyEyebrow: value } })} />
          <LocalisedFields label={t('Tajuk ketelusan', 'Transparency title')} value={draft.home.transparencyTitle} multiline onChange={(value) => setDraft({ ...draft, home: { ...draft.home, transparencyTitle: value } })} />
          <LocalisedFields label={t('Label pengumuman', 'Announcements eyebrow')} value={draft.home.announcementsEyebrow} onChange={(value) => setDraft({ ...draft, home: { ...draft.home, announcementsEyebrow: value } })} />
          <LocalisedFields label={t('Tajuk pengumuman', 'Announcements title')} value={draft.home.announcementsTitle} onChange={(value) => setDraft({ ...draft, home: { ...draft.home, announcementsTitle: value } })} />
          <LocalisedFields label={t('Label pejabat', 'Office eyebrow')} value={draft.home.officeEyebrow} onChange={(value) => setDraft({ ...draft, home: { ...draft.home, officeEyebrow: value } })} />
          <LocalisedFields label={t('Tajuk pejabat', 'Office title')} value={draft.home.officeTitle} multiline onChange={(value) => setDraft({ ...draft, home: { ...draft.home, officeTitle: value } })} />
          <LocalisedFields label={t('Penerangan pejabat', 'Office description')} value={draft.home.officeDescription} multiline onChange={(value) => setDraft({ ...draft, home: { ...draft.home, officeDescription: value } })} />
          <LocalisedFields label={t('Butang pejabat', 'Office button')} value={draft.home.officeCtaLabel} onChange={(value) => setDraft({ ...draft, home: { ...draft.home, officeCtaLabel: value } })} />
        </div>
      </Card>

      <Card title={t('Tajuk halaman', 'Page headings')}>
        <div className="cms-page-copy-list">
          {(Object.keys(draft.pages) as PageKey[]).map((page) => (
            <details className="cms-page-copy" key={page}>
              <summary>{page}</summary>
              <div className="form-grid">
                <LocalisedFields label={t('Label kecil', 'Eyebrow')} value={draft.pages[page].eyebrow} onChange={(value) => updatePage(page, 'eyebrow', value)} />
                <LocalisedFields label={t('Tajuk', 'Title')} value={draft.pages[page].title} multiline onChange={(value) => updatePage(page, 'title', value)} />
                <LocalisedFields label={t('Penerangan', 'Description')} value={draft.pages[page].description} multiline onChange={(value) => updatePage(page, 'description', value)} />
              </div>
            </details>
          ))}
        </div>
      </Card>

      <Card title={t('Footer dan maklumat hubungan', 'Footer and contact information')}>
        <div className="form-grid">
          <LocalisedFields label={t('Label jalur footer', 'Footer band eyebrow')} value={draft.footer.bandEyebrow} onChange={(value) => setDraft({ ...draft, footer: { ...draft.footer, bandEyebrow: value } })} />
          <LocalisedFields label={t('Tajuk jalur footer', 'Footer band title')} value={draft.footer.bandTitle} multiline onChange={(value) => setDraft({ ...draft, footer: { ...draft.footer, bandTitle: value } })} />
          <LocalisedFields label={t('Penerangan jalur footer', 'Footer band description')} value={draft.footer.bandDescription} multiline onChange={(value) => setDraft({ ...draft, footer: { ...draft.footer, bandDescription: value } })} />
          <LocalisedFields label={t('Butang jalur footer', 'Footer band button')} value={draft.footer.bandCtaLabel} onChange={(value) => setDraft({ ...draft, footer: { ...draft.footer, bandCtaLabel: value } })} />
          <LocalisedFields label={t('Penerangan jenama', 'Brand description')} value={draft.footer.brandDescription} multiline onChange={(value) => setDraft({ ...draft, footer: { ...draft.footer, brandDescription: value } })} />
          <LocalisedFields label={t('Tajuk hubungan', 'Contact heading')} value={draft.footer.contactTitle} onChange={(value) => setDraft({ ...draft, footer: { ...draft.footer, contactTitle: value } })} />
          <LocalisedFields label={t('Nama pejabat', 'Office name')} value={draft.footer.officeName} onChange={(value) => setDraft({ ...draft, footer: { ...draft.footer, officeName: value } })} />
          <div className="full-span"><Field label={t('Alamat', 'Address')}><textarea rows={5} value={draft.footer.address} onChange={(event) => setDraft({ ...draft, footer: { ...draft.footer, address: event.target.value } })} /></Field></div>
          <Field label={t('E-mel rasmi', 'Official email')}><input type="email" value={draft.footer.email} onChange={(event) => setDraft({ ...draft, footer: { ...draft.footer, email: event.target.value } })} /></Field>
          <LocalisedFields label={t('Label privasi', 'Privacy label')} value={draft.footer.privacyLabel} onChange={(value) => setDraft({ ...draft, footer: { ...draft.footer, privacyLabel: value } })} />
          <Field label={t('Pautan privasi', 'Privacy URL')}><input value={draft.footer.privacyUrl} onChange={(event) => setDraft({ ...draft, footer: { ...draft.footer, privacyUrl: event.target.value } })} /></Field>
          <Field label={t('Label versi', 'Version label')}><input value={draft.footer.versionLabel} onChange={(event) => setDraft({ ...draft, footer: { ...draft.footer, versionLabel: event.target.value } })} /></Field>
          <LocalisedFields label={t('Hak cipta', 'Copyright')} value={draft.footer.copyright} onChange={(value) => setDraft({ ...draft, footer: { ...draft.footer, copyright: value } })} />
        </div>
      </Card>

      <Card title={t('Notifikasi e-mel', 'Email notifications')}>
        <div className="form-grid">
          <label className="checkbox-field full-span"><input type="checkbox" checked={draft.notifications.enabled} onChange={(event) => setDraft({ ...draft, notifications: { ...draft.notifications, enabled: event.target.checked } })} /> {t('Aktifkan notifikasi permohonan baharu selepas Edge Function disediakan', 'Enable new-application notifications after the Edge Function is configured')}</label>
          <Field label={t('Awalan subjek e-mel', 'Email subject prefix')}><input value={draft.notifications.subjectPrefix} onChange={(event) => setDraft({ ...draft, notifications: { ...draft.notifications, subjectPrefix: event.target.value } })} /></Field>
          <div className="full-span cms-info-note"><Icon name="mail" size={19} /><p>{t('Alamat penerima diambil secara automatik daripada profil yang mempunyai role admin. Rahsia API e-mel tidak disimpan dalam website.', 'Recipients are automatically taken from profiles with the admin role. The email API secret is never stored in the website.')}</p></div>
        </div>
      </Card>

      <div className="cms-sticky-save">
        <Button type="submit" disabled={busy}><Icon name="save" size={18} /> {busy ? t('Menyimpan…', 'Saving…') : t('Simpan semua tetapan', 'Save all settings')}</Button>
      </div>
    </form>
  )
}

export default SiteSettingsEditor
