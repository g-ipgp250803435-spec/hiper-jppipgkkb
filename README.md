# Hab Perbendaharaan Digital (HiPER)

Portal rasmi Pejabat Bendahari Agung Kehormat (PBAK), JPP IPG Kampus Kota Bharu.

## Modul utama

- iKES Care dan iKES Go-Home
- e-Aset dan katalog aset
- Tabung Jumaat, kutipan serta rekod agihan
- Pengumuman dengan poster
- Portal semakan siswa guru
- Carta organisasi PBAK
- Dashboard pentadbir
- Log masuk Google DELIMa
- Bahasa BM/EN
- Light mode dan dark mode
- Paparan desktop, tablet dan telefon

## Naik taraf dalam versi ini

- Navigation bar premium dan responsif
- Butang Log Masuk DELIMa/Log Keluar dalam menu telefon
- Toggle switch bahasa BM/EN
- Ikon SVG dalaman menggantikan emoji
- Kad pengumuman halaman utama yang lebih ringkas
- Paparan kandungan pengumuman berbilang baris
- Admin boleh edit pengumuman
- Admin boleh edit aset
- Admin boleh edit ahli organisasi
- Admin boleh tambah rekod kutipan manual menggunakan jadual `donations`
- Spacing dan paparan dashboard diperhalus

Rujuk [`CHANGELOG-NAIK-TARAF-2026-08-06.md`](CHANGELOG-NAIK-TARAF-2026-08-06.md) untuk senarai penuh.

## Teknologi

- React 19 + Vite 7 + TypeScript
- Supabase Database, Auth dan Storage
- Google OAuth
- GitHub dan Vercel

## Menjalankan projek

```bash
npm install
npm run dev
```

Untuk production build:

```bash
npm run build
```

## Fail penting

- `src/` — kod aplikasi aktif
- `supabase/migrations/` — sejarah migration database Production
- `supabase/schema.sql` — rujukan schema, bukan untuk dijalankan semula secara membuta tuli
- `.env.example` — template environment variables
- `vercel.json` — routing SPA Vercel
- `IMPORT-GITHUB.md` — langkah import paling mudah
- `KONTEKS-PROJEK-CHATGPT-LATEST.md` — dokumen kesinambungan projek

## Keselamatan

- Jangan muat naik `.env`, Google client secret, database password atau token ke GitHub.
- Gunakan Supabase anon key sahaja pada frontend.
- Jangan ubah Production database tanpa migration baharu dan ujian dry run.
- Versi ini tidak memerlukan migration database baharu.
