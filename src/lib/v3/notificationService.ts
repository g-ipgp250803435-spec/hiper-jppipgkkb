import { supabase } from '../supabase'

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type = 'IKES_STATUS',
) {
  return supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
  })
}
