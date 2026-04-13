'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    sex: '',
    height: '',
    weight: '',
    // Doctor fields
    specialization: '',
    hospital: '',
    experience: '',
    phone: '',
  });

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'doctor') setRole('doctor');
  }, [searchParams]);

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Validation
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (role === 'doctor') {
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
      <div className="auth-container" style={{ maxWidth: role === 'doctor' ? 540 : 480 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" className="landing-logo" style={{ justifyContent: 'center', fontSize: '1.8rem' }}>
            <div className="landing-logo-icon">🔬</div>
            <span className="text-gradient">DermoAI</span>
          </Link>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Join DermoAI for intelligent skin health monitoring</p>
          </div>

          {/* Role Toggle */}
          <div className="role-toggle">
            <button
              type="button"
              className={role === 'patient' ? 'active' : ''}
              onClick={() => setRole('patient')}
            >
              🧑 Patient
            </button>
            <button
              type="button"
              className={role === 'doctor' ? 'active' : ''}
              onClick={() => setRole('doctor')}
            >
              🩺 Doctor
            </button>
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
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your full name"
                value={form.name}
                onChange={e => updateForm('name', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => updateForm('email', e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={e => updateForm('password', e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={e => updateForm('confirmPassword', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-divider">Personal Information</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Age</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g., 25"
                  value={form.age}
                  onChange={e => updateForm('age', e.target.value)}
                  min="1"
                  max="120"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sex</label>
                <select
                  className="form-input form-select"
                  value={form.sex}
                  onChange={e => updateForm('sex', e.target.value)}
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
                  placeholder="e.g., 170"
                  value={form.height}
                  onChange={e => updateForm('height', e.target.value)}
                  min="50"
                  max="250"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g., 65"
                  value={form.weight}
                  onChange={e => updateForm('weight', e.target.value)}
                  min="10"
                  max="300"
                />
              </div>
            </div>

            {role === 'doctor' && (
              <>
                <div className="auth-divider">Professional Information</div>

                <div className="form-group">
                  <label className="form-label">Specialization *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Dermatology"
                    value={form.specialization}
                    onChange={e => updateForm('specialization', e.target.value)}
                    required={role === 'doctor'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Hospital / Clinic *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., City General Hospital"
                    value={form.hospital}
                    onChange={e => updateForm('hospital', e.target.value)}
                    required={role === 'doctor'}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Years of Experience</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g., 10"
                      value={form.experience}
                      onChange={e => updateForm('experience', e.target.value)}
                      min="0"
                      max="60"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g., +91-9876543210"
                      value={form.phone}
                      onChange={e => updateForm('phone', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? '⏳ Creating Account...' : `🚀 Create ${role === 'doctor' ? 'Doctor' : 'Patient'} Account`}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link href="/login">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-container"><div className="auth-card"><div className="auth-header"><h1>Loading...</h1></div></div></div></div>}>
      <SignupForm />
    </Suspense>
  );
}
