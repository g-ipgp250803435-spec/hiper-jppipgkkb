import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, LoadingBlock, Notice, PageHeader } from '../components/UI'
import { Icon } from '../components/Icons'
import { useUi } from '../contexts/UiContext'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured } from '../lib/config'
import { supabase } from '../lib/supabase'
import type {
  CmsPage,
  CmsPageBlock,
  RichTextBlockContent,
  ImageBlockContent,
  ButtonBlockContent,
  LinkBlockContent,
  GalleryBlockContent,
  SpacerBlockContent,
} from '../lib/types'

export default function DynamicPage() {
  const { slug } = useParams<{ slug: string }>()
  const { language, t } = useUi()
  const { isAdmin } = useAuth()

  const [page, setPage] = useState<CmsPage | null>(null)
  const [blocks, setBlocks] = useState<CmsPageBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function loadCmsPage() {
      if (!slug) return
      setLoading(true)
      setNotFound(false)

      if (!isSupabaseConfigured) {
        // Fallback mock data for offline/demo mode
        if (slug === 'dasar-privasi') {
          setPage({
            id: 'mock-cms-1',
            title_bm: 'Dasar Privasi',
            title_en: 'Privacy Policy',
            slug: 'dasar-privasi',
            description_bm: 'Dasar privasi dan perlindungan data bagi Hab Perbendaharaan Digital (HiPER) JPP IPG Kampus Kota Bharu.',
            description_en: 'Privacy policy and data protection for Digital Treasury Hub (HiPER) JPP IPG Kampus Kota Bharu.',
            status: 'published',
            is_public: true,
            show_in_navigation: false,
            navigation_order: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          setBlocks([
            {
              id: 'b1',
              page_id: 'mock-cms-1',
              block_type: 'rich_text',
              content: {
                heading_bm: '1. Pengenalan',
                heading_en: '1. Introduction',
                body_bm: 'Hab Perbendaharaan Digital (HiPER) dikendalikan oleh Pejabat Bendahari Agung Kehormat JPP IPG Kampus Kota Bharu. Kami komited untuk melindungi privasi dan keselamatan maklumat peribadi siswa guru, staf dan pengguna portal ini.',
                body_en: 'The Digital Treasury Hub (HiPER) is managed by the Office of the Honorary Treasurer General JPP IPG Kampus Kota Bharu. We are committed to protecting privacy and security.',
              },
              display_order: 1,
            },
            {
              id: 'b2',
              page_id: 'mock-cms-1',
              block_type: 'rich_text',
              content: {
                heading_bm: '2. Pengumpulan Maklumat',
                heading_en: '2. Collection of Information',
                body_bm: 'Kami mengumpul maklumat yang anda berikan secara langsung apabila membuat permohonan e-Aset, iKES, KPK+, dan tempahan bilik.',
                body_en: 'We collect information directly provided when applying for e-Asset, iKES, KPK+, and room bookings.',
              },
              display_order: 2,
            },
            {
              id: 'b3',
              page_id: 'mock-cms-1',
              block_type: 'rich_text',
              content: {
                heading_bm: '3. Penggunaan Maklumat',
                heading_en: '3. Use of Information',
                body_bm: 'Maklumat digunakan khusus untuk memproses permohonan, penghantaran notifikasi, dan rekod audit kewangan PBAK.',
                body_en: 'Information is used exclusively for application processing, notifications, and PBAK financial audits.',
              },
              display_order: 3,
            },
            {
              id: 'b4',
              page_id: 'mock-cms-1',
              block_type: 'rich_text',
              content: {
                heading_bm: '4. Perlindungan Data',
                heading_en: '4. Data Protection',
                body_bm: 'Kawalan keselamatan data berasaskan peranan (RBAC) dan penyulitan SSL/TLS dilaksanakan.',
                body_en: 'Role-Based Access Control (RBAC) and SSL/TLS encryption are enforced.',
              },
              display_order: 4,
            },
            {
              id: 'b5',
              page_id: 'mock-cms-1',
              block_type: 'rich_text',
              content: {
                heading_bm: '5. Hak Pengguna',
                heading_en: '5. User Rights',
                body_bm: 'Pengguna berhak menyemak dan mengemaskini profil pada bila-bila masa melalui Portal Permohonan Saya.',
                body_en: 'Users have the right to review and update profile at any time via My Applications Portal.',
              },
              display_order: 5,
            },
            {
              id: 'b6',
              page_id: 'mock-cms-1',
              block_type: 'rich_text',
              content: {
                heading_bm: '6. Hubungan',
                heading_en: '6. Contact',
                body_bm: 'Pertanyaan boleh dikemukakan ke e-mel rasmi: jppipgkkb.rasmi@ipg.edu.my.',
                body_en: 'Inquiries can be sent to official email: jppipgkkb.rasmi@ipg.edu.my.',
              },
              display_order: 6,
            },
          ])
        } else {
          setNotFound(true)
        }
        setLoading(false)
        return
      }

      try {
        const { data: pageData, error: pageError } = await supabase
          .from('cms_pages')
          .select('*')
          .eq('slug', slug)
          .maybeSingle()

        if (pageError || !pageData) {
          setNotFound(true)
          setLoading(false)
          return
        }

        const pageRec = pageData as CmsPage
        if (pageRec.status !== 'published' && !isAdmin) {
          setNotFound(true)
          setLoading(false)
          return
        }

        setPage(pageRec)

        const { data: blockData, error: blockError } = await supabase
          .from('cms_page_blocks')
          .select('*')
          .eq('page_id', pageRec.id)
          .order('display_order', { ascending: true })

        if (!blockError && blockData) {
          setBlocks(blockData as CmsPageBlock[])
        }
      } catch (err) {
        console.error('Error loading CMS page:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    void loadCmsPage()
  }, [slug, isAdmin])

  if (loading) {
    return (
      <section className="section">
        <div className="container narrow-container">
          <LoadingBlock label={t('Memuatkan halaman...', 'Loading page...')} />
        </div>
      </section>
    )
  }

  if (notFound || !page) {
    return (
      <section className="section">
        <div className="container narrow-container">
          <Card>
            <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <span className="empty-icon">404</span>
              <h1>{t('Halaman tidak ditemui', 'Page not found')}</h1>
              <p style={{ color: 'var(--ink-soft)' }}>
                {t('Halaman yang anda cari tidak wujud atau belum diterbitkan.', 'The page you are looking for does not exist or has not been published.')}
              </p>
              <Link className="button button-primary" to="/" style={{ marginTop: '16px' }}>
                {t('Kembali ke utama', 'Return home')}
              </Link>
            </div>
          </Card>
        </div>
      </section>
    )
  }

  const pageTitle = language === 'bm' ? page.title_bm : page.title_en || page.title_bm
  const pageDescription = language === 'bm' ? page.description_bm : page.description_en || page.description_bm

  return (
    <section className="section cms-page-section">
      <div className="container narrow-container">
        {page.status !== 'published' && (
          <div style={{ marginBottom: '16px' }}>
            <Notice type="warning">
              <strong>{t('MOD DRAF/PENTADBIR:', 'DRAFT/ADMIN MODE:')}</strong> {t('Halaman ini belum diterbitkan secara awam.', 'This page is not publicly published yet.')}
            </Notice>
          </div>
        )}

        <PageHeader
          eyebrow={t('HALAMAN RASMI', 'OFFICIAL PAGE')}
          title={pageTitle}
          description={pageDescription || undefined}
        />

        <div className="cms-page-content" style={{ display: 'grid', gap: '24px' }}>
          {blocks.map((block) => {
            // 1. RICH TEXT BLOCK
            if (block.block_type === 'rich_text') {
              const c = block.content as RichTextBlockContent
              const heading = language === 'bm' ? c.heading_bm : c.heading_en || c.heading_bm
              const body = language === 'bm' ? c.body_bm : c.body_en || c.body_bm

              return (
                <Card key={block.id} className="cms-block-card">
                  {heading && <h3 style={{ marginTop: 0, marginBottom: '12px', color: 'var(--brand-primary)' }}>{heading}</h3>}
                  {body && <p style={{ margin: 0, lineHeight: '1.7', whiteSpace: 'pre-line' }}>{body}</p>}
                </Card>
              )
            }

            // 2. IMAGE BLOCK
            if (block.block_type === 'image') {
              const c = block.content as ImageBlockContent
              if (!c.image_url) return null
              const caption = language === 'bm' ? c.caption_bm : c.caption_en || c.caption_bm
              const align = c.alignment || 'center'
              const size = c.size || 'full'

              const widthMap = { small: '350px', medium: '600px', full: '100%' }

              return (
                <div key={block.id} style={{ textAlign: align, margin: '10px 0' }}>
                  <img
                    src={c.image_url}
                    alt={caption || ''}
                    style={{
                      maxWidth: widthMap[size],
                      width: '100%',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-sm)',
                      border: '1px solid var(--line)',
                    }}
                  />
                  {caption && <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '8px' }}>{caption}</p>}
                </div>
              )
            }

            // 3. BUTTON BLOCK
            if (block.block_type === 'button') {
              const c = block.content as ButtonBlockContent
              if (!c.url) return null
              const label = language === 'bm' ? c.label_bm : c.label_en || c.label_bm
              const variantClass = c.variant === 'gold' ? 'button-gold' : c.variant === 'secondary' ? 'button-secondary' : c.variant === 'outline' ? 'button-ghost' : 'button-primary'

              return (
                <div key={block.id} style={{ margin: '12px 0' }}>
                  <a
                    href={c.url}
                    target={c.open_new_tab ? '_blank' : '_self'}
                    rel={c.open_new_tab ? 'noreferrer' : undefined}
                    className={`button ${variantClass}`}
                  >
                    {label || t('Klik di sini', 'Click here')} <Icon name="chevron-right" size={16} />
                  </a>
                </div>
              )
            }

            // 4. LINK BLOCK
            if (block.block_type === 'link') {
              const c = block.content as LinkBlockContent
              if (!c.url) return null
              const title = language === 'bm' ? c.title_bm : c.title_en || c.title_bm
              const desc = language === 'bm' ? c.description_bm : c.description_en || c.description_bm

              return (
                <Card key={block.id} className="cms-block-card">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--brand-primary)', display: 'block' }}>{title}</strong>
                      {desc && <span style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>{desc}</span>}
                    </div>
                    <Icon name="external-link" size={20} />
                  </a>
                </Card>
              )
            }

            // 5. GALLERY BLOCK
            if (block.block_type === 'gallery') {
              const c = block.content as GalleryBlockContent
              const items = c.items || []
              if (items.length === 0) return null

              return (
                <div key={block.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', margin: '16px 0' }}>
                  {items.map((img) => {
                    const caption = language === 'bm' ? img.caption_bm : img.caption_en || img.caption_bm
                    return (
                      <div key={img.id} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--line)', background: 'var(--surface)' }}>
                        <img src={img.image_url} alt={caption || ''} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                        {caption && <div style={{ padding: '8px 12px', fontSize: '0.82rem', color: 'var(--ink-soft)' }}>{caption}</div>}
                      </div>
                    )
                  })}
                </div>
              )
            }

            // 6. SPACER BLOCK
            if (block.block_type === 'spacer') {
              const c = block.content as SpacerBlockContent
              const height = c.height_px || 24
              const showLine = c.show_line ?? true

              return (
                <div key={block.id} style={{ padding: `${height / 2}px 0` }}>
                  {showLine && <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: 0 }} />}
                </div>
              )
            }

            return null
          })}
        </div>
      </div>
    </section>
  )
}
