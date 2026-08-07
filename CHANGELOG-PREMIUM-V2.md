# Changelog — HiPER Premium V2

Tarikh: 7 Ogos 2026

## Reka bentuk

- Design system premium corporate dibina semula.
- Header desktop dua baris dan mobile drawer khusus.
- Homepage, e-Aset, Tabung Jumaat, Pengumuman, Organisasi, login dan admin diseragamkan.
- Dark/light mode dan BM/English dikekalkan.

## Pentadbir

- CMS identiti dan kandungan.
- Rich-text editor pengumuman.
- Metadata aset dan editor lengkap.
- Hierarchy organisasi parent/child.
- Rekod kutipan tunai dan fungsi sedia ada dikekalkan.

## Backend

- Migration `20260807013000_premium_cms_hierarchy_notifications.sql`.
- Edge Function `notify-admin-application`.
- Log penghantaran e-mel.
- Storage policies admin.

## Keselamatan dan kualiti

- Sanitasi rich HTML.
- Validasi upload.
- Fallback CMS.
- Pencegahan hierarchy cycle.
- Tiada secret ditambah ke repository.
