import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios.js";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await api.post("/auth/send-otp", form);
      sessionStorage.setItem("pendingEmail", form.email);
      setMessage("OTP sent to your email. Please verify.");
      setTimeout(() => navigate("/verify-otp", { state: { email: form.email } }), 800);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Signup failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <div className="auth-panel">
          <div className="auth-panel-card">
            <span className="auth-panel-kicker">Start your journey</span>
            <h2 className="auth-panel-title">Create an account and grow your impact.</h2>
            <p className="auth-panel-text">
              Join the community and earn rewards for every sustainable action you take.
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
            <div className="auth-logo">🌱</div>
            <h1>Create account</h1>
            <p>Join the community and start earning rewards for your impact.</p>
          </div>
          <form onSubmit={handleSubmit} className="form">
            <label>
              Full Name
              <input name="name" value={form.name} onChange={onChange} required />
            </label>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
              />
            </label>
            <label>
              Username
              <input name="username" value={form.username} onChange={onChange} required />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                required
              />
            </label>
            {error && <div className="error">{error}</div>}
            {message && <div className="success">{message}</div>}
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Creating..." : "Signup"}
            </button>
          </form>
          <div className="auth-footer">
            <span>Already have an account?</span>
            <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
