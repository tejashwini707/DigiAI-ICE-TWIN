import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Globe,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  Cpu,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  UserCheck,
  Sparkles,
  Radio,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const QUICK_PROFILES = [
  {
    id: "hq",
    label: "HQ Global Director",
    email: "hq@moes.gov.in",
    password: "MissionAdmin#2026",
    role: "admin",
    clearance: "LEVEL-5 TOP SECRET",
    station: "All Polar Stations (Maitri + Bharati)",
    desc: "Full command authority, disaster injection, and cross-station twin synchronization.",
  },
  {
    id: "maitri",
    label: "Maitri Station Lead",
    email: "maitri@moes.gov.in",
    password: "PolarLead@Maitri2026",
    role: "operator",
    clearance: "LEVEL-4 POLAR COMMAND",
    station: "Maitri Station (70°S)",
    desc: "Schirmacher Oasis operations, Diesel Gensets, Lake Priyadarshini water pipeline.",
  },
  {
    id: "bharati",
    label: "Bharati Station Lead",
    email: "bharati@moes.gov.in",
    password: "PolarLead@Bharati2026",
    role: "operator",
    clearance: "LEVEL-4 POLAR COMMAND",
    station: "Bharati Station (69°S)",
    desc: "Larsemann Hills operations, GSAT-30 uplink, containerised green habitat module.",
  },
];

