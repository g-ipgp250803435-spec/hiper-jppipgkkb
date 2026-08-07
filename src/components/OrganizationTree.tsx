import type { Language, OrganizationMember } from '../lib/types'
import { Icon } from './Icons'

interface TreeNode extends OrganizationMember {
  children: TreeNode[]
}

function buildTree(members: OrganizationMember[]) {
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

function NodeCard({ node, language, depth }: { node: TreeNode; language: Language; depth: number }) {
  const position = language === 'bm' ? node.position_bm : node.position_en || node.position_bm
  const unit = language === 'bm' ? node.unit_bm : node.unit_en || node.unit_bm
  const duties = language === 'bm' ? node.duties_bm : node.duties_en || node.duties_bm

  if (node.node_type === 'unit') {
    return (
      <article className="org-unit-node" data-depth={depth}>
        <span className="org-unit-icon"><Icon name="building" size={22} /></span>
        <small>{language === 'bm' ? 'UNIT' : 'UNIT'}</small>
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

function Branch({ node, language, depth }: { node: TreeNode; language: Language; depth: number }) {
  const childClass = node.children.some((child) => child.node_type === 'unit')
    ? ' org-unit-children'
    : node.children.some((child) => child.node_type === 'member')
      ? ' org-member-children'
      : ''

  return (
    <li className={`org-tree-branch org-branch-${node.node_type} org-tree-depth-${Math.min(depth, 4)}`}>
      <NodeCard node={node} language={language} depth={depth} />
      {node.children.length > 0 && (
        <ul className={`org-tree-children${childClass}`}>
          {node.children.map((child) => <Branch node={child} language={language} depth={depth + 1} key={child.id} />)}
        </ul>
      )}
    </li>
  )
}

export function OrganizationTree({ members, language }: { members: OrganizationMember[]; language: Language }) {
  const roots = buildTree(members)
  return (
    <div className="organization-tree-wrap">
      <ul className="organization-tree">
        {roots.map((node) => <Branch node={node} language={language} depth={0} key={node.id} />)}
      </ul>
    </div>
  )
}
