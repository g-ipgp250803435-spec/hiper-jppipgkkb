import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useUi } from '../contexts/UiContext'
import { supabase } from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/config'
import type { Announcement, FundSummary } from '../lib/types'
import { Card, PageHeader, StatCard } from '../components/UI'
import { formatDate, formatMoney } from '../lib/helpers'

const sampleAnnouncements: Announcement[] = [
  {
    id: 'sample-1',
    title_bm: 'Selamat datang ke HiPER',
    title_en: 'Welcome to HiPER',
    content_bm: 'Semua perkhidmatan kebajikan PBAK kini dipusatkan dalam satu portal.',
    content_en: 'PBAK welfare services are now centralised in one portal.',
    poster_url: '/placeholder-poster.svg',
    published: true,
    pinned: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function HomePage() {
  const { language, t } = useUi()
  const [announcements, setAnnouncements] = useState<Announcement[]>(sampleAnnouncements)
  const [fund, setFund] = useState<FundSummary>({ total_verified: 0, total_disbursed: 0, balance: 0 })

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void Promise.all([
      supabase
        .from('announcements')
        .select('*')
        .eq('published', true)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3),
      supabase.rpc('get_public_fund_summary'),
    ]).then(([announcementResult, fundResult]) => {
      if (announcementResult.data?.length) setAnnouncements(announcementResult.data as Announcement[])
      const summary = Array.isArray(fundResult.data) ? fundResult.data[0] : fundResult.data
      if (summary) setFund(summary as FundSummary)
    })
  }, [])

  const services = [
    {
      icon: '♡',
      title: 'iKES',
      description: t('Pinjaman kebajikan tanpa faedah untuk keperluan segera dan perjalanan pulang.', 'Interest-free welfare assistance for urgent needs and travel home.'),
      href: '/ikes',
    },
    {
      icon: '▣',
      title: 'e-Aset',
      description: t('Mohon pinjaman aset JPP dan semak tarikh pemulangan.', 'Request JPP assets and monitor return dates.'),
      href: '/e-aset',
    },
    {
      icon: '◇',
      title: t('Tabung Jumaat', 'Friday Fund'),
      description: t('Salurkan sumbangan dan lihat rekod kutipan serta agihan.', 'Donate and view collection and distribution records.'),
      href: '/tabung-jumaat',
    },
    {
      icon: '◉',
      title: t('Pengumuman', 'Announcements'),
      description: t('Dapatkan hebahan terkini berkaitan elaun, jualan dan kebajikan.', 'Get the latest allowance, sales and welfare updates.'),
      href: '/pengumuman',
    },
  ]

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">PEJABAT BENDAHARI AGUNG KEHORMAT</p>
            <h1>{t('Satu portal untuk kebajikan siswa guru.', 'One portal for student teacher welfare.')}</h1>
            <p>
              {t(
                'Mohon bantuan, pinjam aset, salurkan sumbangan dan semak pengumuman PBAK dengan lebih tersusun.',
                'Request assistance, borrow assets, contribute and check PBAK announcements in one organised place.',
              )}
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/login">
                {t('Log masuk dengan DELIMa', 'Sign in with DELIMa')}
              </Link>
              <Link className="button button-secondary" to="/pengumuman">
                {t('Lihat pengumuman', 'View announcements')}
              </Link>
            </div>
            <div className="trust-row">
              <span>✓ {t('Akses terkawal', 'Controlled access')}</span>
              <span>✓ {t('Mesra telefon', 'Mobile friendly')}</span>
              <span>✓ BM / EN</span>
            </div>
          </div>
          <div className="hero-panel">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <img src="/logo-mark.svg" alt="HiPER" />
            <strong>HiPER</strong>
            <span>{t('Kebajikan · Ketelusan · Perkhidmatan', 'Welfare · Transparency · Service')}</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <PageHeader
            eyebrow={t('PERKHIDMATAN UTAMA', 'CORE SERVICES')}
            title={t('Semua keperluan dalam satu tempat', 'Everything you need in one place')}
          />
          <div className="service-grid">
            {services.map((service) => (
              <Link to={service.href} className="service-card" key={service.href}>
                <span className="service-icon">{service.icon}</span>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                <span className="text-link">{t('Buka perkhidmatan', 'Open service')} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <PageHeader eyebrow={t('KETELUSAN', 'TRANSPARENCY')} title={t('Ringkasan Tabung Jumaat', 'Friday Fund summary')} />
          <div className="stats-grid">
            <StatCard label={t('Jumlah disahkan', 'Verified total')} value={formatMoney(fund.total_verified)} />
            <StatCard label={t('Jumlah diagihkan', 'Total distributed')} value={formatMoney(fund.total_disbursed)} />
            <StatCard label={t('Baki semasa', 'Current balance')} value={formatMoney(fund.balance)} />
          </div>
          <div className="section-action">
            <Link className="button button-secondary" to="/tabung-jumaat">
              {t('Lihat butiran tabung', 'View fund details')}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <PageHeader
            eyebrow={t('HEBAHAN TERKINI', 'LATEST UPDATES')}
            title={t('Pengumuman PBAK', 'PBAK announcements')}
            actions={<Link className="text-link" to="/pengumuman">{t('Lihat semua', 'View all')} →</Link>}
          />
          <div className="announcement-grid compact-grid">
            {announcements.map((item) => (
              <Card key={item.id} className="announcement-card">
                <img src={item.poster_url || '/placeholder-poster.svg'} alt="" />
                <div className="announcement-body">
                  <span className="meta">{formatDate(item.created_at, language)}</span>
                  <h2>{language === 'bm' ? item.title_bm : item.title_en || item.title_bm}</h2>
                  <p>{language === 'bm' ? item.content_bm : item.content_en || item.content_bm}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
