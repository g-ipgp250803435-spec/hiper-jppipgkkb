# Changelog Naik Taraf HiPER — 6 Ogos 2026

## Paparan dan navigasi

- Memperkemas spacing Dashboard Pentadbir HiPER.
- Menambah reka bentuk premium corporate berwarna dark maroon dan dark gold.
- Membaiki navigation bar untuk desktop, tablet dan telefon.
- Menambah panel menu telefon yang memaparkan butang Log Masuk DELIMa atau Log Keluar.
- Menukar penukar bahasa BM/EN kepada toggle switch.
- Menggantikan emoji dan simbol teks antaramuka dengan ikon SVG dalaman tanpa package tambahan.
- Menambah baik focus state, mobile stacking, saiz butang dan kawalan borang.

## Pengumuman

- Kad pengumuman pada halaman utama kini memaparkan poster, tarikh dan tajuk sahaja.
- Kandungan penuh kekal dipaparkan pada halaman Pengumuman.
- Baris baharu dan perenggan dalam kandungan pengumuman dikekalkan.
- Admin boleh menambah dan mengedit pengumuman sedia ada.
- Poster sedia ada dikekalkan jika admin tidak memuat naik poster baharu.

## Katalog aset

- Admin boleh menambah dan mengedit aset.
- Admin boleh mengubah nama, penerangan, jumlah stok, stok tersedia, status aktif dan gambar.
- Validasi menghalang stok tersedia daripada melebihi jumlah stok.

## Carta organisasi

- Admin boleh menambah dan mengedit ahli organisasi.
- Admin boleh mengubah nama, jawatan, unit, kelas, bidang tugas, susunan, status aktif dan gambar.

## Tabung Jumaat

- Admin boleh menambah rekod kutipan manual menggunakan jadual `donations` sedia ada.
- Rekod manual menggunakan bayaran tunai; ia dimasukkan sebagai `pending` mengikut polisi RLS sedia ada dan kemudian disahkan oleh operasi update admin.
- Tiada migration database baharu diperlukan.

## Keselamatan dan skop

- Tiada perubahan dibuat pada RLS, authentication, Supabase migration atau environment secret.
- Tiada package baharu ditambah.
- Tiga migration keselamatan sedia ada dikekalkan.
