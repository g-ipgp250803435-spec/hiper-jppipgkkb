import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useUi } from '../contexts/UiContext'
import { supabase } from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/config'
import type { Announcement, FundSummary } from '../lib/types'
import { Card, PageHeader, StatCard } from '../components/UI'
import { Icon, type IconName } from '../components/Icons'
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
      setAnnouncements((announcementResult.data as Announcement[]) || [])
      const summary = Array.isArray(fundResult.data) ? fundResult.data[0] : fundResult.data
      if (summary) setFund(summary as FundSummary)
    })
  }, [])

  const services: { icon: IconName; title: string; description: string; href: string }[] = [
    {
      icon: 'heart',
      title: 'iKES',
      description: t('Pinjaman kebajikan tanpa faedah untuk keperluan segera dan perjalanan pulang.', 'Interest-free welfare assistance for urgent needs and travel home.'),
      href: '/ikes',
    },
    {
      icon: 'box',
      title: 'e-Aset',
      description: t('Mohon pinjaman aset JPP dan semak tarikh pemulangan.', 'Request JPP assets and monitor return dates.'),
      href: '/e-aset',
    },
    {
      icon: 'fund',
      title: t('Tabung Jumaat', 'Friday Fund'),
      description: t('Salurkan sumbangan dan lihat rekod kutipan serta agihan.', 'Donate and view collection and distribution records.'),
      href: '/tabung-jumaat',
    },
    {
      icon: 'megaphone',
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
            <p className="eyebrow">HAB PERBENDAHARAAN DIGITAL · PBAK</p>
            <h1>{t('Satu hab digital untuk kebajikan dan perbendaharaan siswa guru.', 'One digital hub for student teacher welfare and treasury services.')}</h1>
            <p>
              {t(
                'Mohon bantuan, pinjam aset, salurkan sumbangan dan semak pengumuman PBAK dengan lebih tersusun.',
                'Request assistance, borrow assets, contribute and check PBAK announcements in one organised place.',
              )}
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/login">
                <Icon name="login" size={18} />
                {t('Log masuk dengan DELIMa', 'Sign in with DELIMa')}
              </Link>
              <Link className="button button-secondary" to="/pengumuman">
                <Icon name="megaphone" size={18} />
                {t('Lihat pengumuman', 'View announcements')}
              </Link>
            </div>
            <div className="trust-row">
              <span><Icon name="check" size={16} /> {t('Akses terkawal', 'Controlled access')}</span>
              <span><Icon name="check" size={16} /> {t('Mesra telefon', 'Mobile friendly')}</span>
              <span><Icon name="language" size={16} /> BM / EN</span>
            </div>
          </div>
          <div className="hero-panel">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <img src="/logo-mark.svg" alt="Logo HiPER" />
            <strong>HiPER</strong>
            <span>{t('Hab Perbendaharaan Digital', 'Digital Treasury Hub')}</span>
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
                <span className="service-icon"><Icon name={service.icon} size={24} /></span>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                <span className="text-link">
                  {t('Buka perkhidmatan', 'Open service')} <Icon name="chevron-right" size={17} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <PageHeader eyebrow={t('KETELUSAN', 'TRANSPARENCY')} title={t('Ringkasan Tabung Jumaat', 'Friday Fund summary')} />
          <div className="stats-grid">
            <StatCard icon="fund" label={t('Jumlah disahkan', 'Verified total')} value={formatMoney(fund.total_verified)} />
            <StatCard icon="activity" label={t('Jumlah diagihkan', 'Total distributed')} value={formatMoney(fund.total_disbursed)} />
            <StatCard icon="dashboard" label={t('Baki semasa', 'Current balance')} value={formatMoney(fund.balance)} />
          </div>
          <div className="section-action">
            <Link className="button button-secondary" to="/tabung-jumaat">
              {t('Lihat butiran tabung', 'View fund details')}
              <Icon name="chevron-right" size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <PageHeader
            eyebrow={t('HEBAHAN TERKINI', 'LATEST UPDATES')}
            title={t('Pengumuman PBAK', 'PBAK announcements')}
            actions={
              <Link className="text-link inline-icon-link" to="/pengumuman">
                {t('Lihat semua', 'View all')} <Icon name="chevron-right" size={17} />
              </Link>
            }
          />
          {announcements.length === 0 ? (
            <Card className="home-announcement-empty">
              <p>{t('Belum ada pengumuman diterbitkan.', 'No announcements have been published yet.')}</p>
            </Card>
          ) : (
            <div className="announcement-grid compact-grid home-announcement-grid">
              {announcements.map((item) => (
                <Link to="/pengumuman" key={item.id} className="home-announcement-link">
                  <Card className="announcement-card home-announcement-card">
                    <div className="announcement-poster-wrap">
                      <img src={item.poster_url || '/placeholder-poster.svg'} alt={language === 'bm' ? item.title_bm : item.title_en || item.title_bm} />
                      {item.pinned && <span className="poster-pin"><Icon name="pin" size={14} /> {t('Penting', 'Pinned')}</span>}
                    </div>
                    <div className="announcement-body">
                      <span className="meta"><Icon name="calendar" size={14} /> {formatDate(item.created_at, language)}</span>
                      <h2>{language === 'bm' ? item.title_bm : item.title_en || item.title_bm}</h2>
                      <span className="text-link inline-icon-link">{t('Baca pengumuman', 'Read announcement')} <Icon name="chevron-right" size={16} /></span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
