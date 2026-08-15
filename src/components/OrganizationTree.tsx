import type { Language, OrganizationMember } from '../lib/types'
import { Icon } from './Icons'

interface TreeNode extends OrganizationMember {
  children: TreeNode[]
}

function buildExplicitTree(members: OrganizationMember[]): TreeNode[] {
  const nodes = new Map<string, TreeNode>()
  members.forEach((member) => nodes.set(member.id, { ...member, children: [] }))

  const roots: TreeNode[] = []
  nodes.forEach((node) => {
    if (node.parent_id && nodes.has(node.parent_id)) nodes.get(node.parent_id)?.children.push(node)
    else roots.push(node)
  })

  const sortNodes = (items: TreeNode[]) => {
    items.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    items.forEach((item) => sortNodes(item.children))
  }
  sortNodes(roots)
  return roots
}

function normalise(value?: string | null) {
  return (value || '').trim().toLocaleLowerCase('ms-MY')
}

function buildLegacyHierarchy(members: OrganizationMember[]): TreeNode[] {
  const sorted = [...members].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
  const treasurer = sorted.find((member) => {
    const position = normalise(member.position_bm)
    const positionEn = normalise(member.position_en)
    return (
      (position.includes('bendahari') && !position.includes('naib')) ||
      (positionEn.includes('treasurer') && !positionEn.includes('vice') && !positionEn.includes('deputy'))
    )
  })
  const deputy = sorted.find((member) => {
    const position = normalise(member.position_bm)
    const positionEn = normalise(member.position_en)
    return (
      position.includes('naib bendahari') ||
      positionEn.includes('vice treasurer') ||
      positionEn.includes('deputy treasurer')
    )
  })
  const leadershipIds = new Set([treasurer?.id, deputy?.id].filter(Boolean) as string[])
  const regularMembers = sorted.filter((member) => !leadershipIds.has(member.id))

  const unitGroups = new Map<string, OrganizationMember[]>()
  regularMembers.forEach((member) => {
    const unitName = (member.unit_bm || member.unit_en || '').trim() || 'Ahli PBAK'
    const key = normalise(unitName)
    const current = unitGroups.get(key) || []
    current.push(member)
    unitGroups.set(key, current)
  })

  const unitNodes: TreeNode[] = Array.from(unitGroups.entries()).map(([key, group], index) => {
    const first = group[0]
    const unitName = (first.unit_bm || first.unit_en || 'Ahli PBAK').trim()
    return {
      id: `virtual-unit-${key.replace(/[^a-z0-9]+/g, '-') || index + 1}`,
      parent_id: null,
      node_type: 'unit' as const,
      sort_order: Math.min(...group.map((member) => member.sort_order || 1)),
      name: unitName,
      position_bm: 'Unit',
      position_en: 'Unit',
      unit_bm: unitName,
      unit_en: first.unit_en || unitName,
      class_name: null,
      duties_bm: null,
      duties_en: null,
      photo_url: null,
      active: true,
      children: group.map((member): TreeNode => ({ ...member, node_type: 'member', children: [] })),
    }
  })

  if (deputy) {
    const deputyNode: TreeNode = { ...deputy, node_type: 'leadership', children: unitNodes }
    if (treasurer) {
      return [{ ...treasurer, node_type: 'leadership' as const, children: [deputyNode] }]
    }
    return [deputyNode]
  }

  if (treasurer) {
    return [{ ...treasurer, node_type: 'leadership' as const, children: unitNodes }]
  }

  return unitNodes.length > 0 ? unitNodes : sorted.map((member): TreeNode => ({ ...member, children: [] }))
}

function buildTree(members: OrganizationMember[]): TreeNode[] {
  const hasExplicitHierarchy = members.some((member) => Boolean(member.parent_id) || member.node_type === 'unit')
  return hasExplicitHierarchy ? buildExplicitTree(members) : buildLegacyHierarchy(members)
}

function nodeCopy(node: TreeNode, language: Language) {
  return {
    position: language === 'bm' ? node.position_bm : node.position_en || node.position_bm,
    unit: language === 'bm' ? node.unit_bm : node.unit_en || node.unit_bm,
    duties: language === 'bm' ? node.duties_bm : node.duties_en || node.duties_bm,
  }
}

