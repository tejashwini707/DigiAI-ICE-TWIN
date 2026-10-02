import { useEffect, useState } from "react";
import { Radio, Signal, Cpu, Compass, Wifi, WifiOff } from "lucide-react";

export default function SatelliteTracker({ isOffline }) {
  const [snr, setSnr] = useState(48.5);
  const [packetLoss, setPacketLoss] = useState(0.02);
  const [azimuth, setAzimuth] = useState(142.4);

  useEffect(() => {
    if (isOffline) {
      setSnr(0);
      setPacketLoss(100);
      return;
    }

    const interval = setInterval(() => {
      setSnr((prev) => Math.min(52, Math.max(42, +(prev + (Math.random() * 1.2 - 0.6)).toFixed(1))));
      setPacketLoss((prev) => Math.min(0.8, Math.max(0.01, +(prev + (Math.random() * 0.04 - 0.02)).toFixed(2))));
      setAzimuth((prev) => +(142.4 + Math.sin(Date.now() / 10000) * 1.5).toFixed(1));
    }, 2500);

    return () => clearInterval(interval);
  }, [isOffline]);

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Radio className={`w-4 h-4 ${isOffline ? "text-red-400 animate-pulse" : "text-[var(--ice-cyan)] animate-spin"}`} />
          <h3 className="font-display text-sm font-semibold tracking-wide text-[var(--text-primary)] uppercase">
            ISRO GSAT-30 / GSAT-14 Orbital Satcom Tracker
          </h3>
        </div>
        <span
          className={`font-mono text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
            isOffline
              ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse"
              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
          }`}
        >
          {isOffline ? "SATCOM LINK DROPOUT" : "UPLINK NOMINAL"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Radar Sweep Visual Canvas */}
        <div className="relative flex items-center justify-center p-3 rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)]">
          <svg viewBox="0 0 160 160" className="w-36 h-36 select-none">
            {/* Radar Concentric Rings */}
            <circle cx="80" cy="80" r="70" fill="none" stroke="#1F2937" strokeWidth="1.5" />
            <circle cx="80" cy="80" r="50" fill="none" stroke="#1F2937" strokeWidth="1.5" />
            <circle cx="80" cy="80" r="30" fill="none" stroke="#1F2937" strokeWidth="1.5" />
            <circle cx="80" cy="80" r="10" fill="none" stroke="#1F2937" strokeWidth="1.5" />

            {/* Crosshair Axes */}
            <line x1="80" y1="10" x2="80" y2="150" stroke="#1F2937" strokeWidth="1.5" />
            <line x1="10" y1="80" x2="150" y2="80" stroke="#1F2937" strokeWidth="1.5" />

            {/* Rotating Radar Sweep Line */}
            {!isOffline && (
              <g style={{ transformOrigin: "80px 80px" }} className="animate-spin-slow">
                <path d="M 80 80 L 145 45 A 70 70 0 0 0 80 10 Z" fill="url(#radarGradient)" opacity="0.4" />
                <line x1="80" y1="80" x2="145" y2="45" stroke="var(--ice-cyan)" strokeWidth="2" />
              </g>
            )}

            {/* Satellite Blip Dot */}
            <circle
              cx={isOffline ? 80 : 115}
              cy={isOffline ? 80 : 50}
              r={isOffline ? 5 : 4}
              fill={isOffline ? "#FF5D5D" : "var(--ice-cyan)"}
              className={isOffline ? "animate-ping" : "animate-pulse"}
            />

            <defs>
              <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--ice-cyan)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--ice-cyan)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute bottom-2 font-mono text-[9px] text-[var(--text-tertiary)] uppercase">
            POLAR GSAT SWEEP
          </span>
        </div>

        {/* Telemetry Telecommunication Metrics */}
        <div className="space-y-2.5">
          <div className="p-2.5 rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Signal className="w-3.5 h-3.5 text-[var(--ice-cyan)]" />
              <span className="text-xs text-[var(--text-secondary)] font-mono">Signal-to-Noise Ratio (SNR)</span>
            </div>
            <span className="font-mono text-xs font-bold" style={{ color: isOffline ? "#FF5D5D" : "#4ADE80" }}>
              {isOffline ? "0.0 dB" : `${snr} dB`}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-[var(--aurora-violet)]" />
              <span className="text-xs text-[var(--text-secondary)] font-mono">Satellite Dish Azimuth</span>
            </div>
            <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
              {isOffline ? "DISH LOCK FROZEN" : `${azimuth}° SE`}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-[var(--text-secondary)] font-mono">Transponder Packet Loss</span>
            </div>
            <span className="font-mono text-xs font-bold" style={{ color: isOffline ? "#FF5D5D" : packetLoss > 0.4 ? "#F4A93B" : "#4ADE80" }}>
              {isOffline ? "100.0%" : `${packetLoss}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
