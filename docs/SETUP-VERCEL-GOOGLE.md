# Persediaan Vercel dan Google OAuth

## Vercel

Tetapkan environment variables berikut pada Preview dan Production:

```text
VITE_SUPABASE_URL=https://nzcjepfxgeupcjjwwaua.supabase.co
VITE_SUPABASE_ANON_KEY=<anon atau publishable key projek>
VITE_ALLOWED_EMAIL_DOMAINS=moe-dl.edu.my
VITE_SITE_NAME=HiPER
VITE_INSTITUTION_NAME=IPG Kampus Kota Bharu
```

Jangan masukkan service-role key, database password, Google client secret, Resend API key atau webhook secret dalam variables frontend Vite.

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

## Supabase Auth URL Configuration

Dalam Supabase Dashboard → Authentication → URL Configuration:

- Site URL: domain Production HiPER.
- Redirect URLs:
  - `https://DOMAIN-PRODUCTION/auth/callback`
  - URL Preview Vercel yang digunakan untuk ujian, jika perlu.

## Google Cloud Console

Notifikasi e-mel Premium V2 tidak memerlukan perubahan Google Cloud kerana ia menggunakan Edge Function + Resend.

Untuk login DELIMa, semak OAuth 2.0 Client sedia ada:

### Authorized JavaScript origins

```text
https://DOMAIN-PRODUCTION-HIPER
```

### Authorized redirect URI

Gunakan Callback URL yang dipaparkan dalam Supabase Google Provider. Kebiasaannya berbentuk:

```text
https://nzcjepfxgeupcjjwwaua.supabase.co/auth/v1/callback
```

Jangan guna `/auth/callback` milik frontend sebagai Google redirect URI; frontend callback digunakan selepas Supabase menyelesaikan OAuth.

## Provider

Dalam Supabase Authentication → Providers:

- Google: ON.
- Email: OFF jika portal hanya menggunakan Google DELIMa.

Selepas perubahan, uji guest, pengguna DELIMa, admin, log keluar dan mobile drawer.
