import { useState } from "react";
import { Zap, AlertTriangle, ShieldCheck, Flame, Radio, Droplets, Wind, RotateCcw, Activity, Sparkles, Layers } from "lucide-react";

const SCENARIOS = [
  {
    id: "comms_blackout",
    label: "ISRO GSAT-30 Drop",
    icon: Radio,
    color: "from-purple-500/20 to-pink-600/30 border-purple-500/40 text-purple-300",
    desc: "GSAT-30 / GSAT-14 SATCOM severed (Offline mode active)",
  },
  {
    id: "generator_failure",
    label: "Diesel Generator Stall",
    icon: Flame,
    color: "from-orange-500/20 to-red-600/30 border-orange-500/40 text-orange-300",
    desc: "Gen #1 bearing seizure & 18% health (TTF: 1h 45m)",
  },
  {
    id: "battery_drain",
    label: "Battery Drain Spike",
    icon: Zap,
    color: "from-amber-500/20 to-red-500/30 border-amber-500/40 text-amber-300",
    desc: "Inverter thermal overload (TTF: 4h 20m)",
  },
  {
    id: "blizzard",
    label: "Katabatic Blizzard",
    icon: Wind,
    color: "from-cyan-500/20 to-blue-600/30 border-cyan-500/40 text-cyan-300",
    desc: "145 km/h gusts & -52°C plunge",
  },
  {
    id: "water_freeze",
    label: "Water Intake Freeze",
    icon: Droplets,
    color: "from-blue-500/20 to-indigo-600/30 border-blue-500/40 text-blue-300",
    desc: "Glacial melt intake line frozen (18h reserve)",
  },
];

export default function DisasterSimulatorBar({
  activeDisaster,
  activeDisasters = [],
  mitigationApplied,
  onTriggerDisaster,
  onTriggerMultiDisasters,
  onResolveDisaster,
}) {
  // Normalize active list
  const currentDisasters = Array.isArray(activeDisasters) && activeDisasters.length > 0
    ? activeDisasters
    : (activeDisaster ? [activeDisaster] : []);

  const hasAnyActive = currentDisasters.length > 0;
  const isDualOrMulti = currentDisasters.length >= 2;

  // Compute presentation demo stage
  let stage = 1; // 1: Nominal, 2: Disaster Active, 3: Mitigation Active
  if (hasAnyActive) {
    stage = mitigationApplied ? 3 : 2;
  }

  const handleDualDemo = () => {
    if (onTriggerMultiDisasters) {
      onTriggerMultiDisasters(["comms_blackout", "generator_failure"]);
    } else {
      onTriggerDisaster("comms_blackout");
      setTimeout(() => onTriggerDisaster("generator_failure"), 300);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 sm:p-5 relative overflow-hidden shadow-xl">
      {/* Background Accent glow */}
      <div
        className={`absolute -right-20 -top-20 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isDualOrMulti ? "bg-purple-600" : hasAnyActive ? "bg-red-500" : "bg-[var(--ice-cyan)]"
        }`}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] text-[var(--ice-cyan)]">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-semibold tracking-wide text-[var(--text-primary)] uppercase">
                Mission Control Disaster Simulator
              </h3>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-[var(--ice-cyan)] border border-[var(--ice-cyan-dim)]">
                Multi-Disaster Injection Capable
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Inject 1 or 2 simultaneous polar crises (e.g. GSAT Satellite Drop + Diesel Generator Failure) to test Edge AI compound risk handling.
            </p>
          </div>
        </div>

        {/* Demo Controls & Stage Tracker */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Click Dual Disaster Demo Preset */}
          <button
            type="button"
            onClick={handleDualDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/40 bg-red-950/40 hover:bg-red-950/70 text-red-300 font-mono text-[11px] font-semibold transition cursor-pointer shadow-sm"
            title="Inject simultaneous GSAT Satellite Outage and Diesel Generator Mechanical Stall"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>⚡ Dual Crisis: Satellite + Diesel Fail</span>
          </button>

          {/* Demo Stage Tracker */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] bg-[var(--bg-deep)] px-3 py-1.5 rounded-xl border border-[var(--border-subtle)]">
            <span className="text-[var(--text-tertiary)] uppercase mr-1">Stage:</span>
            <span className={`px-1.5 py-0.5 rounded ${stage === 1 ? "bg-emerald-500/20 text-emerald-400 font-bold" : "text-[var(--text-tertiary)]"}`}>
              1. Nominal
            </span>
            <span className="text-[var(--text-tertiary)]">➔</span>
            <span className={`px-1.5 py-0.5 rounded ${stage === 2 ? "bg-red-500/30 text-red-300 font-bold animate-pulse" : "text-[var(--text-tertiary)]"}`}>
              {isDualOrMulti ? `2. Dual Crisis (${currentDisasters.length})` : "2. Crisis Event"}
            </span>
            <span className="text-[var(--text-tertiary)]">➔</span>
            <span className={`px-1.5 py-0.5 rounded ${stage === 3 ? "bg-amber-500/20 text-amber-300 font-bold" : "text-[var(--text-tertiary)]"}`}>
              3. Mitigated
            </span>
          </div>
        </div>
      </div>

      {/* Scenario Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
        {SCENARIOS.map((sc) => {
          const Icon = sc.icon;
          const isActive = currentDisasters.includes(sc.id);

          return (
            <button
              key={sc.id}
              onClick={() => onTriggerDisaster(sc.id)}
              className={`flex flex-col p-3 rounded-xl border transition-all text-left relative overflow-hidden group cursor-pointer ${
                isActive
                  ? "bg-red-950/60 border-red-500 ring-2 ring-red-500/40 shadow-lg shadow-red-500/20"
                  : `bg-[var(--bg-panel-raised)] hover:bg-[var(--bg-deep)] border-[var(--border-subtle)] hover:border-[var(--ice-cyan-dim)]`
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className={`p-1.5 rounded-lg ${isActive ? "bg-red-500/30 text-red-300" : "bg-[var(--bg-deep)] text-[var(--text-secondary)] group-hover:text-[var(--ice-cyan)]"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isActive && (
                  <span className="flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.2 rounded bg-red-500/40 text-red-200 uppercase font-bold animate-pulse">
                    ACTIVE
                  </span>
                )}
              </div>

              <p className={`font-display text-xs font-semibold ${isActive ? "text-red-200 font-bold" : "text-[var(--text-primary)]"}`}>
                {sc.label}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 leading-tight line-clamp-1">
                {sc.desc}
              </p>
            </button>
          );
        })}

        {/* Reset / Nominal Button */}
        <button
          onClick={onResolveDisaster}
          className={`flex flex-col p-3 rounded-xl border transition-all text-left relative overflow-hidden group cursor-pointer ${
            !hasAnyActive
              ? "bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/30"
              : "bg-[var(--bg-panel-raised)] hover:bg-[var(--bg-deep)] border-[var(--border-subtle)] hover:border-emerald-500/40"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <div className={`p-1.5 rounded-lg ${!hasAnyActive ? "bg-emerald-500/20 text-emerald-300" : "bg-[var(--bg-deep)] text-[var(--text-secondary)] group-hover:text-emerald-300"}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            {!hasAnyActive && (
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">NOMINAL</span>
            )}
          </div>
          <p className={`font-display text-xs font-semibold ${!hasAnyActive ? "text-emerald-300" : "text-[var(--text-primary)]"}`}>
            Reset to Nominal
          </p>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 leading-tight">
            Clear all active alarms
          </p>
        </button>
      </div>
    </div>
  );
}
