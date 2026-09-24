# Hab Perbendaharaan Digital (HiPER)

Portal rasmi Pejabat Bendahari Agung Kehormat (PBAK), Jawatankuasa Perwakilan Pelajar (JPP) IPG Kampus Kota Bharu.

## HiPER Remediation & Production Readiness (HPR-01 - HPR-32)

Aplikasi HiPER telah dikemas kini secara menyeluruh untuk memastikan keselamatan, privasi data, integriti transaksi, aksesibiliti, dan kesediaan pengeluaran (production readiness).

### Ringkasan Pembetulan & Peningkatan Keselamatan

- **HPR-01 & HPR-02**: Privasi kalendar tempahan bilik JPP diasingkan. Maklumat peribadi pemohon dilindungi daripada carian awam melalui RPC `get_public_room_availability()`. Kelulusan sendiri oleh pengguna dihalang pada peringkat pangkalan data.
- **HPR-03**: Sanitasi HTML (`escapeHtml`) dilaksanakan pada cetakan/laporan PDF untuk mengelakkan serangan HTML Injection.
- **HPR-04 & HPR-05**: Kebenaran RLS notifikasi pentadbir diperketat. Notifikasi `recipient_id IS NULL` khusus untuk pentadbir sahaja.
- **HPR-07 & HPR-18**: Sistem penjadualan tempahan bilik JPP menggunakan pengunci baris atomik (`create_room_booking()` & `approve_room_booking()`) dan penetapan zon masa rasmi `Asia/Kuala_Lumpur`.
- **HPR-08 & HPR-09**: Syarat status sumbangan menerima status `'cancelled'`, dan `notification_delivery_log` disesuaikan untuk semua modul aplikasi.
- **HPR-10**: Medan permohonan yang dihantar bersifat tidak boleh diubah (`immutable`) semasa pembatalan oleh pemohon melalui trigger `prevent_user_application_tampering()`.
- **HPR-11**: Pengemaskinian blok CMS diselesaikan secara transaksi atomik dalam Postgres (`save_cms_page_blocks_transactional()`).
- **HPR-12 & HPR-25**: Pengesahan fail muat naik diperketat (10MB limit, jenis fail `PRIVATE_FILE_TYPES`), dan pautan CMS disanitasi daripada protokol `javascript:`.
- **HPR-13 & HPR-29**: Sokongan navigasi halaman, carian, dan statistik pentadbir disusun semula secara modular.
- **HPR-14**: Log audit kewangan tidak boleh diubah (`financial_audit_logs`) ditambah untuk pengesahan sumbangan dan agihan dana.
- **HPR-19**: Penjanaan nombor rujukan iKES menggunakan sekuens atomik Postgres (`ikes_app_number_seq`).
- **HPR-23 & HPR-24**: Pautan lompat ke kandungan utama (`#main-content`), kawalan papan kekunci drawer telefon, dan kontras warna butang emas dipertingkatkan mengikut piawaian WCAG 2.2 AA.
- **HPR-27 & HPR-30**: Ujian automatik (Vitest + React Testing Library), integrasi berterusan GitHub Actions (`.github/workflows/ci.yml`), dan pengepala keselamatan HTTP (`vercel.json`) disediakan.

## Teknologi

- React 19
- TypeScript
- Vite 7
- React Router 6
- Supabase (Database, Auth, Storage, Edge Functions)
- Vitest & React Testing Library
- Vercel Deployment & Security Headers

## Cara Menjalankan Projek

```bash
# 1. Salin konfigurasi persekitaran
cp .env.example .env

# 2. Pasang kebergantungan
npm install

# 3. Jalankan typecheck & ujian
npm run typecheck
npm test

# 4. Jalankan pelayan pembangunan
npm run dev

# 5. Bina pakej pengeluaran
npm run build
```

## Langkah Deployment Database Supabase

Untuk memasang atau mengemas kini database Supabase secara rasmi:
1. Jalankan fail migration terkini di `supabase/migrations/20260809000000_hyper_comprehensive_remediation.sql` pada SQL Editor Supabase Dashboard.
2. Pastikan bucket storage `application-files` (private) dan `public-media` (public) telah dikonfigurasikan.
3. Sediakan Edge Function `notify-admin-application` dan tetapkan rahsia `HIPER_WEBHOOK_SECRET`, `RESEND_API_KEY`, `HIPER_EMAIL_FROM`, dan `SUPABASE_SERVICE_ROLE_KEY`.

## Keselamatan Rahsia

Jangan sekali-kali memasukkan atau menyimpan:
- Supabase service-role key dalam Kod Frontend atau pembolehubah `VITE_`
- Kata laluan pangkalan data
- Google OAuth client secret
- Resend API key
- Webhook secret
- Fail `.env`
