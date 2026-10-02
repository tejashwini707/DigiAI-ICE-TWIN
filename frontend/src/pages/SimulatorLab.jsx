import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useConnectivity } from "../context/ConnectivityContext.jsx";
import { generateOfflineTick } from "../offline/edgePredictor.js";
import { DEFAULT_STATIONS, generateDefaultTelemetry } from "../services/dataDefaults.js";
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
  Clock,
  BrainCircuit,
  ShieldAlert,
  Cpu,
} from "lucide-react";
import soundEngine from "../services/soundEngine.js";

const STATIONS = [
  { code: "MAITRI", label: "Maitri Station (70°S)" },
  { code: "BHARATI", label: "Bharati Station (69°S)" },
];

const SCENARIOS = [
  {
    id: "generator_failure",
    label: "Primary Diesel GenSet #1 Mechanical Stall",
    icon: Flame,
    severity: "CRITICAL",
    color: "border-red-500/50 bg-red-950/30 text-red-300",
    desc: "Bearing seizure & vibration spike on Primary GenSet #1. Output health drops to 18%. Risk index climbs to 88%.",
    affectedZone: "Generator Shed (Diesel #1)",
    mitigationSOP: "SOP-08: Auto-start and synchronise Backup Kirloskar Diesel Unit #2.",
  },
  {
    id: "blizzard",
    label: "Category 4 Katabatic Blizzard (145 km/h)",
    icon: Wind,
    severity: "CRITICAL",
    color: "border-cyan-500/50 bg-cyan-950/30 text-cyan-300",
    desc: "Extreme wind gusts to 145 km/h and rapid thermal plunge to -52°C. Structural & line freeze risk.",
    affectedZone: "Living Habitat & External Radomes",
    mitigationSOP: "SOP-22: Full Polar Storm Habitat Lockdown & High-Voltage Trace Heating.",
  },
  {
    id: "battery_drain",
    label: "Battery Drain & Inverter Overload",
    icon: Zap,
    severity: "CRITICAL",
    color: "border-amber-500/50 bg-amber-950/30 text-amber-300",
    desc: "Inverter thermal overload trigger. Rapid battery SOC depletion (-12.4%/hr). Projected blackout in 4h 20m.",
    affectedZone: "Power Plant Main Grid Bus",
    mitigationSOP: "SOP-14: Shed non-essential lab loads & engage Aux GenSet in parallel.",
  },
  {
    id: "comms_blackout",
    label: "ISRO GSAT-30 / GSAT-14 SATCOM Dropout",
    icon: Radio,
    severity: "CRITICAL",
    color: "border-purple-500/50 bg-purple-950/30 text-purple-300",
    desc: "ISRO GSAT polar link drop & dish ice load lock. Autonomous Edge AI mode activates with local IndexedDB buffer.",
    affectedZone: "SATCOM High-Gain Array",
    mitigationSOP: "SOP-19: Switch to Edge Local Mode & Engage Radome Thermal De-Icer.",
  },
  {
    id: "water_freeze",
    label: "Glacial Melt Intake Sub-Zero Freeze",
    icon: Droplets,
    severity: "WARNING",
    color: "border-blue-500/50 bg-blue-950/30 text-blue-300",
    desc: "Sub-zero ice core blockages in lake meltwater intake pipeline. Fresh water reserve declines.",
    affectedZone: "Water Treatment & RO Plant",
    mitigationSOP: "SOP-31: Engage thermal trace heating elements on intake conduits.",
  },
];

