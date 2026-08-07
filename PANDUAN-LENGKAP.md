# Panduan Lengkap HiPER

Ikut langkah mengikut turutan. Jangan lompat langkah.

## 1. Ekstrak fail ZIP

1. Ekstrak fail `hiper-jppipgkkb.zip`.
2. Pastikan folder mengandungi `src`, `public`, `supabase`, `docs` dan `package.json`.

## 2. Cipta projek Supabase

1. Buka Supabase.
2. Klik **New project**.
3. Pilih organisasi.
4. Masukkan nama projek: `hiper-jppipgkkb`.
5. Cipta kata laluan database yang kuat.
6. Pilih rantau paling hampir.
7. Klik **Create new project**.
8. Tunggu dashboard projek dibuka.

## 3. Pasang database dan keselamatan

1. Dalam Supabase, buka **SQL Editor**.
2. Klik **New query**.
3. Buka fail `supabase/schema.sql` daripada folder projek.
4. Salin semua kandungan fail.
5. Tampal ke SQL Editor.
6. Klik **Run**.
7. Pastikan mesej selesai dipaparkan tanpa ralat merah.

## 4. Dapatkan URL dan anon key Supabase

1. Dalam Supabase, buka **Project Settings**.
2. Buka bahagian **API** atau **Data API**.
3. Salin **Project URL**.
4. Salin **anon public key** atau **Publishable key** yang digunakan oleh aplikasi browser.
5. Simpan kedua-dua nilai untuk langkah Vercel.
6. Jangan gunakan `service_role` key.

## 5. Cipta Google OAuth untuk DELIMa

1. Buka Google Cloud Console.
2. Cipta projek baharu bernama `HiPER`.
3. Buka **Google Auth Platform**.
4. Mulakan konfigurasi Auth Platform jika diminta, kemudian lengkapkan halaman **Branding**.
5. Masukkan nama aplikasi: `HiPER`.
6. Masukkan e-mel sokongan rasmi.
7. Pilih **External** pada Audience jika akaun DELIMa bukan dalam organisasi Google Cloud anda.
8. Tambah e-mel anda sebagai test user jika aplikasi masih dalam mod Testing.
9. Buka **Clients**.
10. Klik **Create client**.
11. Pilih **Web application**.
12. Masukkan nama: `HiPER Web`.
13. Dalam **Authorized JavaScript origins**, tambah:
    - `http://localhost:5173`
    - Domain Vercel anda selepas deployment, contoh `https://hiper-jppipgkkb.vercel.app`
14. Dalam **Authorized redirect URIs**, tambah:
    - `https://PROJECT_REF.supabase.co/auth/v1/callback`
15. Gantikan `PROJECT_REF` dengan project reference Supabase anda.
16. Klik **Create**.
17. Salin **Client ID**.
18. Salin **Client secret**.

## 6. Sambungkan Google OAuth kepada Supabase

1. Dalam Supabase, buka **Authentication**.
2. Buka **Providers**.
3. Pilih **Google**.
4. Aktifkan Google provider.
5. Tampal Google **Client ID**.
6. Tampal Google **Client secret**.
7. Simpan.
8. Buka **Authentication > URL Configuration**.
9. Masukkan Site URL sementara: `http://localhost:5173`.
10. Tambah Redirect URL: `http://localhost:5173/auth/callback`.
11. Selepas Vercel siap, tambah `https://DOMAIN-VERCEL-ANDA/auth/callback`.
12. Tukar Site URL kepada domain Vercel utama selepas pelancaran.

## 7. Cipta repository GitHub

1. Log masuk GitHub.
2. Klik **New repository**.
3. Masukkan nama: `hiper-jppipgkkb`.
4. Pilih **Private** dahulu.
5. Jangan tambah README, `.gitignore` atau lesen dari GitHub.
6. Klik **Create repository**.
7. Pada halaman repository kosong, klik **uploading an existing file**.
8. Buka folder `hiper-jppipgkkb` yang telah diekstrak.
9. Seret semua kandungan dalam folder itu ke ruangan upload GitHub.
10. Pastikan `.env` tidak dimuat naik.
11. Klik **Commit changes**.

