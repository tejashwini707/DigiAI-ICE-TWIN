import { useState, useMemo } from "react";
import { Cpu, Eye, Radio, Shield, AlertCircle, Info, Sparkles, Flame, EyeOff } from "lucide-react";

const STATUS_COLOR = {
  nominal: "#4ADE80",
  warning: "#F4A93B",
  critical: "#FF5D5D",
  offline: "#64748B",
};

const LAYOUT = {
  "power-plant":     { x: 35,  y: 50,  w: 140, h: 90,  shape: "rect", icon: "⚡", label: "Power Plant", subtitle: "Grid Bus & Inverters", temp: "22°C" },
  "generator-shed":  { x: 35,  y: 170, w: 140, h: 80,  shape: "rect", icon: "⚙", label: "GenSet Cluster", subtitle: "Diesel Units #1-#3", temp: "68°C" },
  "fuel-depot":      { x: 35,  y: 275, w: 140, h: 80,  shape: "rect", icon: "⛽", label: "Fuel Storage", subtitle: "Polar Grade Bulk", temp: "-12°C" },
  "living-quarters": { x: 215, y: 50,  w: 180, h: 120, shape: "rect", icon: "🏠", label: "Living Habitat", subtitle: "Berths, Mess & Life Support", temp: "20°C" },
  "research-lab":    { x: 215, y: 195, w: 180, h: 85,  shape: "rect", icon: "🔬", label: "Research Lab", subtitle: "Atmospheric & Ice Cores", temp: "18°C" },
  "medical-bay":     { x: 215, y: 305, w: 180, h: 75,  shape: "rect", icon: "✚", label: "Medical Bay", subtitle: "Surgical & Telemedicine", temp: "22°C" },
  "comms-tower":     { x: 440, y: 40,  w: 70,  h: 70,  shape: "circle", icon: "📡", label: "SATCOM Tower", subtitle: "GSAT Array & Uplink", temp: "-28°C" },
  "supply-storage":  { x: 430, y: 145, w: 155, h: 100, shape: "rect", icon: "📦", label: "Cryo Warehouse", subtitle: "Rations & Spares Depot", temp: "-18°C" },
  "water-plant":     { x: 430, y: 275, w: 155, h: 95,  shape: "rect", icon: "💧", label: "Water Plant", subtitle: "Lake Melt Intake & RO", temp: "4°C" },
};

const DEFAULT_ZONES = [
  { zoneId: "power-plant", label: "Power Plant (Main Grid)", type: "power", status: "nominal" },
  { zoneId: "generator-shed", label: "Generator Shed (Diesel #1/#2)", type: "generator", status: "nominal" },
  { zoneId: "fuel-depot", label: "Fuel Depot (Polar Diesel & ATF)", type: "fuel", status: "nominal" },
  { zoneId: "living-quarters", label: "Living Quarters (Habitat Block)", type: "habitat", status: "nominal" },
  { zoneId: "research-lab", label: "Research Laboratory & Earth Sensors", type: "lab", status: "nominal" },
  { zoneId: "comms-tower", label: "Satellite Comms & Nav Array", type: "comms", status: "nominal" },
  { zoneId: "medical-bay", label: "Medical Bay & Hyperbaric Unit", type: "medical", status: "nominal" },
  { zoneId: "supply-storage", label: "Supply Storage & Cryo Storage", type: "storage", status: "nominal" },
  { zoneId: "water-plant", label: "Water Treatment & Melt Intake", type: "water", status: "nominal" },
];

