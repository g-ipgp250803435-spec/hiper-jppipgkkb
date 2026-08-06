import { useEffect, useRef, type MouseEvent } from 'react'
import { Icon } from './Icons'

const allowedTags = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'UL', 'OL', 'LI'])

function sanitiseNode(node: Node) {
  Array.from(node.childNodes).forEach((child) => sanitiseNode(child))

  if (!(node instanceof Element)) return

  if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM'].includes(node.tagName)) {
    node.remove()
    return
  }

  if (!allowedTags.has(node.tagName)) {
    const fragment = document.createDocumentFragment()
    while (node.firstChild) fragment.appendChild(node.firstChild)
    node.replaceWith(fragment)
    return
  }

  Array.from(node.attributes).forEach((attribute) => node.removeAttribute(attribute.name))
}

export function sanitiseRichHtml(value: string | null | undefined) {
  if (!value) return ''
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return value

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(value)
  const source = looksLikeHtml
    ? value
    : value
        .split(/\n{2,}/)
        .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('')

  const documentValue = new DOMParser().parseFromString(`<div>${source}</div>`, 'text/html')
  const root = documentValue.body.firstElementChild
  if (!root) return ''
  Array.from(root.childNodes).forEach((child) => sanitiseNode(child))
  return root.innerHTML
}

export function richTextToPlainText(value: string | null | undefined) {
  if (!value) return ''
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const parsed = new DOMParser().parseFromString(`<div>${sanitiseRichHtml(value)}</div>`, 'text/html')
  return (parsed.body.textContent || '').replace(/\s+/g, ' ').trim()
}

export function RichTextContent({ html, className = '' }: { html: string | null | undefined; className?: string }) {
  return <div className={`rich-text-content ${className}`.trim()} dangerouslySetInnerHTML={{ __html: sanitiseRichHtml(html) }} />
}

type Command = 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList' | 'undo' | 'redo'

export function RichTextEditor({
  value,
  onChange,
  label,
  ariaLabel,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  label?: string
  ariaLabel?: string
  placeholder?: string
}) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const nextValue = sanitiseRichHtml(value)
    if (editor.innerHTML !== nextValue) editor.innerHTML = nextValue
  }, [value])

  const runCommand = (event: MouseEvent<HTMLButtonElement>, command: Command) => {
    event.preventDefault()
    editorRef.current?.focus()
    document.execCommand(command)
    onChange(sanitiseRichHtml(editorRef.current?.innerHTML || ''))
  }

  const accessibleLabel = ariaLabel || label || 'Rich text editor'

  return (
    <div className="rich-editor-field">
      {label && <span className="field-label">{label}</span>}
      <div className="rich-editor-shell">
        <div className="rich-editor-toolbar" role="toolbar" aria-label={`${accessibleLabel} formatting`}>
          <button type="button" onMouseDown={(event) => runCommand(event, 'bold')} aria-label="Bold" title="Bold">
            <Icon name="bold" size={17} />
          </button>
          <button type="button" onMouseDown={(event) => runCommand(event, 'italic')} aria-label="Italic" title="Italic">
            <Icon name="italic" size={17} />
          </button>
          <span className="rich-editor-divider" />
          <button type="button" onMouseDown={(event) => runCommand(event, 'insertUnorderedList')} aria-label="Bulleted list" title="Bulleted list">
            <Icon name="list" size={18} />
          </button>
          <button type="button" onMouseDown={(event) => runCommand(event, 'insertOrderedList')} aria-label="Numbered list" title="Numbered list">
            <Icon name="list-ordered" size={18} />
          </button>
          <span className="rich-editor-divider" />
          <button type="button" onMouseDown={(event) => runCommand(event, 'undo')} aria-label="Undo" title="Undo">
            <Icon name="undo" size={17} />
          </button>
          <button type="button" onMouseDown={(event) => runCommand(event, 'redo')} aria-label="Redo" title="Redo">
            <Icon name="redo" size={17} />
          </button>
        </div>
        <div
          ref={editorRef}
          className="rich-editor-area"
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label={accessibleLabel}
          data-placeholder={placeholder || ''}
          suppressContentEditableWarning
          onInput={(event) => onChange(sanitiseRichHtml(event.currentTarget.innerHTML))}
          onBlur={(event) => onChange(sanitiseRichHtml(event.currentTarget.innerHTML))}
        />
      </div>
    </div>
  )
}
