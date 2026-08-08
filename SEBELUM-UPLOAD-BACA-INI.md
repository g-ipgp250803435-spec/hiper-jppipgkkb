# Upload HiPER — langkah paling ringkas

1. Upload kandungan ZIP ini ke GitHub `main` atau branch ujian anda.
2. Tunggu Vercel. Pastikan `npm run build` selesai dan deployment menjadi `Ready`.
3. Selepas website boleh dibuka, jalankan `SUPABASE-ONE-TIME-REPAIR.sql` **sekali sahaja** di Supabase SQL Editor jika belum pernah berjaya dijalankan.

Selepas SQL berjaya, uji minimum:
- Admin → ubah status satu iKES.
- Admin → edit satu pengumuman.
- Admin → edit satu aset.
- Admin → edit satu ahli organisasi.
- Admin → Identiti & Kandungan → Save.
- Portal Saya pada telefon.
- Organisasi pada telefon.

Jangan kongsi access token, service-role key, database password atau Google client secret.
