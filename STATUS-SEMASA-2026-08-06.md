# Status Semasa HiPER — 6 Ogos 2026

## Selesai

- Penjenamaan rasmi kepada Hab Perbendaharaan Digital (HiPER).
- Production baseline dan tiga migration keselamatan.
- Supabase security hardening asas.
- Dashboard Pentadbir HiPER V2.
- Navigation bar responsif dan paparan login/logout telefon.
- Toggle bahasa BM/EN.
- Ikon SVG menggantikan emoji antaramuka.
- Paparan pengumuman halaman utama diringkaskan.
- Kandungan pengumuman berbilang baris.
- Fungsi edit pengumuman, aset dan ahli organisasi.
- Fungsi tambah rekod kutipan manual menggunakan jadual `donations`.
- Penambahbaikan spacing, mobile layout dan corporate styling.

## Database

Migration sedia ada dikekalkan:

- `20260806072750_remote_schema.sql`
- `20260806080231_first_security_hardening.sql`
- `20260806084303_revoke_trigger_rpc_access.sql`

Tiada migration baharu diperlukan untuk naik taraf ini.

## Ujian yang perlu dibuat selepas import

1. Pastikan Vercel Preview berstatus `Ready`.
2. Uji halaman utama pada desktop dan telefon.
3. Uji menu telefon dan Log Masuk/Log Keluar.
4. Uji edit pengumuman.
5. Uji edit aset dan validasi stok.
6. Uji edit ahli organisasi.
7. Uji tambah rekod kutipan manual.
8. Pastikan jumlah Tabung Jumaat berubah selepas rekod verified dimuat semula.
9. Uji BM/EN serta light/dark mode.

## Nota validasi fail

- Semua fail TypeScript/TSX lulus pemeriksaan sintaks.
- Pemeriksaan jenis struktur menggunakan TypeScript tempatan lulus.
- Build penuh tidak dapat dijalankan dalam persekitaran penyediaan ZIP kerana registry package dalaman tidak menyediakan `@supabase/supabase-js`.
- Vercel Preview perlu digunakan sebagai build production sebenar.