## 8. Deploy ke Vercel

1. Log masuk Vercel menggunakan GitHub.
2. Klik **Add New > Project**.
3. Pilih repository `hiper-jppipgkkb`.
4. Klik **Import**.
5. Pastikan Framework Preset dikesan sebagai **Vite**.
6. Buka bahagian **Environment Variables**.
7. Tambah:

```text
VITE_SUPABASE_URL=Project URL Supabase
VITE_SUPABASE_ANON_KEY=Anon/Publishable key Supabase
VITE_ALLOWED_EMAIL_DOMAINS=moe-dl.edu.my
VITE_SITE_NAME=HiPER
VITE_INSTITUTION_NAME=IPG Kampus Kota Bharu
```

8. Klik **Deploy**.
9. Buka domain Vercel yang diberikan.
10. Salin domain tersebut.

## 9. Kemas kini URL Google dan Supabase

1. Kembali ke Google Cloud Console.
2. Buka Google OAuth client `HiPER Web`.
3. Tambah domain Vercel dalam **Authorized JavaScript origins**.
4. Simpan.
5. Kembali ke Supabase.
6. Buka **Authentication > URL Configuration**.
7. Tukar **Site URL** kepada domain Vercel.
8. Tambah `https://DOMAIN-VERCEL-ANDA/auth/callback` dalam Redirect URLs.
9. Simpan.
10. Dalam Vercel, klik **Redeploy** jika pemboleh ubah persekitaran diubah.

## 10. Tetapkan admin pertama

1. Buka website Vercel.
2. Log masuk menggunakan akaun DELIMa yang hendak dijadikan admin.
3. Kembali ke Supabase.
4. Buka **SQL Editor**.
5. Jalankan arahan berikut:

```sql
update public.profiles
set role = 'admin'
where email = 'EMAIL_DELIMA_ADMIN_ANDA';
```

6. Gantikan e-mel contoh dengan e-mel DELIMa admin sebenar.
7. Log keluar daripada website.
8. Log masuk semula.
9. Pastikan menu **Admin** dipaparkan.

## 11. Isi kandungan sebenar

1. Buka menu **Admin**.
2. Buka tab **Tabung**.
3. Isi nama bank, nama akaun dan nombor akaun rasmi JPP.
4. Muat naik kod QR rasmi.
5. Buka tab **Organisasi**.
6. Tambah gambar, nama, jawatan, kelas dan bidang tugas.
7. Buka tab **Katalog Aset**.
8. Tambah semua aset sebenar dan jumlah stok.
9. Buka tab **Pengumuman**.
10. Tambah poster dan hebahan sebenar.
11. Padam kandungan contoh jika tidak diperlukan.

## 12. Uji sebelum pelancaran

1. Ikut `docs/SENARAI-SEMAK-UJIAN.md`.
2. Gunakan satu akaun siswa guru biasa.
3. Gunakan satu akaun admin.
4. Uji di telefon dan komputer.
5. Lancarkan kepada kumpulan kecil dahulu.
6. Semak data selama beberapa hari.
7. Buka kepada semua siswa guru selepas semua ujian lulus.

## Menambah admin lain

1. Minta admin baharu log masuk sekali.
2. Jalankan:

```sql
update public.profiles
set role = 'admin'
where email = 'EMAIL_ADMIN_BAHARU';
```

## Menarik akses admin

```sql
update public.profiles
set role = 'user'
where email = 'EMAIL_ADMIN';
```

## Menukar domain e-mel yang dibenarkan

1. Tambah atau nyahaktif domain dalam Supabase menggunakan SQL di bawah.
2. Kemas kini `VITE_ALLOWED_EMAIL_DOMAINS` dalam Vercel.
3. Redeploy projek Vercel.

Tambah domain:

```sql
insert into public.allowed_email_domains (domain, active)
values ('domain-baharu.edu.my', true)
on conflict (domain) do update set active = true;
```

Nyahaktif domain:

```sql
update public.allowed_email_domains
set active = false
where domain = 'domain-lama.edu.my';
```
