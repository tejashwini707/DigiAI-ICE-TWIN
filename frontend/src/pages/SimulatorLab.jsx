import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useConnectivity } from "../context/ConnectivityContext.jsx";
import {
  Zap,
  AlertTriangle,
  ShieldCheck,
  Flame,
  Radio,
  Droplets,
  Wind,
  RotateCcw,
  ArrowLeft,
  Activity,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Layers,
} from "lucide-react";

const STATIONS = [
  { code: "MAITRI", label: "Maitri Station (70°S)" },
  { code: "BHARATI", label: "Bharati Station (69°S)" },
];

const SCENARIOS = [
  {
    id: "comms_blackout",
    label: "ISRO GSAT-30 / GSAT-14 SATCOM Dropout",
    icon: Radio,
    severity: "CRITICAL",
    color: "border-purple-500/50 bg-purple-950/30 text-purple-300",
    desc: "ISRO GSAT polar link drop & dish ice load lock. Autonomous Edge AI mode activates with local IndexedDB buffer.",
    mitigationSOP: "SOP-19: Switch to Edge Local Mode & Engage Radome Thermal De-Icer.",
  },
  {
    id: "generator_failure",
    label: "Primary Diesel GenSet #1 Mechanical Stall",
    icon: Flame,
    severity: "CRITICAL",
    color: "border-red-500/50 bg-red-950/30 text-red-300",
    desc: "Bearing seizure & vibration spike on Primary GenSet #1. Output health drops to 18%. TTF: 1h 45m.",
    mitigationSOP: "SOP-08: Auto-start and synchronise Backup Kirloskar Diesel Unit #2.",
  },
  {
    id: "battery_drain",
    label: "Battery Drain & Inverter Overload",
    icon: Zap,
    severity: "CRITICAL",
    color: "border-amber-500/50 bg-amber-950/30 text-amber-300",
    desc: "Inverter thermal overload trigger. Rapid battery SOC depletion (-12.4%/hr). Projected blackout in 4h 20m.",
    mitigationSOP: "SOP-14: Shed non-essential lab loads & engage Aux GenSet in parallel.",
  },
  {
    id: "blizzard",
    label: "Category 4 Katabatic Blizzard",
    icon: Wind,
    severity: "CRITICAL",
    color: "border-cyan-500/50 bg-cyan-950/30 text-cyan-300",
    desc: "Extreme wind gusts to 145 km/h and rapid thermal plunge to -52°C. Severe structural & line freeze risk.",
    mitigationSOP: "SOP-22: Full Polar Storm Habitat Lockdown & High-Voltage Trace Heating.",
  },
  {
    id: "water_freeze",
    label: "Glacial Melt Intake Sub-Zero Freeze",
    icon: Droplets,
    severity: "WARNING",
    color: "border-blue-500/50 bg-blue-950/30 text-blue-300",
    desc: "Sub-zero ice core blockages in lake meltwater intake pipeline. Fresh water reserve declines.",
    mitigationSOP: "SOP-31: Engage thermal trace heating elements on intake conduits.",
  },
];

