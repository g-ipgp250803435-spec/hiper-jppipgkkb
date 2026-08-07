import type { SiteSettings } from './types'

export const defaultSiteSettings: SiteSettings = {
  branding: {
    siteName: 'HiPER',
    fullName: {
      bm: 'Hab Perbendaharaan Digital',
      en: 'Digital Treasury Hub',
    },
    tagline: {
      bm: 'Berwibawa, Berintegriti',
      en: 'Authoritative, With Integrity',
    },
    logoUrl: '/hiper-logo.png',
    faviconUrl: '/hiper-favicon.png',
    browserTitle: 'HiPER | PBAK JPP IPGKKB',
    metaDescription: {
      bm: 'Hab Perbendaharaan Digital (HiPER), portal rasmi Pejabat Bendahari Agung Kehormat JPP IPG Kampus Kota Bharu.',
      en: 'Digital Treasury Hub (HiPER), the official portal of the Honorary Treasurer General Office, JPP IPG Kampus Kota Bharu.',
    },
  },
  announcementBar: {
    enabled: true,
    badge: { bm: 'Makluman', en: 'Notice' },
    text: {
      bm: 'Permohonan e-Aset dan iKES kini boleh dibuat sepenuhnya secara dalam talian.',
      en: 'e-Asset and iKES applications can now be completed fully online.',
    },
    linkLabel: { bm: 'Ketahui lanjut', en: 'Learn more' },
    linkUrl: '/pengumuman',
  },
  navigation: {
    home: { bm: 'Utama', en: 'Home' },
    assets: { bm: 'e-Aset', en: 'e-Asset' },
    ikes: { bm: 'iKES', en: 'iKES' },
    fund: { bm: 'Tabung Jumaat', en: 'Friday Fund' },
    announcements: { bm: 'Pengumuman', en: 'Announcements' },
    office: { bm: 'Organisasi', en: 'Organisation' },
    portal: { bm: 'Permohonan Saya', en: 'My Applications' },
    admin: { bm: 'Pentadbir', en: 'Admin' },
  },
  home: {
    eyebrow: {
      bm: 'Pejabat Bendahari Agung Kehormat',
      en: 'Office of the Honorary Treasurer General',
    },
    title: {
      bm: 'Urusan kewangan kampus, dipermudah.',
      en: 'Campus financial services, simplified.',
    },
    description: {
      bm: 'Pinjaman aset, bantuan kebajikan tanpa faedah, ketelusan Tabung Jumaat dan pengumuman rasmi dalam satu pusat operasi digital.',
      en: 'Asset loans, interest-free welfare assistance, Friday Fund transparency and official announcements in one digital operations centre.',
    },
    primaryCtaLabel: { bm: 'Mohon Pinjaman Aset', en: 'Request an Asset' },
    primaryCtaUrl: '/e-aset',
    secondaryCtaLabel: { bm: 'Mohon iKES', en: 'Apply for iKES' },
    secondaryCtaUrl: '/ikes',
    heroImageUrl: '/hiper-logo.png',
    trustOne: { bm: 'Aliran kerja digital', en: 'Digital workflow' },
    trustTwo: { bm: 'Jejak audit penuh', en: 'Complete audit trail' },
    trustThree: { bm: 'Data masa nyata', en: 'Real-time data' },
    servicesEyebrow: { bm: 'Operasi Digital', en: 'Digital Operations' },
    servicesTitle: { bm: 'Satu hab untuk urusan utama PBAK.', en: 'One hub for PBAK’s core services.' },
    servicesDescription: {
      bm: 'Setiap perkhidmatan disusun supaya mudah dicapai, telus dan mesra telefon.',
      en: 'Every service is organised to be accessible, transparent and mobile-friendly.',
    },
    services: [
      { icon: 'box', eyebrow: { bm: 'PINJAMAN ASET', en: 'ASSET LOANS' }, title: { bm: 'e-Aset', en: 'e-Asset' }, description: { bm: 'Semak ketersediaan aset dan hantar permohonan dalam talian.', en: 'Check asset availability and submit an online request.' }, href: '/e-aset' },
      { icon: 'heart', eyebrow: { bm: 'KEBAJIKAN SISWA', en: 'STUDENT WELFARE' }, title: { bm: 'iKES', en: 'iKES' }, description: { bm: 'Bantuan kebajikan tanpa faedah untuk keperluan segera.', en: 'Interest-free welfare assistance for immediate needs.' }, href: '/ikes' },
      { icon: 'fund', eyebrow: { bm: 'KETELUSAN DANA', en: 'FUND TRANSPARENCY' }, title: { bm: 'Tabung Jumaat', en: 'Friday Fund' }, description: { bm: 'Salurkan sumbangan dan lihat rekod kutipan serta agihan.', en: 'Contribute and view collection and distribution records.' }, href: '/tabung-jumaat' },
      { icon: 'megaphone', eyebrow: { bm: 'HEBAHAN RASMI', en: 'OFFICIAL NOTICES' }, title: { bm: 'Pengumuman', en: 'Announcements' }, description: { bm: 'Dapatkan makluman terkini berkaitan kebajikan dan urusan PBAK.', en: 'Get the latest welfare and PBAK operational updates.' }, href: '/pengumuman' },
    ],
    transparencyEyebrow: { bm: 'Tabung Jumaat', en: 'Friday Fund' },
    transparencyTitle: {
      bm: 'Ketelusan yang boleh dilihat, bukan sekadar dijanjikan.',
      en: 'Transparency you can see, not merely promise.',
    },
    announcementsEyebrow: { bm: 'Hebahan Rasmi', en: 'Official Notices' },
    announcementsTitle: { bm: 'Pengumuman PBAK', en: 'PBAK Announcements' },
    officeEyebrow: { bm: 'Hab Perbendaharaan Digital', en: 'Digital Treasury Hub' },
    officeTitle: { bm: '“Berwibawa, Berintegriti”', en: '“Authoritative, With Integrity”' },
    officeDescription: {
      bm: 'Menerajui transformasi digital ke arah pengurusan kewangan yang cekap, telus dan berintegriti.',
      en: 'Leading digital transformation towards efficient, transparent and principled financial management.',
    },
    officeCtaLabel: { bm: 'Kenali pejabat kami', en: 'Meet our office' },
  },
  pages: {
    assets: {
      eyebrow: { bm: 'e-Aset', en: 'e-Asset' },
      title: { bm: 'Aset kampus, sedia untuk digunakan.', en: 'Campus assets, ready to serve.' },
      description: {
        bm: 'Ketersediaan aset dipaparkan secara terbuka dan dikemas kini apabila penyerahan atau pemulangan direkodkan.',
        en: 'Asset availability is displayed openly and updated whenever handover or return is recorded.',
      },
    },
    ikes: {
      eyebrow: { bm: 'Inisiatif Kebajikan Siswa', en: 'Student Welfare Initiative' },
      title: { bm: 'iKES', en: 'iKES' },
      description: {
        bm: 'Bantuan kebajikan tanpa faedah bagi keperluan segera siswa guru.',
        en: 'Interest-free welfare assistance for student teachers’ immediate needs.',
      },
    },
    donations: {
      eyebrow: { bm: 'Tabung Jumaat', en: 'Friday Fund' },
      title: { bm: 'Sumbangan kecil, impak yang nyata.', en: 'Small contributions, visible impact.' },
      description: {
        bm: 'Lihat kutipan, agihan dan baki semasa melalui rekod yang telus.',
        en: 'View collections, distributions and the current balance through transparent records.',
      },
    },
    announcements: {
      eyebrow: { bm: 'Pusat Hebahan', en: 'Notice Centre' },
      title: { bm: 'Pengumuman PBAK', en: 'PBAK Announcements' },
      description: {
        bm: 'Hebahan berkaitan elaun, jualan, kebajikan dan urusan semasa.',
        en: 'Updates on allowances, sales, welfare and current matters.',
      },
    },
    office: {
      eyebrow: { bm: 'Struktur Organisasi', en: 'Organisation Structure' },
      title: { bm: 'Pejabat Bendahari Agung Kehormat', en: 'Office of the Honorary Treasurer General' },
      description: {
        bm: 'Kepimpinan, unit dan ahli PBAK dipaparkan mengikut hierarki rasmi.',
        en: 'PBAK leadership, units and members are displayed according to the official hierarchy.',
      },
    },
    login: {
      eyebrow: { bm: 'Akses DELIMa', en: 'DELIMa Access' },
      title: { bm: 'Akses khas warga IPGKKB', en: 'Exclusive access for the IPGKKB community' },
      description: {
        bm: 'Gunakan akaun DELIMa atau akaun pentadbir yang telah dilantik untuk mengakses portal.',
        en: 'Use your DELIMa account or an appointed administrator account to access the portal.',
      },
    },
  },
  footer: {
    bandEyebrow: { bm: 'Hab Perbendaharaan Digital', en: 'Digital Treasury Hub' },
    bandTitle: { bm: '“Berwibawa, Berintegriti”', en: '“Authoritative, With Integrity”' },
    bandDescription: {
      bm: 'Menerajui transformasi digital ke arah pengurusan kewangan yang cekap, telus dan berintegriti.',
      en: 'Leading digital transformation towards efficient, transparent and principled financial management.',
    },
    bandCtaLabel: { bm: 'Kenali pejabat kami', en: 'Meet our office' },
    brandDescription: {
      bm: 'Hab Perbendaharaan Digital ialah sistem operasi digital Pejabat Bendahari Agung Kehormat.',
      en: 'The Digital Treasury Hub is the digital operations system of the Honorary Treasurer General Office.',
    },
    contactTitle: { bm: 'Hubungi', en: 'Contact' },
    officeName: { bm: 'Pejabat Bendahari Agung Kehormat', en: 'Office of the Honorary Treasurer General' },
    address: 'Bangunan Jawatankuasa Perwakilan Pelajar\nIPG Kampus Kota Bharu\nJalan Maktab, Pengkalan Chepa\n16109 Kota Bharu\nKelantan',
    email: 'jppipgkkb.rasmi@ipg.edu.my',
    privacyLabel: { bm: 'Dasar Privasi', en: 'Privacy Policy' },
    privacyUrl: '#',
    copyright: {
      bm: 'Hak cipta terpelihara Pejabat Bendahari Agung Kehormat JPP IPGKKB.',
      en: 'All rights reserved by the Honorary Treasurer General Office, JPP IPGKKB.',
    },
    versionLabel: 'Hab Perbendaharaan Digital · v2.0',
  },
  notifications: {
    enabled: true,
    subjectPrefix: '[HiPER]',
  },
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export function mergeSiteSettings<T>(defaults: T, incoming: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(incoming)) {
    return (incoming === undefined || incoming === null ? defaults : incoming) as T
  }

  const output: Record<string, unknown> = { ...defaults }
  Object.entries(incoming).forEach(([key, value]) => {
    const defaultValue = (defaults as Record<string, unknown>)[key]
    if (value === undefined || value === null) {
      output[key] = defaultValue
    } else if (isPlainObject(defaultValue) && isPlainObject(value)) {
      output[key] = mergeSiteSettings(defaultValue, value)
    } else if (Array.isArray(defaultValue) && !Array.isArray(value)) {
      output[key] = defaultValue
    } else {
      output[key] = value
    }
  })
  return output as T
}

export const localise = (value: { bm: string; en: string }, language: 'bm' | 'en') =>
  language === 'bm' ? value.bm : value.en || value.bm
