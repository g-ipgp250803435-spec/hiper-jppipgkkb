import { useEffect, useState } from 'react'
import { Card, EmptyState, LoadingBlock, PageHeader } from '../components/UI'
import { useUi } from '../contexts/UiContext'
import { isSupabaseConfigured } from '../lib/config'
import { supabase } from '../lib/supabase'
import type { OrganizationMember } from '../lib/types'

const sampleMembers: OrganizationMember[] = [
  {
    id: 'sample-1',
    sort_order: 1,
    name: 'Nama Pegawai',
    position_bm: 'Bendahari Agung Kehormat',
    position_en: 'Honorary Treasurer General',
    unit_bm: 'Pentadbiran',
    unit_en: 'Administration',
    class_name: 'Kelas',
    duties_bm: 'Gantikan maklumat ini melalui panel pentadbir.',
    duties_en: 'Replace this information through the admin panel.',
    photo_url: null,
    active: true,
  },
]

export default function OfficePage() {
  const { language, t } = useUi()
  const [members, setMembers] = useState<OrganizationMember[]>(sampleMembers)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void supabase
      .from('organization_members')
      .select('*')
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => {
        setMembers((data as OrganizationMember[]) || [])
        setLoading(false)
      })
  }, [])

  return (
    <section className="section">
      <div className="container">
        <PageHeader
          eyebrow={t('KENALI KAMI', 'MEET THE TEAM')}
          title={t('Pejabat Bendahari Agung Kehormat', 'Office of the Honorary Treasurer General')}
          description={t('Carta organisasi, unit dan bidang tugas warga PBAK.', 'Organisation, units and responsibilities of the PBAK team.')}
        />
        {loading ? (
          <LoadingBlock />
        ) : members.length === 0 ? (
          <EmptyState title={t('Carta organisasi belum ditambah', 'Organisation chart has not been added')} />
        ) : (
          <div className="people-grid">
            {members.map((member) => (
              <Card className="person-card" key={member.id}>
                <div className="person-photo">
                  {member.photo_url ? <img src={member.photo_url} alt={member.name} /> : <span>{member.name.charAt(0)}</span>}
                </div>
                <h2>{member.name}</h2>
                <strong>{language === 'bm' ? member.position_bm : member.position_en || member.position_bm}</strong>
                <div className="person-meta">
                  {member.unit_bm && <span>{language === 'bm' ? member.unit_bm : member.unit_en || member.unit_bm}</span>}
                  {member.class_name && <span>{member.class_name}</span>}
                </div>
                {(member.duties_bm || member.duties_en) && (
                  <p>{language === 'bm' ? member.duties_bm : member.duties_en || member.duties_bm}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
