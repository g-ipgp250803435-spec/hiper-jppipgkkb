import { useMemo } from 'react'
import { Button, Card, EmptyState, StatCard, StatusBadge } from '../UI'
import { Icon } from '../Icons'
import { formatDate, formatMoney } from '../../lib/helpers'
import type { Announcement, AssetApplication, AssetItem, Donation, FundDisbursement, IkesApplication, OrganizationMember } from '../../lib/types'

import type { KpkApplication } from '../../lib/types'

type AdminTab = 'overview' | 'ikes' | 'kpk' | 'assets-requests' | 'donations' | 'announcements' | 'catalogue' | 'organization' | 'fund' | 'site'

interface AdminOverviewProps {
  language: 'bm' | 'en'
  t: (bm: string, en: string) => string
  ikes: IkesApplication[]
  kpk?: KpkApplication[]
  assetRequests: AssetApplication[]
  donations: Donation[]
  announcements: Announcement[]
  catalogue: AssetItem[]
  members: OrganizationMember[]
  disbursements: FundDisbursement[]
  unreadNotificationsCount?: number
  onNavigateTab: (tab: AdminTab) => void
  onOpenNotificationsPopup?: () => void
}

export default function AdminOverview({
  language,
  t,
  ikes,
  kpk = [],
  assetRequests,
  donations,
  announcements,
  catalogue,
  members,
  disbursements,
  unreadNotificationsCount = 0,
  onNavigateTab,
  onOpenNotificationsPopup,
}: AdminOverviewProps) {
  const counts = useMemo(() => {
    const pendingIkes = ikes.filter((item) => item.status === 'pending').length
    const pendingKpk = kpk.filter((item) => item.status === 'pending').length
    const pendingAssets = assetRequests.filter((item) => item.status === 'pending').length
    const pendingDonations = donations.filter((item) => item.status === 'pending').length
    const verifiedDonations = donations.filter((item) => item.status === 'verified').reduce((sum, item) => sum + Number(item.amount), 0)

    const totalPending = pendingIkes + pendingKpk + pendingAssets + pendingDonations
    const lowStockAssets = catalogue.filter(
      (item) => item.active && item.stock_available <= Math.max(1, Math.ceil(item.stock_total * 0.2))
    ).length
    const unpublishedAnnouncements = announcements.filter((item) => !item.published).length

    return {
      pendingIkes,
      pendingKpk,
      pendingAssets,
      pendingDonations,
      verifiedDonations,
      totalPending,
      lowStockAssets,
      unpublishedAnnouncements,
    }
  }, [ikes, kpk, assetRequests, donations, catalogue, announcements])

  const recentActivity = useMemo(() => {
    const ikesAct = ikes.map((item) => ({
      id: item.id,
      type: 'ikes',
      name: item.applicant_name,
      status: item.status,
      created_at: item.created_at,
      tab: 'ikes' as AdminTab,
      detail: item.ikes_type === 'care' ? 'iKES Care' : 'iKES Go-Home',
    }))
    const assetAct = assetRequests.map((item) => ({
      id: item.id,
      type: 'asset',
      name: item.applicant_name,
      status: item.status,
      created_at: item.created_at,
      tab: 'assets-requests' as AdminTab,
      detail: language === 'bm' ? item.asset_items?.name_bm : item.asset_items?.name_en || item.asset_items?.name_bm,
    }))
    const donationAct = donations.map((item) => ({
      id: item.id,
      type: 'donation',
      name: item.donor_name || (language === 'bm' ? 'Tanpa nama' : 'Anonymous'),
      status: item.status,
      created_at: item.created_at,
      tab: 'donations' as AdminTab,
      detail: formatMoney(item.amount),
    }))

    const combined = [...ikesAct, ...assetAct, ...donationAct]
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return combined.slice(0, 6)
  }, [ikes, assetRequests, donations, language])

  return (
    <>
      {/* Overview Stat Cards */}
      <div className="stats-grid admin-v2-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label={t('Jumlah Permohonan Hari Ini', 'Applications Today')} value={String(counts.totalPending > 0 ? Math.min(counts.totalPending, 12) : 0)} icon="activity" />
        <StatCard label={t('Menunggu Kelulusan', 'Pending Approval')} value={String(counts.totalPending)} icon="alert" />
        <StatCard label={t('Permohonan Diluluskan', 'Approved')} value={String(ikes.filter((i) => i.status === 'approved').length + assetRequests.filter((a) => a.status === 'approved').length + kpk.filter((k) => k.status === 'approved').length)} icon="check" />
        <StatCard label={t('Tempahan Bilik Aktif', 'Active Bookings')} value={String(counts.pendingAssets + counts.pendingKpk)} icon="calendar" />
      </div>

      <div className="admin-v2-overview-layout">
        <Card title={t('Tindakan Segera & Ringkasan Portal', 'Immediate Attention & Portal Summary')} className="admin-v2-combined-card">
          <div className="admin-v2-combined-section">
            <h4 className="admin-v2-combined-subtitle">{t('Tindakan Segera', 'Immediate Attention')}</h4>
            <div className="admin-v2-attention-list">
              <button onClick={() => onNavigateTab('ikes')} className="admin-v2-attention-item">
                <span className="admin-v2-attention-count">{counts.pendingIkes}</span>
                <span className="admin-v2-attention-label">{t('Permohonan iKES Menunggu', 'Pending iKES Applications')}</span>
                <span className="admin-v2-attention-arrow">
                  <Icon name="chevron-right" size={18} />
                </span>
              </button>

              <button onClick={() => onNavigateTab('kpk')} className="admin-v2-attention-item">
                <span className="admin-v2-attention-count">{counts.pendingKpk}</span>
                <span className="admin-v2-attention-label">{t('Permohonan KPK+ Menunggu', 'Pending KPK+ Applications')}</span>
                <span className="admin-v2-attention-arrow">
                  <Icon name="chevron-right" size={18} />
                </span>
              </button>

              <button onClick={() => onNavigateTab('assets-requests')} className="admin-v2-attention-item">
                <span className="admin-v2-attention-count">{counts.pendingAssets}</span>
                <span className="admin-v2-attention-label">{t('Permohonan e-Aset Menunggu', 'Pending e-Asset Requests')}</span>
                <span className="admin-v2-attention-arrow">
                  <Icon name="chevron-right" size={18} />
                </span>
              </button>

              <button onClick={() => onNavigateTab('donations')} className="admin-v2-attention-item">
                <span className="admin-v2-attention-count">{counts.pendingDonations}</span>
                <span className="admin-v2-attention-label">{t('Sumbangan Perlu Pengesahan', 'Donation Verification Pending')}</span>
                <span className="admin-v2-attention-arrow">
                  <Icon name="chevron-right" size={18} />
                </span>
              </button>

              <button onClick={() => onOpenNotificationsPopup ? onOpenNotificationsPopup() : undefined} className="admin-v2-attention-item">
                <span className="admin-v2-attention-count">{unreadNotificationsCount}</span>
                <span className="admin-v2-attention-label">{t('Notifikasi Belum Dibaca', 'Unread System Notifications')}</span>
                <span className="admin-v2-attention-arrow">
                  <Icon name="chevron-right" size={18} />
                </span>
              </button>

              <button onClick={() => onNavigateTab('catalogue')} className="admin-v2-attention-item admin-v2-low-stock-warning">
                <span className={`admin-v2-attention-count ${counts.lowStockAssets > 0 ? 'admin-v2-warning-highlight' : ''}`}>{counts.lowStockAssets}</span>
                <span className="admin-v2-attention-label">{t('Aset Kurang Stok', 'Low-Stock Assets')}</span>
                <span className="admin-v2-attention-arrow">
                  <Icon name="chevron-right" size={18} />
                </span>
              </button>

              <button onClick={() => onNavigateTab('announcements')} className="admin-v2-attention-item">
                <span className="admin-v2-attention-count">{counts.unpublishedAnnouncements}</span>
                <span className="admin-v2-attention-label">{t('Pengumuman Belum Diterbitkan', 'Unpublished Announcements')}</span>
                <span className="admin-v2-attention-arrow">
                  <Icon name="chevron-right" size={18} />
                </span>
              </button>
            </div>
          </div>

          <div className="admin-v2-combined-divider" />

          <div className="admin-v2-combined-section">
            <h4 className="admin-v2-combined-subtitle">{t('Ringkasan Kandungan Portal', 'Portal Content Summary')}</h4>
            <div className="admin-v2-summary-grid">
              <div className="admin-v2-summary-item">
                <span className="admin-v2-summary-label">{t('Jumlah Pengumuman', 'Total Announcements')}</span>
                <strong className="admin-v2-summary-value">{announcements.length}</strong>
                <span className="admin-v2-summary-sub">
                  {announcements.filter((a) => a.published).length} {t('Diterbitkan', 'Published')}
                </span>
              </div>
              <div className="admin-v2-summary-item">
                <span className="admin-v2-summary-label">{t('Katalog Aset', 'Asset Catalogue')}</span>
                <strong className="admin-v2-summary-value">{catalogue.length}</strong>
                <span className="admin-v2-summary-sub">{t('Aset aktif', 'Active assets')}</span>
              </div>
              <div className="admin-v2-summary-item">
                <span className="admin-v2-summary-label">{t('Ahli Organisasi', 'Organisation Members')}</span>
                <strong className="admin-v2-summary-value">{members.length}</strong>
                <span className="admin-v2-summary-sub">{t('Ahli PBAK', 'PBAK members')}</span>
              </div>
              <div className="admin-v2-summary-item">
                <span className="admin-v2-summary-label">{t('Rekod Agihan Dana', 'Fund Disbursement Records')}</span>
                <strong className="admin-v2-summary-value">{disbursements.length}</strong>
                <span className="admin-v2-summary-sub">
                  {formatMoney(disbursements.reduce((sum, d) => sum + Number(d.amount), 0))} {t('diagihkan', 'disbursed')}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card title={t('Aktiviti Terbaharu', 'Recent Activity')} className="admin-v2-recent-card">
          {recentActivity.length === 0 ? (
            <EmptyState title={t('Tiada aktiviti', 'No recent activity')} />
          ) : (
            <div className="admin-v2-recent-list">
              {recentActivity.map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="admin-v2-recent-item"
                  onClick={() => onNavigateTab(activity.tab)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="admin-v2-recent-meta-col">
                    <span className="admin-v2-recent-type">
                      {activity.type === 'ikes' && t('iKES', 'iKES')}
                      {activity.type === 'asset' && t('e-Aset', 'e-Asset')}
                      {activity.type === 'donation' && t('Derma', 'Donation')}
                    </span>
                    <span className="admin-v2-recent-name">{activity.name}</span>
                    <span className="admin-v2-recent-detail">{activity.detail}</span>
                  </div>
                  <div className="admin-v2-recent-status-col">
                    <StatusBadge status={activity.status as any} />
                    <span className="admin-v2-recent-date">{formatDate(activity.created_at, language)}</span>
                  </div>
                  <div className="admin-v2-recent-action-col">
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onNavigateTab(activity.tab)
                      }}
                      className="compact"
                    >
                      {t('Urus', 'Manage')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
