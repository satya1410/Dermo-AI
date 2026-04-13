'use client';

import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ analyses: 0, appointments: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProfile(data.profile);
      setStats(data.stats || { analyses: 0, appointments: 0 });
      setEditForm(data.profile || {});
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (res.ok) {
        setProfile(data.profile);
        setEditing(false);
        setMessage('Profile updated successfully!');
        // Update local storage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...storedUser, ...data.profile }));
      } else {
        setMessage(data.error || 'Failed to update profile');
      }
    } catch {
      setMessage('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function getBMI() {
    if (profile?.height && profile?.weight) {
      const bmi = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);
      let category = '';
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi < 25) category = 'Normal';
      else if (bmi < 30) category = 'Overweight';
      else category = 'Obese';
      return { value: bmi, category };
    }
    return null;
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton" style={{ height: 28, width: 150, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 250 }} />
        </div>
        <div className="page-body">
          <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-xl)', marginBottom: 24 }} />
          <div className="profile-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 70, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const bmi = getBMI();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👤 Profile</h1>
        <p className="page-subtitle">Manage your personal and medical information</p>
      </div>

      <div className="page-body">
        {message && (
          <div style={{
            padding: '0.75rem 1rem',
            background: message.includes('success') ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: `1px solid ${message.includes('success') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            borderRadius: 'var(--radius-md)',
            color: message.includes('success') ? 'var(--success)' : 'var(--danger)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
          }}>
            {message.includes('success') ? '✅' : '⚠️'} {message}
          </div>
        )}

        {/* Profile Header */}
        <div className="profile-header-card">
          <div className="profile-avatar-large">
            {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="profile-info">
            <h2>{profile?.name}</h2>
            <p>{profile?.email}</p>
            <div className="profile-stats">
              <div className="profile-stat">
                <div className="profile-stat-value">{stats.analyses}</div>
                <div className="profile-stat-label">Analyses</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-value">{stats.appointments}</div>
                <div className="profile-stat-label">Appointments</div>
              </div>
              {bmi && (
                <div className="profile-stat">
                  <div className="profile-stat-value">{bmi.value}</div>
                  <div className="profile-stat-label">BMI ({bmi.category})</div>
                </div>
              )}
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setEditing(!editing)}
            style={{ alignSelf: 'flex-start' }}
          >
            {editing ? '✕ Cancel' : '✏️ Edit Profile'}
          </button>
        </div>

        {/* Edit Form */}
        {editing ? (
          <form onSubmit={handleSave} className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Edit Profile Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.name || ''}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.age || ''}
                    onChange={e => setEditForm({ ...editForm, age: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sex</label>
                  <select
                    className="form-input form-select"
                    value={editForm.sex || ''}
                    onChange={e => setEditForm({ ...editForm, sex: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Height (cm)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.height || ''}
                    onChange={e => setEditForm({ ...editForm, height: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.weight || ''}
                    onChange={e => setEditForm({ ...editForm, weight: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editForm.phone || ''}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          /* Profile Fields */
          <div className="profile-grid">
            <div className="profile-field">
              <div className="profile-field-label">Full Name</div>
              <div className="profile-field-value">{profile?.name || '—'}</div>
            </div>
            <div className="profile-field">
              <div className="profile-field-label">Email</div>
              <div className="profile-field-value">{profile?.email || '—'}</div>
            </div>
            <div className="profile-field">
              <div className="profile-field-label">Age</div>
              <div className="profile-field-value">{profile?.age ? `${profile.age} years` : '—'}</div>
            </div>
            <div className="profile-field">
              <div className="profile-field-label">Sex</div>
              <div className="profile-field-value">{profile?.sex || '—'}</div>
            </div>
            <div className="profile-field">
              <div className="profile-field-label">Height</div>
              <div className="profile-field-value">{profile?.height ? `${profile.height} cm` : '—'}</div>
            </div>
            <div className="profile-field">
              <div className="profile-field-label">Weight</div>
              <div className="profile-field-value">{profile?.weight ? `${profile.weight} kg` : '—'}</div>
            </div>
            <div className="profile-field">
              <div className="profile-field-label">Phone</div>
              <div className="profile-field-value">{profile?.phone || '—'}</div>
            </div>
            <div className="profile-field">
              <div className="profile-field-label">Member Since</div>
              <div className="profile-field-value">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                }) : '—'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
