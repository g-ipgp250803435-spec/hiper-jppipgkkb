# Cara Import Fail Ini ke GitHub

ZIP ini mengandungi root projek Vite yang lengkap.

## Kaedah paling mudah

1. Ekstrak ZIP.
2. Buka repository `hiper-jppipgkkb` di GitHub.
3. Gunakan Codespaces atau GitHub Desktop.
4. Gantikan kandungan projek dengan semua fail daripada folder ini.
5. Jangan muat naik fail `.env` atau sebarang secret.
6. Commit dan push ke branch baharu, contohnya `feature/hiper-premium-upgrade`.
7. Tunggu Vercel Preview berstatus `Ready`.
8. Uji halaman utama, menu telefon dan semua fungsi edit admin sebelum merge ke `main`.

## Environment variables yang diperlukan di Vercel

Rujuk `.env.example`. Gunakan nilai sedia ada dalam Vercel; jangan masukkan secret ke GitHub.

## Database

Naik taraf ini menggunakan schema sedia ada. Jangan jalankan `supabase db push` untuk ZIP ini kerana tiada migration baharu.
