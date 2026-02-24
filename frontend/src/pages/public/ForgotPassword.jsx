import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios.js";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            await api.post("/auth/forgot-password", { email });
            setSent(true);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to send reset email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fp-page">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fp-page {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background: linear-gradient(160deg, #0f4d43 0%, #1a7a6e 40%, #2a9d8f 75%, #3dbda8 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 2rem 1.5rem;
        }

        .fp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 3rem;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e8f5f2;
          box-shadow: 0 2px 16px rgba(42,157,143,0.06);
        }
        .fp-nav-left { display: flex; align-items: center; gap: 0.5rem; }
        .fp-nav-logo { font-size: 1.6rem; }
        .fp-nav-name { font-size: 1.2rem; font-weight: 800; color: #2a9d8f; }
        .fp-nav-link {
          font-weight: 700; font-size: 0.9rem; color: #fff;
          text-decoration: none; padding: 0.55rem 1.4rem;
          border-radius: 8px; background: #2a9d8f;
          transition: all 0.2s;
          box-shadow: 0 2px 12px rgba(42,157,143,0.3);
        }
        .fp-nav-link:hover { background: #238a7e; transform: translateY(-1px); }

        .fp-box {
          width: 100%; max-width: 440px;
          background: #fff; border-radius: 24px;
          padding: 2.5rem; margin-top: 80px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }

        .fp-back {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.85rem; color: #2a9d8f; text-decoration: none;
          font-weight: 600; margin-bottom: 1.8rem; transition: gap 0.2s;
        }
        .fp-back:hover { gap: 0.7rem; }

        .fp-header { text-align: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid #f0f4f3; }
        .fp-icon { font-size: 2.5rem; margin-bottom: 0.75rem; display: block; }
        .fp-header h1 { font-size: 1.7rem; font-weight: 800; color: #1a1a1a; margin-bottom: 0.4rem; letter-spacing: -0.02em; }
        .fp-header p { font-size: 0.875rem; color: #999; line-height: 1.6; }

        .fp-form { display: flex; flex-direction: column; gap: 1.2rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-group label { font-size: 0.82rem; font-weight: 600; color: #444; }
        .form-group input {
          width: 100%; padding: 0.78rem 1rem;
          border: 1.5px solid #e2eeec; border-radius: 10px;
          font-size: 0.93rem; font-family: 'Inter', sans-serif;
          color: #1a1a1a; background: #f5fafa;
          transition: all 0.2s; outline: none;
        }
        .form-group input:focus { border-color: #2a9d8f; box-shadow: 0 0 0 3px rgba(42,157,143,0.1); background: #fff; }
        .form-group input::placeholder { color: #bbb; }

        .fp-error { background: #fff0f0; border: 1px solid #ffcccc; color: #cc0000; font-size: 0.83rem; padding: 0.7rem 1rem; border-radius: 8px; text-align: center; }

        .fp-success {
          text-align: center; padding: 1.5rem;
        }
        .fp-success-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
        .fp-success h2 { font-size: 1.3rem; font-weight: 800; color: #1a1a1a; margin-bottom: 0.5rem; }
        .fp-success p { font-size: 0.875rem; color: #666; line-height: 1.7; }
        .fp-success-email { font-weight: 700; color: #2a9d8f; }

        .fp-btn {
          width: 100%; padding: 0.9rem;
          background: #2a9d8f; color: #fff;
          font-size: 1rem; font-weight: 700;
          border: none; border-radius: 10px; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(42,157,143,0.35);
        }
        .fp-btn:hover:not(:disabled) { background: #238a7e; transform: translateY(-1px); }
        .fp-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .fp-footer {
          text-align: center; margin-top: 1.3rem; padding-top: 1.2rem;
          border-top: 1px solid #f0f4f3; font-size: 0.875rem; color: #aaa;
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
        }
        .fp-footer a { color: #2a9d8f; text-decoration: none; font-weight: 700; }
        .fp-footer a:hover { text-decoration: underline; }
      `}</style>

            <nav className="fp-nav">
                <div className="fp-nav-left">
                    <span className="fp-nav-logo">🌍</span>
                    <span className="fp-nav-name">CCTRS</span>
                </div>
                <Link className="fp-nav-link" to="/login">Sign In</Link>
            </nav>

            <div className="fp-box">
                <Link className="fp-back" to="/login">← Back to login</Link>

                <div className="fp-header">
                    <span className="fp-icon">🔑</span>
                    <h1>Forgot password?</h1>
                    <p>No worries! Enter your email and we'll send you a reset link.</p>
                </div>

                {sent ? (
                    <div className="fp-success">
                        <span className="fp-success-icon">📬</span>
                        <h2>Check your email!</h2>
                        <p>We sent a password reset link to<br/><span className="fp-success-email">{email}</span><br/><br/>Click the link in the email to reset your password. Check your spam folder if you don't see it.</p>
                    </div>
                ) : (
                    <form className="fp-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        {error && <div className="fp-error">⚠️ {error}</div>}
                        <button type="submit" className="fp-btn" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Link →"}
                        </button>
                    </form>
                )}

                <div className="fp-footer">
                    <span>Remember your password?</span>
                    <Link to="/login">Login In</Link>
                </div>
            </div>
        </div>
    );
}