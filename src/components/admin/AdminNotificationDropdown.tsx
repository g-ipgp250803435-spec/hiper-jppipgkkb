import { useEffect, useRef } from 'react'
import { Icon } from '../Icons'
import { formatTimeAgo } from '../../lib/helpers'
import type { Notification } from '../../lib/types'

interface AdminNotificationDropdownProps {
  notifications: Notification[]
  language: 'bm' | 'en'
  t: (bm: string, en: string) => string
  onNotificationClick: (notification: Notification) => Promise<void>
  onClearAll: () => Promise<void>
  onClose: () => void
}

export default function AdminNotificationDropdown({
  notifications,
  language,
  t,
  onNotificationClick,
  onClearAll,
  onClose,
}: AdminNotificationDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const getStatusDot = (type: string) => {
    switch (type) {
      case 'e_aset':
      case 'asset':
      case 'kpk':
        return '🟢'
      case 'ikes':
      case 'tabung_jumaat':
      case 'donation':
        return '🟡'
      default:
        return '🟢'
    }
  }

  return (
    <div ref={containerRef} className="admin-notif-popup" role="dialog" aria-label={t('Notifikasi', 'Notifications')}>
      <div className="admin-notif-header">
        <div className="admin-notif-title-wrap">
          <Icon name="bell" size={18} />
          <strong>{t('Notifikasi', 'Notifications')}</strong>
          {unreadCount > 0 && <span className="admin-notif-header-badge">{unreadCount}</span>}
        </div>
        <div className="admin-notif-header-actions">
          {notifications.length > 0 && (
            <button
              type="button"
              className="admin-notif-clear-btn"
              onClick={() => void onClearAll()}
              title={t('Kosongkan semua', 'Clear all')}
            >
              {t('Kosongkan', 'Clear all')}
            </button>
          )}
          <button
            type="button"
            className="admin-notif-close-btn"
            onClick={onClose}
            aria-label={t('Tutup', 'Close')}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      </div>

      <div className="admin-notif-divider" />

      <div className="admin-notif-body">
        {notifications.length === 0 ? (
          <div className="admin-notif-empty">
            <Icon name="bell" size={28} />
            <p>{t('Tiada notifikasi baharu', 'No new notifications')}</p>
          </div>
        ) : (
          <div className="admin-notif-list">
            {notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`admin-notif-item ${item.is_read ? 'read' : 'unread'}`}
                onClick={() => void onNotificationClick(item)}
              >
                <div className="admin-notif-item-header">
                  <span className="admin-notif-status-dot">{getStatusDot(item.notification_type)}</span>
                  <strong className="admin-notif-item-title">{item.title}</strong>
                  {!item.is_read && <span className="admin-notif-new-tag">BARU</span>}
                </div>
                <p className="admin-notif-item-msg">{item.message}</p>
                <span className="admin-notif-item-time">{formatTimeAgo(item.created_at, language)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
