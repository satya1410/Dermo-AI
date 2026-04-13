'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === 'doctor') {
        router.push('/doctor-dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" className="landing-logo" style={{ justifyContent: 'center', fontSize: '1.8rem' }}>
            <div className="landing-logo-icon">🔬</div>
            <span className="text-gradient">DermoAI</span>
          </Link>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in to access your skin health dashboard</p>
          </div>

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'var(--danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger)',
              fontSize: '0.9rem',
              marginBottom: '1rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? '⏳ Signing in...' : '🔓 Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don&apos;t have an account? <Link href="/signup">Create Account</Link></p>
            <p style={{ marginTop: '0.5rem' }}>
              Are you a doctor? <Link href="/signup?role=doctor">Register as Doctor</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
