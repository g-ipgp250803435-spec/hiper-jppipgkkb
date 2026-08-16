import type { Language, OrganizationMember } from '../lib/types'
import { Icon } from './Icons'

interface TreeNode extends OrganizationMember {
  children: TreeNode[]
}

function normalise(value?: string | null) {
  return (value || '').trim().toLowerCase()
}

export function buildTree(members: OrganizationMember[]): TreeNode[] {
  if (!members || members.length === 0) return []

  const activeMembers = members.filter((m) => m.active !== false)
  const sorted = [...activeMembers].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name))

  const nodeMap = new Map<string, TreeNode>()
  sorted.forEach((member) => {
    nodeMap.set(member.id, { ...member, children: [] })
  })

  const rootLeadershipNodes: TreeNode[] = []
  const orphanUnits: TreeNode[] = []
  const orphanMembers: TreeNode[] = []

  // First pass: Link explicit parent_id relationships
  nodeMap.forEach((node) => {
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      const parent = nodeMap.get(node.parent_id)!
      if (!parent.children.some((child) => child.id === node.id)) {
        parent.children.push(node)
      }
    } else {
      if (node.node_type === 'leadership') {
        rootLeadershipNodes.push(node)
      } else if (node.node_type === 'unit') {
        orphanUnits.push(node)
      } else {
        orphanMembers.push(node)
      }
    }
  })

  // Find target leadership node to connect units
  let targetLeadershipNode: TreeNode | null = null
  if (rootLeadershipNodes.length > 0) {
    let current = rootLeadershipNodes[rootLeadershipNodes.length - 1]
    while (current.children.some((c) => c.node_type === 'leadership')) {
      current = current.children.find((c) => c.node_type === 'leadership')!
    }
    targetLeadershipNode = current
  }

  // Find existing unit nodes map
  const existingUnitsMap = new Map<string, TreeNode>()
  nodeMap.forEach((node) => {
    if (node.node_type === 'unit') {
      const unitKey = normalise(node.unit_bm || node.name)
      if (unitKey) existingUnitsMap.set(unitKey, node)
    }
  })

  // Link orphan units to leadership
  orphanUnits.forEach((unitNode) => {
    if (targetLeadershipNode) {
      if (!targetLeadershipNode.children.some((c) => c.id === unitNode.id)) {
        targetLeadershipNode.children.push(unitNode)
      }
    } else {
      if (!rootLeadershipNodes.some((r) => r.id === unitNode.id)) {
        rootLeadershipNodes.push(unitNode)
      }
    }
  })

  // Link orphan members to appropriate unit
  orphanMembers.forEach((memberNode) => {
    const unitName = (memberNode.unit_bm || memberNode.unit_en || 'Ahli PBAK').trim()
    const unitKey = normalise(unitName)

    let targetUnit = existingUnitsMap.get(unitKey)
    if (!targetUnit) {
      targetUnit = {
        id: `virtual-unit-${unitKey.replace(/[^a-z0-9]+/g, '-') || 'default'}`,
        parent_id: targetLeadershipNode?.id || null,
        node_type: 'unit',
        sort_order: 99,
        name: unitName,
        position_bm: 'Unit',
        position_en: 'Unit',
        unit_bm: unitName,
        unit_en: memberNode.unit_en || unitName,
        class_name: null,
        duties_bm: null,
        duties_en: null,
        photo_url: null,
        active: true,
        children: [],
      }
      existingUnitsMap.set(unitKey, targetUnit)
      if (targetLeadershipNode) {
        targetLeadershipNode.children.push(targetUnit)
      } else {
        rootLeadershipNodes.push(targetUnit)
      }
    }
    if (!targetUnit.children.some((c) => c.id === memberNode.id)) {
      targetUnit.children.push(memberNode)
    }
  })

  // Sort nodes recursively
  const sortTreeNodes = (items: TreeNode[]) => {
    items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name))
    items.forEach((item) => sortTreeNodes(item.children))
  }

  const finalRoots = rootLeadershipNodes.length > 0 ? rootLeadershipNodes : Array.from(existingUnitsMap.values())
  sortTreeNodes(finalRoots)
  return finalRoots
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
