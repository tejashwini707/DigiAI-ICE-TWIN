import { useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import {
  BrainCircuit,
  Clock,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Zap,
  Flame,
  Wind,
  BatteryCharging,
  Droplets,
  RotateCcw,
  Activity,
  Cpu,
  Radio,
} from "lucide-react";
import soundEngine from "../services/soundEngine.js";

const SCENARIOS = [
  { id: "generator_failure", label: "GenSet Thermal Stall", icon: Flame, color: "hover:border-red-500 hover:text-red-400" },
  { id: "blizzard", label: "Polar Blizzard (145 km/h)", icon: Wind, color: "hover:border-cyan-400 hover:text-cyan-300" },
  { id: "battery_drain", label: "Battery Grid Depletion", icon: BatteryCharging, color: "hover:border-amber-400 hover:text-amber-300" },
  { id: "comms_blackout", label: "ISRO SATCOM Drop", icon: Radio, color: "hover:border-purple-400 hover:text-purple-300" },
  { id: "water_freeze", label: "Glacial Melt Freeze", icon: Droplets, color: "hover:border-blue-400 hover:text-blue-300" },
];

export default function PredictionRiskPanel({
  prediction,
  stationCode = "MAITRI",
  onExecuteMitigation,
  onTriggerDisaster,
  onResetNominal,
}) {
  const [injecting, setInjecting] = useState(false);

  if (!prediction) {
    return (
      <div className="rounded-2xl ice-pane frost-border p-5">
        <p className="text-sm text-[var(--text-tertiary)]">Awaiting AI risk engine telemetry evaluation…</p>
      </div>
    );
  }

  const {
    riskScore = 8,
    status = "nominal",
    timeToFailure,
    primaryThreat,
    rootCauses = [],
    degradationCurve = [],
    recommendations = [],
    regressionModel = {},
    activeDisaster,
    activeDisasters = [],
  } = prediction;

  const currentDisasters = activeDisasters.length > 0 ? activeDisasters : activeDisaster ? [activeDisaster] : [];
  const isCritical = status === "critical" || riskScore >= 75;
  const isWarning = status === "warning" || (riskScore >= 30 && riskScore < 75);

  const handleScenarioClick = async (disasterType) => {
    setInjecting(true);
    try {
      await soundEngine.ensureAudio();
      if (onTriggerDisaster) {
        await onTriggerDisaster(disasterType);
      }
    } finally {
      setInjecting(false);
    }
  };

  const handleResetClick = async () => {
    setInjecting(true);
    try {
      soundEngine.stopSiren();
      if (onResetNominal) {
        await onResetNominal();
      }
    } finally {
      setInjecting(false);
    }
  };

  // Status badge config with Aurora Polar Night colors
  const statusConfig = {
    critical: {
      color: "text-red-400",
      bg: "bg-red-500/20 border-red-500/50 shadow-red-500/10",
      label: "HIGH CASCADE FAILURE RISK",
    },
    warning: {
      color: "text-amber-400",
      bg: "bg-amber-500/20 border-amber-500/50 shadow-amber-500/10",
      label: "ELEVATED ANOMALY RISK",
    },
    nominal: {
      color: "text-[var(--aurora-teal)]",
      bg: "bg-[var(--aurora-teal)]/20 border-[var(--aurora-teal)]/50 shadow-teal-500/10",
      label: "NOMINAL POLAR STABILITY",
    },
  }[status] || {
    color: "text-[var(--aurora-teal)]",
    bg: "bg-[var(--aurora-teal)]/20 border-[var(--aurora-teal)]/50",
    label: "NOMINAL",
  };

  return (
    <div className="rounded-2xl ice-pane frost-border p-5 relative overflow-hidden shadow-2xl space-y-5">
      {/* Panel Top Heading */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--aurora-violet)]/20 text-[var(--aurora-violet)] border border-[var(--aurora-violet)]/40 shadow-sm">
              AI PREDICTIVE RISK ENGINE
            </span>
            <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
              Model: Polar-Twin OLS Regression &amp; Degradation AI v3.4
            </span>
          </div>
          <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-[var(--aurora-teal)]" />
            Predictive Risk &amp; Automated SOP Countermeasure Engine
          </h3>
        </div>

        {/* Status and Risk Gauge */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-xl border font-mono text-xs font-bold ${statusConfig.bg} ${statusConfig.color}`}>
            {statusConfig.label}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono">Risk Index</p>
            <p className={`font-mono text-xl font-bold ${isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-[var(--aurora-teal)]"}`}>
              {riskScore}%
            </p>
          </div>
        </div>
      </div>

      {/* 1-Click Interactive Fault Scenario Injection Bar */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-deep)]/80 border border-[var(--border-frozen)] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--aurora-teal)] animate-spin" />
            <p className="font-display text-xs font-semibold text-white uppercase tracking-wide">
              Live Scenario Injector (Demonstrate AI TTF &amp; Risk Live)
            </p>
          </div>
          <button
            onClick={handleResetClick}
            disabled={injecting}
            className="flex items-center gap-1 text-[11px] font-mono text-[var(--aurora-teal)] hover:text-white transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restore Nominal</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SCENARIOS.map((sc) => {
            const Icon = sc.icon;
            const isCurrent = currentDisasters.includes(sc.id);
            return (
              <button
                key={sc.id}
                disabled={injecting}
                onClick={() => handleScenarioClick(sc.id)}
                className={`flex items-center gap-1.5 p-2 rounded-lg border text-[11px] font-mono font-medium transition cursor-pointer text-left ${
                  isCurrent
                    ? "bg-red-950/70 border-red-500 text-red-300 font-bold shadow-md shadow-red-500/20"
                    : `bg-[var(--bg-panel-raised)] border-[var(--border-subtle)] text-[var(--text-secondary)] ${sc.color}`
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{sc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: TTF Card, Threat Analysis, & Mathematical OLS Fit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Time-To-Failure (TTF) Card */}
        <div className={`p-4 rounded-xl border ${isCritical ? "bg-red-950/40 border-red-500/50 shadow-lg shadow-red-500/10" : isWarning ? "bg-amber-950/30 border-amber-500/40" : "bg-[var(--bg-panel-raised)] border-[var(--border-subtle)]"}`}>
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
            <Clock className={`w-4 h-4 ${isCritical ? "text-red-400 animate-spin" : isWarning ? "text-amber-400" : "text-[var(--aurora-teal)]"}`} />
            <p className="font-mono text-xs uppercase tracking-wider">Projected TTF Countdown</p>
          </div>
          <p className={`font-display text-2xl font-bold mt-1 ${isCritical ? "text-red-300" : isWarning ? "text-amber-300" : "text-[var(--aurora-teal)]"}`}>
            {timeToFailure?.formatted || "No imminent threat"}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            <span className="text-[var(--text-tertiary)] font-mono">Driver: </span>
            {primaryThreat}
          </p>
        </div>

        {/* Root Causes / Anomaly Detection */}
        <div className="p-4 rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
            <ShieldAlert className="w-4 h-4 text-[var(--aurora-cyan)]" />
            <p className="font-mono text-xs uppercase tracking-wider">Sensor Anomaly Diagnostics</p>
          </div>
          {rootCauses.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
              {rootCauses.slice(0, 3).map((cause, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold">•</span>
                  <span className="line-clamp-2">{cause}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--text-tertiary)]">
              All 9 station zones operating within nominal multi-layer threshold envelopes.
            </p>
          )}
        </div>

        {/* Mathematical Regression Stats */}
        <div className="p-4 rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
            <Cpu className="w-4 h-4 text-[var(--aurora-violet)]" />
            <p className="font-mono text-xs uppercase tracking-wider">OLS Regression Statistics</p>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Linear Slope (m):</span>
              <span className={`font-bold ${isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-[var(--aurora-teal)]"}`}>
                {regressionModel?.slope != null ? `${regressionModel.slope > 0 ? "+" : ""}${regressionModel.slope}% / hr` : "+0.4% / hr"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Coefficient (R²):</span>
              <span className="text-[var(--aurora-cyan)] font-bold">
                {regressionModel?.rSquared != null ? regressionModel.rSquared.toFixed(3) : "0.942"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Algorithmic Basis:</span>
              <span className="text-[var(--text-secondary)]">Ordinary Least Squares</span>
            </div>
          </div>
        </div>
      </div>

      {/* Degradation Trajectory Chart */}
      {degradationCurve.length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-display text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                12-Hour Projected Failure / Risk Trajectory Curve
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                Dynamic predictive forecast computed via linear regression gradient descent across load &amp; thermal telemetry.
              </p>
            </div>
            <span className="font-mono text-[10px] text-[var(--aurora-teal)] bg-[var(--bg-deep)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
              OLS Trajectory
            </span>
          </div>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={degradationCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isCritical ? "#FF4B4B" : isWarning ? "#F59E0B" : "#00F5A0"} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={isCritical ? "#FF4B4B" : isWarning ? "#F59E0B" : "#00F5A0"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timeOffset" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="var(--text-tertiary)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(6, 8, 15, 0.95)",
                    border: "1px solid rgba(0, 245, 160, 0.25)",
                    borderRadius: 8,
                    fontSize: 11,
                    color: "var(--text-primary)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="risk"
                  name="Risk Index (%)"
                  stroke={isCritical ? "#FF4B4B" : isWarning ? "#F59E0B" : "#00F5A0"}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#riskGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recommended Automated Mitigation Protocols */}
      {recommendations.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--aurora-teal)]" />
            <p className="font-display text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide">
              Automated SOP Countermeasures &amp; Mitigation Protocols
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)]/80 hover:border-[var(--border-frozen)] transition"
              >
                <div className="pr-3">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{rec.label}</p>
                  <p className="font-mono text-[10px] text-[var(--aurora-teal)] mt-0.5">
                    Expected Outcome: {rec.riskDelta}
                  </p>
                </div>

                {rec.action !== "none" && (
                  <button
                    onClick={() => onExecuteMitigation(rec)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-display uppercase tracking-wider bg-gradient-to-r from-[var(--aurora-teal)] to-[var(--aurora-cyan)] hover:opacity-90 text-black transition shrink-0 cursor-pointer shadow-md shadow-teal-500/20"
                  >
                    <span>Execute</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
