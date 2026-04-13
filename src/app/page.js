'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      setNews(data.news || []);
    } catch (err) {
      console.error('Failed to fetch news:', err);
    } finally {
      setLoadingNews(false);
    }
  }

  return (
    <div>
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-icon">🔬</div>
          <span className="text-gradient">DermoAI</span>
        </div>
        <div className="landing-nav-links">
          <Link href="/login" className="btn btn-ghost">Log In</Link>
          <Link href="/signup" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            ✨ AI-Powered Dermatology Analysis
          </div>
          <h1>
            <span className="text-gradient">Advanced Skin Analysis</span>
            <br />
            Powered by AI
          </h1>
          <p>
            Upload or capture a photo of your skin condition and receive an instant, 
            detailed medical report with AI-powered diagnosis, home remedies, and 
            direct access to specialist dermatologists.
          </p>
          <div className="hero-buttons">
            <Link href="/signup" className="btn btn-primary btn-lg">
              🩺 Start Free Analysis
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg">
              Sign In →
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">95%+</div>
              <div className="hero-stat-label">Accuracy Rate</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">50+</div>
              <div className="hero-stat-label">Conditions Detected</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">&lt;30s</div>
              <div className="hero-stat-label">Analysis Time</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">24/7</div>
              <div className="hero-stat-label">Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2><span className="text-gradient">How It Works</span></h2>
          <p>Three simple steps to get a comprehensive skin analysis report</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>Upload or Capture</h3>
            <p>Take a photo of the affected skin area or upload an existing image. Our AI validates the image quality before analysis.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>AI Analysis</h3>
            <p>Our advanced AI, powered by Google Gemini, analyzes your skin condition — classifying it as benign, malignant, wound type, or skin condition.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Detailed Report</h3>
            <p>Receive a comprehensive report including diagnosis, severity level, possible causes, home remedies, and medical recommendations.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍⚕️</div>
            <h3>Doctor Consultation</h3>
            <p>Connect directly with specialist dermatologists. Book appointments and share your AI analysis report with your doctor.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Track Progress</h3>
            <p>Monitor your skin health over time with a complete history of analyses. Track changes and improvements in your condition.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure & Private</h3>
            <p>Your medical data is encrypted and stored securely in the cloud. Only you and your authorized doctors can access your reports.</p>
          </div>
        </div>
      </section>

      {/* Medical News Section */}
      <section className="news-section" id="news">
        <div className="section-header">
          <h2><span className="text-gradient">Latest in Medical News</span></h2>
          <p>Stay informed with the latest developments in dermatology and skin health</p>
        </div>
        <div className="news-grid">
          {loadingNews ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="news-card">
                <div className="news-card-image skeleton" style={{ height: 200 }} />
                <div className="news-card-body">
                  <div className="skeleton" style={{ height: 16, width: 80, marginBottom: 12, borderRadius: 20 }} />
                  <div className="skeleton" style={{ height: 20, width: '90%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '100%', marginBottom: 4 }} />
                  <div className="skeleton" style={{ height: 14, width: '70%' }} />
                </div>
              </div>
            ))
          ) : news.length > 0 ? (
            news.map((article) => (
              <div key={article.id} className="news-card">
                <div className="news-card-image">
                  <span>{article.emoji || '📰'}</span>
                </div>
                <div className="news-card-body">
                  <span className="news-card-category">{article.category}</span>
                  <h3>{article.title}</h3>
                  <p>{article.summary}</p>
                  <div className="news-card-meta">
                    <span>📅 {article.date}</span>
                    <span>📰 {article.source}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-state-icon">📰</div>
              <h3>News Loading...</h3>
              <p>Medical news will appear here shortly.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="features-section">
        <div className="section-header">
          <h2><span className="text-gradient">Ready to Get Started?</span></h2>
          <p>Join thousands of users who trust DermoAI for their skin health monitoring</p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn btn-primary btn-lg">
              Create Free Account
            </Link>
            <Link href="/signup?role=doctor" className="btn btn-secondary btn-lg">
              🩺 Register as Doctor
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2026 DermoAI. AI-Powered Skin Analysis Platform. All rights reserved.</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
          ⚠️ Disclaimer: This tool provides AI-assisted analysis for informational purposes only. 
          Always consult a qualified healthcare professional for medical advice.
        </p>
      </footer>
    </div>
  );
}
