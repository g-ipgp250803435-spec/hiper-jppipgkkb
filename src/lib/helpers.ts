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
    timeZone: 'Asia/Kuala_Lumpur',
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
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(date)
}

export const formatTimeAgo = (value: string | null | undefined, language: Language = 'bm') => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (diffMinutes < 1) return language === 'bm' ? 'Baru sahaja' : 'Just now'
  if (diffMinutes < 60) return language === 'bm' ? `${diffMinutes} minit lalu` : `${diffMinutes} mins ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return language === 'bm' ? `${diffHours} jam lalu` : `${diffHours} hours ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return language === 'bm' ? `${diffDays} hari lalu` : `${diffDays} days ago`
  return formatDate(value, language)
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

export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return '#'
  const trimmed = url.trim()
  const lower = trimmed.toLowerCase()
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return '#'
  }
  return trimmed
}

const PUBLIC_MEDIA_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
])

const PRIVATE_FILE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
])

function validateUpload(file: File, allowedTypes: Set<string>, maxBytes: number, label: string) {
  if (!allowedTypes.has(file.type)) {
    throw new Error(`${label}: jenis fail tidak dibenarkan. Hanya imej PNG/JPG/WEBP atau dokumen PDF disokong.`)
  }
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error(`${label}: saiz fail melebihi had ${Math.round(maxBytes / 1024 / 1024)}MB.`)
  }
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
  maxBytes = 10 * 1024 * 1024
) => {
  validateUpload(file, PRIVATE_FILE_TYPES, maxBytes, 'Dokumen permohonan')
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

export const formatTime12Hour = (time24: string | null | undefined): string => {
  if (!time24) return '—'
  if (time24.includes('AM') || time24.includes('PM')) return time24
  const [hStr, mStr] = time24.split(':')
  const hours = parseInt(hStr, 10)
  const minutes = parseInt(mStr || '0', 10)
  if (isNaN(hours)) return time24
  const period = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 || 12
  return `${h12}:${String(minutes).padStart(2, '0')} ${period}`
}

export const timeToMinutes = (timeStr: string | null | undefined): number => {
  if (!timeStr) return 0
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (match) {
      let h = parseInt(match[1], 10)
      const m = parseInt(match[2], 10)
      const p = match[3].toUpperCase()
      if (p === 'PM' && h < 12) h += 12
      if (p === 'AM' && h === 12) h = 0
      return h * 60 + m
    }
  }
  const [hStr, mStr] = timeStr.split(':')
  const h = parseInt(hStr, 10) || 0
  const m = parseInt(mStr, 10) || 0
  return h * 60 + m
}

export const checkTimeOverlap = (
  start1: string,
  end1: string,
  start2: string | null | undefined,
  end2: string | null | undefined
): boolean => {
  if (!start2 || !end2) return true
  const s1 = timeToMinutes(start1)
  const e1 = timeToMinutes(end1)
  const s2 = timeToMinutes(start2)
  const e2 = timeToMinutes(end2)
  return !(e1 <= s2 || s1 >= e2)
}

export const convertHtmlToWhatsAppText = (html: string | null | undefined): string => {
  if (!html) return ''

  let text = html

  // 1. Convert headers to bold
  text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '*$1*\n\n')

  // 2. Convert bold tags
  text = text.replace(/<(?:b|strong)[^>]*>(.*?)<\/(?:b|strong)>/gi, '*$1*')

  // 3. Convert italic tags
  text = text.replace(/<(?:i|em)[^>]*>(.*?)<\/(?:i|em)>/gi, '_$1_')

  // 4. Convert list items
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')

  // 5. Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n')

  // 6. Convert paragraph and div end tags to double newlines
  text = text.replace(/<\/(?:p|div)>/gi, '\n\n')

  // 7. Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '')

  // 8. Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")

  // 9. Trim excess space and format newlines
  return text
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
