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
    id: 'lead-1', parent_id: null, node_type: 'leadership', sort_order: 1, name: 'Bendahari Agung Kehormat',
    position_bm: 'Bendahari Agung Kehormat', position_en: 'Honorary Treasurer General', unit_bm: null, unit_en: null,
    class_name: null, duties_bm: 'Memimpin dan menyelaras keseluruhan operasi PBAK.', duties_en: 'Leads and coordinates all PBAK operations.', photo_url: null, active: true,
  },
  {
    id: 'lead-2', parent_id: 'lead-1', node_type: 'leadership', sort_order: 1, name: 'Naib Bendahari Agung Kehormat',
    position_bm: 'Naib Bendahari Agung Kehormat', position_en: 'Deputy Honorary Treasurer General', unit_bm: null, unit_en: null,
    class_name: null, duties_bm: 'Menyokong tadbir urus dan pemantauan unit.', duties_en: 'Supports governance and unit oversight.', photo_url: null, active: true,
  },
  {
    id: 'unit-1', parent_id: 'lead-2', node_type: 'unit', sort_order: 1, name: 'Unit Kebajikan',
    position_bm: 'Unit', position_en: 'Unit', unit_bm: 'Kebajikan', unit_en: 'Welfare', class_name: null,
    duties_bm: 'Mengurus inisiatif iKES dan kebajikan siswa guru.', duties_en: 'Manages iKES and student teacher welfare initiatives.', photo_url: null, active: true,
  },
  {
    id: 'member-1', parent_id: 'unit-1', node_type: 'member', sort_order: 1, name: 'Ahli Unit Kebajikan',
    position_bm: 'Ahli', position_en: 'Member', unit_bm: 'Unit Kebajikan', unit_en: 'Welfare Unit', class_name: 'PISMP',
    duties_bm: 'Membantu pengurusan permohonan dan program.', duties_en: 'Supports application and programme management.', photo_url: null, active: true,
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
