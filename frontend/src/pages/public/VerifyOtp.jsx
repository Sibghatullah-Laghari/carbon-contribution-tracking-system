import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios.js";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stateEmail = location.state?.email;
    const storedEmail = sessionStorage.getItem("pendingEmail");
    const resolvedEmail = stateEmail || storedEmail || "";
    setEmail(resolvedEmail);
  }, [location.state]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setResendMessage("");
    if (!email) {
      setError("Missing email. Please sign up again.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email, otp });
      sessionStorage.removeItem("pendingEmail");
      setMessage("Account created. You can now log in.");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "OTP verification failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    setResendMessage("");
    if (!email) {
      setError("Missing email. Please sign up again.");
      return;
    }
    setResendLoading(true);
    try {
      await api.post("/auth/resend-otp", { email });
      setResendMessage("A new OTP has been sent to your email.");
      setCooldown(30);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to resend OTP";
      setError(msg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <div className="auth-panel">
          <div className="auth-panel-card">
            <span className="auth-panel-kicker">Verify OTP</span>
            <h2 className="auth-panel-title">Confirm your account securely.</h2>
            <p className="auth-panel-text">
              Enter the code we sent to your email to finish creating your account.
            </p>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">OTP</div>
            <h1>Verify your email</h1>
            <p>Enter the 6-digit code sent to your inbox.</p>
          </div>
          {!email && (
            <div className="error">
              Missing email. Please <Link to="/signup">sign up</Link> again.
            </div>
          )}
          <form onSubmit={handleSubmit} className="form">
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              OTP Code
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                required
              />
            </label>
            {error && <div className="error">{error}</div>}
            {message && <div className="success">{message}</div>}
            {resendMessage && <div className="success">{resendMessage}</div>}
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={handleResend}
              disabled={resendLoading || cooldown > 0}
            >
              {resendLoading
                ? "Resending..."
                : cooldown > 0
                  ? `Resend available in ${cooldown}s`
                  : "Resend OTP"}
            </button>
          </form>
          <div className="auth-footer">
            <span>Need to start over?</span>
            <Link to="/signup">Back to signup</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
