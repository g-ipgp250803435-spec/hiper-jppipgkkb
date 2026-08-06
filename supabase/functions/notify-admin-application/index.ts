import { createClient } from 'npm:@supabase/supabase-js@2'

type WebhookPayload = {
  type?: string
  table?: string
  schema?: string
  record?: Record<string, unknown> | null
  old_record?: Record<string, unknown> | null
}

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8' }

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatMoney(value: unknown) {
  const numberValue = Number(value || 0)
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(numberValue)
}

function formatDate(value: unknown) {
  if (!value) return '—'
  const date = new Date(String(value))
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('ms-MY', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kuala_Lumpur' }).format(date)
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const webhookSecret = Deno.env.get('HIPER_WEBHOOK_SECRET')
  if (!webhookSecret) return jsonResponse({ error: 'Server webhook secret is not configured' }, 500)

  const providedSecret = request.headers.get('x-hiper-webhook-secret')
  if (!providedSecret || providedSecret !== webhookSecret) return jsonResponse({ error: 'Unauthorized' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('HIPER_EMAIL_FROM')
  const siteUrl = Deno.env.get('HIPER_SITE_URL') || 'https://hiper-jppipgkkb.vercel.app'

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !fromEmail) {
    return jsonResponse({ error: 'Required function secrets are not configured' }, 500)
  }

  let payload: WebhookPayload
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const sourceTable = payload.table
  const record = payload.record
  if (payload.type !== 'INSERT' || payload.schema !== 'public' || !record) {
    return jsonResponse({ skipped: true, reason: 'Only public INSERT webhooks are processed' })
  }
  if (sourceTable !== 'ikes_applications' && sourceTable !== 'asset_applications') {
    return jsonResponse({ error: 'Unsupported webhook table' }, 400)
  }

  const recordId = String(record.id || '')
  if (!recordId) return jsonResponse({ error: 'Record id is missing' }, 400)

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: priorDelivery } = await adminClient
    .from('notification_delivery_log')
    .select('id')
    .eq('source_table', sourceTable)
    .eq('record_id', recordId)
    .eq('status', 'sent')
    .maybeSingle()

  if (priorDelivery) return jsonResponse({ skipped: true, reason: 'Notification already sent' })

  const { data: settingsRow } = await adminClient
    .from('site_settings')
    .select('settings')
    .eq('id', 1)
    .maybeSingle()

  const siteSettings = (settingsRow?.settings || {}) as Record<string, unknown>
  const notificationSettings = (siteSettings.notifications || {}) as Record<string, unknown>
  if (notificationSettings.enabled === false) {
    await adminClient.from('notification_delivery_log').insert({
      source_table: sourceTable,
      record_id: recordId,
      recipient_count: 0,
      status: 'skipped',
      error_message: 'Notifications disabled in HiPER CMS',
    })
    return jsonResponse({ skipped: true, reason: 'Notifications disabled' })
  }

  const { data: admins, error: adminError } = await adminClient
    .from('profiles')
    .select('email, full_name')
    .eq('role', 'admin')
    .not('email', 'is', null)

  if (adminError) return jsonResponse({ error: adminError.message }, 500)

  const recipients = Array.from(new Set((admins || []).map((admin) => String(admin.email || '').trim().toLowerCase()).filter(Boolean)))
  if (recipients.length === 0) {
    await adminClient.from('notification_delivery_log').insert({
      source_table: sourceTable,
      record_id: recordId,
      recipient_count: 0,
      status: 'failed',
      error_message: 'No admin email recipients found',
    })
    return jsonResponse({ error: 'No admin email recipients found' }, 500)
  }

  let applicationLabel = 'Permohonan baharu'
  let detailsHtml = ''

  if (sourceTable === 'ikes_applications') {
    applicationLabel = record.ikes_type === 'go_home' ? 'Permohonan iKES Go-Home baharu' : 'Permohonan iKES Care baharu'
    detailsHtml = `
      <tr><td>Nama pemohon</td><td><strong>${escapeHtml(record.applicant_name)}</strong></td></tr>
      <tr><td>Kelas</td><td>${escapeHtml(record.class_name)}</td></tr>
      <tr><td>Jenis</td><td>${escapeHtml(record.ikes_type)}</td></tr>
      <tr><td>Amaun</td><td>${escapeHtml(formatMoney(record.amount))}</td></tr>
      <tr><td>Diterima</td><td>${escapeHtml(formatDate(record.created_at))}</td></tr>`
  } else {
    let assetName = 'Aset'
    if (record.asset_id) {
      const { data: asset } = await adminClient.from('asset_items').select('name_bm, asset_code').eq('id', record.asset_id).maybeSingle()
      if (asset) assetName = `${asset.asset_code ? `${asset.asset_code} · ` : ''}${asset.name_bm}`
    }
    applicationLabel = 'Permohonan e-Aset baharu'
    detailsHtml = `
      <tr><td>Nama pemohon</td><td><strong>${escapeHtml(record.applicant_name)}</strong></td></tr>
      <tr><td>Kelas</td><td>${escapeHtml(record.class_name)}</td></tr>
      <tr><td>Aset</td><td>${escapeHtml(assetName)}</td></tr>
      <tr><td>Kuantiti</td><td>${escapeHtml(record.quantity)}</td></tr>
      <tr><td>Tarikh pinjam</td><td>${escapeHtml(formatDate(record.borrow_date))}</td></tr>
      <tr><td>Tarikh pulang</td><td>${escapeHtml(formatDate(record.return_date))}</td></tr>
      <tr><td>Diterima</td><td>${escapeHtml(formatDate(record.created_at))}</td></tr>`
  }

  const subjectPrefix = String(notificationSettings.subjectPrefix || '[HiPER]')
  const html = `<!doctype html><html lang="ms"><body style="margin:0;background:#f5efe9;font-family:Arial,sans-serif;color:#2b181b"><div style="max-width:680px;margin:0 auto;padding:32px 18px"><div style="background:#2a060d;color:#fff;padding:24px 28px;border-radius:18px 18px 0 0"><div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#d6aa3b">Hab Perbendaharaan Digital</div><h1 style="font-size:25px;margin:10px 0 0">${escapeHtml(applicationLabel)}</h1></div><div style="background:#fff;padding:28px;border:1px solid #eadfd8;border-top:0;border-radius:0 0 18px 18px"><p>Satu rekod baharu memerlukan perhatian pentadbir.</p><table style="width:100%;border-collapse:collapse">${detailsHtml}</table><p style="margin:28px 0 0"><a href="${escapeHtml(siteUrl)}/admin" style="display:inline-block;background:#c89b2b;color:#2a060d;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:999px">Buka Dashboard Pentadbir</a></p><p style="font-size:12px;color:#78686b;margin-top:24px">E-mel automatik HiPER. Maklumat terperinci dan dokumen sulit hanya boleh dilihat selepas log masuk.</p></div></div></body></html>`

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromEmail,
      to: [recipients[0]],
      bcc: recipients.slice(1),
      subject: `${subjectPrefix} ${applicationLabel}`,
      html,
    }),
  })

  const resendBody = await resendResponse.json().catch(() => ({})) as Record<string, unknown>
  if (!resendResponse.ok) {
    const message = String(resendBody.message || `Resend returned ${resendResponse.status}`)
    await adminClient.from('notification_delivery_log').insert({
      source_table: sourceTable,
      record_id: recordId,
      recipient_count: recipients.length,
      status: 'failed',
      error_message: message.slice(0, 1000),
    })
    return jsonResponse({ error: message }, 502)
  }

  await adminClient.from('notification_delivery_log').insert({
    source_table: sourceTable,
    record_id: recordId,
    recipient_count: recipients.length,
    status: 'sent',
    provider_message_id: String(resendBody.id || ''),
  })

  return jsonResponse({ sent: true, recipientCount: recipients.length, messageId: resendBody.id || null })
})