export default function SimulatorLab() {
  const navigate = useNavigate();
  const { isOffline, write } = useConnectivity();
  const [stationCode, setStationCode] = useState("MAITRI");
  const [activeDisasters, setActiveDisasters] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`digi_ai_disasters_MAITRI`) || "[]");
    } catch {
      return [];
    }
  });
  const [mitigationApplied, setMitigationApplied] = useState(null);
  const [notice, setNotice] = useState(null);

  // Sync active disasters when station switch occurs
  useEffect(() => {
    let localList = [];
    try {
      localList = JSON.parse(localStorage.getItem(`digi_ai_disasters_${stationCode}`) || "[]");
    } catch {
      localList = [];
    }
    setActiveDisasters(localList);

    api
      .get(`/stations/${stationCode}/twin`)
      .then((res) => {
        const station = res.data?.station;
        const list = station?.activeDisasters || (station?.activeDisaster ? [station.activeDisaster] : []);
        if (list.length > 0) {
          setActiveDisasters(list);
          localStorage.setItem(`digi_ai_disasters_${stationCode}`, JSON.stringify(list));
        } else if (localList.length === 0) {
          setActiveDisasters([]);
        }
        setMitigationApplied(station?.mitigationApplied || null);
      })
      .catch(() => {});
  }, [stationCode]);

  // Compute live AI prediction & zone state directly on the Lab screen
  const simulatedState = useMemo(() => {
    const baseStation = DEFAULT_STATIONS[stationCode] || DEFAULT_STATIONS.MAITRI;
    const stationWithDisaster = {
      ...baseStation,
      activeDisaster: activeDisasters[0] || null,
      activeDisasters,
      mitigationApplied,
    };
    return generateOfflineTick(stationWithDisaster, generateDefaultTelemetry(stationCode));
  }, [stationCode, activeDisasters, mitigationApplied]);

  const prediction = simulatedState.prediction;
  const isCritical = prediction?.status === "critical" || (prediction?.riskScore || 0) >= 75;
  const isWarning = prediction?.status === "warning" || ((prediction?.riskScore || 0) >= 30 && (prediction?.riskScore || 0) < 75);

  const toggleDisaster = async (disasterType) => {
    await soundEngine.ensureAudio();
    soundEngine.startSiren();
    let updated;
    if (activeDisasters.includes(disasterType)) {
      updated = activeDisasters.filter((d) => d !== disasterType);
    } else {
      updated = [...activeDisasters, disasterType];
    }
    setActiveDisasters(updated);
    setMitigationApplied(null);

    if (updated.length > 0) {
      localStorage.setItem(`digi_ai_disasters_${stationCode}`, JSON.stringify(updated));
      setNotice(`🚨 Disaster Injected: [${updated.map((d) => d.toUpperCase()).join(" + ")}] active in ${stationCode}. Check live telemetry and AI risk below.`);
    } else {
      soundEngine.stopSiren();
      localStorage.removeItem(`digi_ai_disasters_${stationCode}`);
      setNotice(`✅ All emergency parameters reset to nominal stability for ${stationCode}.`);
    }

    window.dispatchEvent(
      new CustomEvent("digi_ai_disaster_update", {
        detail: { stationCode, disasters: updated },
      })
    );

    try {
      await write({
        type: "station_disaster",
        method: "POST",
        url: `/stations/${stationCode}/disaster`,
        body: { disasterType, toggle: true, activeDisasters: updated },
      });
    } catch (err) {
      console.warn("Disaster trigger background note:", err.message);
    }
  };

  const resolveDisaster = async () => {
    soundEngine.stopSiren();
    soundEngine.playSuccess();
    setActiveDisasters([]);
    setMitigationApplied(null);
    localStorage.removeItem(`digi_ai_disasters_${stationCode}`);

    window.dispatchEvent(
      new CustomEvent("digi_ai_disaster_update", {
        detail: { stationCode, disasters: [] },
      })
    );

    setNotice(`✅ All emergency parameters reset to nominal stability for ${stationCode}.`);

    try {
      await write({
        type: "station_resolve",
        method: "POST",
        url: `/stations/${stationCode}/resolve-disaster`,
        body: {},
      });
    } catch (err) {
      console.warn("Resolve background note:", err.message);
    }
  };

  return (
    <div className="min-h-screen px-3 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl ice-pane frost-border shadow-2xl">
        <div className="flex items-center gap-3.5">
          <Link
            to="/"
            className="p-2.5 rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] text-[var(--aurora-teal)] hover:border-[var(--aurora-teal)] transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="font-mono text-[10px] tracking-[0.2em] font-bold text-[var(--aurora-teal)] uppercase">
              SCENARIO INJECTION LAB
            </span>
            <p className="text-xs text-[var(--text-secondary)] font-mono">
              Polar Disaster &amp; Cascade Failure Simulation
            </p>
          </div>
        </div>

        {/* Top Center Title */}
        <div className="text-center mx-auto order-first sm:order-none w-full sm:w-auto py-1">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-md">
            <span className="text-[var(--aurora-teal)] font-extrabold">DigiAI ICE TWIN</span>
            <span className="text-gray-400 font-normal mx-2">-</span>
            <span className="text-white font-bold">Polar Testing Console</span>
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
                    ? "bg-[var(--bg-panel-raised)] text-[var(--aurora-teal)] border border-[var(--border-frozen)]"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-display bg-gradient-to-r from-[var(--aurora-teal)] to-[var(--aurora-cyan)] text-black hover:opacity-90 shadow-lg shadow-teal-500/20 transition cursor-pointer"
          >
            <span>Live Mission Control</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Notice Alert */}
      {notice && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-teal-950/80 to-purple-950/80 border border-[var(--aurora-teal)] text-teal-100 text-xs font-mono flex items-center justify-between animate-fadeIn shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-4 h-4 text-[var(--aurora-teal)] animate-spin shrink-0" />
            <span className="truncate">{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-[var(--aurora-teal)] hover:text-white cursor-pointer ml-3 font-bold shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Live AI Risk & TTF Status Banner (Reflects disaster immediately!) */}
      <div className={`p-5 rounded-2xl border transition-all shadow-2xl ${
        isCritical
          ? "bg-red-950/40 border-red-500 shadow-red-500/20 ring-1 ring-red-500/30"
          : isWarning
          ? "bg-amber-950/30 border-amber-500/50"
          : "ice-pane frost-border"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BrainCircuit className={`w-5 h-5 ${isCritical ? "text-red-400 animate-spin" : isWarning ? "text-amber-400" : "text-[var(--aurora-teal)]"}`} />
              <span className="font-mono text-xs uppercase font-bold text-white tracking-wider">
                Live AI Risk &amp; TTF Telemetry Evaluation
              </span>
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isCritical
                  ? "bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse"
                  : isWarning
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-[var(--aurora-teal)]/20 text-[var(--aurora-teal)] border border-[var(--aurora-teal)]/40"
              }`}>
                {prediction?.status || "NOMINAL"}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-mono">
              Target: <span className="text-white font-bold">{stationCode} Station</span> · Active Faults:{" "}
              <span className="font-bold text-red-400">{activeDisasters.length > 0 ? activeDisasters.join(" + ") : "None (All Zones Nominal)"}</span>
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase font-mono text-[var(--text-tertiary)]">Risk Index</p>
              <p className={`font-mono text-2xl font-bold ${isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-[var(--aurora-teal)]"}`}>
                {prediction?.riskScore || 8}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-mono text-[var(--text-tertiary)]">Projected TTF Countdown</p>
              <p className={`font-mono text-lg font-bold ${isCritical ? "text-red-300" : isWarning ? "text-amber-300" : "text-[var(--aurora-teal)]"}`}>
                {prediction?.timeToFailure?.formatted || ">72h stable buffer"}
              </p>
            </div>
          </div>
        </div>

        {/* Action button to Jump to Live Twin */}
        {activeDisasters.length > 0 && (
          <div className="mt-4 pt-3 border-t border-red-500/30 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-red-200 font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
              <span>Disaster is active! Inspect live 2D CAD animation and thermal layer on the main twin.</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={resolveDisaster}
                className="px-3 py-1.5 rounded-xl border border-red-500/40 text-xs font-mono text-red-300 hover:bg-red-950/60 transition cursor-pointer"
              >
                Reset to Nominal
              </button>
              <Link
                to="/"
                className="px-4 py-1.5 rounded-xl text-xs font-bold font-display bg-gradient-to-r from-red-500 to-amber-500 text-black hover:opacity-90 transition cursor-pointer shadow-lg shadow-red-500/30 flex items-center gap-1.5"
              >
                <span>🚀 Inspect 2D Twin in Mission Control</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Scenario Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Disaster Scenario Matrix (1-Click Fault Injection)
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={resolveDisaster}
              className="flex items-center gap-1.5 text-xs font-mono text-[var(--aurora-teal)] hover:text-white transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore All Nominal</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCENARIOS.map((sc) => {
            const Icon = sc.icon;
            const isCurrent = activeDisasters.includes(sc.id);

            return (
              <div
                key={sc.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  isCurrent
                    ? "border-red-500 bg-red-950/40 ring-2 ring-red-500/40 shadow-2xl backdrop-blur-md"
                    : "ice-pane frost-border hover:border-[var(--aurora-teal)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl border ${sc.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-bold text-[var(--text-primary)]">
                          {sc.label}
                        </h4>
                        <p className="font-mono text-[10px] text-[var(--text-tertiary)]">
                          Subsystem: {sc.affectedZone}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 uppercase font-bold">
                      {sc.severity}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-2">
                    {sc.desc}
                  </p>

                  <div className="mt-3 p-2.5 rounded-lg bg-[var(--bg-deep)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--aurora-teal)]">
                    <span className="text-[var(--text-tertiary)]">AI Mitigation SOP: </span>
                    {sc.mitigationSOP}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                  <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                    {isCurrent ? "🚨 Scenario ACTIVE" : "Ready for injection"}
                  </span>
                  <button
                    onClick={() => toggleDisaster(sc.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold font-display uppercase tracking-wider transition cursor-pointer shadow-md ${
                      isCurrent
                        ? "bg-red-600 text-white animate-pulse shadow-red-600/30"
                        : "bg-gradient-to-r from-[var(--aurora-teal)] to-[var(--aurora-cyan)] text-black hover:opacity-90 shadow-teal-500/20"
                    }`}
                  >
                    {isCurrent ? "Active (Click to Disarm)" : "⚡ Inject Disaster"}
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