export default function SimulatorLab() {
  const navigate = useNavigate();
  const { isOffline, write } = useConnectivity();
  const [stationCode, setStationCode] = useState("MAITRI");
  const [activeDisasters, setActiveDisasters] = useState([]);
  const [mitigationApplied, setMitigationApplied] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch current station status
  useEffect(() => {
    api.get(`/stations/${stationCode}/twin`).then((res) => {
      const station = res.data?.station;
      const list = station?.activeDisasters || (station?.activeDisaster ? [station.activeDisaster] : []);
      setActiveDisasters(list);
      setMitigationApplied(station?.mitigationApplied || null);
    }).catch(() => {});
  }, [stationCode]);

  const toggleDisaster = async (disasterType) => {
    setLoading(true);
    try {
      let updated;
      if (activeDisasters.includes(disasterType)) {
        updated = activeDisasters.filter((d) => d !== disasterType);
      } else {
        updated = [...activeDisasters, disasterType];
      }
      setActiveDisasters(updated);
      setMitigationApplied(null);
      setNotice(
        updated.length > 0
          ? `🚨 Crisis state updated: [${updated.map((u) => u.toUpperCase()).join(" + ")}] active in ${stationCode}. Return to Mission Control to observe live response.`
          : `✅ All disasters cleared for ${stationCode}.`
      );

      await write({
        type: "station_disaster",
        method: "POST",
        url: `/stations/${stationCode}/disaster`,
        body: { disasterType, toggle: true, activeDisasters: updated },
      });
    } catch (err) {
      console.error("Disaster trigger failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerDualDisaster = async () => {
    setLoading(true);
    try {
      const dual = ["comms_blackout", "generator_failure"];
      setActiveDisasters(dual);
      setMitigationApplied(null);
      setNotice(`🚨 DUAL CRISIS INJECTED: [ISRO GSAT-30 SATCOM DROP + DIESEL GENERATOR #1 STALL] simultaneously active in ${stationCode}!`);

      await write({
        type: "station_disaster",
        method: "POST",
        url: `/stations/${stationCode}/disaster`,
        body: { activeDisasters: dual },
      });
    } catch (err) {
      console.error("Dual disaster trigger failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const resolveDisaster = async () => {
    setLoading(true);
    try {
      setActiveDisasters([]);
      setMitigationApplied(null);
      setNotice(`✅ All emergency parameters reset to nominal for ${stationCode}.`);

      await write({
        type: "station_resolve",
        method: "POST",
        url: `/stations/${stationCode}/resolve-disaster`,
        body: {},
      });
    } catch (err) {
      console.error("Resolve failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-8 py-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] shadow-xl">
        <div className="flex items-center gap-3.5">
          <Link
            to="/"
            className="p-2.5 rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] text-[var(--ice-cyan)] hover:border-[var(--ice-cyan-dim)] transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="font-mono text-[10px] tracking-[0.2em] font-bold text-amber-400 uppercase">
              SCENARIO INJECTION LAB
            </span>
            <p className="text-xs text-[var(--text-secondary)] font-mono">
              Polar Disaster Simulation
            </p>
          </div>
        </div>

        {/* Top Center Title */}
        <div className="text-center mx-auto order-first sm:order-none w-full sm:w-auto py-1">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-md">
            <span className="text-[var(--ice-cyan)] font-extrabold">DigiAI ICE TWIN</span>
            <span className="text-gray-400 font-normal mx-2">-</span>
            <span className="text-white font-bold">Antarctic Intelligence &amp; Digital Twin</span>
          </h1>
        </div>

        {/* Station switcher & Launch button */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-1 overflow-hidden">
            {STATIONS.map((s) => (
              <button
                key={s.code}
                onClick={() => setStationCode(s.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition cursor-pointer ${
                  stationCode === s.code
                    ? "bg-[var(--bg-panel-raised)] text-[var(--ice-cyan)] border border-[var(--ice-cyan-dim)]"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-display bg-[var(--ice-cyan)] text-black hover:opacity-90 shadow-lg transition cursor-pointer"
          >
            <span>Live Mission Control</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Notice Alert */}
      {notice && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/60 to-red-950/60 border border-amber-500/50 text-amber-200 text-xs font-mono flex items-center justify-between animate-fadeIn shadow-xl">
          <span>{notice}</span>
          <button
            onClick={() => setNotice(null)}
            className="text-amber-400 hover:text-white cursor-pointer ml-3 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Current State Card */}
      <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase text-[var(--text-tertiary)]">Target Research Station</p>
          <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
            {stationCode === "MAITRI" ? "Maitri Station (70°S)" : "Bharati Station (69°S)"}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Active Disasters:{" "}
            <span className="font-mono font-bold" style={{ color: activeDisasters.length > 0 ? "#FF5D5D" : "#4ADE80" }}>
              {activeDisasters.length > 0
                ? `🚨 [${activeDisasters.map((d) => d.toUpperCase()).join(" + ")}] ACTIVE (${activeDisasters.length})`
                : "✅ NOMINAL POLAR OPERATIONS"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dual Disaster Quick Trigger */}
          <button
            onClick={triggerDualDisaster}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-display border border-red-500/50 bg-red-950/30 text-red-300 hover:bg-red-950/60 transition cursor-pointer shadow-md disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>⚡ Inject Dual Disaster: GSAT Drop + Diesel Stall</span>
          </button>

          <button
            onClick={resolveDisaster}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-display border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Reset All to Nominal Safety</span>
          </button>
        </div>
      </div>

      {/* Scenario Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Toggle Disaster Scenarios (Inject Multiple Simultaneously)
          </h3>
          <span className="text-xs font-mono text-[var(--ice-cyan)]">
            {activeDisasters.length} active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCENARIOS.map((sc) => {
            const Icon = sc.icon;
            const isCurrent = activeDisasters.includes(sc.id);

            return (
              <div
                key={sc.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isCurrent
                    ? "border-red-500 bg-red-950/40 ring-2 ring-red-500/40 shadow-2xl"
                    : "border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--ice-cyan-dim)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl border ${sc.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-display text-sm font-bold text-[var(--text-primary)]">
                        {sc.label}
                      </h4>
                    </div>
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 uppercase font-bold">
                      {sc.severity}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {sc.desc}
                  </p>

                  <div className="mt-3 p-2.5 rounded-lg bg-[var(--bg-deep)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--ice-cyan)]">
                    <span className="text-[var(--text-tertiary)]">AI Mitigation SOP: </span>
                    {sc.mitigationSOP}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                  <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                    {isCurrent ? "Scenario currently active" : "Ready for injection"}
                  </span>
                  <button
                    onClick={() => toggleDisaster(sc.id)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold font-display uppercase tracking-wider transition cursor-pointer ${
                      isCurrent
                        ? "bg-red-600 text-white animate-pulse"
                        : "bg-[var(--ice-cyan)] text-black hover:opacity-90"
                    }`}
                  >
                    {isCurrent ? "Active (Click to Stop)" : "Inject Disaster"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
