import { useState } from "react";
import { useConnectivity } from "../context/ConnectivityContext.jsx";
import { Activity, ShieldCheck, Heart, AlertOctagon } from "lucide-react";
import soundEngine from "../services/soundEngine.js";

const HEALTH_COLOR = {
  fit: "var(--status-nominal)",
  monitoring: "var(--status-warning)",
  critical: "var(--status-critical)",
};

export default function PersonnelPanel({ personnel = [], onRefresh, onLocalSOSIncident }) {
  const { write, isOffline } = useConnectivity();
  const [pendingId, setPendingId] = useState(null);
  const [localStatuses, setLocalStatuses] = useState({});

  const handleToggleSOS = async (person) => {
    setPendingId(person._id);
    const currentStatus = localStatuses[person._id] || person.healthStatus || "fit";
    const isCurrentlyCritical = currentStatus === "critical";

    if (isCurrentlyCritical) {
      soundEngine.playSuccess();
      setLocalStatuses((prev) => ({ ...prev, [person._id]: "fit" }));

      const standDownIncident = {
        _id: `inc-sos-clear-${Date.now()}`,
        stationCode: person.stationCode || "MAITRI",
        zoneId: "medical-bay",
        title: `✅ SOS STAND DOWN: ${person.name} (${person.role}) Cleared`,
        description: `Emergency medical SOS beacon deactivated for ${person.name}. Vitals stabilized and cleared by Commander.`,
        severity: "info",
        status: "resolved",
        reportedBy: "Station Commander",
        createdAt: new Date().toISOString(),
        isLocalDraft: isOffline,
      };

      onLocalSOSIncident?.(standDownIncident);

      const result = await write({
        type: "personnel",
        method: "PATCH",
        url: `/personnel/item/${person._id}`,
        body: { healthStatus: "fit" },
      });

      setPendingId(null);
      if (!result.queued) onRefresh?.();
    } else {
      soundEngine.playAlarm();
      setLocalStatuses((prev) => ({ ...prev, [person._id]: "critical" }));

      const sosIncident = {
        _id: `inc-sos-${Date.now()}`,
        stationCode: person.stationCode || "MAITRI",
        zoneId: "medical-bay",
        title: `🚨 EMERGENCY SOS: ${person.name} (${person.role})`,
        description: `Medical SOS beacon activated for ${person.name}. Immediate medical dispatch requested.`,
        severity: "critical",
        status: "open",
        reportedBy: "Automated SOS Beacon (Local Edge)",
        createdAt: new Date().toISOString(),
        isLocalDraft: isOffline,
      };

      onLocalSOSIncident?.(sosIncident);

      const result = await write({
        type: "sos",
        method: "POST",
        url: `/personnel/item/${person._id}/sos`,
        body: {},
      });

      setPendingId(null);
      if (!result.queued) onRefresh?.();
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <h3 className="font-display text-sm font-semibold tracking-wide text-[var(--text-primary)] uppercase flex items-center gap-2">
          <Activity className="w-4 h-4 text-[var(--ice-cyan)] animate-pulse" />
          Crew Biometrics &amp; Expedition Roster
        </h3>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase">
          {personnel.length} On-Site
        </span>
      </div>

      <div className="space-y-3">
        {personnel.map((p) => {
          const currentStatus = localStatuses[p._id] || p.healthStatus || "fit";
          const isCritical = currentStatus === "critical";

          return (
            <div
              key={p._id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                isCritical
                  ? "bg-red-950/40 border-red-500/60 shadow-md ring-1 ring-red-500/30"
                  : "bg-[var(--bg-panel-raised)] border-[var(--border-subtle)] hover:border-[var(--ice-cyan-dim)]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCritical ? "animate-ping bg-red-400" : ""}`}
                  style={{ background: isCritical ? "#FF5D5D" : HEALTH_COLOR[currentStatus] || "var(--status-nominal)" }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{p.name}</p>
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[var(--bg-deep)] text-[var(--text-tertiary)] uppercase">
                      {p.shift}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                    {p.role} · Vitals: {p.vitals?.hr || (isCritical ? 138 : 72)} bpm / {p.vitals?.spo2 || (isCritical ? 88 : 99)}% SpO₂
                  </p>
                </div>
              </div>

              {/* Animated Mini ECG Pulse Waveform */}
              <div className="hidden md:flex items-center px-2 py-1 rounded bg-[var(--bg-deep)] border border-[var(--border-subtle)] opacity-80">
                <svg viewBox="0 0 60 20" className="w-14 h-4">
                  <path
                    d="M 0 10 L 15 10 L 20 2 L 25 18 L 30 7 L 35 12 L 40 10 L 60 10"
                    fill="none"
                    stroke={isCritical ? "#FF5D5D" : "var(--ice-cyan)"}
                    strokeWidth="1.5"
                    className="animate-pulse"
                  />
                </svg>
              </div>

              <button
                onClick={() => handleToggleSOS(p)}
                disabled={pendingId === p._id}
                className={`shrink-0 text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer disabled:opacity-50 ${
                  isCritical
                    ? "bg-red-500/30 text-red-200 border-red-500/70 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/50"
                    : "border-red-500/40 text-red-400 hover:bg-red-500/20"
                }`}
                title={
                  isCritical
                    ? "Click to Stand Down / Clear active emergency SOS"
                    : isOffline
                    ? "Will broadcast SOS beacon locally and queue to sync to HQ"
                    : "Raise emergency SOS"
                }
              >
                {pendingId === p._id ? "…" : isCritical ? "OFF SOS (Clear)" : "SOS"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
