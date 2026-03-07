import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios.js";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (password !== confirm) { setError("Passwords do not match"); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
        setLoading(true);
        try {
            await api.post("/auth/reset-password", { token, password });
            setDone(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rp-page">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .rp-page {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background: linear-gradient(160deg, #0f4d43 0%, #1a7a6e 40%, #2a9d8f 75%, #3dbda8 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 2rem 1.5rem;
        }

        .rp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 3rem;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e8f5f2;
          box-shadow: 0 2px 16px rgba(42,157,143,0.06);
        }
        .rp-nav-left { display: flex; align-items: center; gap: 0.5rem; }
        .rp-nav-logo { font-size: 1.6rem; }
        .rp-nav-name { font-size: 1.2rem; font-weight: 800; color: #2a9d8f; }
        .rp-nav-link {
          font-weight: 700; font-size: 0.9rem; color: #fff;
          text-decoration: none; padding: 0.55rem 1.4rem;
          border-radius: 8px; background: #2a9d8f;
          transition: all 0.2s;
          box-shadow: 0 2px 12px rgba(42,157,143,0.3);
        }
        .rp-nav-link:hover { background: #238a7e; transform: translateY(-1px); }

        .rp-box {
          width: 100%; max-width: 440px;
          background: #fff; border-radius: 24px;
          padding: 2.5rem; margin-top: 80px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }

        .rp-header { text-align: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid #f0f4f3; }
        .rp-icon { font-size: 2.5rem; margin-bottom: 0.75rem; display: block; }
        .rp-header h1 { font-size: 1.7rem; font-weight: 800; color: #1a1a1a; margin-bottom: 0.4rem; letter-spacing: -0.02em; }
        .rp-header p { font-size: 0.875rem; color: #999; line-height: 1.6; }

        .rp-form { display: flex; flex-direction: column; gap: 1.2rem; }
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

        .rp-error { background: #fff0f0; border: 1px solid #ffcccc; color: #cc0000; font-size: 0.83rem; padding: 0.7rem 1rem; border-radius: 8px; text-align: center; }

        .rp-success { text-align: center; padding: 1rem 0; }
        .rp-success-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
        .rp-success h2 { font-size: 1.3rem; font-weight: 800; color: #1a1a1a; margin-bottom: 0.5rem; }
        .rp-success p { font-size: 0.875rem; color: #666; line-height: 1.7; }

        .rp-btn {
          width: 100%; padding: 0.9rem;
          background: #2a9d8f; color: #fff;
          font-size: 1rem; font-weight: 700;
          border: none; border-radius: 10px; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(42,157,143,0.35);
        }
        .rp-btn:hover:not(:disabled) { background: #238a7e; transform: translateY(-1px); }
        .rp-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .rp-footer {
          text-align: center; margin-top: 1.3rem; padding-top: 1.2rem;
          border-top: 1px solid #f0f4f3; font-size: 0.875rem; color: #aaa;
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
        }
        .rp-footer a { color: #2a9d8f; text-decoration: none; font-weight: 700; }
        .rp-footer a:hover { text-decoration: underline; }

        .strength-bar { height: 4px; border-radius: 100px; margin-top: 6px; transition: all 0.3s; }
        .strength-weak { background: #ff4444; width: 33%; }
        .strength-medium { background: #ffaa00; width: 66%; }
        .strength-strong { background: #2a9d8f; width: 100%; }
        .strength-label { font-size: 0.75rem; margin-top: 4px; }
      `}</style>

            <nav className="rp-nav">
                <div className="rp-nav-left">
                    <span className="rp-nav-logo">🌍</span>
                    <span className="rp-nav-name">CCTRS</span>
                </div>
                <Link className="rp-nav-link" to="/login">Sign In</Link>
            </nav>

            <div className="rp-box">
                <div className="rp-header">
                    <span className="rp-icon">🔒</span>
                    <h1>Reset password</h1>
                    <p>Enter your new password below.</p>
                </div>

                {done ? (
                    <div className="rp-success">
                        <span className="rp-success-icon">✅</span>
                        <h2>Password reset!</h2>
                        <p>Your password has been updated successfully.<br/>Redirecting you to login...</p>
                    </div>
                ) : (
                    <form className="rp-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {password.length > 0 && (
                                <>
                                    <div className={`strength-bar ${password.length < 6 ? "strength-weak" : password.length < 10 ? "strength-medium" : "strength-strong"}`}></div>
                                    <span className="strength-label" style={{color: password.length < 6 ? "#ff4444" : password.length < 10 ? "#ffaa00" : "#2a9d8f"}}>
                    {password.length < 6 ? "Weak" : password.length < 10 ? "Medium" : "Strong ✓"}
                  </span>
                                </>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                            />
                            {confirm.length > 0 && password !== confirm && (
                                <span style={{fontSize:"0.75rem", color:"#ff4444"}}>Passwords do not match</span>
                            )}
                            {confirm.length > 0 && password === confirm && (
                                <span style={{fontSize:"0.75rem", color:"#2a9d8f"}}>✓ Passwords match</span>
                            )}
                        </div>
                        {error && <div className="rp-error">⚠️ {error}</div>}
                        <button type="submit" className="rp-btn" disabled={loading}>
                            {loading ? "Resetting..." : "Reset Password →"}
                        </button>
                    </form>
                )}

                <div className="rp-footer">
                    <span>Remember your password?</span>
                    <Link to="/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
}