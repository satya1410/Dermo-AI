'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAnalyses(data.analyses || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }

  function getSeverityBadge(severity) {
    const map = {
      Low: 'badge-success',
      Moderate: 'badge-warning',
      High: 'badge-danger',
      Critical: 'badge-danger',
    };
    return map[severity] || 'badge-neutral';
  }

  function getClassBadge(classification) {
    const map = {
      benign: 'badge-success',
      malignant: 'badge-danger',
    };
    return map[classification] || 'badge-neutral';
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📊 Analysis History</h1>
        <p className="page-subtitle">Review your past skin analyses and reports</p>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="history-list">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="history-item">
                <div className="skeleton" style={{ width: 80, height: 80, borderRadius: 'var(--radius-md)' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '30%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>No Analyses Yet</h3>
            <p>Start by uploading a skin image on the Analysis page to get your first report.</p>
          </div>
        ) : (
          <>
            <div className="history-list">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="history-item"
                  onClick={() => setSelectedAnalysis(selectedAnalysis?.id === analysis.id ? null : analysis)}
                >
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {analysis.image_url ? (
                      <Image
                        src={analysis.image_url}
                        alt="Analysis"
                        width={80}
                        height={80}
                        className="history-thumbnail"
                        onError={() => {
                          // Handle error by showing fallback
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '2rem' }}>
                        {analysis.classification === 'benign' ? '✅' :
                         analysis.classification === 'malignant' ? '⚠️' : '🔍'}
                      </span>
                    )}
                  </div>
                  <div className="history-info">
                    <h3>{analysis.condition_name || 'Skin Analysis'}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      <span className={`badge ${getClassBadge(analysis.classification)}`}>
                        {analysis.classification?.toUpperCase()}
                      </span>
                      <span className={`badge ${getSeverityBadge(analysis.severity)}`}>
                        {analysis.severity}
                      </span>
                      {analysis.confidence && (
                        <span className="badge badge-neutral">
                          {(analysis.confidence * 100).toFixed(0)}% confidence
                        </span>
                      )}
                    </div>
                    <div className="history-meta">
                      <span>📅 {formatDate(analysis.created_at)}</span>
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', alignSelf: 'center' }}>
                    {selectedAnalysis?.id === analysis.id ? '▲' : '▼'}
                  </span>
                </div>
              ))}
            </div>

            {/* Expanded Analysis Detail */}
            {selectedAnalysis && selectedAnalysis.report && (
              <div className="card" style={{ marginTop: '1rem', animation: 'fadeInUp 0.3s ease-out' }}>
                <div className="card-header">
                  <h3 className="card-title">📋 Detailed Report — {selectedAnalysis.condition_name}</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAnalysis(null)}>✕ Close</button>
                </div>

                {selectedAnalysis.report.description && (
                  <div className="report-section">
                    <div className="report-section-title">📝 Description</div>
                    <div className="report-section-content">{selectedAnalysis.report.description}</div>
                  </div>
                )}

                {selectedAnalysis.report.possible_causes?.length > 0 && (
                  <div className="report-section">
                    <div className="report-section-title">🔍 Possible Causes</div>
                    <ul className="report-list">
                      {selectedAnalysis.report.possible_causes.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}

                {selectedAnalysis.report.home_remedies?.length > 0 && (
                  <div className="report-section">
                    <div className="report-section-title">🌿 Home Remedies</div>
                    {selectedAnalysis.report.home_remedies.map((r, i) => (
                      <div key={i} className="remedy-card">
                        <h4>🍃 {r.remedy}</h4>
                        <p>{r.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedAnalysis.report.medical_recommendations?.length > 0 && (
                  <div className="report-section">
                    <div className="report-section-title">🏥 Medical Recommendations</div>
                    <ul className="report-list">
                      {selectedAnalysis.report.medical_recommendations.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}

                {selectedAnalysis.report.when_to_see_doctor && (
                  <div className="report-section">
                    <div className="report-section-title">🚨 When to See a Doctor</div>
                    <div className="report-section-content" style={{
                      padding: '1rem',
                      background: 'var(--danger-bg)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      {selectedAnalysis.report.when_to_see_doctor}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
