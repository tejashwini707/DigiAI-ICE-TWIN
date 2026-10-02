import { useState, useEffect } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  Volume2,
  VolumeX,
  Zap,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Clock,
  Radio,
  Activity,
} from "lucide-react";
import soundEngine from "../services/soundEngine.js";

const DISASTER_INFO = {
  generator_failure: {
    title: "PRIMARY DIESEL GENERATOR #1 MECHANICAL STALL",
    desc: "Primary diesel generator output collapsed to 18%. High mechanical vibration and bearing seizure risk. Projected heat dissipation failure in 1h 45m.",
    actionLabel: "Execute SOP-08: Engage Backup Gen #2",
    zone: "Generator Shed",
  },
  battery_drain: {
    title: "INVERTER THERMAL OVERLOAD & RAPID BATTERY DRAIN",
    desc: "Main Inverter Bank #1 thermal threshold breach (>68°C). Battery SOC discharging rapidly at -12.4%/hr. Station blackout projected in 4h 20m.",
    actionLabel: "Execute SOP-14: Shed Loads & Aux Gen",
    zone: "Power Plant",
  },
  blizzard: {
    title: "CATEGORY 4 KATABATIC BLIZZARD STORM INCOMING",
    desc: "Severe 145 km/h katabatic wind gusts & -52°C exterior thermal plunge. External service line freeze in 6 hours without habitat barrier lockdown.",
    actionLabel: "Execute SOP-22: Storm Lockdown",
    zone: "Living Quarters",
  },
  comms_blackout: {
    title: "ISRO GSAT-30 / GSAT-14 POLAR SATCOM DROPOUT",
    desc: "GSAT polar downlink severed & dish ice load locked. Station operating autonomously via Offline-First Edge AI Sync Layer.",
    actionLabel: "Execute SOP-19: Radome De-Icer",
    zone: "Comms Tower",
  },
  water_freeze: {
    title: "SUB-ZERO GLACIAL MELT INTAKE PIPELINE FREEZE",
    desc: "Priyadarshini lake meltwater intake pipeline freezing. Fresh water reserves declining. Auxiliary trace heating required.",
    actionLabel: "Execute SOP-31: Melt Trace Heating",
    zone: "Water Treatment Plant",
  },
};

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
    (isCritical ? "4h 20m until habitat power drop" : ">72h stable buffer");

  // Determine Primary Title & Message
  let primaryTitle = prediction?.alert?.title;
  let primaryDesc = prediction?.alert?.message;

  if (disasters.length >= 2) {
    primaryTitle = `🚨 CRITICAL MULTI-VECTOR DISASTER: ${disasters.map((d) => DISASTER_INFO[d]?.title || d.toUpperCase()).join(" + ")}`;
    primaryDesc = `Multiple simultaneous subsystem failures active at ${stationCode} Station. Autonomous Edge AI coordinating parallel mitigation SOPs. Immediate commander action required.`;
  } else if (disasters.length === 1 && DISASTER_INFO[disasters[0]]) {
    primaryTitle = `🚨 CRITICAL ALERT: ${DISASTER_INFO[disasters[0]].title}`;
    primaryDesc = primaryDesc || DISASTER_INFO[disasters[0]].desc;
  } else if (!primaryTitle) {
    primaryTitle = isCritical
      ? "🚨 HIGH RISK POLAR ANOMALY DETECTED"
      : "⚠️ ELEVATED POLAR RISK WARNING";
    primaryDesc = primaryDesc || "Station telemetry parameters approaching critical threshold bounds. AI predictive model recommends preventative SOP execution.";
  }

  // Manage Sound Siren automatically
  useEffect(() => {
    if (isCritical || isWarning) {
      soundEngine.startSiren();
    } else {
      soundEngine.stopSiren();
    }
    return () => {
      // Don't kill siren if disaster is still actively maintained across short re-renders
      if (!isCritical && !isWarning) {
        soundEngine.stopSiren();
      }
    };
  }, [isCritical, isWarning, disasters.join(",")]);

  const handleToggleMute = (e) => {
    e.stopPropagation();
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundEngine.setMuted(nextMute);
    if (!nextMute && (isCritical || isWarning)) {
      soundEngine.startSiren();
    }
  };

  const handleManualEnableAudio = async (e) => {
    e.stopPropagation();
    const ready = await soundEngine.ensureAudio();
    if (ready) {
      soundEngine.setMuted(false);
      setIsMuted(false);
      soundEngine.startSiren();
    }
  };

  if (!isCritical && !isWarning) return null;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all relative overflow-hidden shadow-2xl ${
        isCritical
          ? "bg-gradient-to-r from-red-950/80 via-[#200b0e]/90 to-red-950/80 border-red-500 shadow-[0_0_40px_rgba(255,75,75,0.35)] ring-2 ring-red-500/50"
          : "bg-gradient-to-r from-amber-950/80 via-[#1c1409]/90 to-amber-950/80 border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/40"
      }`}
    >
      {/* Background Animated Pulse Glow */}
      <div
        className={`absolute -right-20 -top-20 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-25 animate-pulse ${
          isCritical ? "bg-red-500" : "bg-amber-500"
        }`}
      />

      {/* Top Bar: Emergency Indicator, Target Station, Risk & TTF */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 border-b border-red-500/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase font-extrabold text-red-300 tracking-wider">
                {isCritical ? "CRITICAL POLAR EMERGENCY ALERT" : "ELEVATED RISK WARNING"}
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-red-500/30 text-white font-bold uppercase animate-ping">
                LIVE
              </span>
            </div>
            <p className="font-mono text-[11px] text-gray-300">
              Station: <span className="text-white font-bold">{stationCode}</span> · Subsystems:{" "}
              <span className="font-bold text-red-300">{disasters.length > 0 ? disasters.join(" + ") : "Telemetry Anomaly"}</span>
            </p>
          </div>
        </div>

        {/* Live Risk Index & TTF Countdown */}
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-[10px] uppercase font-mono text-gray-400">Risk Score</p>
            <p className={`font-mono text-2xl font-extrabold ${isCritical ? "text-red-400 animate-pulse" : "text-amber-400"}`}>
              {riskScore}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-mono text-gray-400">Projected TTF Window</p>
            <p className={`font-mono text-base font-bold ${isCritical ? "text-red-200" : "text-amber-200"}`}>
              {ttfFormatted}
            </p>
          </div>
        </div>
      </div>

      {/* Main Alert Message Content */}
      <div className="my-3 space-y-1 relative z-10">
        <h4 className="font-display text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce shrink-0" />
          <span>{primaryTitle}</span>
        </h4>
        <p className="text-xs sm:text-sm text-red-100/90 leading-relaxed font-mono">
          {primaryDesc}
        </p>
      </div>

      {/* Action Controls Toolbar */}
      <div className="pt-3 border-t border-red-500/30 flex flex-wrap items-center justify-between gap-3 relative z-10">
        {/* Audio Siren Control */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleMute}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition cursor-pointer ${
              isMuted
                ? "bg-red-950/40 border-red-500/40 text-red-400 hover:bg-red-900/50"
                : "bg-red-600/30 border-red-400 text-red-200 hover:bg-red-600/50 ring-1 ring-red-400/40"
            }`}
            title={isMuted ? "Unmute Alarm Siren" : "Mute Alarm Siren"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-red-300 animate-pulse" />
            )}
            <span>{isMuted ? "Alarm Muted" : "🚨 Alarm Siren Active"}</span>
          </button>

          {/* Quick Audio Test / Unlock helper */}
          <button
            type="button"
            onClick={handleManualEnableAudio}
            className="hidden sm:inline-flex text-[11px] font-mono text-red-300/80 hover:text-white transition cursor-pointer underline underline-offset-2"
          >
            Sound Check
          </button>
        </div>

        {/* Countermeasures: SOP Execution & Reset */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Reset to Nominal */}
          {onResetNominal && (
            <button
              type="button"
              onClick={() => {
                soundEngine.stopSiren();
                onResetNominal();
              }}
              className="px-3.5 py-1.5 rounded-xl border border-red-500/50 bg-red-950/50 hover:bg-red-900/60 text-xs font-mono text-red-200 transition cursor-pointer shadow-sm"
            >
              Reset to Nominal
            </button>
          )}

          {/* Execute SOP Countermeasure */}
          {prediction?.recommendations && prediction.recommendations.length > 0 && onExecuteMitigation ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.stopSiren();
                onExecuteMitigation(prediction.recommendations[0]);
              }}
              className="px-4 py-1.5 rounded-xl text-xs font-bold font-display bg-gradient-to-r from-red-500 via-amber-500 to-yellow-500 text-black hover:opacity-95 shadow-lg shadow-red-500/40 flex items-center gap-1.5 transition cursor-pointer animate-pulse"
            >
              <Zap className="w-4 h-4" />
              <span>{prediction.recommendations[0].label || "Execute SOP Countermeasure"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                soundEngine.stopSiren();
                if (onExecuteMitigation) {
                  onExecuteMitigation({
                    id: "emergency_mitigate",
                    label: "SOP-14: Emergency Grid Stabilization",
                    protocol: "shed_load_aux_gen",
                    riskDelta: "-45%",
                  });
                } else if (onResetNominal) {
                  onResetNominal();
                }
              }}
              className="px-4 py-1.5 rounded-xl text-xs font-bold font-display bg-gradient-to-r from-red-500 to-amber-500 text-black hover:opacity-95 shadow-lg shadow-red-500/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Execute Emergency Mitigation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

