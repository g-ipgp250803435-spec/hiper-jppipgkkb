# Senarai Semak Sebelum Fasa Naik Taraf

Ikut mengikut turutan. Jangan mulakan fungsi baharu sehingga item wajib selesai.

## A. Pengesahan akses

- [ ] Akaun DELIMa boleh log masuk selepas secret OAuth direset.
- [ ] Akaun admin boleh log masuk dan membuka `/admin`.
- [ ] Akaun Google peribadi ditolak.
- [ ] Log keluar berfungsi.

## B. Baseline GitHub

- [ ] Upload pack ini ke repository `hiper-jppipgkkb`.
- [ ] Pastikan `.env` tidak berada dalam repository.
- [ ] Cipta branch `stabilization/hiper`.
- [ ] Pastikan branch `main` kekal sebagai salinan yang boleh dipulihkan.

## C. Vercel Preview

- [ ] Sambungkan repository kepada projek Vercel `hiper-jppipgkkb`.
- [ ] Tetapkan `VITE_SITE_NAME=HiPER`.
- [ ] Tetapkan `VITE_INSTITUTION_NAME=IPG Kampus Kota Bharu`.
- [ ] Tetapkan `VITE_SUPABASE_URL`.
- [ ] Tetapkan `VITE_SUPABASE_ANON_KEY` sahaja.
- [ ] Deploy branch `stabilization/hiper` sebagai Preview.
- [ ] Pastikan build berjaya.

## D. Supabase

- [ ] Jangan jalankan semula seluruh `supabase/schema.sql` pada database live.
- [ ] Wujudkan folder `supabase/migrations`.
- [ ] Tarik struktur database live sebagai baseline migration.
- [ ] Commit migration ke GitHub.
- [ ] Audit fungsi `SECURITY DEFINER` dan polisi Storage.
- [ ] Jalankan Security Advisor semula.

## E. Ujian baseline

- [ ] Halaman utama.
- [ ] iKES.
- [ ] e-Aset.
- [ ] Tabung Jumaat.
- [ ] Pengumuman.
- [ ] Kenali Pejabat.
- [ ] Portal Saya.
- [ ] Panel Admin.
- [ ] BM/EN.
- [ ] Light/dark mode.
- [ ] Desktop dan telefon.

## Syarat mula naik taraf

Fasa naik taraf boleh bermula selepas bahagian A, B, C dan baseline database dalam D selesai tanpa ralat kritikal.
