# Import ke GitHub — Cara Paling Mudah

## Disyorkan

1. Ekstrak ZIP.
2. Buka folder `hiper-jppipgkkb`.
3. Pastikan kandungannya termasuk `src`, `public`, `supabase`, `package.json` dan fail konfigurasi.
4. Upload semua kandungan folder itu ke repository `hiper-jppipgkkb`.
5. Jangan upload folder pembungkus tambahan sehingga struktur menjadi `repo/hiper-jppipgkkb/src`.
6. Jangan upload `.env`, `node_modules`, `dist` atau fail `*.tsbuildinfo`.
7. Commit ke branch baharu, contoh:

```text
feature/premium-v2-complete
```

8. Tunggu Vercel Preview.
9. Jalankan migration dan setup backend mengikut `docs/SETUP-SUPABASE-PREMIUM-V2.md`.
10. Uji Preview sebelum merge ke `main`.

## Jika sudah terlanjur upload ke main

Jangan padam database atau force-push. Tunggu deployment, uji, kemudian gunakan commit baru untuk pembetulan. GitHub history masih menjadi rollback point.