function DesktopNodeCard({ node, language, depth }: { node: TreeNode; language: Language; depth: number }) {
  const { position, unit, duties } = nodeCopy(node, language)

  if (node.node_type === 'unit') {
    return (
      <article className="org-unit-node" data-depth={depth}>
        <span className="org-unit-icon"><Icon name="building" size={22} /></span>
        <small>UNIT</small>
        <h2>{node.name}</h2>
        {unit && unit.toLowerCase() !== node.name.toLowerCase() && <strong>{unit}</strong>}
        {duties && <p>{duties}</p>}
      </article>
    )
  }

  return (
    <article className={`org-person-node org-${node.node_type}`} data-depth={depth}>
      <div className="org-person-photo">
        {node.photo_url ? <img src={node.photo_url} alt={node.name} /> : <span>{node.name.charAt(0).toUpperCase()}</span>}
      </div>
      <div className="org-person-copy">
        <h2>{node.name}</h2>
        <strong>{position}</strong>
        {(unit || node.class_name) && (
          <div className="org-person-meta">
            {unit && <span>{unit}</span>}
            {node.class_name && <span>{node.class_name}</span>}
          </div>
        )}
        {duties && <p className="org-person-duties">{duties}</p>}
      </div>
    </article>
  )
}

function DesktopBranch({ node, language, depth }: { node: TreeNode; language: Language; depth: number }) {
  const childClass = node.children.some((child) => child.node_type === 'unit')
    ? ' org-unit-children'
    : node.children.some((child) => child.node_type === 'member')
      ? ' org-member-children'
      : ''

  return (
    <li className={`org-tree-branch org-branch-${node.node_type} org-tree-depth-${Math.min(depth, 4)}`}>
      <DesktopNodeCard node={node} language={language} depth={depth} />
      {node.children.length > 0 && (
        <ul className={`org-tree-children${childClass}`}>
          {node.children.map((child) => <DesktopBranch node={child} language={language} depth={depth + 1} key={child.id} />)}
        </ul>
      )}
    </li>
  )
}

function MobileNodeCard({ node, language }: { node: TreeNode; language: Language }) {
  const { position, unit, duties } = nodeCopy(node, language)

  if (node.node_type === 'unit') {
    return (
      <article className="org-mobile-node org-mobile-unit">
        <span className="org-mobile-unit-icon"><Icon name="building" size={19} /></span>
        <div className="org-mobile-node-copy">
          <small>UNIT</small>
          <h2>{node.name}</h2>
          {unit && unit.toLowerCase() !== node.name.toLowerCase() && <strong>{unit}</strong>}
          {duties && <p>{duties}</p>}
        </div>
      </article>
    )
  }

  return (
    <article className={`org-mobile-node org-mobile-${node.node_type}`}>
      <div className="org-mobile-photo">
        {node.photo_url ? <img src={node.photo_url} alt={node.name} /> : <span>{node.name.charAt(0).toUpperCase()}</span>}
      </div>
      <div className="org-mobile-node-copy">
        <h2>{node.name}</h2>
        <strong>{position}</strong>
        {(unit || node.class_name) && (
          <div className="org-mobile-meta">
            {unit && <span>{unit}</span>}
            {node.class_name && <span>{node.class_name}</span>}
          </div>
        )}
        {duties && <p>{duties}</p>}
      </div>
    </article>
  )
}

function MobileBranch({ node, language, depth }: { node: TreeNode; language: Language; depth: number }) {
  return (
    <div className={`org-mobile-branch org-mobile-depth-${Math.min(depth, 4)}`}>
      <MobileNodeCard node={node} language={language} />
      {node.children.length > 0 && (
        <div className="org-mobile-children">
          {node.children.map((child) => <MobileBranch node={child} language={language} depth={depth + 1} key={child.id} />)}
        </div>
      )}
    </div>
  )
}

export function OrganizationTree({ members, language }: { members: OrganizationMember[]; language: Language }) {
  const roots = buildTree(members)
  return (
    <>
      <div className="organization-tree-wrap organization-tree-desktop" aria-label={language === 'bm' ? 'Carta organisasi PBAK' : 'PBAK organisation chart'}>
        <ul className="organization-tree">
          {roots.map((node) => <DesktopBranch node={node} language={language} depth={0} key={node.id} />)}
        </ul>
      </div>

      <div className="organization-tree-mobile" aria-label={language === 'bm' ? 'Carta organisasi PBAK untuk telefon' : 'PBAK organisation chart for mobile'}>
        {roots.map((node) => <MobileBranch node={node} language={language} depth={0} key={node.id} />)}
      </div>
    </>
  )
}
