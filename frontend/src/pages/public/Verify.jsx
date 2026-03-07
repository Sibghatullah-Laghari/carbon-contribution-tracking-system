import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios.js";

export default function Verify() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setError("Verification token is missing.");
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const response = await api.get(`/auth/verify?token=${encodeURIComponent(token)}`);
        setMessage(response?.data?.message || "Email verified successfully.");
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Verification failed.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [params]);

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <div className="auth-panel">
          <div className="auth-panel-card">
            <span className="auth-panel-kicker">Email verification</span>
            <h2 className="auth-panel-title">Secure your account access.</h2>
            <p className="auth-panel-text">
              We are confirming your account details to keep your rewards safe.
            </p>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">🌿</div>
            <h1>Email verification</h1>
            <p>Confirming your account.</p>
          </div>
          {loading && <div className="info">Verifying...</div>}
          {!loading && message && <div className="success">{message}</div>}
          {!loading && error && <div className="error">{error}</div>}
          <button type="button" className="primary-btn" onClick={() => navigate("/login")}
          >
            Go to login
          </button>
        </div>
      </div>
    </div>
  );
}
