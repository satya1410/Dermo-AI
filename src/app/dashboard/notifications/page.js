'use client';

import { useState, useEffect } from 'react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id) {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch {}
  }

  async function markAllAsRead() {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await markAsRead(n.id);
    }
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'appointment': return '📋';
      case 'report': return '📊';
      case 'system': return '🔔';
      default: return '📬';
    }
  }

  function formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">🔔 Notifications</h1>
            <p className="page-subtitle">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-ghost" onClick={markAllAsRead}>
              ✓ Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="notifications-list">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="notification-item">
                <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 16, width: '50%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 12, width: '20%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <h3>No Notifications</h3>
            <p>You&apos;ll receive notifications about your analyses and appointment updates here.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
                style={{ cursor: !notification.is_read ? 'pointer' : 'default' }}
              >
                <div className={`notification-icon ${notification.type}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{formatTime(notification.created_at)}</div>
                </div>
                {!notification.is_read && (
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--accent-cyan)',
                    flexShrink: 0,
                    alignSelf: 'center',
                  }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
