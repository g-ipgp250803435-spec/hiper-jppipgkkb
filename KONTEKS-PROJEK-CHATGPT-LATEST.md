# KONTEKS INDUK PROJEK HiPER

**Versi dokumen:** 2026-08-06 20:40 MYT  
**Status:** Dokumen kesinambungan aktif  
**Tujuan:** Digunakan untuk menyambung projek HiPER dalam chat baharu sekiranya chat lama dipadam atau tidak boleh diakses.

> Muat naik fail ini bersama ZIP kod terkini atau berikan pautan repository/commit terkini sebelum meminta perubahan kod. Fail ini menerangkan sejarah, keputusan, risiko, standard kerja dan status semasa projek, tetapi kod semasa tetap menjadi sumber kebenaran bagi implementasi.

---

## 1. Identiti pemilik dan organisasi

- Pemilik kerja: **Naib Bendahari Agung Kehormat (NBAK)**.
- Organisasi: **Jawatankuasa Perwakilan Pelajar (JPP), IPG Kampus Kota Bharu**.
- Pejabat: **Pejabat Bendahari Agung Kehormat (PBAK)**.
- Nama rasmi produk/website: **Hab Perbendaharaan Digital (HiPER)**.
- PBAK kekal sebagai nama rasmi pejabat; jangan gantikan semua perkataan “PBAK” dengan “HiPER”.
- Maksud rasmi HiPER: **Hab Perbendaharaan Digital**.
- Nama paparan yang sesuai:
  - **Hab Perbendaharaan Digital (HiPER)**
  - **HiPER**
  - **HiPER — Hab Perbendaharaan Digital**
  - **HiPER — Portal Rasmi PBAK, JPP IPG Kampus Kota Bharu**
- Nama teknikal repository/projek:
  - `hiper-jppipgkkb`

---

## 2. Cara bantuan yang pengguna mahukan

- Beri arahan **satu per satu** mengikut turutan.
- Gunakan **Bahasa Melayu yang mudah, terus dan tidak terlalu teknikal**.
- Elakkan aliran kerja profesional yang rumit.
- Utamakan kaedah yang:
  - kurang ralat;
  - mudah diuji;
  - mudah dipulihkan;
  - mempunyai langkah rollback.
- Gunakan alat berikut sejauh yang praktikal:
  - GitHub;
  - GitHub Codespaces;
  - Vercel;
  - Supabase;
  - Google Cloud Console;
  - Jules AI.
- Jangan terus mengubah banyak fail atau banyak modul serentak.
- Setiap naik taraf mesti dibuat dalam branch berasingan.
- Jangan mengubah database untuk kerja UI yang tidak memerlukan perubahan database.
- Sebelum merge:
  - semak diff;
  - jalankan build;
  - gunakan Vercel Preview;
  - uji fungsi berkaitan.
- Jangan meminta pengguna menyalin keseluruhan output Terminal apabila output mungkin mengandungi token, key atau URL login.
- Apabila memberikan arahan Terminal, pengguna perlu menyalin **arahan dalam code block sahaja**, bukan prompt Terminal atau output lama.

---

## 3. Reka bentuk dan pengalaman pengguna

- Gaya:
  - corporate;
  - eksklusif;
  - clean;
  - minimalist;
  - premium tetapi tidak berlebihan.
- Warna utama:
  - dark maroon;
  - dark gold.
- Sokongan paparan:
  - desktop;
  - tablet;
  - telefon.
- Sokongan bahasa:
  - Bahasa Melayu;
  - English.
- Sokongan tema:
  - light mode;
  - dark mode.
- Jangan membuat redesign besar pada halaman yang tidak terlibat.
- Kekalkan kebolehbacaan, focus state, responsif dan tiada horizontal overflow pada halaman.

---

## 4. Tujuan utama HiPER

HiPER memusatkan inisiatif PBAK supaya siswa guru boleh:

- memohon iKES;
- memohon pinjaman aset melalui e-Aset;
- menderma kepada Tabung Jumaat;
- melihat pengumuman PBAK;
- melihat poster hebahan;
- menyemak status permohonan;
- melihat rekod sendiri;
- melihat carta organisasi PBAK.

Admin boleh:

