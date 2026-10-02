import { useState, useEffect } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  Volume2,
  VolumeX,
  Zap,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import soundEngine from "../services/soundEngine.js";

export default function CriticalAlertBanner({
  prediction,
  stationCode = "MAITRI",
  onExecuteMitigation,
  onResetNominal,
}) {
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted());

  const disasters = prediction?.activeDisasters?.length > 0
    ? prediction.activeDisasters
    : prediction?.activeDisaster
    ? [prediction.activeDisaster]
    : [];

  const isCritical =
    prediction?.status === "critical" ||
    (prediction?.riskScore || 0) >= 70 ||
    disasters.length > 0;

  const isWarning =
    !isCritical &&
    (prediction?.status === "warning" || (prediction?.riskScore || 0) >= 30);

  const riskScore = prediction?.riskScore || (isCritical ? 92 : 8);
  const ttfFormatted =
    prediction?.timeToFailure?.formatted ||
    (isCritical ? "4h 20m remaining until habitat power drop" : ">72h stable buffer");
  const activeFaultsStr =
    disasters.length > 0
      ? disasters.join(" + ")
      : isCritical
      ? "Subsystem Anomaly"
      : "None";

  const alertMessage =
    prediction?.alert?.message ||
    `Disaster is active! Inspect live 2D CAD animation and thermal layer on the main twin.`;

  useEffect(() => {
    if (isCritical || isWarning) {
      soundEngine.startSiren();
    } else {
      soundEngine.stopSiren();
    }
    return () => {
      soundEngine.stopSiren();
    };
  }, [isCritical, isWarning, activeFaultsStr]);

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundEngine.setMuted(nextMute);
    if (!nextMute && (isCritical || isWarning)) {
      soundEngine.startSiren();
    }
  };

  if (!isCritical && !isWarning) return null;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-2xl ${
        isCritical
          ? "bg-red-950/50 border-red-500/80 shadow-[0_0_35px_rgba(255,93,93,0.35)] ring-1 ring-red-500/40"
          : "bg-amber-950/40 border-amber-500/60 shadow-[0_0_20px_rgba(244,169,59,0.2)]"
      }`}
    >
      {/* Top Row: AI Title, Station & Faults, Risk Index & TTF Countdown */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BrainCircuit
              className={`w-5 h-5 ${
                isCritical
                  ? "text-red-400 animate-spin"
                  : isWarning
                  ? "text-amber-400"
                  : "text-[var(--aurora-teal)]"
              }`}
            />
            <span className="font-mono text-xs uppercase font-bold text-white tracking-wider">
              LIVE AI RISK &amp; TTF TELEMETRY EVALUATION
            </span>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isCritical
                  ? "bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}
            >
              {prediction?.status || (isCritical ? "CRITICAL" : "WARNING")}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-mono">
            Target: <span className="text-white font-bold">{stationCode} Station</span> · Active Faults:{" "}
            <span className="font-bold text-red-400 font-mono">{activeFaultsStr}</span>
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] uppercase font-mono text-[var(--text-tertiary)]">Risk Index</p>
            <p
              className={`font-mono text-2xl font-bold ${
                isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-[var(--aurora-teal)]"
              }`}
            >
              {riskScore}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-mono text-[var(--text-tertiary)]">
              Projected TTF Countdown
            </p>
            <p
              className={`font-mono text-lg font-bold ${
                isCritical ? "text-red-300" : isWarning ? "text-amber-300" : "text-[var(--aurora-teal)]"
              }`}
            >
              {ttfFormatted}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Strip */}
      <div className="mt-3 pt-3 border-t border-red-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-red-200 font-mono">
          <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce shrink-0" />
          <span>{alertMessage}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mute Audio Alarm */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? "Unmute Alarm Siren" : "Mute Alarm Siren"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/40 bg-red-950/40 text-red-300 hover:bg-red-900/50 text-xs font-mono font-bold transition cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            )}
            <span>{isMuted ? "Muted" : "Mute Alarm"}</span>
          </button>

          {/* Reset to Nominal */}
          {onResetNominal && (
            <button
              onClick={() => {
                soundEngine.stopSiren();
                onResetNominal();
              }}
              className="px-3.5 py-1.5 rounded-xl border border-red-500/40 text-xs font-mono text-red-300 hover:bg-red-950/60 transition cursor-pointer"
            >
              Reset to Nominal
            </button>
          )}

          {/* Execute SOP Countermeasure */}
          {prediction?.recommendations && prediction.recommendations.length > 0 && onExecuteMitigation && (
            <button
              onClick={() => {
                soundEngine.stopSiren();
                onExecuteMitigation(prediction.recommendations[0]);
              }}
              className="px-4 py-1.5 rounded-xl text-xs font-bold font-display bg-gradient-to-r from-red-500 to-amber-500 text-black hover:opacity-90 shadow-lg shadow-red-500/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Execute {prediction.recommendations[0].label || "SOP Protocol"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
