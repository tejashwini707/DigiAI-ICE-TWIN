import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { BrainCircuit, Clock, ShieldAlert, Sparkles, CheckCircle2, ChevronRight, Zap } from "lucide-react";

export default function PredictionRiskPanel({ prediction, onExecuteMitigation }) {
  if (!prediction) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5">
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
    activeDisaster,
    mitigationApplied,
  } = prediction;

  const isCritical = status === "critical" || riskScore >= 75;
  const isWarning = status === "warning" || (riskScore >= 30 && riskScore < 75);

  // Status badge config
  const statusConfig = {
    critical: {
      color: "text-red-400",
      bg: "bg-red-500/20 border-red-500/50",
      label: "HIGH FAILURE RISK",
    },
    warning: {
      color: "text-amber-400",
      bg: "bg-amber-500/20 border-amber-500/50",
      label: "ELEVATED RISK",
    },
    nominal: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/20 border-emerald-500/50",
      label: "NOMINAL STABILITY",
    },
  }[status] || {
    color: "text-emerald-400",
    bg: "bg-emerald-500/20 border-emerald-500/50",
    label: "NOMINAL",
  };

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 relative overflow-hidden shadow-xl space-y-5">
      {/* Panel Top Heading */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--aurora-violet)]/20 text-[var(--aurora-violet)] border border-[var(--aurora-violet)]/30">
              AI PREDICTIVE RISK ENGINE
            </span>
            <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
              Model: Polar-Twin Anomaly &amp; Degradation AI v3.4
            </span>
          </div>
          <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-[var(--aurora-violet)]" />
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
            <p className={`font-mono text-xl font-bold ${isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-emerald-400"}`}>
              {riskScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: TTF Card & Threat Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Time-To-Failure (TTF) Card */}
        <div className={`p-4 rounded-xl border ${isCritical ? "bg-red-950/30 border-red-500/40" : isWarning ? "bg-amber-950/20 border-amber-500/30" : "bg-[var(--bg-panel-raised)] border-[var(--border-subtle)]"}`}>
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
            <Clock className={`w-4 h-4 ${isCritical ? "text-red-400 animate-spin" : isWarning ? "text-amber-400" : "text-emerald-400"}`} />
            <p className="font-mono text-xs uppercase tracking-wider">Projected Time-To-Failure (TTF)</p>
          </div>
          <p className={`font-display text-2xl font-bold mt-1 ${isCritical ? "text-red-300" : isWarning ? "text-amber-300" : "text-emerald-300"}`}>
            {timeToFailure?.formatted || "No imminent threat detected"}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            <span className="text-[var(--text-tertiary)] font-mono">Primary Driver: </span>
            {primaryThreat}
          </p>
        </div>

        {/* Root Causes / Anomaly Detection */}
        <div className="p-4 rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
            <ShieldAlert className="w-4 h-4 text-[var(--ice-cyan)]" />
            <p className="font-mono text-xs uppercase tracking-wider">Sensor Anomaly Diagnostics</p>
          </div>
          {rootCauses.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
              {rootCauses.map((cause, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold">•</span>
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--text-tertiary)]">
              All 9 station zones operating within nominal multi-layer threshold envelopes. No anomalous drift detected.
            </p>
          )}
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
                Dynamic predictive forecast computed from real-time gradient descent across load &amp; thermal telemetry.
              </p>
            </div>
            <span className="font-mono text-[10px] text-[var(--ice-cyan)] bg-[var(--bg-deep)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
              Prediction Curve
            </span>
          </div>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={degradationCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isCritical ? "#FF5D5D" : isWarning ? "#F4A93B" : "#6FE7DD"} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={isCritical ? "#FF5D5D" : isWarning ? "#F4A93B" : "#6FE7DD"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timeOffset" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="var(--text-tertiary)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 8,
                    fontSize: 11,
                    color: "var(--text-primary)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="risk"
                  name="Risk Index (%)"
                  stroke={isCritical ? "#FF5D5D" : isWarning ? "#F4A93B" : "#6FE7DD"}
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
            <Sparkles className="w-4 h-4 text-[var(--ice-cyan)]" />
            <p className="font-display text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide">
              Automated SOP Countermeasures &amp; Mitigation Actions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] hover:border-[var(--ice-cyan-dim)] transition"
              >
                <div className="pr-3">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{rec.label}</p>
                  <p className="font-mono text-[10px] text-emerald-400 mt-0.5">
                    Expected Outcome: {rec.riskDelta}
                  </p>
                </div>

                {rec.action !== "none" && (
                  <button
                    onClick={() => onExecuteMitigation(rec)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-display uppercase tracking-wider bg-gradient-to-r from-[var(--ice-cyan-dim)] to-[var(--ice-cyan)] hover:opacity-90 text-black transition shrink-0 cursor-pointer shadow-md"
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
