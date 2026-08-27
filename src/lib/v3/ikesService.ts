import { supabase } from '../supabase'

export async function createIkesStatusHistory(recordId:string, oldStatus:string|null, newStatus:string, userId:string, remarks='') {
  return supabase.from('application_status_history').insert({
    module:'iKES', record_id:recordId, old_status:oldStatus, new_status:newStatus,
    changed_by:userId, remarks
  })
}
