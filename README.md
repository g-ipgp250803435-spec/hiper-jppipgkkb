# HiPER

Portal bersepadu Pejabat Bendahari Agung Kehormat, JPP IPG Kampus Kota Bharu.

**Nama rasmi:** HiPER — Portal Rasmi PBAK, JPP IPG Kampus Kota Bharu.

## Modul

- iKES Care dan iKES Go-Home
- e-Aset
- Tabung Jumaat dan rekod agihan
- Pengumuman dengan poster
- Portal semakan siswa guru
- Carta organisasi PBAK
- Panel pentadbir
- Log masuk Google/DELIMa
- Bahasa BM/EN
- Light mode/dark mode
- Paparan desktop dan telefon

## Teknologi

- React + Vite + TypeScript
- Supabase Database, Auth dan Storage
- Google OAuth
- GitHub
- Vercel

## Mula di sini

Buka fail [`docs/PANDUAN-LENGKAP.md`](docs/PANDUAN-LENGKAP.md) dan ikut langkah 1 hingga 12.

## Arahan tempatan pilihan

```bash
npm install
npm run dev
```

## Fail penting

- `supabase/schema.sql` — jadual, RLS, fungsi dan storage
- `.env.example` — pemboleh ubah persekitaran
- `vercel.json` — sokongan routing SPA di Vercel
- `docs/PANDUAN-LENGKAP.md` — panduan pemasangan
- `docs/SENARAI-SEMAK-UJIAN.md` — ujian sebelum pelancaran
- `docs/ARAHAN-JULES.md` — contoh arahan selamat untuk Jules
- `docs/IDENTITI-HIPER.md` — piawaian nama rasmi
- `docs/SEBELUM-NAIK-TARAF.md` — checklist stabilisasi

## Keselamatan

- Jangan masukkan `service_role` key dalam GitHub atau Vercel.
- Gunakan `anon` key sahaja pada `VITE_SUPABASE_ANON_KEY`.
- Polisi RLS dalam `supabase/schema.sql` mesti dijalankan.
- Tukar akaun admin melalui SQL selepas akaun tersebut log masuk kali pertama.
