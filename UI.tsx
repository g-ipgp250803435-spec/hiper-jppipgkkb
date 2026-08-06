import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useUi } from '../contexts/UiContext'
import { getStatusLabel } from '../lib/helpers'
import type { RequestStatus } from '../lib/types'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

export function Card({
  children,
  className = '',
  title,
  action,
}: {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
}) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || action) && (
        <div className="card-header">
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}) {
  return (
    <button className={`button button-${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}

export function StatusBadge({ status }: { status: RequestStatus | 'verified' }) {
  const { language } = useUi()
  return <span className={`status status-${status}`}>{getStatusLabel(status, language)}</span>
}

export function LoadingBlock({ label = 'Memuatkan…' }: { label?: string }) {
  return (
    <div className="loading-block" role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">◇</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  )
}

export function Notice({
  children,
  type = 'info',
}: {
  children: ReactNode
  type?: 'info' | 'success' | 'warning' | 'danger'
}) {
  return <div className={`notice notice-${type}`}>{children}</div>
}

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label} {required && <span aria-hidden="true">*</span>}
      </span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

export function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  )
}
