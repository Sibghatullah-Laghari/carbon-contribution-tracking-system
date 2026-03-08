import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function OAuth2Callback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get("token");
        const role = searchParams.get("role");

        if (token && role) {
            // Decode email from JWT payload (same field AuthContext uses)
            let email = null;
            try {
                email = JSON.parse(atob(token.split(".")[1])).sub ?? null;
            } catch {
                // token is malformed — fall through to error redirect
                navigate("/login?error=oauth_failed", { replace: true });
                return;
            }

            // Use AuthContext.login so React state is updated alongside localStorage
            login(token, role, email);

            // Redirect based on role
            if (role === "ADMIN") {
                navigate("/admin-cctrs-2024", { replace: true });
            } else {
                navigate("/dashboard", { replace: true });
            }
        } else {
            navigate("/login?error=oauth_failed", { replace: true });
        }
    }, [searchParams, navigate, login]);

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(160deg, #0f4d43 0%, #2a9d8f 100%)",
            flexDirection: "column", gap: "1rem"
        }}>
            <div style={{
                width: 48, height: 48, border: "4px solid rgba(255,255,255,0.3)",
                borderTop: "4px solid #fff", borderRadius: "50%",
                animation: "spin 0.8s linear infinite"
            }}></div>
            <p style={{ color: "#fff", fontWeight: 600, fontSize: "1rem" }}>
                Signing you in with Google...
            </p>
            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}
