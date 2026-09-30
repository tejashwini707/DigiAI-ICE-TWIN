import { useState, useEffect } from "react";
import { AlertTriangle, AlertOctagon, ShieldAlert, CheckCircle2, Volume2, VolumeX, ArrowRight } from "lucide-react";

// Web Audio API synthesizer for Antarctic telemetry alerts (no external audio files required)
function playAlertBeep(severity = "critical") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = severity === "critical" ? "sawtooth" : "sine";
    osc.frequency.setValueAtTime(severity === "critical" ? 880 : 587.33, ctx.currentTime); // A5 or D5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // browser audio autoplay restrictions
  }
}

export default function CriticalAlertBanner({ prediction, onExecuteMitigation }) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const alert = prediction?.alert;
  const isCritical = alert?.level === "critical";
  const isWarning = alert?.level === "warning";
  const ttf = prediction?.timeToFailure;

  useEffect(() => {
    // Reset acknowledgment on new alert title
    setAcknowledged(false);
    if (alert && soundEnabled) {
      playAlertBeep(alert.level);
    }
  }, [alert?.title, soundEnabled]);

  if (!alert || (acknowledged && !isCritical)) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${
        isCritical
          ? "bg-red-950/40 border-red-500/60 shadow-[0_0_30px_rgba(255,93,93,0.25)] animate-pulse-subtle"
          : isWarning
          ? "bg-amber-950/30 border-amber-500/50 shadow-[0_0_20px_rgba(244,169,59,0.15)]"
          : "bg-blue-950/30 border-cyan-500/40"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Alert Icon and Info */}
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isCritical
                ? "bg-red-500/20 text-red-400 ring-2 ring-red-500/40"
                : isWarning
                ? "bg-amber-500/20 text-amber-400"
                : "bg-cyan-500/20 text-cyan-300"
            }`}
          >
            {isCritical ? (
              <AlertOctagon className="w-6 h-6 animate-bounce-subtle" />
            ) : isWarning ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`font-mono text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isCritical
                    ? "bg-red-500 text-black font-black"
                    : isWarning
                    ? "bg-amber-500 text-black font-bold"
                    : "bg-cyan-500 text-black"
                }`}
              >
                {isCritical ? "🚨 CRITICAL ALERT" : isWarning ? "⚠️ PREDICTION WARNING" : "ℹ️ SYSTEM ADVISORY"}
              </span>

              {ttf?.minutes != null && (
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/40 font-semibold">
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
              onClick={() => onExecuteMitigation(prediction.recommendations[0])}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-display uppercase tracking-wider transition-all bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg hover:shadow-red-500/30 cursor-pointer"
            >
              <span>Execute SOP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute audio alarms" : "Enable alarm sound chimes"}
            className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:bg-[var(--bg-panel-raised)] text-[var(--text-secondary)] transition cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[var(--ice-cyan)]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Acknowledge */}
          <button
            onClick={() => setAcknowledged(true)}
            className="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:bg-[var(--bg-panel-raised)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer font-mono"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
