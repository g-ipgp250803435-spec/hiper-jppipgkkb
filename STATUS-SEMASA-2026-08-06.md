# Status Semasa — 6 Ogos 2026

## Diterima

- ZIP source code HiPER.
- Eksport Supabase Performance and Security Lints.
- Eksport metadata struktur database Supabase.
- Screenshot Google provider Supabase.
- Screenshot pengguna Google Auth.

## Disahkan daripada kod

- Halaman utama, iKES, e-Aset, Tabung Jumaat, pengumuman, organisasi, portal pengguna dan admin telah diwujudkan.
- Google OAuth menggunakan callback `/auth/callback`.
- Domain lalai ialah `moe-dl.edu.my`.
- Admin berdasarkan `profiles.role`.
- RLS dan dua bucket Storage disediakan dalam `supabase/schema.sql`.

## Perlu dibuat dahulu

1. Uji login DELIMa dan admin selepas reset secret.
2. Gunakan nama HiPER secara seragam pada GitHub, Vercel dan Google OAuth.
3. Selaraskan database live dengan repository melalui migration.
4. Audit amaran Supabase Security Advisor.
5. Jalankan production build dan Vercel Preview.
6. Uji menggunakan satu akaun siswa dan satu akaun admin.

## Jangan lakukan dahulu

- Jangan jalankan keseluruhan `schema.sql` sekali lagi pada database live tanpa semakan perbezaan.
- Jangan ubah banyak modul serentak menggunakan Jules.
- Jangan letakkan secret dalam Vite environment variables.