- menyemak permohonan;
- meluluskan atau menolak permohonan;
- mengurus aset dan stok;
- menyemak serta mengesahkan derma;
- merekod agihan Tabung Jumaat;
- menentukan agihan yang boleh dipaparkan kepada umum;
- menambah, mengubah atau membuang pengumuman;
- mengurus carta organisasi;
- melihat rekod melalui dashboard admin.

---

## 5. Modul pengguna

### 5.1 iKES Care

- Pinjaman tanpa faedah.
- Jumlah: **RM30 atau RM50**.
- Biasanya dibuka pada **5 haribulan** jika elaun belum dikreditkan.
- Ditutup apabila Elaun Sara Hidup siswa guru dikreditkan.

### 5.2 iKES Go-Home

- Untuk siswa guru yang mahu pulang ke kampung tetapi menghadapi kekangan kewangan.
- Maksimum: **RM100**.
- Pemohon wajib menyertakan resit atau tiket.

### 5.3 Bayaran balik iKES

- Bayaran penuh mesti dibuat dalam tempoh **tiga hari** selepas elaun bulan berikutnya dikreditkan.

### 5.4 e-Aset

- Pengguna memilih:
  - aset;
  - kuantiti;
  - tarikh pinjam;
  - tarikh pulang;
  - tujuan.
- Admin boleh meluluskan atau menolak permohonan.
- Stok tersedia berubah apabila status permohonan berubah.
- Trigger stok mesti kekal berfungsi apabila permohonan diluluskan atau status dileraikan daripada `approved`.

### 5.5 Tabung Jumaat

- Pengguna memilih jumlah derma.
- Kaedah:
  - QR;
  - pindahan bank;
  - tunai.
- Paparan umum:
  - jumlah kutipan disahkan;
  - jumlah agihan;
  - baki.
- Admin:
  - mengesahkan sumbangan;
  - merekod agihan;
  - memilih sama ada agihan dipaparkan kepada umum.

### 5.6 Pengumuman

- Tajuk dan kandungan BM/EN.
- Poster.
- Status:
  - `published`;
  - `pinned`.

### 5.7 Portal Saya

- Semakan:
  - permohonan iKES;
  - permohonan e-Aset;
  - rekod derma;
  - status;
  - nota admin;
  - tarikh berkaitan.

### 5.8 Kenali Pejabat

- Gambar.
- Nama.
- Jawatan.
- Unit.
- Kelas.
- Bidang tugas.
- Susunan carta organisasi.

---

## 6. Teknologi semasa

- React 19.
- Vite 7.
- TypeScript.
- React Router.
- Supabase JavaScript client.
- Supabase Database.
- Supabase Auth.
- Supabase Storage.
- GitHub.
- GitHub Codespaces.
- Vercel.
- Google Cloud Console.
- Jules AI.

Jangan menambah package baharu tanpa keperluan yang jelas.

---

## 7. Repository, deployment dan projek

### GitHub

- Repository:
  - `https://github.com/g-ipgp250803435-spec/hiper-jppipgkkb`
- Branch production:
  - `main`
- Tag stabil:
  - `v1.0.0-stable-baseline`
- Tag tersebut sudah wujud di remote. Jangan gunakan `--force` untuk menolaknya semula.

### Vercel

- Nama projek pilihan:
  - `hiper-jppipgkkb`
- Production sudah berjaya dideploy dan diuji selepas penyeragaman HiPER.
- URL Production belum direkodkan dalam dokumen ini.
- Vercel Preview mesti digunakan untuk branch feature sebelum merge.

### Supabase

- Project reference:
  - `nzcjepfxgeupcjjwwaua`
- Project URL:
  - `https://nzcjepfxgeupcjjwwaua.supabase.co`
- Jangan simpan:
  - database password;
  - access token;
  - service-role key;
  - refresh token;
  - Google client secret.

---

## 8. Authentication dan akses

- Login utama: **Google OAuth melalui Supabase Auth**.
- Akaun sasaran: akaun DELIMa.
- Domain dibenarkan:
  - `moe-dl.edu.my`
- Pengguna biasa hanya boleh melihat rekod sendiri.
- Admin ditentukan melalui:
  - `profiles.role = 'admin'`
- Admin juga disokong oleh:
  - `admin_email_allowlist`
- Google OAuth client secret pernah terpapar dalam screenshot lama tetapi **sudah di-reset**.
- Jangan simpan secret tersebut dalam:
  - GitHub;
  - Vercel frontend env;
  - fail `.env` yang dikongsi;
  - chat.
