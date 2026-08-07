# HiPER — Pembaikan Admin + Mobile (7 Ogos 2026)

## Punca fungsi pentadbir gagal

Kod Premium V2 menggunakan struktur pangkalan data tambahan seperti:

- `site_settings`
- `asset_items.asset_code`
- `asset_items.category_bm/category_en`
- `asset_items.sort_order`
- `organization_members.parent_id`
- `organization_members.node_type`
- polisi RLS admin bagi CMS/media/kutipan manual

Jika migration Premium V2 belum digunakan pada Supabase Production, UI masih boleh dibuka tetapi operasi simpan/edit akan gagal.

Versi ini menambah:

- `SUPABASE-ONE-TIME-REPAIR.sql` untuk pembaikan sekali jalan melalui Supabase SQL Editor;
- migration `20260807050000_admin_functionality_repair.sql` untuk aliran CLI/Git;
- mesej ralat sebenar daripada Supabase, bukan hanya `Tindakan gagal.`;
- amaran jelas pada Dashboard Admin apabila schema Premium belum tersedia.

## Portal Saya — telefon

Paparan jadual desktop dikekalkan. Pada telefon, setiap rekod kini menggunakan kad khas dengan:

- status jelas;
- amaun/nama aset sebagai nilai utama;
- label dan nilai berjarak baik;
- nota admin yang boleh wrap;
- tab tiga kolum penuh;
- ringkasan responsif 2 kolum dan 1 kolum pada telefon sangat kecil.

## Organisasi — telefon

Carta desktop tidak lagi dipaksa mengecil pada telefon. Komponen kini merender paparan mobile hierarchy khas:

- kepimpinan di tengah;
- unit sebagai node beraksen emas;
- ahli sebagai kad horizontal yang lebih ringkas;
- child node mempunyai connector dan indentation;
- tiada horizontal scroll.

## Langkah wajib selepas deploy frontend

Buka Supabase Dashboard → SQL Editor → New query.

Salin keseluruhan kandungan `SUPABASE-ONE-TIME-REPAIR.sql`, tekan Run sekali sahaja, kemudian refresh halaman `/admin`.

Selepas itu uji:

1. Ubah status iKES.
2. Ubah status e-Aset.
3. Sahkan sumbangan.
4. Edit pengumuman.
5. Edit aset.
6. Edit ahli organisasi.
7. Simpan Identiti & Kandungan.
8. Tambah rekod kutipan manual.
9. Upload satu imej ujian ke media awam.
