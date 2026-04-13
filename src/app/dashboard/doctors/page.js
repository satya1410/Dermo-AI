'use client';

import { useState, useEffect } from 'react';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    scheduled_date: '',
    scheduled_time: '',
    reason: '',
    analysis_id: '',
  });
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchAnalyses();
  }, []);

  async function fetchDoctors() {
    try {
      const res = await fetch('/api/doctors');
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalyses() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAnalyses(data.analyses || []);
    } catch {}
  }

  async function fetchAvailableSlots(doctorId, date) {
    if (!doctorId || !date) {
      setAvailableSlots([]);
      return;
    }
    setFetchingSlots(true);
    try {
      const res = await fetch(`/api/slots?doctor_id=${doctorId}&date=${date}`);
      const data = await res.json();
      setAvailableSlots(data.available_slots || []);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setAvailableSlots([]);
    } finally {
      setFetchingSlots(false);
    }
  }

  function openBookingModal(doctor) {
    setSelectedDoctor(doctor);
    setShowModal(true);
    setBookingForm({ scheduled_date: '', scheduled_time: '', reason: '', analysis_id: '' });
    setAvailableSlots([]);
    setBookingSuccess('');
    setBookingError('');
  }

  async function handleBookAppointment(e) {
    e.preventDefault();
    setBooking(true);
    setBookingError('');
    setBookingSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          ...bookingForm,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBookingError(data.error || 'Failed to book appointment');
        return;
      }

      setBookingSuccess('Appointment request sent! The doctor will be notified.');
      setTimeout(() => {
        setShowModal(false);
        setBookingSuccess('');
      }, 2000);
    } catch {
      setBookingError('Network error. Please try again.');
    } finally {
      setBooking(false);
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👨‍⚕️ Doctors</h1>
        <p className="page-subtitle">Find and book appointments with specialist dermatologists</p>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="doctors-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="doctor-card">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%' }} />
                  <div>
                    <div className="skeleton" style={{ height: 18, width: 150, marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 14, width: 100 }} />
                  </div>
                </div>
                <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👨‍⚕️</div>
            <h3>No Doctors Available</h3>
            <p>Doctors will appear here once they register on the platform.</p>
          </div>
        ) : (
          <div className="doctors-grid">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="doctor-card-modern">
                <div className="doctor-card-header-modern">
                  <div className="doctor-avatar-modern">
                    <div className="avatar-gradient">
                      {doctor.name?.charAt(0)?.toUpperCase() || 'D'}
                    </div>
                  </div>
                  <div className="doctor-info-modern">
                    <h3 className="doctor-name-modern">{doctor.name}</h3>
                    <p className="doctor-specialization-modern">{doctor.specialization}</p>
                  </div>
                </div>

                <div className="doctor-details-modern">
                  <div className="detail-item-modern">
                    <div className="detail-icon-modern">🏥</div>
                    <span>{doctor.hospital || 'Hospital not specified'}</span>
                  </div>
                  <div className="detail-item-modern">
                    <div className="detail-icon-modern">📅</div>
                    <span>{doctor.experience ? `${doctor.experience} years experience` : 'Experience not specified'}</span>
                  </div>
                  {doctor.phone && (
                    <div className="detail-item-modern">
                      <div className="detail-icon-modern">📞</div>
                      <span>{doctor.phone}</span>
                    </div>
                  )}
                </div>

                <button
                  className="book-btn-modern"
                  onClick={() => openBookingModal(doctor)}
                >
                  <span className="btn-icon">📋</span>
                  Book Appointment
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Book Appointment</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="doctor-avatar" style={{ width: 48, height: 48, fontSize: '1rem' }}>
                {selectedDoctor?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{selectedDoctor?.name}</div>
                <div style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>{selectedDoctor?.specialization}</div>
              </div>
            </div>

            {bookingSuccess && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--success-bg)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--success)',
                fontSize: '0.9rem',
                marginBottom: '1rem',
              }}>
                ✅ {bookingSuccess}
              </div>
            )}

            {bookingError && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--danger-bg)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                fontSize: '0.9rem',
                marginBottom: '1rem',
              }}>
                ⚠️ {bookingError}
              </div>
            )}

            <form onSubmit={handleBookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Preferred Date *</label>
                <input
                  type="date"
                  className="form-input"
                  min={today}
                  value={bookingForm.scheduled_date}
                  onChange={e => {
                    const date = e.target.value;
                    setBookingForm({ ...bookingForm, scheduled_date: date, scheduled_time: '' });
                    fetchAvailableSlots(selectedDoctor?.id, date);
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Available Time Slots *</label>
                {fetchingSlots ? (
                  <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="analyzing-spinner" style={{ width: 16, height: 16 }} />
                    Loading slots...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="form-input" style={{ color: 'var(--text-secondary)' }}>
                    {bookingForm.scheduled_date ? 'No slots available for this date' : 'Select a date first'}
                  </div>
                ) : (
                  <select
                    className="form-input form-select"
                    value={bookingForm.scheduled_time}
                    onChange={e => setBookingForm({ ...bookingForm, scheduled_time: e.target.value })}
                    required
                  >
                    <option value="">Select a time slot</option>
                    {availableSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {new Date(`2000-01-01T${slot}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Related Analysis (Optional)</label>
                <select
                  className="form-input form-select"
                  value={bookingForm.analysis_id}
                  onChange={e => setBookingForm({ ...bookingForm, analysis_id: e.target.value })}
                >
                  <option value="">No specific analysis</option>
                  {analyses.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.condition_name} — {a.severity} ({new Date(a.created_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Visit</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Describe your concern..."
                  value={bookingForm.reason}
                  onChange={e => setBookingForm({ ...bookingForm, reason: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={booking}>
                {booking ? '⏳ Sending Request...' : '📤 Send Appointment Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
