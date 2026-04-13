'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DoctorDashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.user) {
        if (data.user.role !== 'doctor') {
          router.push('/dashboard');
          return;
        }
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchNotificationCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUnreadCount(data.unread_count || 0);
    } catch {}
  }, []);

  useEffect(() => {
    checkAuth();
    fetchNotificationCount();
  }, [checkAuth, fetchNotificationCount]);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  const navItems = [
    { href: '/doctor-dashboard', label: 'Dashboard', icon: '🏠', exact: true },
    { href: '/doctor-dashboard/notifications', label: 'Notifications', icon: '🔔', badge: unreadCount },
  ];

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loader">
          <div className="loader-dot" />
          <div className="loader-dot" />
          <div className="loader-dot" />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <button
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/" className="sidebar-logo">
            <div className="landing-logo-icon" style={{ width: 32, height: 32, fontSize: '1rem' }}>🔬</div>
            <span className="text-gradient">DermoAI</span>
          </Link>
          <span className="badge badge-info" style={{ marginLeft: 'auto' }}>Doctor</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {item.badge > 0 && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={handleLogout} title="Click to logout">
            <div className="sidebar-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'Doctor'}</div>
              <div className="sidebar-user-email">{user?.email || ''}</div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>🚪</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>

      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
