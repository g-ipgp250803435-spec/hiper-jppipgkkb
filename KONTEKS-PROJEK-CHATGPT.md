# Konteks Induk Projek HiPER

Gunakan fail ini untuk menyambung kerja dalam chat baharu. Muat naik fail ini bersama ZIP kod terkini apabila perlu.

## 1. Pemilik dan tujuan

- Pemilik kerja: Naib Bendahari Agung Kehormat (NBAK), JPP IPG Kampus Kota Bharu.
- Pejabat: Pejabat Bendahari Agung Kehormat (PBAK).
- Nama rasmi portal: **HiPER**.
- Nama organisasi kekal: **Pejabat Bendahari Agung Kehormat (PBAK)**.
- Nama teknikal repository: `hiper-jppipgkkb`.
- Paparan rasmi: **HiPER — Portal Rasmi PBAK, JPP IPG Kampus Kota Bharu**.

## 2. Cara bantuan yang dikehendaki

- Beri arahan satu per satu mengikut turutan.
- Gunakan bahasa mudah dan terus.
- Elakkan aliran kerja profesional yang rumit.
- Utamakan kaedah yang kurang ralat dan mudah dipulihkan.
- Gunakan GitHub, Vercel, Supabase, Google Cloud Console dan Jules AI sahaja sejauh yang praktikal.
- Setiap perubahan perlu kecil, boleh diuji dan mempunyai langkah rollback.

## 3. Reka bentuk

- Corporate, eksklusif, clean dan minimalist.
- Warna utama: dark maroon dan dark gold.
- Paparan desktop dan telefon.
- Bahasa BM dan English.
- Light mode dan dark mode.

## 4. Modul pengguna

### iKES Care

- Pinjaman tanpa faedah RM30 atau RM50.
- Biasanya dibuka pada 5 haribulan jika elaun belum dikreditkan.
- Ditutup apabila Elaun Sara Hidup dikreditkan.

### iKES Go-Home

- Bantuan pulang ke kampung bagi siswa guru yang mempunyai kekangan kewangan.
- Maksimum RM100.
- Pemohon wajib menyertakan resit atau tiket.

### Bayaran balik iKES

- Bayaran penuh perlu dibuat dalam tiga hari selepas elaun bulan berikutnya dikreditkan.

### e-Aset

- Siswa guru memilih aset, kuantiti, tarikh pinjam, tarikh pulang dan tujuan.
- Admin meluluskan atau menolak permohonan.
- Stok tersedia berubah apabila status permohonan berubah.

### Tabung Jumaat

- Pilihan jumlah derma.
- Kaedah QR, pindahan bank atau tunai.
- Paparan jumlah kutipan disahkan, jumlah agihan dan baki.
- Admin mengesahkan sumbangan dan merekod agihan.
- Admin boleh memilih sama ada sesuatu agihan dipaparkan kepada umum.

### Pengumuman

- Hebahan BM/EN.
- Poster.
- Status published dan pinned.

### Portal Saya

- Semakan permohonan iKES.
- Semakan permohonan e-Aset.
- Semakan rekod derma dan status.
- Paparan nota admin dan tarikh berkaitan.

### Kenali Pejabat

- Gambar.
- Nama.
- Jawatan.
- Unit.
- Kelas.
- Bidang tugas.
- Susunan carta organisasi.

## 5. Akses dan peranan

- Log masuk menggunakan Google OAuth melalui Supabase Auth.
- Domain DELIMa semasa: `moe-dl.edu.my`.
- Pengguna biasa hanya melihat rekod sendiri.
- Admin ditentukan melalui `profiles.role = 'admin'`.
- Jangan masukkan `service_role` key ke dalam kod frontend, GitHub atau Vercel.

## 6. Teknologi semasa

- React 19.
- Vite 7.
- TypeScript.
- React Router.
- Supabase JavaScript client.
- Supabase Database, Auth dan Storage.
- GitHub untuk source control.
- Vercel untuk deployment.
- Google Cloud Console untuk OAuth.
- Jules AI untuk perubahan kecil.

## 7. Struktur kod semasa

- `src/pages/HomePage.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/AuthCallbackPage.tsx`
- `src/pages/IkesPage.tsx`
- `src/pages/AssetsPage.tsx`
- `src/pages/DonationsPage.tsx`
- `src/pages/AnnouncementsPage.tsx`
- `src/pages/OfficePage.tsx`
- `src/pages/PortalPage.tsx`
- `src/pages/AdminPage.tsx`
- `src/contexts/AuthContext.tsx`
- `src/contexts/UiContext.tsx`
- `src/lib/supabase.ts`
- `src/lib/config.ts`
- `src/lib/helpers.ts`
- `src/lib/types.ts`
- `supabase/schema.sql`

