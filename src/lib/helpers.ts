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
  return new Intl.DateTimeFormat(language === 'bm' ? 'ms-MY' : 'en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export const formatDateTime = (value: string | null | undefined, language: Language = 'bm') => {
  if (!value) return '—'
  return new Intl.DateTimeFormat(language === 'bm' ? 'ms-MY' : 'en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
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

export const uploadPublicFile = async (
  supabaseClient: SupabaseClient,
  file: File,
  folder: string,
) => {
  const extension = file.name.split('.').pop() || 'file'
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
  const extension = file.name.split('.').pop() || 'file'
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
