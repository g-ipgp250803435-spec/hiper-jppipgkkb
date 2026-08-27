import { supabase } from '../supabase'

export async function createAuditLog(
  actorId: string,
  action: string,
  description: string,
  recordId?: string,
) {
  return supabase.from('audit_logs').insert({
    actor_id: actorId,
    action,
    module: 'iKES',
    record_id: recordId ?? null,
    description,
  })
}
