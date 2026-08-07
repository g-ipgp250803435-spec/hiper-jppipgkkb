# Sistem Reka Bentuk HiPER Premium V2

## Arah visual

Reka bentuk diterjemahkan daripada rujukan website lama yang diberikan:

- latar warm ivory dan pale rose;
- maroon gelap sebagai warna autoriti;
- dark gold sebagai aksen rasmi;
- header desktop dua tingkat;
- tajuk editorial berskala besar;
- garis pemisah halus, radius terkawal dan shadow lembut;
- whitespace luas serta kandungan yang tidak padat;
- kad aset dan kewangan yang menyerupai laporan korporat moden;
- jalur penutup maroon dan footer maklumat berwarna krim.

Font khusus rujukan tidak disalin. Heading menggunakan Georgia dan fallback serif sistem, manakala isi menggunakan font UI sistem supaya website ringan dan tidak bergantung pada fail font luar.

## Token utama

Semua token utama berada pada awal `src/styles.css`:

- `--maroon-*`: warna jenama dan permukaan gelap;
- `--gold-*`: aksen, pautan dan status premium;
- `--canvas`, `--canvas-rose`: latar halaman;
- `--surface`, `--surface-muted`: kad dan permukaan;
- `--line`, `--line-strong`: sempadan;
- `--radius-*`: radius komponen;
- `--shadow-*`: hierarki elevation;
- `--container`: lebar kandungan maksimum;
- `--header-offset`: offset komponen sticky.

## Breakpoint

- Lebih 1180px: desktop penuh.
- 981–1180px: desktop/laptop kompak.
- 821–980px: tablet, navigasi desktop dalam grid seimbang.
- 820px dan ke bawah: drawer telefon.
- 600px dan ke bawah: kad dan borang satu kolum.
- 360px dan ke bawah: kawalan header dipadatkan dengan selamat.

## Prinsip komponen

- Jangan gunakan absolute positioning untuk menyusun navigasi utama.
- Jangan tambah CSS patch navigation baharu di hujung fail; ubah rule asal.
- Gunakan class khusus komponen, bukan selector global yang luas.
- Kekalkan focus state, `aria-label`, active state dan kawasan klik yang selesa.
- Gunakan `Icon` daripada `src/components/Icons.tsx`, bukan emoji.
- Kandungan admin yang boleh berubah mesti datang daripada `site_settings` atau jadual modul berkaitan.
