import { useState } from 'react'
import { Button, Card, EmptyState } from '../UI'
import { Icon } from '../Icons'
import { formatDate } from '../../lib/helpers'
import type { Notification } from '../../lib/types'

interface AdminNotificationsProps {
  t: (bm: string, en: string) => string
  language: 'bm' | 'en'
  notifications: Notification[]
  onMarkAsRead: (id: string) => Promise<void>
  onClearAll: () => Promise<void>
}

export default function AdminNotifications({
  t,
  language,
  notifications,
  onMarkAsRead,
  onClearAll,
}: AdminNotificationsProps) {
  const [filterType, setFilterType] = useState<string>('all')

  const filtered = notifications.filter((item) => {
    if (filterType === 'all') return true
    return item.notification_type === filterType
  })

  return (
    <Card title={t('Notifikasi Sistem & Permohonan', 'System & Application Notifications')} className="table-card">
      <div className="admin-v2-filter-toolbar">
        <div className="admin-v2-status-wrap">
          <select className="admin-v2-status-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">{t('Semua Jenis Notifikasi', 'All Notification Types')}</option>
            <option value="e_aset">{t('e-Aset', 'e-Asset')}</option>
            <option value="ikes">{t('iKES', 'iKES')}</option>
            <option value="tabung_jumaat">{t('Tabung Jumaat', 'Tabung Jumaat')}</option>
            <option value="announcement">{t('Pengumuman', 'Announcement')}</option>
          </select>
        </div>
        <div className="admin-v2-toolbar-right">
          <span className="admin-v2-results-count">
            {t(`Menunjukkan ${filtered.length} daripada ${notifications.length} notifikasi`, `Showing ${filtered.length} of ${notifications.length} notifications`)}
          </span>
          {notifications.length > 0 && (
            <Button variant="ghost" className="admin-v2-clear-btn compact" onClick={() => void onClearAll()}>
              {t('Kosongkan Semua', 'Clear All')}
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('Tiada notifikasi', 'No notifications')} description={t('Tiada pemberitahuan sistem terbaharu.', 'No recent system notifications.')} />
      ) : (
        <div className="management-list">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="management-item management-item-rich"
              style={{
                background: item.is_read ? 'transparent' : 'var(--bg-card-highlight, rgba(160, 20, 40, 0.05))',
                borderColor: item.is_read ? 'var(--border-color)' : 'var(--primary-color, #800000)',
              }}
            >
              <div className="management-thumb">
                <Icon name="bell" size={24} />
              </div>
              <div className="management-copy">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em', color: 'var(--ink-soft)' }}>
                    {item.notification_type.replace('_', ' ')}
                  </strong>
                  {!item.is_read && <span style={{ background: 'var(--primary-color, #800000)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>BARU</span>}
                </div>
                <strong style={{ display: 'block', fontSize: '15px', marginTop: '2px' }}>{item.title}</strong>
                <p className="management-excerpt" style={{ color: 'var(--ink-body)', marginTop: '4px' }}>{item.message}</p>
                <small style={{ color: 'var(--ink-soft)' }}>{formatDate(item.created_at, language)}</small>
              </div>
              <div className="management-actions">
                {!item.is_read && (
                  <Button variant="secondary" className="compact" onClick={() => void onMarkAsRead(item.id)}>
                    <Icon name="check" size={16} /> {t('Tanda dibaca', 'Mark read')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