function ZoneShape({ zone, layout, onSelect, selected, flirMode }) {
  const status = zone?.status || "nominal";
  const color = STATUS_COLOR[status] || STATUS_COLOR.nominal;
  const isCircle = layout.shape === "circle";
  const cx = layout.x + layout.w / 2;
  const cy = layout.y + layout.h / 2;
  const isSelected = selected === zone.zoneId;
  const isCritical = status === "critical";
  const isWarning = status === "warning";

  // FLIR Thermal Color Fill
  const flirFill =
    layout.zoneId === "generator-shed"
      ? "rgba(239, 68, 68, 0.45)"
      : layout.temp?.includes("-")
      ? "rgba(59, 130, 246, 0.45)"
      : "rgba(245, 158, 11, 0.4)";

  return (
    <g
      onClick={() => onSelect(zone.zoneId)}
      className="cursor-pointer transition-all duration-200 group"
      opacity={selected && !isSelected ? 0.45 : 1}
    >
      {/* Zone Background Box with Glow */}
      {isCircle ? (
        <>
          {isCritical && (
            <circle cx={cx} cy={cy} r={layout.w / 2 + 6} fill="none" stroke="#FF5D5D" strokeWidth="2" opacity="0.6" className="animate-ping" />
          )}
          <circle
            cx={cx}
            cy={cy}
            r={layout.w / 2}
            fill={flirMode ? flirFill : "var(--bg-panel-raised)"}
            stroke={color}
            strokeWidth={isSelected ? 3 : 1.8}
            className="group-hover:stroke-[var(--ice-cyan)] transition"
          />
        </>
      ) : (
        <>
          {isCritical && (
            <rect
              x={layout.x - 4}
              y={layout.y - 4}
              width={layout.w + 8}
              height={layout.h + 8}
              rx={10}
              fill="none"
              stroke="#FF5D5D"
              strokeWidth="2"
              opacity="0.6"
              className="animate-pulse"
            />
          )}
          <rect
            x={layout.x}
            y={layout.y}
            width={layout.w}
            height={layout.h}
            rx={8}
            fill={flirMode ? flirFill : "var(--bg-panel-raised)"}
            stroke={color}
            strokeWidth={isSelected ? 3 : 1.8}
            className="group-hover:stroke-[var(--ice-cyan)] transition"
          />
        </>
      )}

      {/* Status indicator dot */}
      <circle
        cx={layout.x + 14}
        cy={layout.y + 14}
        r={4.5}
        fill={color}
        className={isCritical || isWarning ? "animate-ping" : ""}
      />
      <circle cx={layout.x + 14} cy={layout.y + 14} r={3.5} fill={color} />

      {/* Icon */}
      <text
        x={cx}
        y={isCircle ? cy - 2 : layout.y + 36}
        textAnchor="middle"
        fontSize="16"
        fontFamily="var(--font-mono)"
        fill="var(--text-primary)"
      >
        {layout.icon}
      </text>

      {/* Label */}
      <text
        x={cx}
        y={isCircle ? cy + 18 : layout.y + 56}
        textAnchor="middle"
        fontSize="11"
        fontFamily="var(--font-display)"
        fill="var(--text-primary)"
        fontWeight="600"
      >
        {zone.label || layout.label}
      </text>

      {/* Subtitle / Thermal Reading */}
      {!isCircle && (
        <text
          x={cx}
          y={layout.y + 70}
          textAnchor="middle"
          fontSize="8.5"
          fontFamily="var(--font-mono)"
          fill={flirMode ? "var(--ice-cyan)" : "var(--text-tertiary)"}
          fontWeight={flirMode ? "bold" : "normal"}
        >
          {flirMode ? `FLIR Temp: ${layout.temp}` : layout.subtitle}
        </text>
      )}

      {/* Status Badge text */}
      <text
        x={layout.x + layout.w - 10}
        y={layout.y + 15}
        textAnchor="end"
        fontSize="8"
        fontFamily="var(--font-mono)"
        fontWeight="bold"
        fill={color}
      >
        {status.toUpperCase()}
      </text>
    </g>
  );
}

