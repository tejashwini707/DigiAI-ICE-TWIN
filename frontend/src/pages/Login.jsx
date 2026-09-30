import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Globe, ShieldCheck, ArrowRight, ShieldAlert, Cpu } from "lucide-react";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("hq@moes.gov.in");
  const [error, setError] = useState("");

  const submit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    const res = await login(email.trim() || "hq@moes.gov.in", "password123");
    if (res.ok) {
      navigate("/");
    } else {
      setError(res.error || "Login failed. Ensure backend server is running on :5000");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 16, 26, 0.65), rgba(6, 11, 19, 0.85)), url('/login-bg.jpg')`,
      }}
    >
      {/* Aurora Ambient Glow Effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--ice-cyan)] opacity-20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[var(--aurora-violet)] opacity-20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-[var(--bg-panel)]/80 border border-[var(--border-subtle)] text-[var(--ice-cyan)] shadow-2xl backdrop-blur-md mb-1">
            <Globe className="w-8 h-8 animate-pulse text-[var(--ice-cyan)]" />
          </div>

          <h1
            className="text-white tracking-tight leading-tight drop-shadow-lg"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "32px",
              fontWeight: "bold",
            }}
          >
            DigiAI ICE TWIN
          </h1>

          <p className="font-mono text-xs text-[var(--ice-cyan)] tracking-wider uppercase font-semibold">
            Antarctic Intelligence &amp; Autonomous Digital Twin
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-[var(--ice-cyan)]/30 bg-[var(--bg-panel)]/80 p-6 sm:p-8 space-y-5 shadow-2xl backdrop-blur-xl">
          <div className="space-y-1 text-center border-b border-[var(--border-subtle)] pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--ice-cyan)]/15 border border-[var(--ice-cyan)]/30 text-[var(--ice-cyan)] text-xs font-mono font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>HQ ADMIN MISSION AUTH</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] pt-1">
              Unified command authorization for Maitri (70°S) &amp; Bharati (69°S) research stations
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5 font-medium font-mono">
                Operator / HQ Admin ID
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hq@moes.gov.in"
                required
                className="w-full bg-[var(--bg-deep)]/90 border border-[var(--border-subtle)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--ice-cyan)] focus:ring-1 focus:ring-[var(--ice-cyan)] transition font-mono"
              />
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-deep)]/60 border border-[var(--border-subtle)] text-[11px] text-[var(--text-tertiary)] font-mono space-y-1">
              <p className="text-[var(--ice-cyan)] font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>Station Switching Enabled</span>
              </p>
              <p>Logging in as HQ Admin grants full twin control &amp; live switching across all polar stations.</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/60 text-red-300 text-xs font-mono">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-display font-bold text-sm text-black bg-[var(--ice-cyan)] hover:bg-[#86efe7] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/25"
            >
              <span>{loading ? "Authenticating HQ Session…" : "Sign In as HQ ADMIN"}</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </form>
        </div>

        <p className="text-center font-mono text-[11px] text-gray-400">
          Autonomous Telemetry · ISRO GSAT-30 SATCOM · Edge AI Engine
        </p>
      </div>
    </div>
  );
}
