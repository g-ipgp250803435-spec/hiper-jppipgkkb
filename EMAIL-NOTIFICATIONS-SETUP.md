# HiPER — Final Admin Email Notifications Setup

This package completes the existing HiPER email notification foundation.

## What will trigger an admin email

A new INSERT in any of these tables:

1. `ikes_applications` — iKES Care / Go-Home
2. `asset_applications` — e-Aset
3. `kpk_applications` — KPK+
4. `room_bookings` — Tempahan Bilik JPP
5. `donations` — Tabung Jumaat

The email contains a safe summary and a button to `/admin`. Private uploaded documents are NOT attached to email.

---

## Step 1 — Replace the Edge Function in GitHub

Replace this existing file:

`supabase/functions/notify-admin-application/index.ts`

with the version in this package.

Commit it to `main`.

Important: Vercel does NOT deploy Supabase Edge Functions. You must also deploy the function in Supabase (Step 5).

---

## Step 2 — Apply the database migration

In Supabase Dashboard → SQL Editor, run the entire contents of:

`supabase/migrations/20260930020000_email_notification_final.sql`

This only repairs/extends the email delivery log. It does not delete your application data.

---

## Step 3 — Create/configure Resend

1. Create/sign in to a Resend account: https://resend.com
2. Create an API key.
3. For real production delivery, add and verify a domain you control in Resend.
4. Choose a From address on that verified domain, for example:
   `HiPER <notifications@your-domain.example>`

For testing, Resend provides test tooling, but production mail should use a verified sending domain.

---

## Step 4 — Add Supabase Edge Function secrets

Supabase Dashboard → Edge Functions → Secrets.

Add:

- `RESEND_API_KEY` = your Resend API key
- `HIPER_WEBHOOK_SECRET` = a long random secret you create (at least 32 random characters)
- `HIPER_EMAIL_FROM` = the verified Resend sender, e.g. `HiPER <notifications@your-domain.example>`
- `HIPER_SITE_URL` = your real public HiPER URL, without a trailing slash
- `HIPER_ADMIN_EMAILS` = OPTIONAL comma-separated fallback admin emails

Example fallback format:

`admin1@example.com,admin2@example.com`

Normally recipients are automatically read from `public.profiles` where `role = 'admin'`. `HIPER_ADMIN_EMAILS` is only an additional safety fallback.

Do NOT put `RESEND_API_KEY` or `HIPER_WEBHOOK_SECRET` in Vercel frontend variables or any `VITE_*` variable.

---

## Step 5 — Deploy the Supabase Edge Function

Preferred CLI route:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy notify-admin-application
```

The project already has this function configured with `verify_jwt = false`, which is required because database webhooks authenticate using the custom `x-hiper-webhook-secret` header instead of a user JWT.

If you use the Supabase Dashboard editor instead, create/update the `notify-admin-application` Edge Function with the provided `index.ts` and deploy it.

---

## Step 6 — Create FIVE database webhooks

Supabase Dashboard → Database → Webhooks.

Create one webhook for each table below. Every webhook uses:

- Event: `INSERT` only
- Schema: `public`
- Destination: Supabase Edge Function / HTTP endpoint for `notify-admin-application`
- Method: `POST`
- Header: `x-hiper-webhook-secret`
- Header value: EXACTLY the same value as the `HIPER_WEBHOOK_SECRET` Edge Function secret

Tables:

1. `ikes_applications`
2. `asset_applications`
3. `kpk_applications`
4. `room_bookings`
5. `donations`

Do not create UPDATE or DELETE email webhooks unless you intentionally want additional emails later.

---

## Step 7 — Confirm admin recipients

Run this in Supabase SQL Editor:

```sql
select id, full_name, email, role
from public.profiles
where role = 'admin'
order by email;
```

Every admin who should receive mail should appear with a real email address.

If no row appears, fix the admin account role before testing, or temporarily set `HIPER_ADMIN_EMAILS`.

---

## Step 8 — Enable HiPER's email notification switch

Open HiPER → Admin → Identiti & Kandungan / Site Settings.

Under `Notifikasi e-mel` / `Email notifications`:

- Turn notifications ON.
- Keep or edit the subject prefix (default `[HiPER]`).
- Save settings.

---

## Step 9 — Test each workflow

Use a normal user account and submit one test record for each module:

- iKES
- e-Aset
- KPK+
- Tempahan Bilik JPP
- Tabung Jumaat

For each submission verify:

1. The user sees a successful submission in HiPER.
2. The in-app admin notification appears.
3. The admin email arrives.
4. The email button opens the HiPER admin dashboard.
5. No private attachment is exposed in the email.

---

## Step 10 — Inspect delivery results

Run:

```sql
select
  id,
  source_table,
  record_id,
  recipient_count,
  status,
  provider_message_id,
  error_message,
  created_at
from public.notification_delivery_log
order by created_at desc
limit 50;
```

Expected successful rows have `status = 'sent'`.

Common failures:

- `No admin email recipients found` → no admin email exists in `profiles`, and no fallback emails are configured.
- `Required function secrets are not configured` → one or more Supabase Edge Function secrets are missing.
- `Unauthorized` → database webhook header does not match `HIPER_WEBHOOK_SECRET`.
- Resend/domain error → verify the sender domain/address in Resend and confirm `HIPER_EMAIL_FROM` matches it.

---

## Security design

- Email sending happens server-side in a Supabase Edge Function.
- Resend API keys never enter browser code.
- Webhook requests require a dedicated shared secret.
- The function accepts only INSERT events from five known HiPER tables.
- Admin recipients come from server-side profile data.
- Private application files are not emailed.
- Delivery attempts are logged for troubleshooting.