export default function Login() {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("hq@moes.gov.in");
  const [password, setPassword] = useState("MissionAdmin#2026");
  const [name, setName] = useState("");
  const [stationCode, setStationCode] = useState("MAITRI");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("hq");

  // Calculate password strength score (0 to 4)
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "Empty", color: "bg-gray-600", text: "text-gray-400" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: "Basic", color: "bg-red-500", text: "text-red-400" };
    if (score === 2) return { score: 2, label: "Moderate", color: "bg-amber-500", text: "text-amber-400" };
    if (score === 3) return { score: 3, label: "Strong", color: "bg-cyan-400", text: "text-cyan-300" };
    return { score: 4, label: "Military-Grade Polar Clearance", color: "bg-emerald-400", text: "text-emerald-300" };
  }, [password]);

  const handleSelectProfile = (p) => {
    setSelectedProfileId(p.id);
    setEmail(p.email);
    setPassword(p.password);
    setError("");
  };

  const submit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessNotice("");

    if (!email.trim()) {
      setError("Please provide an Operator ID / Email.");
      return;
    }

    if (!password || password.length < 4) {
      setError("Security password must be at least 4 characters.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        setError("Please provide Operator Name.");
        return;
      }
      const res = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role: "station_commander",
        stationCode,
      });
      if (res.ok) {
        setSuccessNotice("Operator clearance profile created. Initializing digital twin session…");
        setTimeout(() => navigate("/"), 800);
      } else {
        setError(res.error || "Registration failed. Try signing in.");
      }
      return;
    }

    // Login mode
    const res = await login(email.trim(), password);
    if (res.ok) {
      setSuccessNotice("Authentication verified. Granting mission control clearance…");
      setTimeout(() => navigate("/"), 400);
    } else {
      setError(res.error || "Authentication failed. Check your password or select a profile.");
    }
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex items-center justify-center px-3.5 sm:px-6 py-8 relative overflow-x-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(7, 11, 18, 0.72), rgba(4, 7, 13, 0.9)), url('/login-bg.jpg')`,
      }}
    >
      {/* Aurora Ambient Glow Effects */}
      <div className="absolute -top-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-[var(--ice-cyan)] opacity-20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-[var(--aurora-violet)] opacity-20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg space-y-5 relative z-10 my-auto">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-[var(--bg-panel)]/90 border border-[var(--ice-cyan)]/40 text-[var(--ice-cyan)] shadow-2xl backdrop-blur-md mb-0.5">
            <Globe className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse text-[var(--ice-cyan)]" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight drop-shadow-xl font-display">
            DigiAI <span className="text-[var(--ice-cyan)]">ICE TWIN</span>
          </h1>

          <p className="font-mono text-[11px] sm:text-xs text-[var(--ice-cyan)] tracking-wider uppercase font-semibold">
            Autonomous Antarctic Intelligence &amp; Digital Twin
          </p>
        </div>

        {/* Login & Security Card */}
        <div className="rounded-2xl border border-[var(--ice-cyan)]/40 bg-[var(--bg-panel)]/90 p-5 sm:p-7 space-y-4 shadow-2xl backdrop-blur-2xl">
          {/* Mission Clearance Status Badge */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[var(--ice-cyan)]/15 border border-[var(--ice-cyan)]/30 text-[var(--ice-cyan)]">
                <Fingerprint className="w-4 h-4" />
              </span>
              <div>
                <p className="font-mono text-[10px] font-bold text-[var(--ice-cyan)] tracking-wider uppercase">
                  POLAR MISSION SECURITY GATEWAY
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] font-mono">
                  ISRO GSAT-30 Telemetry Clearance
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-[var(--bg-deep)] p-1 rounded-xl border border-[var(--border-subtle)] text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  mode === "login"
                    ? "bg-[var(--ice-cyan)] text-black font-bold shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  mode === "register"
                    ? "bg-[var(--ice-cyan)] text-black font-bold shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {/* Quick Profile Credential Badges (1-Click Switcher) */}
          {mode === "login" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block">
                Select Authorized Mission Clearance:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {QUICK_PROFILES.map((p) => {
                  const isSelected = selectedProfileId === p.id && email === p.email;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProfile(p)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-[var(--ice-cyan)]/15 border-[var(--ice-cyan)] ring-1 ring-[var(--ice-cyan)]/40 shadow-sm"
                          : "bg-[var(--bg-panel-raised)]/80 border-[var(--border-subtle)] hover:border-[var(--ice-cyan-dim)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-display text-xs font-bold text-[var(--text-primary)]">
                          {p.label.split(" ")[0]}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ice-cyan)]" />}
                      </div>
                      <p className="font-mono text-[9px] text-[var(--text-tertiary)] truncate">
                        {p.role.toUpperCase()}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-3.5 pt-1">
            {mode === "register" && (
              <>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1 font-medium font-mono">
                    Operator Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    required
                    className="w-full bg-[var(--bg-deep)]/90 border border-[var(--border-subtle)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--ice-cyan)] transition font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1 font-medium font-mono">
                    Target Station Assignment
                  </label>
                  <select
                    value={stationCode}
                    onChange={(e) => setStationCode(e.target.value)}
                    className="w-full bg-[var(--bg-deep)]/90 border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none font-mono cursor-pointer"
                  >
                    <option value="MAITRI">Maitri Station (70°S - Schirmacher Oasis)</option>
                    <option value="BHARATI">Bharati Station (69°S - Larsemann Hills)</option>
                  </select>
                </div>
              </>
            )}

            {/* Operator ID / Email */}
            <div>
              <label className="text-xs text-[var(--text-secondary)] flex items-center justify-between mb-1 font-medium font-mono">
                <span>Operator Mission ID / Email</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">MoES / NCAOR Gov ID</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSelectedProfileId(null);
                  }}
                  placeholder="hq@moes.gov.in"
                  required
                  className="w-full bg-[var(--bg-deep)]/90 border border-[var(--border-subtle)] rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--ice-cyan)] transition font-mono"
                />
                <UserCheck className="w-4 h-4 text-[var(--text-tertiary)] absolute right-3.5 top-3" />
              </div>
            </div>

            {/* Password with Eye Toggle & Strength */}
            <div>
              <label className="text-xs text-[var(--text-secondary)] flex items-center justify-between mb-1 font-medium font-mono">
                <span>Mission Access Password</span>
                <span className={`text-[10px] font-mono ${passwordStrength.text}`}>
                  {passwordStrength.label}
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security password…"
                  required
                  className="w-full bg-[var(--bg-deep)]/90 border border-[var(--border-subtle)] rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--ice-cyan)] transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[var(--text-tertiary)] hover:text-white transition cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter Bar */}
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      passwordStrength.score >= step ? passwordStrength.color : "bg-gray-800"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error or Success Notice */}
            {error && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/60 text-red-300 text-xs font-mono flex items-start gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {successNotice && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-xs font-mono flex items-start gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-display font-bold text-sm text-black bg-[var(--ice-cyan)] hover:bg-[#86efe7] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 active:scale-[0.99]"
            >
              <span>
                {loading
                  ? "Authenticating Mission Credentials…"
                  : mode === "register"
                  ? "Create Operator Account"
                  : "Authorize & Launch Mission Control"}
              </span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center space-y-1">
          <p className="font-mono text-[10px] text-gray-400">
            NCAOR · Ministry of Earth Sciences (MoES) · Government of India
          </p>
          <p className="font-mono text-[9px] text-gray-500">
            Encrypted SHA-256 JWT Token · Edge AI Anomaly Guard
          </p>
        </div>
      </div>
    </div>
  );
}