## 8. Database dalam fail sumber

Jadual utama:

- `allowed_email_domains`
- `profiles`
- `ikes_applications`
- `asset_items`
- `asset_applications`
- `donations`
- `fund_disbursements`
- `donation_settings`
- `announcements`
- `organization_members`

Storage buckets:

- `public-media`
- `application-files`

Fungsi penting:

- `is_allowed_user()`
- `is_admin()`
- `handle_new_user()`
- `protect_profile_role()`
- `sync_asset_stock_from_request()`
- `get_public_fund_summary()`
- `set_updated_at()`

## 9. Perbezaan database live dan fail sumber

Eksport metadata Supabase yang diberikan menunjukkan database live mempunyai tambahan berikut yang tidak terdapat dalam `supabase/schema.sql` semasa:

- Jadual `admin_email_allowlist`.
- Fungsi `update_my_profile(new_full_name text, new_class_name text)`.

Sebelum perubahan database seterusnya, hasilkan migration yang menyelaraskan database live dengan repository. Jangan jalankan semula seluruh `schema.sql` secara membuta tuli pada projek live.

## 10. Status keselamatan semasa

Tindakan pertama:

1. Google OAuth client secret yang pernah terdedah telah direset pada 6 Ogos 2026.
2. Secret baharu hanya boleh disimpan dalam Google provider di Supabase.
3. Jangan masukkan secret itu ke GitHub, Vercel, fail `.env` frontend atau chat.
4. Ujian login DELIMa dan admin masih perlu dibuat selepas reset.

Eksport Supabase Security Advisor menunjukkan 15 amaran, termasuk:

- `set_updated_at()` tidak menetapkan `search_path`.
- Bucket `public-media` boleh disenaraikan melalui polisi SELECT yang luas.
- Beberapa fungsi `SECURITY DEFINER` boleh dipanggil oleh `anon` atau `authenticated`.
- Leaked password protection tidak aktif.

Sebahagian amaran mungkin disengajakan untuk RLS atau paparan jumlah awam, tetapi setiap fungsi perlu diaudit dan hak `EXECUTE` perlu ditetapkan secara khusus.

## 11. Kekurangan yang telah dikenal pasti dalam ZIP asal

- README menyebut `.env.example`, tetapi fail itu tiada dalam ZIP asal.
- `.gitignore` juga tiada.
- Kedua-dua fail telah ditambah dalam continuity pack ini.

## 12. Status ujian

- Struktur fail dan aliran utama telah diperiksa.
- Ujian `npm install` dalam persekitaran ChatGPT tidak selesai kerana registry dalaman tidak menjumpai pakej `@supabase/supabase-js`.
- Keadaan itu tidak membuktikan kod rosak.
- Jalankan `npm install` dan `npm run build` melalui Vercel atau komputer sendiri sebelum merge besar.

## 13. Maklumat yang perlu disimpan untuk kesinambungan

Simpan tanpa rahsia:

- URL repository GitHub.
- URL deployment Vercel production.
- Supabase project URL atau project reference sahaja.
- Nama rasmi akhir portal.
- Akaun admin yang dilantik, tetapi elakkan berkongsi senarai e-mel penuh dalam dokumen awam.
- Status modul yang sudah diuji.
- Senarai isu semasa.
- Perubahan terakhir dan fail yang disentuh.
- SQL migration terakhir yang telah dijalankan.

Jangan simpan:

- Google client secret.
- Supabase service-role key.
- Database password.
- Access token.
- Refresh token.
- Kata laluan pengguna.

## 14. Format kemas kini selepas setiap sesi

Tambahkan rekod seperti berikut:

```text
Tarikh:
Tujuan:
Fail diubah:
SQL dijalankan:
Environment variable diubah:
Ujian lulus:
Ujian gagal:
Isu belum selesai:
Langkah seterusnya:
Versi ZIP atau commit:
```

## 15. Prompt untuk chat baharu

```text
Saya sedang menyambung projek HiPER untuk PBAK, JPP IPG Kampus Kota Bharu. Baca fail KONTEKS-PROJEK-CHATGPT.md dan ZIP kod terkini dahulu. Jangan ubah kod sebelum menyenaraikan status semasa, risiko, dan satu langkah seterusnya. Beri arahan satu per satu dalam Bahasa Melayu mudah. Jangan minta atau paparkan client secret, service-role key, token atau kata laluan. Setiap perubahan mesti kecil, mudah diuji dan mempunyai langkah rollback.
```
