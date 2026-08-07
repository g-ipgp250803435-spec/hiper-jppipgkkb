# Vercel build fix — 7 Ogos 2026

Punca deployment gagal ialah tiga fail salinan UI-fix telah diletakkan terus di bawah `src/`, sedangkan import di dalam fail tersebut menganggap fail berada dalam `src/pages/` atau `src/components/`. Oleh sebab `tsconfig.app.json` meng-include seluruh folder `src`, TypeScript tetap mengkompil fail salinan itu walaupun `App.tsx` menggunakan fail canonical.

Fail yang dibetulkan:
- `src/AnnouncementsPage.tsx` → compatibility wrapper ke `src/pages/AnnouncementsPage.tsx`
- `src/DonationsPage.tsx` → compatibility wrapper ke `src/pages/DonationsPage.tsx`
- `src/OrganizationTree.tsx` → compatibility wrapper ke `src/components/OrganizationTree.tsx`

Fail canonical yang mengandungi pembaikan UI kekal:
- `src/pages/AnnouncementsPage.tsx`
- `src/pages/DonationsPage.tsx`
- `src/components/OrganizationTree.tsx`
- `src/styles.css`

Pembaikan UI yang dikekalkan:
1. Pengumuman menggunakan kad poster gaya asal.
2. Carta organisasi parent/child dipusatkan dan menggunakan kad orang gaya asal.
3. Ruang antara header e-Aset dan katalog dipadatkan.
4. Kotak maklumat akaun bank mempunyai spacing dan wrapping yang selamat.

Tiada perubahan database atau Supabase dibuat dalam hotfix build ini.