- Access token CLI Codespaces sementara sudah dipadam oleh pengguna.
- Jika perlu menggunakan Supabase CLI semula:
  - jalankan `supabase login`;
  - jangan kongsi login link atau verification code.
- Semakan wajib pada Supabase Auth:
  - Google provider = ON;
  - Email provider = OFF jika HiPER hanya menggunakan Google DELIMa.
- Warning Leaked Password Protection boleh dianggap tidak terpakai apabila Email provider benar-benar OFF, terutama pada pelan yang tidak menyediakan ciri tersebut.

---

## 9. Struktur kod utama

Fail halaman:

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

Fail konteks dan utiliti:

- `src/contexts/AuthContext.tsx`
- `src/contexts/UiContext.tsx`
- `src/lib/supabase.ts`
- `src/lib/config.ts`
- `src/lib/helpers.ts`
- `src/lib/types.ts`
- `src/styles.css`

Database:

- `supabase/config.toml`
- `supabase/migrations/`
- `supabase/schema.sql`

**Penting:** `supabase/schema.sql` ialah fail lama/rujukan. Selepas baseline dibuat, sumber kebenaran untuk perubahan database ialah fail dalam `supabase/migrations/`. Jangan menjalankan semula seluruh `schema.sql` pada Production secara membuta tuli.

---

## 10. Jadual database utama

- `admin_email_allowlist`
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

---

## 11. Storage buckets

### `public-media`

- Public bucket.
- Digunakan untuk poster, gambar aset dan media awam.
- URL objek kekal boleh digunakan secara awam.
- Polisi listing umum telah dibuang.
- Listing metadata hanya untuk admin.

### `application-files`

- Private bucket.
- Digunakan untuk tiket/resit/bukti pengguna.
- Pengguna hanya boleh mengakses fail sendiri.
- Admin boleh mengakses mengikut polisi.

---

## 12. Fungsi database penting

- `is_allowed_user()`
- `is_admin()`
- `handle_new_user()`
- `protect_profile_role()`
- `sync_asset_stock_from_request()`
- `get_public_fund_summary()`
- `set_updated_at()`
- `update_my_profile(new_full_name text, new_class_name text)`

---

## 13. Migration database yang sudah direkodkan

### 13.1 Baseline Production

```text
20260806072750_remote_schema.sql
```

Tujuan:

- mengambil struktur database Production;
- menyelaraskan sejarah migration local dan remote;
- merekod struktur live sebagai baseline.

### 13.2 First security hardening

```text
20260806080231_first_security_hardening.sql
```

Perubahan utama:

- menetapkan `search_path` untuk `set_updated_at()`;
- mengehadkan akses terus kepada beberapa fungsi;
- mengekalkan `get_public_fund_summary()` sebagai RPC awam yang disengajakan;
- mengehadkan `is_admin()` dan `is_allowed_user()` kepada pengguna authenticated;
- mengubah polisi bacaan awam supaya tidak perlu memanggil `is_admin()` untuk anon;
- membuang polisi listing umum bucket `public-media`;
- menambah polisi listing metadata untuk admin.

### 13.3 Revoke direct trigger RPC access

```text
20260806084303_revoke_trigger_rpc_access.sql
```

Perubahan:

- menarik hak `EXECUTE` fungsi `sync_asset_stock_from_request()` daripada:
  - `public`;
  - `anon`;
  - `authenticated`.
- Fungsi kekal digunakan oleh trigger dalaman e-Aset.

### Status migration

Ketiga-tiga migration telah:

- diuji dengan `db reset --local`;
- lulus `db lint --local --level warning`;
- dihantar ke Production;
- direkodkan pada local dan remote;
- disimpan dalam `main`.

---

## 14. Status keselamatan

### Selesai

- Google OAuth client secret di-reset.
- Baseline database direkodkan.
- `set_updated_at()` mempunyai `search_path`.
- Akses fungsi trigger diketatkan.
- Listing umum `public-media` dibuang.
- Akses langsung kepada `sync_asset_stock_from_request()` ditarik.
- Access token CLI sementara dipadam.
- Branch keselamatan telah Squash and Merge.

### Warning yang boleh diterima

Warning berikut boleh kekal kerana disengajakan:

