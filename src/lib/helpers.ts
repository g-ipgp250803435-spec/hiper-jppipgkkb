import type { SupabaseClient } from '@supabase/supabase-js'
import type { Language, RequestStatus } from './types'

export const formatMoney = (value: number | string | null | undefined) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export const formatDate = (value: string | null | undefined, language: Language = 'bm') => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(language === 'bm' ? 'ms-MY' : 'en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export const formatDateTime = (value: string | null | undefined, language: Language = 'bm') => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(language === 'bm' ? 'ms-MY' : 'en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const getStatusLabel = (status: RequestStatus | DonationStatus, language: Language) => {
  const labels: Record<string, [string, string]> = {
    pending: ['Menunggu', 'Pending'],
    approved: ['Diluluskan', 'Approved'],
    rejected: ['Ditolak', 'Rejected'],
    cancelled: ['Dibatalkan', 'Cancelled'],
    completed: ['Selesai', 'Completed'],
    verified: ['Disahkan', 'Verified'],
  }
  const pair = labels[status] || [status, status]
  return language === 'bm' ? pair[0] : pair[1]
}

type DonationStatus = 'pending' | 'verified' | 'rejected'

export const safeFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const PUBLIC_MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'])
const PRIVATE_FILE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])

function validateUpload(file: File, allowedTypes: Set<string>, maxBytes: number, label: string) {
  if (!allowedTypes.has(file.type)) throw new Error(`${label}: jenis fail tidak dibenarkan.`)
  if (file.size <= 0 || file.size > maxBytes) throw new Error(`${label}: saiz fail melebihi had ${Math.round(maxBytes / 1024 / 1024)}MB.`)
}

function safeExtension(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')
  return extension || (file.type === 'application/pdf' ? 'pdf' : 'file')
}

export const uploadPublicFile = async (
  supabaseClient: SupabaseClient,
  file: File,
  folder: string,
) => {
  validateUpload(file, PUBLIC_MEDIA_TYPES, 5 * 1024 * 1024, 'Media awam')
  const extension = safeExtension(file)
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`
  const { error } = await supabaseClient.storage.from('public-media').upload(path, file, {
    upsert: false,
    cacheControl: '3600',
  })
  if (error) throw error
  const { data } = supabaseClient.storage.from('public-media').getPublicUrl(path)
  return data.publicUrl
}

export const uploadPrivateFile = async (
  supabaseClient: SupabaseClient,
  userId: string,
  file: File,
  folder: string,
) => {
  validateUpload(file, PRIVATE_FILE_TYPES, 10 * 1024 * 1024, 'Dokumen permohonan')
  const extension = safeExtension(file)
  const path = `${userId}/${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`
  const { error } = await supabaseClient.storage.from('application-files').upload(path, file, {
    upsert: false,
    cacheControl: '3600',
  })
  if (error) throw error
  return path
}

export const openPrivateFile = async (
  supabaseClient: SupabaseClient,
  path: string,
) => {
  const { data, error } = await supabaseClient.storage
    .from('application-files')
    .createSignedUrl(path, 120)
  if (error) throw error
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
}

export const getErrorMessage = (
  error: unknown,
  fallback = 'Tindakan tidak dapat diselesaikan.',
) => {
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    const code = typeof record.code === 'string' ? record.code.trim() : ''

    if (code === '23503') {
      return 'Rekod ini tidak boleh dipadam kerana terdapat rekod lain yang berkait kepadanya.'
    }

    const message = typeof record.message === 'string' ? record.message.trim() : ''
    const details = typeof record.details === 'string' ? record.details.trim() : ''
    const hint = typeof record.hint === 'string' ? record.hint.trim() : ''

    const parts = [message, details, hint].filter(Boolean)
    if (parts.length > 0) return `${parts.join(' — ')}${code ? ` (${code})` : ''}`
  }

  if (error instanceof Error && error.message.trim()) return error.message

  return fallback
}

export const isPremiumSchemaMissingError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false
  const record = error as Record<string, unknown>
  const code = typeof record.code === 'string' ? record.code : ''
  const message = typeof record.message === 'string' ? record.message.toLowerCase() : ''

  return (
    code === '42P01' ||
    code === '42703' ||
    code === 'PGRST204' ||
    message.includes('site_settings') ||
    message.includes('parent_id') ||
    message.includes('node_type') ||
    message.includes('asset_code') ||
    message.includes('category_bm') ||
    message.includes('sort_order')
  )
}