export default function StationTwin({ station, isOffline, selectedZone, onSelectZone }) {
  const [flirMode, setFlirMode] = useState(false);

  const zones = useMemo(() => {
    if (station?.zones && station.zones.length > 0) return station.zones;
    return DEFAULT_ZONES;
  }, [station]);

  const isBlizzard = station?.activeDisaster === "blizzard";
  const stationName = station?.name || "Maitri Station";
  const lat = station?.location?.lat ?? -70.7669;
  const lng = station?.location?.lng ?? 11.7333;
  const region = station?.location?.region || "Schirmacher Oasis, Queen Maud Land";

  return (
    <div className="relative rounded-2xl p-[1.5px] overflow-hidden shadow-2xl">
      {/* Animated Aurora or Frozen Border */}
      <div className={`absolute inset-0 ${isOffline ? "frozen-border" : "aurora-border"}`} />

      <div className="relative rounded-2xl bg-[var(--bg-panel)] p-4 sm:p-6 space-y-4">
        {/* Twin Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--ice-cyan)] bg-[var(--bg-panel-raised)] px-2 py-0.5 rounded border border-[var(--ice-cyan-dim)]">
                Live 2D Physics Schematic &amp; FLIR Thermal Twin
              </span>
              <h3 className="font-display text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                {stationName} Digital Twin Schematic
              </h3>
            </div>
            <p className="font-mono text-xs text-[var(--text-tertiary)] mt-0.5">
              Lat: {lat}° · Long: {lng}° · Region: {region}
            </p>
          </div>

          {/* FLIR IR Heatmap Toggle & Connectivity State */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFlirMode((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition cursor-pointer ${
                flirMode
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                  : "bg-[var(--bg-deep)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="Toggle FLIR Infra-Red Thermal Heatmap View Mode"
            >
              <Flame className={`w-3.5 h-3.5 ${flirMode ? "text-amber-400 animate-pulse" : ""}`} />
              <span>{flirMode ? "FLIR Thermal: ON" : "FLIR Thermal: OFF"}</span>
            </button>

            <div className="flex items-center gap-2.5 font-mono text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${isOffline ? "bg-cyan-400 animate-pulse" : "bg-emerald-400 animate-ping"}`}
              />
              <span
                className="font-bold tracking-wide hidden sm:inline"
                style={{ color: isOffline ? "var(--ice-cyan)" : "var(--status-nominal)" }}
              >
                {isOffline ? "AUTONOMOUS EDGE TWIN" : "LIVE STREAMING"}
              </span>
            </div>
          </div>
        </div>

        {/* SVG Canvas for Station Digital Twin */}
        <div className="relative bg-[var(--bg-deep)] rounded-xl p-2 border border-[var(--border-subtle)] overflow-hidden">
          {/* Animated Power Bus Grid Lines */}
          <svg
            viewBox="0 0 620 410"
            className="w-full h-auto select-none"
            role="img"
            aria-label={`${stationName} station schematic`}
          >
            <defs>
              {/* Power Flow animated pattern */}
              <pattern id="powerGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#1F2937" />
              </pattern>
            </defs>

            {/* Background Grid */}
            <rect width="620" height="410" fill="url(#powerGrid)" />

            {/* Power Flow Interconnection Lines */}
            <g opacity="0.75">
              {/* Power Plant to GenShed */}
              <line x1="105" y1="140" x2="105" y2="170" stroke="#F4A93B" strokeWidth="2.5" strokeDasharray="4 3" />
              {/* GenShed to Fuel Depot */}
              <line x1="105" y1="250" x2="105" y2="275" stroke="#FB923C" strokeWidth="2" strokeDasharray="4 3" />
              {/* Power Plant to Habitat */}
              <path d="M 175 95 L 215 95" stroke="#6FE7DD" strokeWidth="2.5" strokeDasharray="4 3" />
              {/* Habitat to Research Lab */}
              <line x1="305" y1="170" x2="305" y2="195" stroke="#6FE7DD" strokeWidth="2" strokeDasharray="4 3" />
              {/* Research Lab to Medical Bay */}
              <line x1="305" y1="280" x2="305" y2="305" stroke="#6FE7DD" strokeWidth="2" strokeDasharray="4 3" />
              {/* Habitat to Comms */}
              <path d="M 395 90 L 440 75" stroke="#9B8CFF" strokeWidth="2" strokeDasharray="4 3" />
              {/* Habitat to Water Plant */}
              <path d="M 395 130 L 415 130 L 415 320 L 430 320" fill="none" stroke="#60A5FA" strokeWidth="2" strokeDasharray="4 3" />
            </g>

            {/* Render 9 Station Zones */}
            {zones.map((zone) => {
              const layout = LAYOUT[zone.zoneId];
              if (!layout) return null;
              return (
                <ZoneShape
                  key={zone.zoneId}
                  zone={zone}
                  layout={layout}
                  onSelect={onSelectZone}
                  selected={selectedZone}
                  flirMode={flirMode}
                />
              );
            })}
          </svg>

          {/* FLIR Thermal Overlay Indicator */}
          {flirMode && (
            <div className="absolute top-3 right-3 bg-amber-950/80 border border-amber-500 px-3 py-1 rounded-lg text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1.5 shadow-lg animate-pulse">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>FLIR IR HEATMAP DISSIPATION VIEW</span>
            </div>
          )}

          {/* Blizzard atmospheric snow effect if blizzard disaster active */}
          {isBlizzard && (
            <div className="absolute inset-0 pointer-events-none bg-cyan-400/5 border border-cyan-300/30 flex items-center justify-center">
              <div className="bg-cyan-950/80 border border-cyan-400 px-3 py-1.5 rounded-xl text-cyan-300 font-mono text-xs flex items-center gap-2 animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span>POLAR BLIZZARD ACTIVE (WIND GUSTS 145 KM/H)</span>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
              Zone Status Index:
            </span>
            {Object.entries(STATUS_COLOR).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
                  {status}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[var(--text-tertiary)] italic">
            Click any zone module to inspect diagnostic equipment telemetry
          </p>
        </div>
      </div>
    </div>
  );
}
