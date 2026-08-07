# Persediaan Supabase — HiPER Premium V2

Ikuti langkah mengikut turutan. Jangan tampal secret, password, token atau verification code ke chat atau GitHub.

## 1. Migration baharu

Migration Premium V2:

```text
supabase/migrations/20260807013000_premium_cms_hierarchy_notifications.sql
```

Ia menambah:

- metadata katalog aset: kod, kategori dan susunan;
- `parent_id` dan `node_type` untuk hierarchy organisasi;
- fungsi pencegahan hierarchy cycle;
- jadual singleton `site_settings` untuk CMS;
- jadual log penghantaran notifikasi;
- polisi Storage admin untuk `public-media`;
- polisi admin untuk memasukkan rekod kutipan tunai yang terus berstatus `verified`.

### Arahan selamat

```bash
npx --yes supabase@latest login
npx --yes supabase@latest link --project-ref nzcjepfxgeupcjjwwaua
npx --yes supabase@latest migration list
npx --yes supabase@latest db push --dry-run --linked
```

Dry run mesti menunjukkan hanya migration yang belum berada pada remote. Selepas disemak:

```bash
npx --yes supabase@latest db push --linked
npx --yes supabase@latest migration list
```

Jangan gunakan `db reset` terhadap Production.

## 2. Semak Storage

Dalam Supabase Dashboard → Storage:

- `public-media`: bucket public sedia ada.
- `application-files`: bucket private sedia ada.

Migration menambah polisi supaya hanya admin boleh upload/update/delete media awam melalui CMS. URL media awam kekal boleh dipaparkan oleh website.

## 3. Admin CMS

Selepas migration dan deployment:

1. Log masuk sebagai admin.
2. Buka `/admin`.
3. Pilih tab **Identiti & Kandungan**.
4. Ubah identiti, header, navigasi, homepage, tajuk halaman atau footer.
5. Simpan.

Tetapan disimpan sebagai JSON dalam satu rekod `site_settings` dengan `id = 1`. Kod mempunyai fallback lengkap supaya website tidak menjadi kosong jika rekod belum wujud atau query gagal.

## 4. Edge Function notifikasi e-mel

Fail:

```text
supabase/functions/notify-admin-application/index.ts
```

Fungsi ini:

- menerima webhook INSERT sahaja;
- menyemak header rahsia `x-hiper-webhook-secret`;
- menerima hanya `ikes_applications` atau `asset_applications`;
- membaca penerima daripada `profiles.role = 'admin'`;
- menghantar e-mel melalui Resend;
- tidak memasukkan sebab penuh atau dokumen sulit dalam e-mel;
- merekod status ke `notification_delivery_log`;
- menghalang penghantaran berjaya yang sama daripada dihantar dua kali.

### 4.1 Sediakan domain e-mel

Cipta akaun Resend dan sahkan domain penghantaran milik organisasi. Gunakan alamat penghantar pada domain yang sudah disahkan, contohnya:

```text
HiPER <notifications@domain-rasmi-anda>
```

### 4.2 Tetapkan secret Edge Function

Jana webhook secret yang panjang dan rawak pada peranti sendiri. Jangan simpan dalam repository.

```bash
npx --yes supabase@latest secrets set \
  RESEND_API_KEY="ISI_DI_TERMINAL_SAHAJA" \
  HIPER_WEBHOOK_SECRET="SECRET_RAWAK_YANG_PANJANG" \
  HIPER_EMAIL_FROM="HiPER <notifications@domain-rasmi-anda>" \
  HIPER_SITE_URL="https://DOMAIN-PRODUCTION-HIPER"
```

`SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` tersedia kepada Edge Function melalui persekitaran Supabase. Jangan salin service-role key ke kod frontend.

### 4.3 Deploy fungsi

```bash
npx --yes supabase@latest functions deploy notify-admin-application --no-verify-jwt
```

`verify_jwt` dimatikan kerana request datang daripada Database Webhook, tetapi fungsi tetap dilindungi oleh custom webhook secret pada header.

## 5. Cipta Database Webhooks

Dalam Supabase Dashboard, buka Database → Webhooks dan cipta dua webhook.

### Webhook iKES

```text
Name: notify-admin-new-ikes
Table: public.ikes_applications
Events: INSERT
Method: POST
URL: https://nzcjepfxgeupcjjwwaua.supabase.co/functions/v1/notify-admin-application
Header name: x-hiper-webhook-secret
Header value: nilai HIPER_WEBHOOK_SECRET yang sama
```

### Webhook e-Aset

```text
Name: notify-admin-new-asset
Table: public.asset_applications
Events: INSERT
Method: POST
URL: https://nzcjepfxgeupcjjwwaua.supabase.co/functions/v1/notify-admin-application
Header name: x-hiper-webhook-secret
Header value: nilai HIPER_WEBHOOK_SECRET yang sama
```

Pilih INSERT sahaja supaya perubahan status admin tidak menghantar e-mel permohonan baharu sekali lagi.

## 6. Aktifkan/nyahaktif e-mel dari CMS

Dalam Dashboard Pentadbir → Identiti & Kandungan → Notifikasi e-mel:

- hidupkan atau matikan notifikasi;
- ubah awalan subjek, contohnya `[HiPER]`.

Alamat penerima diambil daripada profil admin. Pastikan setiap admin mempunyai e-mel yang sah dalam `profiles`.

## 7. Ujian notifikasi

1. Hantar satu permohonan iKES ujian.
2. Semak Edge Function Logs.
3. Semak inbox/spam admin.
4. Semak jadual `notification_delivery_log` melalui SQL Editor atau aplikasi admin.
5. Hantar satu permohonan e-Aset ujian.
6. Pastikan setiap rekod hanya menghasilkan satu e-mel berjaya.

## 8. Rollback

Sebelum rollback, ambil backup. Jangan padam migration yang sudah digunakan pada Production. Cipta migration rollback baharu jika benar-benar perlu. Menyahaktifkan dua Database Webhooks akan menghentikan e-mel tanpa mengganggu permohonan.
