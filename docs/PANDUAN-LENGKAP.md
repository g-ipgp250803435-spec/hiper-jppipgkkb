# Panduan Import dan Pelancaran HiPER

Dokumen ini untuk projek Production sedia ada **Hab Perbendaharaan Digital (HiPER)**. Ia bukan arahan mencipta projek Supabase baharu.

## 1. Import ke GitHub

1. Ekstrak ZIP.
2. Pastikan folder root mempunyai `src`, `public`, `supabase`, `package.json` dan `vercel.json`.
3. Import semua fail ke branch baharu, disyorkan `feature/hiper-premium-upgrade`.
4. Jangan muat naik `.env`, token, database password atau Google client secret.
5. Commit dan push branch tersebut.

## 2. Vercel Preview

1. Kekalkan environment variables Production yang sudah digunakan oleh projek Vercel.
2. Jangan menukar Supabase URL atau anon/publishable key tanpa sebab.
3. Tunggu deployment Preview berstatus `Ready`.
4. Buka Preview dan jalankan senarai semak dalam `SENARAI-SEMAK-UJIAN.md`.

## 3. Database

Pakej ini tidak menambah migration baharu. Jangan jalankan:

```text
supabase db push
supabase db reset
supabase/schema.sql
```

Tiga migration sedia ada mesti kekal:

```text
20260806072750_remote_schema.sql
20260806080231_first_security_hardening.sql
20260806084303_revoke_trigger_rpc_access.sql
```

## 4. Semakan admin wajib

- Edit satu pengumuman ujian dan simpan.
- Edit satu aset ujian tanpa menjadikan stok tersedia lebih tinggi daripada jumlah stok.
- Edit satu ahli carta organisasi.
- Tambah satu rekod kutipan manual dan pastikan status akhirnya `verified`.
- Padam atau pulihkan data ujian selepas semakan.

## 5. Merge dan rollback

Selepas Preview lulus, gunakan **Squash and Merge** ke `main`, kemudian uji Production sekali lagi.

Sekiranya Production bermasalah, revert commit squash terakhir atau pulihkan tag stabil:

```text
v1.0.0-stable-baseline
```

Jangan gunakan `git push --force` pada `main`.
