import { useState, useEffect } from "react";
import { AlertTriangle, AlertOctagon, ShieldAlert, CheckCircle2, Volume2, VolumeX, ArrowRight } from "lucide-react";
import soundEngine from "../services/soundEngine.js";

export default function CriticalAlertBanner({ prediction, onExecuteMitigation }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted());

  // Derive alert object reliably from prediction
  const isCritical = prediction?.status === "critical" || (prediction?.riskScore || 0) >= 70 || Boolean(prediction?.activeDisaster) || (prediction?.activeDisasters && prediction.activeDisasters.length > 0);
  const isWarning = !isCritical && (prediction?.status === "warning" || (prediction?.riskScore || 0) >= 30);

  const alert = prediction?.alert || (
    isCritical ? {
      level: "critical",
      title: `🚨 CRITICAL ALERT: ${prediction?.primaryThreat || "Active Subsystem Anomaly"}`,
      message: `Station risk index elevated to ${prediction?.riskScore || 88}%. Projected TTF countdown: ${prediction?.timeToFailure?.formatted || "1h 45m"}. Immediate SOP countermeasure execution required.`,
    } : isWarning ? {
      level: "warning",
      title: `⚠️ WARNING: ${prediction?.primaryThreat || "Subsystem Warning"}`,
      message: `Telemetry fluctuation detected. Predictive AI recommends monitoring zone status envelopes.`,
    } : null
  );

  const ttf = prediction?.timeToFailure;

  useEffect(() => {
    setAcknowledged(false);
    if (isCritical || isWarning) {
      soundEngine.startSiren();
    } else {
      soundEngine.stopSiren();
    }
    return () => {
      soundEngine.stopSiren();
    };
  }, [alert?.title, isCritical, isWarning]);

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundEngine.setMuted(nextMute);
    if (!nextMute && (isCritical || isWarning)) {
      soundEngine.startSiren();
    }
  };

  if (!alert || (acknowledged && !isCritical)) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${
        isCritical
          ? "bg-red-950/60 border-red-500/80 shadow-[0_0_35px_rgba(255,93,93,0.4)] animate-pulse-subtle ring-1 ring-red-500/40"
          : isWarning
          ? "bg-amber-950/40 border-amber-500/60 shadow-[0_0_20px_rgba(244,169,59,0.2)]"
          : "bg-blue-950/40 border-cyan-500/50"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Alert Icon and Info */}
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isCritical
                ? "bg-red-500/30 text-red-300 ring-2 ring-red-500/60 shadow-lg"
                : isWarning
                ? "bg-amber-500/20 text-amber-400"
                : "bg-cyan-500/20 text-cyan-300"
            }`}
          >
            {isCritical ? (
              <AlertOctagon className="w-6 h-6 animate-ping text-red-400" />
            ) : isWarning ? (
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-cyan-400" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`font-mono text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isCritical
                    ? "bg-red-500 text-black font-black animate-pulse"
                    : isWarning
                    ? "bg-amber-500 text-black font-bold"
                    : "bg-cyan-500 text-black"
                }`}
              >
                {isCritical ? "🚨 CRITICAL DISASTER ALERT ACTIVE" : isWarning ? "⚠️ PREDICTION WARNING" : "ℹ️ SYSTEM ADVISORY"}
              </span>

              {ttf?.minutes != null && (
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-red-500/30 text-red-200 border border-red-500/50 font-bold">
                  ⏱️ Predicted Failure in: {ttf.formatted}
                </span>
              )}

              <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                {new Date().toLocaleTimeString()}
              </span>
            </div>

            <h3 className="font-display font-semibold text-base sm:text-lg text-[var(--text-primary)]">
              {alert.title}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 max-w-3xl">
              {alert.message}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          {/* Quick Mitigation Action if available */}
          {prediction?.recommendations && prediction.recommendations.length > 0 && (
            <button
              onClick={() => {
                soundEngine.stopSiren();
                onExecuteMitigation(prediction.recommendations[0]);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-display uppercase tracking-wider transition-all bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg hover:shadow-red-500/40 cursor-pointer"
            >
              <span>Execute SOP Protocol</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Sound Mute/Unmute Siren */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? "Unmute Alarm Siren" : "Mute Alarm Siren"}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/40 bg-red-950/40 text-red-300 hover:bg-red-900/50 text-xs font-mono font-bold transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-red-400 animate-pulse" />}
            <span>{isMuted ? "Muted" : "MUTE ALARM"}</span>
          </button>

          {/* Acknowledge */}
          <button
            onClick={() => {
              soundEngine.stopSiren();
              setAcknowledged(true);
            }}
            className="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:bg-[var(--bg-panel-raised)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer font-mono"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
