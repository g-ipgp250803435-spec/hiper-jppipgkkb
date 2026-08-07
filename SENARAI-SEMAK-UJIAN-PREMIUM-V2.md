# Senarai Semak Ujian HiPER Premium V2

## Build dan struktur

- [ ] `npm install` berjaya.
- [ ] `npm run build` berjaya.
- [ ] Vercel Preview = Ready.
- [ ] Tiada `.env`, secret, `node_modules`, `dist` atau `*.tsbuildinfo` dalam commit.

## Responsive

Uji 1920, 1440, 1366, 1024, 821, 820, 390 dan 360 px.

- [ ] Tiada horizontal overflow.
- [ ] Header desktop tidak bertindih.
- [ ] Drawer hanya pada 820px ke bawah.
- [ ] Login/logout mobile kelihatan.
- [ ] BM/EN dan dark mode berfungsi.
- [ ] Admin tabs tidak menindih kandungan.

## Public pages

- [ ] Homepage menyerupai tema premium rujukan.
- [ ] Katalog aset memaparkan kategori, kod dan stok.
- [ ] iKES boleh dihantar.
- [ ] e-Aset boleh dihantar.
- [ ] Tabung Jumaat memaparkan ringkasan.
- [ ] Homepage announcement hanya poster, tarikh dan tajuk.
- [ ] Halaman Pengumuman memaparkan rich text dengan betul.
- [ ] Carta organisasi memaparkan parent/child.

## Admin

- [ ] Edit/tambah pengumuman.
- [ ] Bold, italic, bullets, numbering berfungsi.
- [ ] Edit/tambah aset dan validasi stok.
- [ ] Edit/tambah leadership, unit dan member.
- [ ] Pilihan parent tidak membenarkan cycle.
- [ ] Tambah rekod kutipan tunai.
- [ ] Ubah logo/favicon/header/navigation/home/page headings/footer.
- [ ] Upload media awam berjaya.

## Database

- [ ] Migration list local/remote sejajar.
- [ ] RLS masih aktif.
- [ ] Kelulusan e-Aset mengurangkan stok.
- [ ] Status keluar daripada approved memulangkan stok.
- [ ] Public tidak boleh mengubah CMS atau hierarchy.

## E-mel

- [ ] Edge Function deployed.
- [ ] Secret disimpan di Supabase sahaja.
- [ ] Dua Database Webhooks INSERT aktif.
- [ ] iKES menghasilkan satu e-mel.
- [ ] e-Aset menghasilkan satu e-mel.
- [ ] Notification log direkodkan.
- [ ] Notifikasi boleh dimatikan melalui CMS.
