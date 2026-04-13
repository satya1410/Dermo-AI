'use client';

import { useState, useEffect } from 'react';

export default function DoctorDashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(appointmentId, status) {
    setActionLoading(appointmentId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchAppointments();
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusBadge(status) {
    const map = {
      pending: 'badge-warning',
      accepted: 'badge-success',
      rejected: 'badge-danger',
      completed: 'badge-info',
    };
    return map[status] || 'badge-neutral';
  }

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const otherAppointments = appointments.filter(a => a.status !== 'pending');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🏠 Doctor Dashboard</h1>
        <p className="page-subtitle">Manage your appointments and patient consultations</p>
      </div>

      <div className="page-body">
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--warning)' }}>
              {pendingAppointments.length}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pending Requests</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success)' }}>
              {appointments.filter(a => a.status === 'accepted').length}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Accepted</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {appointments.length}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Appointments</div>
          </div>
        </div>

        {/* Pending Appointments */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
          ⏳ Pending Appointment Requests
        </h2>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton" style={{ height: 20, width: '50%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 36, width: '40%' }} />
              </div>
            ))}
          </div>
        ) : pendingAppointments.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon">📋</div>
            <h3>No Pending Requests</h3>
            <p>New appointment requests from patients will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {pendingAppointments.map((apt) => (
              <div key={apt.id} className="card card-glow">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                      👤 {apt.patient?.name || 'Unknown Patient'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <span>📅 Date: {apt.scheduled_date}</span>
                      <span>🕐 Time: {apt.scheduled_time}</span>
                      {apt.patient?.age && <span>🎂 Age: {apt.patient.age} • {apt.patient.sex}</span>}
                      {apt.reason && <span>📝 Reason: {apt.reason}</span>}
                      {apt.analysis && (
                        <span>
                          🔬 Analysis: {apt.analysis.condition_name} 
                          <span className={`badge ${apt.analysis.severity === 'High' || apt.analysis.severity === 'Critical' ? 'badge-danger' : 'badge-warning'}`} style={{ marginLeft: '0.5rem' }}>
                            {apt.analysis.severity}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleAction(apt.id, 'accepted')}
                      disabled={actionLoading === apt.id}
                    >
                      {actionLoading === apt.id ? '...' : '✅ Accept'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleAction(apt.id, 'rejected')}
                      disabled={actionLoading === apt.id}
                    >
                      {actionLoading === apt.id ? '...' : '❌ Reject'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Other Appointments */}
        {otherAppointments.length > 0 && (
          <>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', marginTop: '2rem' }}>
              📋 All Appointments
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {otherAppointments.map((apt) => (
                <div key={apt.id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{apt.patient?.name || 'Patient'}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.75rem', fontSize: '0.87rem' }}>
                        {apt.scheduled_date} at {apt.scheduled_time}
                      </span>
                    </div>
                    <span className={`badge ${getStatusBadge(apt.status)}`}>
                      {apt.status?.toUpperCase()}
                    </span>
                  </div>
                  {apt.analysis && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.87rem', color: 'var(--text-secondary)' }}>
                      🔬 {apt.analysis.condition_name} ({apt.analysis.classification}) — {apt.analysis.severity}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
