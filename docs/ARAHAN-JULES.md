# Arahan Selamat untuk Jules AI — HiPER

Gunakan Jules hanya untuk satu perubahan kecil pada satu masa. Hadkan fail yang boleh diubah, minta `npm run build`, semak diff dan uji Vercel Preview sebelum merge.

## Contoh arahan selamat

```text
Dalam projek Hab Perbendaharaan Digital (HiPER), baiki overflow pada halaman Tabung Jumaat untuk skrin 375px. Ubah hanya fail halaman tersebut dan src/styles.css. Jangan ubah database, authentication, dependencies atau halaman lain. Jalankan npm run build.
```

```text
Tambah kategori pada pengumuman dengan migration berasingan. Senaraikan schema, RLS, fail kod dan pelan rollback sebelum mengubah apa-apa. Jangan jalankan migration Production.
```

## Arahan yang perlu dielakkan

Jangan gunakan arahan terlalu umum seperti:

```text
Baiki seluruh website dan jadikan lebih professional.
```

Jangan benarkan Jules mengubah `package.json`, lock file, migration, RLS atau environment configuration kecuali perkara itu memang skop tugasan dan telah disemak terlebih dahulu.
