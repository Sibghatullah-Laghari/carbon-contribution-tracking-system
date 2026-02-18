import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios.js";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const resData = response?.data?.data;
      if (!resData || !resData.token) {
        throw new Error("Invalid login response");
      }
      localStorage.setItem("token", resData.token);
      localStorage.setItem("role", resData.role);
      navigate("/dashboard");
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <div className="auth-panel">
          <div className="auth-panel-card">
            <span className="auth-panel-kicker">Welcome back to CCTRS</span>
            <h2 className="auth-panel-title">Your impact dashboard is ready.</h2>
            <p className="auth-panel-text">
              Track your progress, verify activities, and celebrate your sustainability journey.
            </p>
            <div className="auth-panel-stats">
              <div className="hero-stat">
                <span className="stat-label">Monthly Points</span>
                <span className="stat-value">+240</span>
              </div>
              <div className="hero-stat">
                <span className="stat-label">Activities</span>
                <span className="stat-value">18</span>
              </div>
              <div className="hero-stat">
                <span className="stat-label">Badge</span>
                <span className="stat-value">Silver</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">🌿</div>
            <h1>Welcome back</h1>
            <p>Track your impact and earn rewards for sustainable actions.</p>
          </div>
          <form onSubmit={handleSubmit} className="form">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <div className="error">{error}</div>}
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
          <div className="auth-footer">
            <span>New here?</span>
            <Link to="/signup">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
