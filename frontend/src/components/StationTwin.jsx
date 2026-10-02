import { useState, useMemo } from "react";
import {
  Cpu,
  Eye,
  Radio,
  Shield,
  AlertCircle,
  Info,
  Sparkles,
  Flame,
  Layers,
  Activity,
  Wifi,
  X,
  Gauge,
  Power,
  Thermometer,
  Droplet,
  CheckCircle2,
} from "lucide-react";

const STATUS_COLOR = {
  nominal: "#00F5A0",
  warning: "#F59E0B",
  critical: "#FF4B4B",
  offline: "#64748B",
};

const LAYOUT = {
  "power-plant": {
    x: 35,
    y: 50,
    w: 140,
    h: 90,
    shape: "rect",
    icon: "⚡",
    label: "Power Plant",
    subtitle: "Grid Bus & Inverters",
    temp: "22.4°C",
    tempVal: 22.4,
    powerLoad: "48.2 kW",
    latency: "1.2 ms",
    specs: "3x 60kW Synchronous Inverters · 415V 3-Phase Bus",
  },
  "generator-shed": {
    x: 35,
    y: 170,
    w: 140,
    h: 80,
    shape: "rect",
    icon: "⚙",
    label: "GenSet Cluster",
    subtitle: "Diesel Units #1-#3",
    temp: "68.5°C",
    tempVal: 68.5,
    powerLoad: "36.8 kW",
    latency: "2.1 ms",
    specs: "Kirloskar Polar-Grade Diesels · Auto-Failover Matrix",
  },
  "fuel-depot": {
    x: 35,
    y: 275,
    w: 140,
    h: 80,
    shape: "rect",
    icon: "⛽",
    label: "Fuel Storage",
    subtitle: "Polar Grade Bulk",
    temp: "-12.0°C",
    tempVal: -12.0,
    powerLoad: "2.4 kW",
    latency: "3.4 ms",
    specs: "4x 20,000L Double-Walled Cryo Tanks with Thermal Jackets",
  },
  "living-quarters": {
    x: 215,
    y: 50,
    w: 180,
    h: 120,
    shape: "rect",
    icon: "🏠",
    label: "Living Habitat",
    subtitle: "Berths, Mess & Life Support",
    temp: "20.8°C",
    tempVal: 20.8,
    powerLoad: "18.5 kW",
    latency: "0.8 ms",
    specs: "25 Berths · HVAC Air Filtration · Thermal Double-Insulation",
  },
  "research-lab": {
    x: 215,
    y: 195,
    w: 180,
    h: 85,
    shape: "rect",
    icon: "🔬",
    label: "Research Lab",
    subtitle: "Atmospheric & Ice Cores",
    temp: "18.2°C",
    tempVal: 18.2,
    powerLoad: "14.1 kW",
    latency: "0.6 ms",
    specs: "Mass Spectrometry · Ice Core Cryo Vault · Geomagnetic Rig",
  },
  "medical-bay": {
    x: 215,
    y: 305,
    w: 180,
    h: 75,
    shape: "rect",
    icon: "✚",
    label: "Medical Bay",
    subtitle: "Surgical & Telemedicine",
    temp: "22.0°C",
    tempVal: 22.0,
    powerLoad: "6.3 kW",
    latency: "0.9 ms",
    specs: "Hyperbaric Chamber · Telemedicine SATCOM Link · Trauma Unit",
  },
  "comms-tower": {
    x: 440,
    y: 40,
    w: 70,
    h: 70,
    shape: "circle",
    icon: "📡",
    label: "SATCOM Tower",
    subtitle: "GSAT Array & Uplink",
    temp: "-28.4°C",
    tempVal: -28.4,
    powerLoad: "8.9 kW",
    latency: "420 ms",
    specs: "2.4m C/Ku-Band Steerable Radome · ISRO GSAT-30 Feeder",
  },
  "supply-storage": {
    x: 430,
    y: 145,
    w: 155,
    h: 100,
    shape: "rect",
    icon: "📦",
    label: "Cryo Warehouse",
    subtitle: "Rations & Spares Depot",
    temp: "-18.5°C",
    tempVal: -18.5,
    powerLoad: "5.1 kW",
    latency: "4.2 ms",
    specs: "Freeze-Dried Rations · Spares Inventory · Cold Storage",
  },
  "water-plant": {
    x: 430,
    y: 275,
    w: 155,
    h: 95,
    shape: "rect",
    icon: "💧",
    label: "Water Plant",
    subtitle: "Lake Melt Intake & RO",
    temp: "4.5°C",
    tempVal: 4.5,
    powerLoad: "12.0 kW",
    latency: "1.8 ms",
    specs: "Priydarshini Melt Intake · Reverse Osmosis · Trace Heaters",
  },
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

function ZoneShape({ zone, layout, onSelect, selected, activeLayer }) {
  const status = zone?.status || "nominal";
  const color = STATUS_COLOR[status] || STATUS_COLOR.nominal;
  const isCircle = layout.shape === "circle";
  const cx = layout.x + layout.w / 2;
  const cy = layout.y + layout.h / 2;
  const isSelected = selected === zone.zoneId;
  const isCritical = status === "critical";
  const isWarning = status === "warning";

  // FLIR Thermal Color Gradient Fill
  const flirFill =
    layout.tempVal > 50
      ? "rgba(239, 68, 68, 0.55)"
      : layout.tempVal > 20
      ? "rgba(245, 158, 11, 0.45)"
      : layout.tempVal > 0
      ? "rgba(0, 245, 160, 0.35)"
      : "rgba(0, 212, 255, 0.45)";

  // Network Layer Fill
  const networkFill = isSelected
    ? "rgba(139, 92, 246, 0.35)"
    : "rgba(18, 24, 38, 0.85)";

  return (
    <g
      onClick={() => onSelect(zone.zoneId)}
      className="cursor-pointer transition-all duration-200 group"
      opacity={selected && !isSelected ? 0.35 : 1}
    >
      {/* Zone Background Shape */}
      {isCircle ? (
        <>
          {isCritical && (
            <circle cx={cx} cy={cy} r={layout.w / 2 + 8} fill="none" stroke="#FF4B4B" strokeWidth="2.5" opacity="0.7" className="animate-ping" />
          )}
          {activeLayer === "network" && (
            <circle cx={cx} cy={cy} r={layout.w / 2 + 5} fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="3 3" className="animate-spin" style={{ animationDuration: "12s" }} />
          )}
          <circle
            cx={cx}
            cy={cy}
            r={layout.w / 2}
            fill={activeLayer === "flir" ? flirFill : activeLayer === "network" ? networkFill : "rgba(26, 35, 52, 0.75)"}
            stroke={isSelected ? "var(--aurora-teal)" : activeLayer === "network" ? "#8B5CF6" : color}
            strokeWidth={isSelected ? 3.5 : 2}
            className="group-hover:stroke-[var(--aurora-teal)] transition"
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
              rx={12}
              fill="none"
              stroke="#FF4B4B"
              strokeWidth="2.5"
              opacity="0.7"
              className="animate-pulse"
            />
          )}
          <rect
            x={layout.x}
            y={layout.y}
            width={layout.w}
            height={layout.h}
            rx={9}
            fill={activeLayer === "flir" ? flirFill : activeLayer === "network" ? networkFill : "rgba(26, 35, 52, 0.75)"}
            stroke={isSelected ? "var(--aurora-teal)" : activeLayer === "network" ? "#8B5CF6" : color}
            strokeWidth={isSelected ? 3 : 1.8}
            className="group-hover:stroke-[var(--aurora-teal)] transition"
          />
          {/* Engineering CAD Corner Crosshairs */}
          {activeLayer === "cad" && (
            <g stroke="rgba(0, 245, 160, 0.25)" strokeWidth="1" opacity="0.6">
              <line x1={layout.x + 2} y1={layout.y + 6} x2={layout.x + 10} y2={layout.y + 6} />
              <line x1={layout.x + 6} y1={layout.y + 2} x2={layout.x + 6} y2={layout.y + 10} />
            </g>
          )}
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
        y={isCircle ? cy - 4 : layout.y + 36}
        textAnchor="middle"
        fontSize="17"
        fontFamily="var(--font-mono)"
        fill="var(--text-primary)"
      >
        {layout.icon}
      </text>

      {/* Label */}
      <text
        x={cx}
        y={isCircle ? cy + 16 : layout.y + 56}
        textAnchor="middle"
        fontSize="11.5"
        fontFamily="var(--font-display)"
        fill="var(--text-primary)"
        fontWeight="600"
      >
        {zone.label || layout.label}
      </text>

      {/* Subtitle / Layer Specific Text */}
      {!isCircle && (
        <text
          x={cx}
          y={layout.y + 70}
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill={
            activeLayer === "flir"
              ? layout.tempVal > 50
                ? "#FCA5A5"
                : "#00F5A0"
              : activeLayer === "network"
              ? "#C4B5FD"
              : "var(--text-tertiary)"
          }
          fontWeight={activeLayer !== "cad" ? "bold" : "normal"}
        >
          {activeLayer === "flir"
            ? `FLIR IR: ${layout.temp}`
            : activeLayer === "network"
            ? `Bus Latency: ${layout.latency}`
            : layout.subtitle}
        </text>
      )}

      {/* Status Badge text */}
      <text
        x={layout.x + layout.w - 10}
        y={layout.y + 15}
        textAnchor="end"
        fontSize="8.5"
        fontFamily="var(--font-mono)"
        fontWeight="bold"
        fill={color}
      >
        {status.toUpperCase()}
      </text>
    </g>
  );
}

export default function StationTwin({ station, isOffline, selectedZone, onSelectZone, telemetryByZone }) {
  const [activeLayer, setActiveLayer] = useState("cad"); // 'cad' | 'flir' | 'network'

  const zones = useMemo(() => {
    if (station?.zones && station.zones.length > 0) return station.zones;
    return DEFAULT_ZONES;
  }, [station]);

  const selectedZoneData = useMemo(() => {
    if (!selectedZone) return null;
    return zones.find((z) => z.zoneId === selectedZone) || { zoneId: selectedZone, label: selectedZone, status: "nominal" };
  }, [selectedZone, zones]);

  const selectedLayout = LAYOUT[selectedZone] || {};
  const selectedZoneReadings = telemetryByZone?.[selectedZone] || [];

  const isBlizzard = station?.activeDisaster === "blizzard" || station?.activeDisasters?.includes("blizzard");
  const stationName = station?.name || "Maitri Research Station";
  const lat = station?.location?.lat ?? -70.7669;
  const lng = station?.location?.lng ?? 11.7333;
  const region = station?.location?.region || "Schirmacher Oasis, Queen Maud Land";

  return (
    <div className="relative rounded-2xl p-[1.5px] overflow-hidden shadow-2xl">
      {/* Animated Aurora or Frozen Border */}
      <div className={`absolute inset-0 ${isOffline ? "frozen-border" : "aurora-border"}`} />

      <div className="relative rounded-2xl ice-pane p-4 sm:p-6 space-y-4">
        {/* Twin Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--aurora-teal)] bg-[var(--bg-panel-raised)] px-2.5 py-0.5 rounded border border-[var(--border-frozen)]">
                {activeLayer === "cad" ? "Physical CAD Schematic" : activeLayer === "flir" ? "FLIR Infra-Red Thermal Twin" : "RF & Network Bus Topology"}
              </span>
              <h3 className="font-display text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                {stationName} Digital Twin
              </h3>
            </div>
            <p className="font-mono text-xs text-[var(--text-tertiary)] mt-0.5">
              Lat: {lat}° · Long: {lng}° · Region: {region}
            </p>
          </div>

          {/* Layer Selector Buttons & Connectivity State */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-0.5">
              <button
                onClick={() => setActiveLayer("cad")}
                className={`flex items-center gap-1.5 px-2.5 py-1.2 rounded-lg font-mono text-xs font-semibold transition cursor-pointer ${
                  activeLayer === "cad"
                    ? "bg-[var(--bg-panel-raised)] text-[var(--aurora-teal)] border border-[var(--border-frozen)]"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
                title="Physical Blueprint & Conduits"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Physical CAD</span>
              </button>

              <button
                onClick={() => setActiveLayer("flir")}
                className={`flex items-center gap-1.5 px-2.5 py-1.2 rounded-lg font-mono text-xs font-semibold transition cursor-pointer ${
                  activeLayer === "flir"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
                title="Infra-Red Thermal Heat Dissipation"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>FLIR Thermal</span>
              </button>

              <button
                onClick={() => setActiveLayer("network")}
                className={`flex items-center gap-1.5 px-2.5 py-1.2 rounded-lg font-mono text-xs font-semibold transition cursor-pointer ${
                  activeLayer === "network"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
                title="Network Packet Routing & SATCOM Uplink"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Network &amp; RF</span>
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs pl-2 border-l border-[var(--border-subtle)]">
              <span
                className={`w-2.5 h-2.5 rounded-full ${isOffline ? "bg-[var(--aurora-cyan)] animate-pulse" : "bg-[var(--aurora-teal)] animate-ping"}`}
              />
              <span
                className="font-bold tracking-wide hidden sm:inline"
                style={{ color: isOffline ? "var(--aurora-cyan)" : "var(--status-nominal)" }}
              >
                {isOffline ? "AUTONOMOUS EDGE" : "LIVE 2D TWIN"}
              </span>
            </div>
          </div>
        </div>

        {/* Main Twin Body with Slide-In Diagnostic Drawer */}
        <div className="relative bg-[var(--bg-deep)]/90 rounded-xl border border-[var(--border-subtle)] overflow-hidden">
          {/* SVG Canvas for Station Digital Twin */}
          <div className="p-2 w-full overflow-hidden">
            <svg
              viewBox="0 0 620 410"
              className="w-full h-auto select-none"
              role="img"
              aria-label={`${stationName} station schematic`}
            >
              <defs>
                {/* Engineering Dot Grid */}
                <pattern id="twinGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="rgba(255, 255, 255, 0.08)" />
                </pattern>
                {/* FLIR Heatmap Pattern */}
                <radialGradient id="flirHeatGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#00F5A0" stopOpacity="0.05" />
                </radialGradient>
              </defs>

              {/* Background Grid */}
              <rect width="620" height="410" fill="url(#twinGrid)" />

              {/* Conduits & Flow Lines */}
              <g>
                {/* Power Conduits (Amber / Electric Aurora Teal) */}
                <line x1="105" y1="140" x2="105" y2="170" stroke="#F59E0B" strokeWidth="3" className="flow-line-power" />
                <line x1="105" y1="250" x2="105" y2="275" stroke="#FB923C" strokeWidth="2.5" className="flow-line-fuel" />
                <path d="M 175 95 L 215 95" stroke="#00F5A0" strokeWidth="3" className="flow-line-power" />
                <line x1="305" y1="170" x2="305" y2="195" stroke="#00F5A0" strokeWidth="2.5" className="flow-line-power" />
                <line x1="305" y1="280" x2="305" y2="305" stroke="#00F5A0" strokeWidth="2.5" className="flow-line-power" />

                {/* SATCOM / Comms Data Bus (Aurora Violet) */}
                <path d="M 395 90 L 440 75" stroke="#8B5CF6" strokeWidth="2.5" className="flow-line-network" />

                {/* Water Glycol Melt Pipe (Cyan / Blue) */}
                <path d="M 395 130 L 415 130 L 415 320 L 430 320" fill="none" stroke="#00D4FF" strokeWidth="2.5" className="flow-line-water" />

                {/* Network Layer: Additional Module-to-Module RF Routing Paths */}
                {activeLayer === "network" && (
                  <g stroke="#8B5CF6" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6">
                    <line x1="475" y1="110" x2="475" y2="145" />
                    <line x1="305" y1="170" x2="430" y2="195" />
                    <line x1="175" y1="95" x2="440" y2="75" />
                  </g>
                )}
              </g>

              {/* Render Station Zones */}
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
                    activeLayer={activeLayer}
                  />
                );
              })}
            </svg>
          </div>

          {/* Layer Specific Overlays */}
          {activeLayer === "flir" && (
            <div className="absolute top-3 right-3 bg-amber-950/85 border border-amber-500 px-3 py-1.5 rounded-xl text-amber-300 font-mono text-[10px] font-bold flex items-center gap-2 shadow-xl animate-pulse">
              <Flame className="w-4 h-4 text-amber-400" />
              <div>
                <p>FLIR IR CALIBRATION: ACTIVE</p>
                <p className="text-[9px] text-amber-200/80 font-normal">Heat Range: -28.4°C to +68.5°C</p>
              </div>
            </div>
          )}

          {activeLayer === "network" && (
            <div className="absolute top-3 right-3 bg-purple-950/85 border border-purple-500 px-3 py-1.5 rounded-xl text-purple-200 font-mono text-[10px] font-bold flex items-center gap-2 shadow-xl">
              <Radio className="w-4 h-4 text-purple-400 animate-spin" />
              <div>
                <p>ISRO GSAT-30 UPLINK MESH: ONLINE</p>
                <p className="text-[9px] text-purple-300/80 font-normal">Packet Latency: ~420ms | Bandwidth: 15 Mbps</p>
              </div>
            </div>
          )}

          {/* Blizzard atmospheric snow effect if blizzard disaster active */}
          {isBlizzard && (
            <div className="absolute inset-0 pointer-events-none bg-cyan-400/5 border border-cyan-300/30 flex items-center justify-center">
              <div className="bg-cyan-950/90 border border-[var(--aurora-cyan)] px-4 py-2 rounded-xl text-cyan-300 font-mono text-xs flex items-center gap-2 shadow-2xl animate-pulse">
                <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
                <span>POLAR BLIZZARD CAT-4 ACTIVE (GUSTS 145 KM/H · PERIMETER SEAL ENGAGED)</span>
              </div>
            </div>
          )}

          {/* Slide-In Diagnostic Detail Drawer (Keeps Twin Visible!) */}
          {selectedZone && selectedZoneData && (
            <div className="absolute top-0 right-0 bottom-0 w-full sm:w-80 md:w-96 bg-[var(--bg-panel-solid)]/95 backdrop-blur-md border-l border-[var(--border-frozen)] p-4 sm:p-5 flex flex-col justify-between shadow-2xl z-20 animate-fadeIn overflow-y-auto">
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedLayout.icon || "⚡"}</span>
                    <div>
                      <h4 className="font-display font-bold text-sm text-white">
                        {selectedZoneData.label || selectedLayout.label}
                      </h4>
                      <p className="font-mono text-[10px] text-[var(--aurora-teal)] uppercase">
                        Module Type: {selectedZoneData.type || "zone"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectZone(null)}
                    className="p-1 rounded-lg hover:bg-[var(--bg-panel-raised)] text-[var(--text-tertiary)] hover:text-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Subsystem Specifications */}
                <div className="p-2.5 rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] mb-3 text-[11px] text-[var(--text-secondary)]">
                  <p className="font-mono text-[9px] uppercase text-[var(--text-tertiary)] mb-1">Architectural Spec</p>
                  <p>{selectedLayout.specs || "Standard Polar Hardened Module Architecture."}</p>
                </div>

                {/* Key Status Indicators */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2.5 rounded-xl ice-pane-raised border border-[var(--border-subtle)]">
                    <p className="font-mono text-[9px] text-[var(--text-tertiary)] uppercase">Status</p>
                    <p
                      className="font-mono text-xs font-bold mt-0.5 uppercase"
                      style={{ color: STATUS_COLOR[selectedZoneData.status] || STATUS_COLOR.nominal }}
                    >
                      {selectedZoneData.status || "nominal"}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl ice-pane-raised border border-[var(--border-subtle)]">
                    <p className="font-mono text-[9px] text-[var(--text-tertiary)] uppercase">Temperature</p>
                    <p className="font-mono text-xs font-bold text-amber-300 mt-0.5">
                      {selectedLayout.temp || "21.0°C"}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl ice-pane-raised border border-[var(--border-subtle)]">
                    <p className="font-mono text-[9px] text-[var(--text-tertiary)] uppercase">Power Draw</p>
                    <p className="font-mono text-xs font-bold text-[var(--aurora-teal)] mt-0.5">
                      {selectedLayout.powerLoad || "12.5 kW"}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl ice-pane-raised border border-[var(--border-subtle)]">
                    <p className="font-mono text-[9px] text-[var(--text-tertiary)] uppercase">Bus Latency</p>
                    <p className="font-mono text-xs font-bold text-purple-300 mt-0.5">
                      {selectedLayout.latency || "1.0 ms"}
                    </p>
                  </div>
                </div>

                {/* Live Diagnostic Sensors */}
                {selectedZoneReadings.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <p className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase">Live Telemetry Sensors</p>
                    {selectedZoneReadings.slice(0, 4).map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--border-subtle)] text-xs">
                        <span className="text-[var(--text-secondary)] capitalize">{r.metric.replace(/_/g, " ")}</span>
                        <span className="font-mono font-bold text-[var(--aurora-teal)]">{r.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Footer Controls */}
              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
                  <span>Aux Trace Heater</span>
                  <span className="text-[var(--aurora-teal)] font-bold">ENGAGED</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
                  <span>Failover Isolation Loop</span>
                  <span className="text-[var(--aurora-cyan)] font-bold">READY</span>
                </div>
                <button
                  onClick={() => onSelectZone(null)}
                  className="w-full py-2 rounded-xl bg-[var(--bg-panel-raised)] hover:bg-[var(--bg-deep)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] transition cursor-pointer"
                >
                  Close Inspection Drawer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Quick Zone Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:hidden scrollbar-none">
          <span className="font-mono text-[9px] text-[var(--text-tertiary)] uppercase whitespace-nowrap shrink-0">
            Quick Zone Tap:
          </span>
          {zones.map((z) => {
            const isSel = selectedZone === z.zoneId;
            const layout = LAYOUT[z.zoneId] || {};
            const status = z.status || "nominal";
            const color = STATUS_COLOR[status] || STATUS_COLOR.nominal;
            return (
              <button
                key={z.zoneId}
                onClick={() => onSelectZone(isSel ? null : z.zoneId)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap border transition cursor-pointer shrink-0 ${
                  isSel
                    ? "bg-gradient-to-r from-[var(--aurora-teal)] to-[var(--aurora-cyan)] text-black font-bold border-transparent"
                    : "bg-[var(--bg-deep)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                <span>{layout.icon || "•"}</span>
                <span>{layout.label || z.label}</span>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
              Zone Status Index:
            </span>
            {Object.entries(STATUS_COLOR).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
                  {status}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] sm:text-[11px] text-[var(--text-tertiary)] italic">
            Tap any module to inspect real-time CAD diagnostics &amp; live telemetry
          </p>
        </div>
      </div>
    </div>
  );
}