- `get_public_fund_summary()` boleh dipanggil oleh `anon`;
- `get_public_fund_summary()` boleh dipanggil oleh `authenticated`;
- `is_admin()` boleh dipanggil oleh `authenticated`;
- `is_allowed_user()` boleh dipanggil oleh `authenticated`.

Sebab:

- `get_public_fund_summary()` diperlukan untuk jumlah Tabung Jumaat awam dan hanya mengembalikan agregat;
- `is_admin()` dan `is_allowed_user()` digunakan oleh polisi RLS serta menyemak konteks pengguna semasa.

### Perlu disahkan apabila menyambung

- Google provider masih ON.
- Email provider OFF.
- Security Advisor terkini tidak lagi memaparkan warning `sync_asset_stock_from_request()`.
- Warning Leaked Password Protection direkod sebagai accepted risk/not applicable jika Email provider OFF.

---

## 15. Fasa yang sudah selesai

### Fasa 1 — Penjenamaan HiPER

- Nama produk diseragamkan kepada HiPER.
- PBAK kekal sebagai nama pejabat.
- Preview dan Production berjaya.
- Pengumuman baharu dalam Supabase kekal muncul kerana data tidak disimpan dalam branch kod.

### Fasa 2 — Production deployment

- Branch stabilisasi diuji.
- Vercel Preview berjaya.
- Production berjaya.
- Login dan modul asas diuji.

### Fasa 3 — Database baseline

- Supabase CLI diinisialisasi.
- Projek di-link.
- `db pull` menghasilkan baseline.
- Local dan remote migration history diselaraskan.
- Baseline di-commit dan merge ke `main`.

### Fasa 4 — Security hardening

- First security hardening diuji local.
- `db lint` lulus.
- Dry run hanya menunjukkan migration sasaran.
- Migration dihantar ke Production.
- Warning fungsi trigger akhir dibetulkan.
- Branch keselamatan akhir telah Squash and Merge.

---

## 16. Fasa semasa — Pakej Naik Taraf Premium HiPER

### Status

- Pengguna menyerahkan ZIP kod terkini untuk dibaiki terus.
- Naik taraf telah disediakan dalam satu pakej ZIP bersih yang belum diimport ke GitHub atau dideploy.
- Tiada migration database baharu ditambah.
- Tiga migration keselamatan terdahulu dikekalkan tanpa perubahan.
- Sumber kebenaran kod ialah folder `src/`; salinan fail kod pendua di root telah dibuang.

### Fungsi yang telah ditambah baik

- Spacing Dashboard Admin diperkemas.
- Navigation bar dinaik taraf kepada gaya premium, corporate dan clean.
- Menu telefon menggunakan panel responsif dan boleh ditutup dengan jelas.
- Butang Log Masuk DELIMa atau Log Keluar dipaparkan dalam menu telefon.
- Language switcher ditukar kepada toggle BM/EN.
- Emoji UI digantikan dengan komponen SVG icon tempatan dalam `src/components/Icons.tsx`.
- Kad pengumuman di halaman utama hanya memaparkan poster, tarikh dan tajuk.
- Kandungan penuh pengumuman kekal di halaman Pengumuman dan menyokong multiple lines.
- Paparan dan spacing umum desktop/tablet/telefon diperkemas.
- Admin boleh menambah dan mengedit pengumuman.
- Admin boleh menambah dan mengedit aset dalam katalog.
- Admin boleh menambah dan mengedit ahli carta organisasi.
- Admin boleh menambah rekod kutipan tunai menggunakan jadual `donations` sedia ada.
- Rekod kutipan dibuat sebagai `pending` terlebih dahulu mengikut polisi RLS, kemudian disahkan melalui polisi update admin.
- Dashboard Admin V2 mengekalkan carian, penapis, ringkasan tindakan segera dan aktiviti terkini.

### Fail utama yang berubah

- `src/components/Icons.tsx`
- `src/components/Layout.tsx`
- `src/components/UI.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/AnnouncementsPage.tsx`
- `src/pages/AdminPage.tsx`
- `src/pages/AssetsPage.tsx`
- `src/pages/DonationsPage.tsx`
- `src/pages/IkesPage.tsx`
- `src/pages/LoginPage.tsx`
- `src/lib/config.ts`
- `src/styles.css`
- `index.html`
- fail dokumentasi dan `.gitignore`

### Pengesahan yang telah dibuat

