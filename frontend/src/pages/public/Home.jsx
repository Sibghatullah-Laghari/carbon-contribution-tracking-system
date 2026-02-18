import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home">
      <header className="home-header">
        <div className="home-brand">
          <span className="home-logo">🌍</span>
          <span className="home-title">CCTRS</span>
        </div>
        <div className="home-actions">
          <Link className="ghost-btn" to="/login">Login</Link>
          <Link className="primary-btn" to="/signup">Signup</Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-grid">
          <div className="hero-content">
            <h1>Turn everyday eco actions into rewards</h1>
            <p>
              Track your sustainable habits, earn points, and celebrate your impact with badges and
              community recognition.
            </p>
            <div className="hero-buttons">
              <Link className="primary-btn" to="/signup">Get Started</Link>
              <Link className="ghost-btn" to="/login">I already have an account</Link>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-stat">
              <span className="stat-label">Monthly Points</span>
              <span className="stat-value">+240</span>
            </div>
            <div className="hero-stat">
              <span className="stat-label">Activities Logged</span>
              <span className="stat-value">18</span>
            </div>
            <div className="hero-stat">
              <span className="stat-label">Current Badge</span>
              <span className="stat-value">Silver</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="card feature-card">
          <div className="feature-icon">📷</div>
          <h3>Quick verification</h3>
          <p>Capture a photo and location to validate your eco-friendly actions.</p>
        </div>
        <div className="card feature-card">
          <div className="feature-icon">📊</div>
          <h3>Progress insights</h3>
          <p>Track monthly performance and keep improving your sustainability score.</p>
        </div>
        <div className="card feature-card">
          <div className="feature-icon">🏆</div>
          <h3>Earn recognition</h3>
          <p>Climb the leaderboard and unlock badges as your impact grows.</p>
        </div>
      </section>
    </div>
  );
}
