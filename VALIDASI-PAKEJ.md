# Validasi Pakej Premium HiPER

Tarikh penyediaan: 6 Ogos 2026

## Lulus

- Semua fail TypeScript/TSX lulus semakan sintaks.
- Semakan struktur TypeScript lulus tanpa error.
- Struktur CSS lulus dan kurungan seimbang.
- Fail konfigurasi JSON boleh dibaca.
- Semua fungsi yang diminta ditemui dalam kod.
- Tiada `node_modules`, `dist` atau fail `*.tsbuildinfo` dalam pakej.
- Tiada emoji UI tertinggal dalam kod aktif; ikon menggunakan SVG tempatan.
- Tiada secret atau fail `.env` sebenar dimasukkan.
- Ketiga-tiga migration Production sedia ada dikekalkan.
- Tiada migration database baharu ditambah.

## Perlu disahkan selepas import

Full production build tidak dapat dijalankan ketika ZIP disediakan kerana package registry tidak tersedia dalam persekitaran kerja. Gunakan Vercel Preview sebagai pengesahan build sebenar sebelum merge ke `main`.

Ujian paling penting:

1. Login dan logout pada telefon.
2. Toggle BM/EN dan light/dark mode.
3. Edit pengumuman, aset dan ahli organisasi.
4. Tambah rekod kutipan manual dan pastikan status akhirnya `verified`.
5. Pastikan fungsi iKES, e-Aset dan Tabung Jumaat sedia ada tidak berubah.
