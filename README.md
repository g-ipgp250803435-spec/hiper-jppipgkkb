# Hab Perbendaharaan Digital (HiPER)

Portal rasmi Pejabat Bendahari Agung Kehormat (PBAK), JPP IPG Kampus Kota Bharu.

## Premium V2

Pakej ini membina semula pengalaman HiPER berasaskan rujukan visual website lama: susun atur dua baris, tona krim/rose lembut, dark maroon, dark gold, kad berbingkai halus, ruang putih yang luas dan hierarki kandungan yang kemas.

### Ciri utama

- Navigasi desktop dua baris tanpa pertindihan dan drawer telefon khusus.
- BM/English dan light/dark mode.
- Homepage premium dengan hero, kad perkhidmatan, ringkasan dana dan pengumuman ringkas.
- CRUD pentadbir untuk pengumuman, aset, ahli organisasi, kutipan dan agihan.
- Rich-text pengumuman: bold, italic, bullets dan numbering, dengan sanitasi paparan.
- CMS pentadbir untuk logo, favicon, nama portal, header, navigasi, homepage, tajuk halaman dan footer.
- Carta organisasi parent/child sebenar dengan perlindungan kitaran hierarchy.
- Edge Function notifikasi e-mel admin untuk permohonan iKES dan e-Aset.
- RLS dan Storage policy khusus admin untuk CMS/media.

## Teknologi

- React 19
- TypeScript
- Vite 7
- React Router
- Supabase Database, Auth, Storage, Edge Functions dan Database Webhooks

## Mula

```bash
cp .env.example .env
npm install
npm run dev
```

Isi `.env` menggunakan Project URL dan anon/publishable key Supabase. Jangan masukkan service-role key atau secret e-mel ke frontend.

## Deployment

1. Import semua kandungan folder ini ke GitHub.
2. Sambungkan repository kepada Vercel.
3. Masukkan environment variables frontend dalam Vercel.
4. Jalankan migration Supabase.
5. Deploy Edge Function dan sediakan dua Database Webhooks.
6. Uji Vercel Preview sebelum Production.

Panduan terperinci:

- `docs/SETUP-SUPABASE-PREMIUM-V2.md`
- `docs/SETUP-VERCEL-GOOGLE.md`
- `IMPORT-GITHUB.md`
- `SENARAI-SEMAK-UJIAN-PREMIUM-V2.md`
- `AUDIT-KOD-PREMIUM-V2.md`
- `VALIDATION-REPORT-PREMIUM-V2.md`
- `docs/REKA-BENTUK-HIPER-PREMIUM-V2.md`

## Keselamatan

Jangan commit atau kongsi:

- Supabase service-role key
- database password
- Google OAuth client secret
- Resend API key
- webhook secret
- access/refresh token
- fail `.env`