- Semua fail `.ts` dan `.tsx` lulus semakan sintaks TypeScript.
- Semakan struktur TypeScript dengan stub modul luaran lulus tanpa error.
- Kurungan CSS seimbang.
- Folder generated seperti `node_modules`, `dist` dan `*.tsbuildinfo` tidak dimasukkan.
- Tiada perubahan Supabase schema, RLS atau migration dibuat untuk pakej ini.

### Batas pengesahan

- Full `npm run build` tidak dapat dijalankan dalam persekitaran penyediaan kerana package registry tidak tersedia.
- Selepas ZIP diimport ke GitHub, Vercel Preview mesti menjadi pengesahan build sebenar.
- Jangan merge ke `main` sebelum Vercel Preview berstatus `Ready` dan fungsi admin utama diuji.

### Langkah seterusnya

1. Import semua fail ZIP ke branch baharu, disyorkan `feature/hiper-premium-upgrade`.
2. Tunggu Vercel Preview.
3. Uji login, navigation mobile, Dashboard Admin, edit pengumuman/aset/ahli, dan tambah rekod kutipan.
4. Selepas lulus, Squash and Merge ke `main`.

---

## 17. Workflow standard untuk setiap naik taraf

1. Kembali ke `main`.
2. `git pull --ff-only origin main`.
3. Pastikan `git status --short` kosong.
4. Cipta branch feature/security/chore.
5. Ubah skop kecil sahaja.
6. Jalankan:
   - `npm run build`;
   - ujian berkaitan.
7. Push branch.
8. Cipta Pull Request.
9. Gunakan Vercel Preview.
10. Uji Preview.
11. Jangan merge sebelum semakan.
12. Selepas lulus, Squash and Merge.
13. Uji Production.
14. Kemas kini dokumen konteks ini.
15. Cipta checkpoint/tag apabila sesuai.

Contoh branch:

- `feature/admin-dashboard-v2`
- `feature/ikes-upgrade`
- `feature/easset-upgrade`
- `security/...`
- `chore/...`

---

## 18. Workflow database yang wajib dipatuhi

- Jangan ubah Production melalui SQL rawak tanpa migration.
- Jangan menjalankan semula seluruh `supabase/schema.sql`.
- Cipta migration baharu untuk setiap perubahan.
- Sebelum Production:
  1. `db reset --local`;
  2. `db lint --local --level warning`;
  3. `db push --dry-run --linked`;
  4. semak hanya migration sasaran;
  5. barulah `db push --linked`.
- Jangan jalankan `db reset` tanpa `--local` apabila tujuan hanya ujian.
- Selepas Codespace refresh, login/link Supabase mungkin hilang.
- Jika perlu:
  - `npx --yes supabase@latest login`
  - `npx --yes supabase@latest link --project-ref nzcjepfxgeupcjjwwaua`
- Jangan kongsi verification code atau login URL.

---

## 19. Arahan yang tidak patut diulang tanpa sebab

Jangan jalankan semula secara automatik:

```text
supabase init
supabase db pull
supabase db reset
supabase db push
git push --force
```

Gunakan hanya apabila langkah dan risikonya telah disemak.

---

## 20. Ujian baseline Production

Selepas perubahan besar, semak:

- Login Google DELIMa.
- Akaun bukan domain dibenarkan ditolak.
- Admin boleh membuka `/admin`.
- Pengumuman dan poster dipaparkan.
- iKES boleh dihantar.
- e-Aset boleh dihantar.
- Kelulusan e-Aset mengurangkan stok.
- Pembatalan status approved memulangkan stok.
- Tabung Jumaat memaparkan jumlah.
- Portal Saya memaparkan rekod pengguna.
- BM/EN berfungsi.
- Light/dark mode berfungsi.
- Desktop/mobile berfungsi.
- Upload poster/media berfungsi.
- Tiada ralat build.

---

## 21. Maklumat yang masih perlu dilengkapkan

Untuk kesinambungan yang lebih tepat, tambahkan kemudian:

- URL Vercel Production.
- URL Vercel Preview semasa jika perlu.
- Commit SHA terkini pada `main`.
- Commit/PR untuk pakej Premium Upgrade.
- Keputusan Vercel Preview dan ujian Production.
- Keputusan `npm run build` daripada Vercel/GitHub selepas dependencies dipasang.
- Screenshot dashboard selepas naik taraf.
- Keputusan Security Advisor terkini selepas refresh.
- Status muktamad:
  - Google provider ON;
  - Email provider OFF.

