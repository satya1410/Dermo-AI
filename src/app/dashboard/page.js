'use client';

import { useState, useRef, useCallback } from 'react';

export default function AnalysisPage() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function processFile(file) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setError('');
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setImage(dataUrl);
    setImagePreview(dataUrl);
    stopCamera();
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  }

  function clearImage() {
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleAnalyze() {
    if (!image) return;
    setAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Analysis failed');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  function getSeverityColor(severity) {
    switch (severity?.toLowerCase()) {
      case 'low': return 'var(--success)';
      case 'moderate': return 'var(--warning)';
      case 'high': return 'var(--danger)';
      case 'critical': return '#dc2626';
      default: return 'var(--text-muted)';
    }
  }

  function getClassificationEmoji(classification) {
    switch (classification?.toLowerCase()) {
      case 'benign': return '✅';
      case 'malignant': return '⚠️';
      case 'wound': return '🩹';
      case 'skin_condition': return '🔍';
      default: return '📋';
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔬 Skin Analysis</h1>
        <p className="page-subtitle">Upload or capture a skin image for AI-powered analysis</p>
      </div>

      <div className="page-body">
        <div className="analysis-container">
          {/* Camera View */}
          {showCamera && (
            <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  maxHeight: 400,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-tertiary)',
                }}
              />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={capturePhoto}>
                  📸 Capture Photo
                </button>
                <button className="btn btn-secondary" onClick={stopCamera}>
                  ✕ Cancel
                </button>
              </div>
            </div>
          )}

          {/* Upload Zone */}
          {!image && !showCamera && (
            <div
              className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-zone-icon">📤</div>
              <h3>Upload Skin Image</h3>
              <p>Drag and drop an image here, or click to browse</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Supported: JPG, PNG, WEBP • Max size: 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <div className="upload-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                  📁 Choose File
                </button>
                <button className="btn btn-secondary" onClick={startCamera}>
                  📷 Use Camera
                </button>
              </div>
            </div>
          )}

          {/* Image Preview */}
          {image && !analyzing && (
            <div>
              <div className="preview-container">
                <img src={imagePreview} alt="Skin image preview" className="preview-image" />
                <div className="preview-overlay">
                  <button className="btn btn-icon btn-secondary" onClick={clearImage} title="Remove image">
                    ✕
                  </button>
                </div>
              </div>

              {!result && (
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="btn btn-primary btn-lg" onClick={handleAnalyze}>
                    🧠 Analyze Skin Condition
                  </button>
                  <button className="btn btn-secondary" onClick={clearImage}>
                    🔄 Upload Different Image
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Analyzing State */}
          {analyzing && (
            <div className="card">
              <div className="analyzing-overlay">
                <div className="analyzing-spinner" />
                <div>
                  <h3>Analyzing Your Skin Image...</h3>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Our AI is examining the image for conditions, causes, and remedies
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)' }}>
                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                <div>
                  <strong>Analysis Error</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Not Skin Result */}
          {result && !result.is_skin && (
            <div className="card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '2rem' }}>🚫</span>
                <div>
                  <h3 style={{ color: 'var(--warning)' }}>Not a Skin Image</h3>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {result.message || result.reason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Report */}
          {result && result.is_skin && result.analysis && (
            <div className="report-container" style={{ marginTop: '1.5rem' }}>
              <div className="card">
                {/* Report Header */}
                <div className="report-header">
                  <div
                    className={`report-status-icon ${result.analysis.severity?.toLowerCase()}`}
                    style={{ color: getSeverityColor(result.analysis.severity) }}
                  >
                    {getClassificationEmoji(result.analysis.classification || result.analysis.report?.classification)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.4rem' }}>
                      {result.analysis.condition_name || result.analysis.report?.condition_name}
                    </h2>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${
                        (result.analysis.classification || result.analysis.report?.classification) === 'malignant' ? 'badge-danger' :
                        (result.analysis.classification || result.analysis.report?.classification) === 'wound' ? 'badge-warning' :
                        (result.analysis.classification || result.analysis.report?.classification) === 'benign' ? 'badge-success' : 'badge-info'
                      }`}>
                        {(result.analysis.classification || result.analysis.report?.classification)?.toUpperCase()}
                      </span>
                      <span className="badge" style={{
                        background: `${getSeverityColor(result.analysis.severity || result.analysis.report?.severity)}20`,
                        color: getSeverityColor(result.analysis.severity || result.analysis.report?.severity),
                        border: `1px solid ${getSeverityColor(result.analysis.severity || result.analysis.report?.severity)}40`,
                      }}>
                        {result.analysis.severity || result.analysis.report?.severity} Severity
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confidence */}
                {(result.analysis.confidence || result.analysis.report?.confidence) && (
                  <div className="report-section">
                    <div className="report-section-title">📊 AI Confidence</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="confidence-bar" style={{ flex: 1 }}>
                        <div
                          className="confidence-fill"
                          style={{ width: `${((result.analysis.confidence || result.analysis.report?.confidence) * 100).toFixed(0)}%` }}
                        />
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {((result.analysis.confidence || result.analysis.report?.confidence) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Description */}
                {(result.analysis.report?.description) && (
                  <div className="report-section">
                    <div className="report-section-title">📝 Description</div>
                    <div className="report-section-content">{result.analysis.report.description}</div>
                  </div>
                )}

                {/* Possible Causes */}
                {result.analysis.report?.possible_causes?.length > 0 && (
                  <div className="report-section">
                    <div className="report-section-title">🔍 Possible Causes</div>
                    <ul className="report-list">
                      {result.analysis.report.possible_causes.map((cause, i) => (
                        <li key={i}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk Factors */}
                {result.analysis.report?.risk_factors?.length > 0 && (
                  <div className="report-section">
                    <div className="report-section-title">⚡ Risk Factors</div>
                    <ul className="report-list">
                      {result.analysis.report.risk_factors.map((factor, i) => (
                        <li key={i}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Symptoms to Watch */}
                {result.analysis.report?.symptoms_to_watch?.length > 0 && (
                  <div className="report-section">
                    <div className="report-section-title">👁️ Symptoms to Watch</div>
                    <ul className="report-list">
                      {result.analysis.report.symptoms_to_watch.map((symptom, i) => (
                        <li key={i}>{symptom}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Home Remedies */}
                {result.analysis.report?.home_remedies?.length > 0 && (
                  <div className="report-section">
                    <div className="report-section-title">🌿 Home Remedies</div>
                    {result.analysis.report.home_remedies.map((remedy, i) => (
                      <div key={i} className="remedy-card">
                        <h4>🍃 {remedy.remedy}</h4>
                        <p>{remedy.description}</p>
                        <span className="remedy-effectiveness" style={{
                          color: remedy.effectiveness === 'High' ? 'var(--success)' :
                                 remedy.effectiveness === 'Moderate' ? 'var(--warning)' : 'var(--text-muted)',
                        }}>
                          Effectiveness: {remedy.effectiveness}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Medical Recommendations */}
                {result.analysis.report?.medical_recommendations?.length > 0 && (
                  <div className="report-section">
                    <div className="report-section-title">🏥 Medical Recommendations</div>
                    <ul className="report-list">
                      {result.analysis.report.medical_recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* When to See Doctor */}
                {result.analysis.report?.when_to_see_doctor && (
                  <div className="report-section">
                    <div className="report-section-title">🚨 When to See a Doctor</div>
                    <div className="report-section-content" style={{
                      padding: '1rem',
                      background: 'var(--danger-bg)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      {result.analysis.report.when_to_see_doctor}
                    </div>
                  </div>
                )}

                {/* Prevention Tips */}
                {result.analysis.report?.prevention_tips?.length > 0 && (
                  <div className="report-section">
                    <div className="report-section-title">🛡️ Prevention Tips</div>
                    <ul className="report-list">
                      {result.analysis.report.prevention_tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Lifestyle Advice */}
                {result.analysis.report?.lifestyle_advice && (
                  <div className="report-section">
                    <div className="report-section-title">💡 Personalized Lifestyle Advice</div>
                    <div className="report-section-content">{result.analysis.report.lifestyle_advice}</div>
                  </div>
                )}

                {/* Additional Notes */}
                {result.analysis.report?.additional_notes && (
                  <div className="report-section">
                    <div className="report-section-title">📌 Additional Notes</div>
                    <div className="report-section-content">{result.analysis.report.additional_notes}</div>
                  </div>
                )}

                {/* Disclaimer */}
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                }}>
                  ⚠️ <strong>Disclaimer:</strong> This AI analysis is for informational purposes only and does not constitute medical advice.
                  Always consult a qualified healthcare professional for proper diagnosis and treatment.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
