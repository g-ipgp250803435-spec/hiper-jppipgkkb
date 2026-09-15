import { supabase } from '../supabase'
import type { NotificationType } from '../types'

export async function createNotification(
  recipientId: string | null,
  title: string,
  message: string,
  notificationType: NotificationType,
  referenceId: string | null = null
) {
  try {
    const { data, error } = await supabase.from('notifications').insert({
      recipient_id: recipientId,
      title,
      message,
      notification_type: notificationType,
      reference_id: referenceId,
      is_read: false,
    }).select().single()

    if (error) {
      console.warn('Notification insert failed:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('Notification error:', err)
    return null
  }
}

export async function notifyAdmins(
  title: string,
  message: string,
  notificationType: NotificationType,
  referenceId: string | null = null
) {
  return createNotification(null, title, message, notificationType, referenceId)
}

export async function notifyUser(
  userId: string,
  title: string,
  message: string,
  notificationType: NotificationType,
  referenceId: string | null = null
) {
  return createNotification(userId, title, message, notificationType, referenceId)
}
