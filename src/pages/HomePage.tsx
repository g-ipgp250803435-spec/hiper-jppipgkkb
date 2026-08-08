import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useUi } from '../contexts/UiContext'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import { supabase } from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/config'
import { localise } from '../lib/siteSettings'
import type { Announcement, FundSummary } from '../lib/types'
import { Card, PageHeader } from '../components/UI'
import { Icon } from '../components/Icons'
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
  const { settings } = useSiteSettings()
  const [announcements, setAnnouncements] = useState<Announcement[]>(isSupabaseConfigured ? [] : sampleAnnouncements)
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
      if (announcementResult.error) {
        console.warn('HiPER announcements could not be loaded:', announcementResult.error.message)
        setAnnouncements([])
      } else {
        setAnnouncements((announcementResult.data as Announcement[]) || [])
      }
      if (fundResult.error) {
        console.warn('HiPER fund summary could not be loaded:', fundResult.error.message)
        return
      }
      const summary = Array.isArray(fundResult.data) ? fundResult.data[0] : fundResult.data
      if (summary) setFund(summary as FundSummary)
    }).catch((error) => {
      console.warn('HiPER homepage data request failed:', error)
      setAnnouncements([])
    })
  }, [])

  const services = settings.home.services


  return (
    <>
      <section className="premium-hero">
        <div className="container premium-hero-grid">
          <div className="premium-hero-copy">
            <p className="eyebrow">{localise(settings.home.eyebrow, language)}</p>
            <h1>{localise(settings.home.title, language)}</h1>
            <p className="hero-description">{localise(settings.home.description, language)}</p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" to={settings.home.primaryCtaUrl || '/e-aset'}>
                {localise(settings.home.primaryCtaLabel, language)} <Icon name="chevron-right" size={18} />
              </Link>
              <Link className="button button-secondary button-large" to={settings.home.secondaryCtaUrl || '/ikes'}>
                {localise(settings.home.secondaryCtaLabel, language)}
              </Link>
            </div>
            <div className="premium-trust-row">
              <span><Icon name="check" size={16} /> {localise(settings.home.trustOne, language)}</span>
              <span><Icon name="shield" size={16} /> {localise(settings.home.trustTwo, language)}</span>
              <span><Icon name="chart" size={16} /> {localise(settings.home.trustThree, language)}</span>
            </div>
          </div>
          <div className="premium-hero-mark" aria-hidden="true">
            <span className="hero-ring hero-ring-one" />
            <span className="hero-ring hero-ring-two" />
            <img src={settings.home.heroImageUrl || settings.branding.logoUrl || '/hiper-logo.png'} alt="" />
          </div>
        </div>
      </section>

      <section className="section premium-services-section">
        <div className="container">
          <PageHeader
            eyebrow={localise(settings.home.servicesEyebrow, language)}
            title={localise(settings.home.servicesTitle, language)}
            description={localise(settings.home.servicesDescription, language)}
          />
          <div className="premium-service-grid">
            {services.map((service) => (
              <Link to={service.href} className="premium-service-card" key={service.href}>
                <span className="premium-service-icon"><Icon name={service.icon} size={24} /></span>
                <span className="premium-service-eyebrow">{localise(service.eyebrow, language)}</span>
                <h2>{localise(service.title, language)}</h2>
                <p>{localise(service.description, language)}</p>
                <span className="premium-card-link">{t('Buka perkhidmatan', 'Open service')} <Icon name="chevron-right" size={17} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section fund-showcase-section">
        <div className="container">
          <PageHeader
            eyebrow={localise(settings.home.transparencyEyebrow, language)}
            title={localise(settings.home.transparencyTitle, language)}
          />
          <div className="fund-showcase-grid">
            <div className="fund-feature-card">
              <span>{t('BAKI SEMASA', 'CURRENT BALANCE')}</span>
              <strong>{formatMoney(fund.balance)}</strong>
              <p>{t('Dikemas kini daripada kutipan disahkan dan rekod agihan.', 'Updated from verified collections and distribution records.')}</p>
              <div className="fund-progress"><span style={{ width: fund.total_verified > 0 ? `${Math.min(100, Math.max(8, (fund.balance / fund.total_verified) * 100))}%` : '0%' }} /></div>
              <small>{t('Rekod kewangan dipaparkan secara telus', 'Financial records are displayed transparently')}</small>
            </div>
            <div className="fund-metric-card">
              <Icon name="chart" size={22} />
              <span>{t('KUTIPAN · DISAHKAN', 'COLLECTIONS · VERIFIED')}</span>
              <strong>{formatMoney(fund.total_verified)}</strong>
            </div>
            <div className="fund-metric-card">
              <Icon name="wallet" size={22} />
              <span>{t('AGIHAN · DIREKODKAN', 'DISTRIBUTIONS · RECORDED')}</span>
              <strong>{formatMoney(fund.total_disbursed)}</strong>
            </div>
            <div className="fund-metric-card">
              <Icon name="shield" size={22} />
              <span>{t('STATUS REKOD', 'RECORD STATUS')}</span>
              <strong className="fund-status-value">{t('TELUS', 'TRANSPARENT')}</strong>
            </div>
          </div>
          <div className="section-action">
            <Link className="button button-secondary" to="/tabung-jumaat">
              {t('Lihat ketelusan awam', 'View public transparency')} <Icon name="chevron-right" size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section premium-announcements-section">
        <div className="container">
          <PageHeader
            eyebrow={localise(settings.home.announcementsEyebrow, language)}
            title={localise(settings.home.announcementsTitle, language)}
            actions={
              <Link className="premium-text-link" to="/pengumuman">
                {t('Lihat semua', 'View all')} <Icon name="chevron-right" size={17} />
              </Link>
            }
          />
          {announcements.length === 0 ? (
            <Card><p>{t('Belum ada pengumuman diterbitkan.', 'No announcements have been published yet.')}</p></Card>
          ) : (
            <div className="premium-announcement-grid">
              {announcements.map((item) => (
                <Link to="/pengumuman" key={item.id} className="premium-announcement-card">
                  <div className="premium-announcement-poster">
                    <img src={item.poster_url || '/placeholder-poster.svg'} alt={language === 'bm' ? item.title_bm : item.title_en || item.title_bm} />
                    {item.pinned && <span><Icon name="pin" size={13} /> {t('Penting', 'Pinned')}</span>}
                  </div>
                  <div className="premium-announcement-copy">
                    <span><Icon name="calendar" size={14} /> {formatDate(item.created_at, language)}</span>
                    <h2>{language === 'bm' ? item.title_bm : item.title_en || item.title_bm}</h2>
                    <b>{t('Baca pengumuman', 'Read announcement')} <Icon name="chevron-right" size={16} /></b>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
