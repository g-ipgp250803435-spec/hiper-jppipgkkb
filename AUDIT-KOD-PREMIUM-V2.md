# Audit Kod dan Reka Bentuk — HiPER Premium V2

## Masalah yang dikenal pasti pada pakej sebelumnya

1. CSS navigasi mempunyai beberapa lapisan pembetulan dan breakpoint bertindih.
2. Tindakan akaun desktop boleh bersaing ruang dengan pautan navigasi.
3. Header desktop dan mobile bergantung pada selector yang saling mempengaruhi.
4. Beberapa kandungan masih hard-coded dan tidak boleh dikawal admin.
5. Pengumuman hanya menyokong plain text.
6. Carta organisasi rata dan tidak mempunyai hubungan parent/child.
7. Tiada backend notifikasi permohonan.
8. Metadata aset tidak mempunyai kod, kategori dan urutan visual.
9. Upload media tidak mempunyai validasi MIME/saiz pada frontend.
10. Paparan tarikh boleh gagal bagi data tarikh tidak sah.
11. Fail CSS lama terlalu besar kerana patch berulang dan menyebabkan risiko regresi.

## Pembinaan semula

- CSS ditulis semula sebagai satu design system dengan variable warna, radius, shadow, spacing dan breakpoint yang konsisten.
- Desktop menggunakan header tindakan + bar navigasi berasingan; mobile menggunakan drawer khusus pada 820px ke bawah.
- CMS JSON singleton ditambah dengan fallback kod.
- Rich text menggunakan whitelist tag dan membuang tag/atribut berbahaya sebelum paparan.
- Hierarchy organisasi menggunakan adjacency list (`parent_id`) dan trigger pencegahan cycle.
- Notifikasi dipindahkan ke backend Edge Function; tiada API secret dalam React.
- Media awam disahkan sebagai format imej dan maksimum 5MB; dokumen permohonan maksimum 10MB.
- Query aset mempunyai fallback untuk database lama sebelum migration.
- Pengumuman homepage kekal poster + tarikh + tajuk sahaja.

## Keputusan reka bentuk

Rujukan visual diterjemahkan kepada:

- latar warm ivory/pale rose;
- dark maroon sebagai warna autoriti;
- dark gold sebagai accent premium;
- garis halus dan shadow lembut;
- whitespace besar;
- card radius sederhana;
- header dua tingkat;
- hero dengan logo besar dan concentric rings;
- footer band dark maroon serta footer maklumat warna krim.

Font tidak disalin secara tepat mengikut permintaan; projek menggunakan font sistem dengan Georgia untuk heading editorial supaya tidak bergantung pada fail font luar.

## Had yang disengajakan

- Label transaksi, validation dan istilah keselamatan kekal dalam kod untuk konsistensi dan mengelakkan admin memadam teks kritikal.
- CMS mengawal identiti, navigasi, homepage, kad perkhidmatan, heading halaman dan footer.
- Rich text sengaja mengehadkan format kepada perenggan, line break, bold, italic, bullets dan numbering. HTML bebas, script, iframe, image dan link tidak dibenarkan dalam kandungan editor.
