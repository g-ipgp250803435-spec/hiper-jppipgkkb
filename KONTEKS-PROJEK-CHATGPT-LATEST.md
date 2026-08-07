# Konteks Projek — Hab Perbendaharaan Digital (HiPER)

Versi: Premium V2 · 7 Ogos 2026

## Identiti

- HiPER = Hab Perbendaharaan Digital.
- Portal rasmi Pejabat Bendahari Agung Kehormat (PBAK), JPP IPG Kampus Kota Bharu.
- Repository: `hiper-jppipgkkb`.
- Supabase project ref: `nzcjepfxgeupcjjwwaua`.
- Domain login DELIMa: `moe-dl.edu.my`.

## Cara membantu pengguna

- Bahasa Melayu mudah.
- Arahan satu per satu.
- Elakkan workflow rumit.
- Perubahan kecil dan boleh rollback.
- Jangan meminta atau memaparkan secret, service-role key, password, token, login link atau verification code.

## Stack

React 19, TypeScript, Vite 7, React Router, Supabase Database/Auth/Storage/Edge Functions/Webhooks, GitHub dan Vercel.

## Status Premium V2

Pakej ZIP ini mengandungi pembinaan semula menyeluruh berasaskan tema website lama:

- warm ivory/pale rose;
- dark maroon + dark gold;
- header desktop dua tingkat;
- mobile drawer pada 820px ke bawah;
- homepage premium;
- CSS tunggal tanpa patch navigasi lama;
- CMS identiti dan kandungan;
- rich-text editor pengumuman;
- hierarchy organisasi parent/child;
- metadata aset;
- notifikasi e-mel backend.

## Migration

Migration lama:

- `20260806072750_remote_schema.sql`
- `20260806080231_first_security_hardening.sql`
- `20260806084303_revoke_trigger_rpc_access.sql`

Migration baharu yang belum dianggap digunakan sehingga pengguna menjalankan Supabase push:

- `20260807013000_premium_cms_hierarchy_notifications.sql`

Jangan jalankan semula `supabase/schema.sql` secara membuta tuli. Gunakan migration.

## Backend e-mel

- Function: `supabase/functions/notify-admin-application/index.ts`.
- Provider: Resend.
- Trigger: dua Supabase Database Webhooks, INSERT sahaja pada `ikes_applications` dan `asset_applications`.
- Secret wajib: `RESEND_API_KEY`, `HIPER_WEBHOOK_SECRET`, `HIPER_EMAIL_FROM`, `HIPER_SITE_URL`.
- Secret disimpan menggunakan Supabase Secrets, bukan frontend.

## CMS

Admin → tab `Identiti & Kandungan` boleh mengubah:

- logo dan favicon;
- nama, tagline, SEO;
- notice bar;
- label navigation;
- hero dan CTA;
- kad perkhidmatan homepage;
- heading halaman;
- footer dan contact;
- suis notifikasi e-mel.

Label transaksi dan validation kritikal kekal dalam kod untuk keselamatan dan konsistensi.

## Validation status semasa pakej

- TypeScript semantic check menggunakan temporary local module stubs: lulus.
- TypeScript/TSX syntax transpilation: lulus.
- JSON parsing: lulus.
- Dependency installation/full Vite build tidak boleh disahkan dalam persekitaran pembinaan kerana registry package timeout; Vercel Preview mesti menjalankan `npm run build` sebelum merge.
- Temporary `.validation` tidak dimasukkan dalam ZIP akhir.

## Langkah pertama dalam chat baharu

1. Baca fail ini.
2. Baca `README.md` dan `AUDIT-KOD-PREMIUM-V2.md`.
3. Semak branch/commit terkini dan Vercel Preview.
4. Jangan ubah database sebelum menyemak migration list dan dry run.
5. Ikut `docs/SETUP-SUPABASE-PREMIUM-V2.md`.
