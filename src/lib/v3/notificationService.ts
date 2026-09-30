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
  try {
    const { data, error } = await supabase.rpc('create_admin_notification', {
      p_title: title,
      p_message: message,
      p_notification_type: notificationType,
      p_reference_id: referenceId,
    })
    if (error) {
      console.warn('Admin notification RPC failed:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('Admin notification error:', err)
    return null
  }
}

export async function notifyAllUsers(
  title: string,
  message: string,
  notificationType: NotificationType,
  referenceId: string | null = null,
) {
  try {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')

    if (profileError) {
      console.warn('Notification recipient lookup failed:', profileError.message)
      return null
    }

    const rows = (profiles || []).map((profile) => ({
      recipient_id: profile.id,
      title,
      message,
      notification_type: notificationType,
      reference_id: referenceId,
      is_read: false,
    }))

    if (rows.length === 0) return []

    const { data, error } = await supabase.from('notifications').insert(rows).select()
    if (error) {
      console.warn('Broadcast notification insert failed:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('Broadcast notification error:', err)
    return null
  }
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
