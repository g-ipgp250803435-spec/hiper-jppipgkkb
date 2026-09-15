import { useEffect, useState } from 'react'
import { EmptyState, LoadingBlock, Notice, PageHeader } from '../components/UI'
import { OrganizationTree } from '../components/OrganizationTree'
import { useUi } from '../contexts/UiContext'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import { isSupabaseConfigured } from '../lib/config'
import { localise } from '../lib/siteSettings'
import { supabase } from '../lib/supabase'
import type { OrganizationMember } from '../lib/types'

const sampleMembers: OrganizationMember[] = [
  {
    id: 'lead-1',
    parent_id: null,
    node_type: 'leadership',
    sort_order: 1,
    name: 'Bendahari Agung Kehormat',
    position_bm: 'Bendahari Agung Kehormat',
    position_en: 'Honorary Treasurer General',
    unit_bm: 'Kepimpinan Utama',
    unit_en: 'Executive Leadership',
    class_name: 'PBAK IPG KKB',
    duties_bm: 'Memimpin dan menyelaras keseluruhan operasi perbendaharaan digital PBAK.',
    duties_en: 'Leads and coordinates overall digital treasury operations of PBAK.',
    photo_url: null,
    active: true,
  },
  {
    id: 'lead-2',
    parent_id: 'lead-1',
    node_type: 'leadership',
    sort_order: 2,
    name: 'Naib Bendahari Agung Kehormat',
    position_bm: 'Naib Bendahari Agung Kehormat',
    position_en: 'Deputy Honorary Treasurer General',
    unit_bm: 'Kepimpinan Utama',
    unit_en: 'Executive Leadership',
    class_name: 'PBAK IPG KKB',
    duties_bm: 'Menyokong tadbir urus perbendaharaan dan pemantauan ketiga-tiga unit utama.',
    duties_en: 'Supports treasury governance and oversight of the three core units.',
    photo_url: null,
    active: true,
  },
  {
    id: 'unit-1',
    parent_id: 'lead-2',
    node_type: 'unit',
    sort_order: 1,
    name: 'Unit Perancangan & Kesatuan',
    position_bm: 'Unit',
    position_en: 'Unit',
    unit_bm: 'Unit Perancangan & Kesatuan',
    unit_en: 'Planning & Union Unit',
    class_name: null,
    duties_bm: 'Perancangan strategik, kebajikan, program dan hal ehwal kesatuan.',
    duties_en: 'Strategic planning, welfare, programmes and union affairs.',
    photo_url: null,
    active: true,
  },
  {
    id: 'unit-2',
    parent_id: 'lead-2',
    node_type: 'unit',
    sort_order: 2,
    name: 'Unit Data & Operasi',
    position_bm: 'Unit',
    position_en: 'Unit',
    unit_bm: 'Unit Data & Operasi',
    unit_en: 'Data & Operations Unit',
    class_name: null,
    duties_bm: 'Pengurusan data digital, iKES, rekod kewangan dan laporan portal.',
    duties_en: 'Digital data management, iKES, financial records and portal analytics.',
    photo_url: null,
    active: true,
  },
  {
    id: 'unit-3',
    parent_id: 'lead-2',
    node_type: 'unit',
    sort_order: 3,
    name: 'Unit Aset & Inventori',
    position_bm: 'Unit',
    position_en: 'Unit',
    unit_bm: 'Unit Aset & Inventori',
    unit_en: 'Asset & Inventory Unit',
    class_name: null,
    duties_bm: 'Pengurusan e-Aset, kawalan stok, inventori dan peralatan perbendaharaan.',
    duties_en: 'e-Asset management, stock control, inventory and equipment handling.',
    photo_url: null,
    active: true,
  },
]

export default function OfficePage() {
  const { language, t } = useUi()
  const { settings } = useSiteSettings()
  const [members, setMembers] = useState<OrganizationMember[]>(isSupabaseConfigured ? [] : sampleMembers)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select('*')
          .eq('active', true)
          .order('sort_order')

        if (error) {
          setLoadError(error.message)
          setMembers([])
        } else {
          setLoadError(null)
          setMembers((data as OrganizationMember[]) || [])
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : t('Carta organisasi gagal dimuatkan.', 'Organisation chart could not be loaded.'))
        setMembers([])
      } finally {
        setLoading(false)
      }
    }
    void fetchMembers()
  }, [])

  return (
    <section className="section page-intro-section office-page-section">
      <div className="container">
        <PageHeader
          eyebrow={localise(settings.pages.office.eyebrow, language)}
          title={localise(settings.pages.office.title, language)}
          description={localise(settings.pages.office.description, language)}
        />
        {loadError && <Notice type="danger">{loadError}</Notice>}
        {loading ? (
          <LoadingBlock />
        ) : members.length === 0 ? (
          <EmptyState title={t('Carta organisasi belum ditambah', 'Organisation chart has not been added')} />
        ) : (
          <OrganizationTree members={members} language={language} />
        )}
      </div>
    </section>
  )
}