---

## 22. Maklumat yang tidak boleh disimpan

Jangan simpan dalam fail ini:

- Google client secret.
- Supabase `service_role` key.
- Database password.
- Personal access token.
- Access token CLI.
- Refresh token.
- JWT pengguna.
- Kata laluan.
- Login link.
- Verification code.
- Senarai penuh e-mel admin dalam dokumen awam.

---

## 23. Format rekod setiap sesi

```text
Tarikh:
Branch:
Tujuan:
Fail diubah:
SQL migration:
Environment variable:
Build:
Preview:
Production:
Ujian lulus:
Ujian gagal:
Isu belum selesai:
Langkah seterusnya:
Commit/PR:
```

---

## 24. Apa yang perlu dimuat naik dalam chat baharu

Minimum:

1. Fail `KONTEKS-PROJEK-CHATGPT-LATEST.md`.
2. ZIP kod terkini atau pautan repository bersama commit/branch terkini.
3. Output/screenshot ralat terkini jika ada.

Sangat membantu:

- URL Vercel Production;
- nama branch aktif;
- `git status --short`;
- ringkasan PR/Preview;
- fail CSV Security Advisor terkini jika isu keselamatan dibincangkan.

---

## 25. Prompt untuk chat baharu

```text
Saya sedang menyambung projek Hab Perbendaharaan Digital (HiPER) untuk Pejabat Bendahari Agung Kehormat (PBAK), JPP IPG Kampus Kota Bharu.

Baca keseluruhan fail KONTEKS-PROJEK-CHATGPT-LATEST.md dan periksa ZIP kod atau repository/commit terkini dahulu.

Jangan ubah kod sebelum:
1. menyatakan status semasa;
2. mengenal pasti branch aktif dan perubahan belum commit;
3. menyenaraikan risiko;
4. memberi hanya satu langkah seterusnya.

Gunakan Bahasa Melayu mudah dan arahan satu per satu. Elakkan workflow developer yang rumit. Setiap perubahan mesti kecil, boleh diuji dan mempunyai rollback.

Jangan meminta atau memaparkan client secret, service-role key, database password, access token, refresh token, login link, verification code atau kata laluan.

Gunakan migration untuk perubahan database. Jangan jalankan semula supabase/schema.sql secara membuta tuli.

Status aktif yang terakhir diketahui:
- Production sebelum naik taraf stabil;
- tiga migration keselamatan berada pada local dan remote;
- tag v1.0.0-stable-baseline wujud;
- satu ZIP Premium Upgrade lengkap telah disediakan tetapi belum diimport/deploy;
- pakej menambah UI premium, mobile navigation, icon SVG, edit pengumuman/aset/ahli dan rekod kutipan;
- tiada migration database baharu;
- full build tempatan belum dapat dibuat kerana package registry tidak tersedia;
- Vercel Preview ialah semakan build sebenar sebelum merge.
```

---

## 26. Changelog dokumen ini

### 2026-08-06 — Penjelasan nama rasmi

- HiPER disahkan sebagai singkatan bagi **Hab Perbendaharaan Digital**.
- Gunakan **Hab Perbendaharaan Digital (HiPER)** pada pengenalan rasmi dan **HiPER** sebagai nama ringkas.

### 2026-08-06

- Nama rasmi disahkan sebagai **Hab Perbendaharaan Digital (HiPER)**.
- Repo dan projek diseragamkan kepada `hiper-jppipgkkb`.
- Google OAuth secret telah di-reset.
- Production deployment disahkan berfungsi.
- Database baseline dibuat.
- Tiga migration direkodkan.
- Supabase security hardening selesai.
- Token CLI sementara dipadam.
- Tag `v1.0.0-stable-baseline` wujud.
- Admin Dashboard V2 digabungkan ke dalam pakej naik taraf premium.
- Navigation, mobile authentication actions, language toggle dan SVG icons ditambah baik.
- Admin edit pengumuman, aset dan ahli organisasi disediakan.
- Rekod kutipan tunai manual disediakan menggunakan jadual `donations` sedia ada.
- ZIP bersih telah disediakan untuk import ke GitHub dan Vercel Preview.
