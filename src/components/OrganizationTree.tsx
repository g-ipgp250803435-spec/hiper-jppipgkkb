import { useState } from 'react'
import type { Language, OrganizationMember } from '../lib/types'
import { Icon } from './Icons'

function normalise(value?: string | null) {
  return (value || '').trim().toLowerCase()
}

interface OrganizationTreeProps {
  members: OrganizationMember[]
  language: Language
}

export function OrganizationTree({ members, language }: OrganizationTreeProps) {
  const [collapsedUnits, setCollapsedUnits] = useState<Record<string, boolean>>({})

  const activeMembers = members.filter((m) => m.active !== false)

  // Identify Leadership
  const bendahari = activeMembers.find(
    (m) =>
      m.node_type === 'leadership' &&
      (normalise(m.position_bm).includes('bendahari agung kehormat') && !normalise(m.position_bm).includes('naib'))
  ) || activeMembers.find((m) => m.node_type === 'leadership' && m.sort_order === 1)

  const naibBendahari = activeMembers.find(
    (m) =>
      m.node_type === 'leadership' &&
      normalise(m.position_bm).includes('naib bendahari agung kehormat')
  ) || activeMembers.find((m) => m.node_type === 'leadership' && m.id !== bendahari?.id)

  // Identify Units
  const unitNodes = activeMembers.filter((m) => m.node_type === 'unit')
  const knownUnitNames = ['Unit Perancangan & Kesatuan', 'Unit Data & Operasi', 'Unit Aset & Inventori']

  // Helper to find members belonging to a unit
  const getUnitMembers = (unitNode?: OrganizationMember, unitNameFallback?: string) => {
    return activeMembers.filter((m) => {
      if (m.node_type !== 'member') return false
      if (unitNode && m.parent_id === unitNode.id) return true
      const targetName = unitNode ? unitNode.name : unitNameFallback
      if (!targetName) return false
      const mUnit = m.unit_bm || m.unit_en || ''
      return normalise(mUnit).includes(normalise(targetName)) || normalise(targetName).includes(normalise(mUnit))
    }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name))
  }

  const toggleUnit = (unitId: string) => {
    setCollapsedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }))
  }

  const MemberCard = ({ member, highlight = false }: { member: OrganizationMember; highlight?: boolean }) => {
    const position = language === 'bm' ? member.position_bm : member.position_en || member.position_bm
    const unit = language === 'bm' ? member.unit_bm : member.unit_en || member.unit_bm
    const duties = language === 'bm' ? member.duties_bm : member.duties_en || member.duties_bm

    return (
      <div className={`org-corporate-card ${highlight ? 'highlight' : ''}`}>
        <div className="org-card-photo">
          {member.photo_url ? (
            <img src={member.photo_url} alt={member.name} />
          ) : (
            <div className="org-card-avatar">
              {member.name ? member.name.charAt(0).toUpperCase() : 'P'}
            </div>
          )}
        </div>
        <div className="org-card-body">
          <h3 className="org-card-name">{member.name}</h3>
          <p className="org-card-position">{position}</p>
          {unit && <p className="org-card-unit">{unit}</p>}
          {member.class_name && <p className="org-card-class">{member.class_name}</p>}
          {duties && <p className="org-card-duties">{duties}</p>}
        </div>
      </div>
    )
  }

  // Define standard units list if DB has explicit nodes or uses default fallbacks
  const unitsToRender = unitNodes.length > 0
    ? unitNodes
    : knownUnitNames.map((name, idx) => ({
        id: `default-unit-${idx}`,
        parent_id: naibBendahari?.id || null,
        node_type: 'unit' as const,
        sort_order: idx + 1,
        name,
        position_bm: 'Unit',
        position_en: 'Unit',
        unit_bm: name,
        unit_en: name,
        class_name: null,
        duties_bm: null,
        duties_en: null,
        photo_url: null,
        active: true,
      }))

  return (
    <div className="org-chart-corporate-container">
      {/* Top Leadership Hierarchy Level 1 */}
      {bendahari && (
        <div className="org-hierarchy-level level-top">
          <div className="org-level-label">{language === 'bm' ? 'KEPIMPUNAN UTAMA' : 'EXECUTIVE LEADERSHIP'}</div>
          <div className="org-node-wrapper">
            <MemberCard member={bendahari} highlight />
          </div>
        </div>
      )}

      {/* Connector Line 1 */}
      {bendahari && naibBendahari && <div className="org-tree-line vertical" />}

      {/* Leadership Hierarchy Level 2 */}
      {naibBendahari && (
        <div className="org-hierarchy-level level-deputy">
          <div className="org-node-wrapper">
            <MemberCard member={naibBendahari} highlight />
          </div>
        </div>
      )}

      {/* Connector Line 2 */}
      <div className="org-tree-line vertical" />

      {/* Horizontal Connector Line for Units */}
      <div className="org-units-connector-bar" />

      {/* Level 3: Units & Members Grid */}
      <div className="org-units-grid-scrollable">
        <div className="org-units-grid">
          {unitsToRender.map((unit) => {
            const unitMembers = getUnitMembers(unit, unit.name)
            const isCollapsed = !!collapsedUnits[unit.id]

            return (
              <div className="org-unit-column" key={unit.id}>
                {/* Connector line down to unit */}
                <div className="org-tree-line vertical-short" />

                {/* Unit Header Card */}
                <div className="org-unit-header-card">
                  <div className="org-unit-header-top">
                    <span className="org-unit-badge"><Icon name="building" size={16} /> UNIT</span>
                    <button
                      type="button"
                      className="org-unit-toggle-btn"
                      onClick={() => toggleUnit(unit.id)}
                      aria-label="Toggle section"
                    >
                      <Icon name={isCollapsed ? 'chevron-right' : 'chevron-down'} size={16} />
                    </button>
                  </div>
                  <h4 className="org-unit-title">{unit.name}</h4>
                  {unit.duties_bm && <p className="org-unit-desc">{language === 'bm' ? unit.duties_bm : unit.duties_en || unit.duties_bm}</p>}
                </div>

                {/* Unit Members List */}
                {!isCollapsed && (
                  <div className="org-unit-members-stack">
                    <div className="org-tree-line vertical-short" />
                    {unitMembers.length > 0 ? (
                      unitMembers.map((member) => (
                        <div key={member.id} className="org-member-node-wrapper">
                          <MemberCard member={member} />
                        </div>
                      ))
                    ) : (
                      <div className="org-member-empty">
                        <small>{language === 'bm' ? 'Tiada ahli berdaftar' : 'No members registered'}</small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
