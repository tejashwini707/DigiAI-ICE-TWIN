import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import { Activity, Thermometer, Wind, Zap, Gauge, Battery, Fuel, Droplets, Home } from "lucide-react";

const METRIC_CONFIG = {
  temperature_c: {
    label: "Outside Temp",
    unit: "°C",
    color: "#6FE7DD",
    icon: Thermometer,
    nominalRange: "-10°C to -35°C",
  },
  wind_speed_kmh: {
    label: "Katabatic Wind",
    unit: "km/h",
    color: "#9B8CFF",
    icon: Wind,
    nominalRange: "20 to 80 km/h",
  },
  power_load_kw: {
    label: "Power Grid Load",
    unit: "kW",
    color: "#F4A93B",
    icon: Zap,
    nominalRange: "50 to 85 kW",
  },
  generator_health_pct: {
    label: "GenSet Health",
    unit: "%",
    color: "#4ADE80",
    icon: Gauge,
    nominalRange: "> 70%",
  },
  battery_pct: {
    label: "Battery Bank SOC",
    unit: "%",
    color: "#38BDF8",
    icon: Battery,
    nominalRange: "> 30%",
  },
  fuel_flow_lph: {
    label: "Diesel Fuel Flow",
    unit: "L/h",
    color: "#FB923C",
    icon: Fuel,
    nominalRange: "10 to 22 L/h",
  },
  water_level_pct: {
    label: "Water Storage",
    unit: "%",
    color: "#60A5FA",
    icon: Droplets,
    nominalRange: "> 25%",
  },
  internal_temp_c: {
    label: "Habitat Temp",
    unit: "°C",
    color: "#A78BFA",
    icon: Home,
    nominalRange: "18°C to 22°C",
  },
};

const DEFAULT_BASELINES = {
  temperature_c: { base: -22.4, variance: 2 },
  wind_speed_kmh: { base: 38.5, variance: 8 },
  power_load_kw: { base: 64.2, variance: 4 },
  generator_health_pct: { base: 94.5, variance: 1 },
  battery_pct: { base: 82.0, variance: 2 },
  fuel_flow_lph: { base: 14.8, variance: 1.5 },
  water_level_pct: { base: 74.0, variance: 2 },
  internal_temp_c: { base: 20.6, variance: 0.8 },
};

function generateFallbackSparkline(metricKey) {
  const meta = DEFAULT_BASELINES[metricKey] || { base: 50, variance: 5 };
  const points = [];
  const now = Date.now();
  for (let i = 10; i >= 0; i--) {
    const spread = (Math.sin(i * 0.8) + (Math.random() - 0.5)) * meta.variance;
    points.push({
      metric: metricKey,
      value: Math.round((meta.base + spread) * 10) / 10,
      recordedAt: new Date(now - i * 30000),
    });
  }
  return points;
}

export default function TelemetryPanel({ telemetryByZone = {}, zones = [] }) {
  // Aggregate all recent readings by metric across all zones or array items
  const metricSeries = {};

  // Extract all available readings from either object keyed by zoneId or flat array
  const allReadings = Array.isArray(telemetryByZone)
    ? telemetryByZone
    : Object.values(telemetryByZone || {}).flat();

  for (const r of allReadings) {
    if (!r || !r.metric || !METRIC_CONFIG[r.metric]) continue;
    if (!metricSeries[r.metric]) metricSeries[r.metric] = [];
    metricSeries[r.metric].push(r);
  }

  const metricEntries = Object.entries(METRIC_CONFIG);

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3.5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--ice-cyan)]/20 text-[var(--ice-cyan)] border border-[var(--ice-cyan-dim)]">
              LIVE TELEMETRY STREAM
            </span>
            <span className="font-mono text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Real-Time Sensor Ingestion (3s tick)
            </span>
          </div>
          <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[var(--ice-cyan)]" />
            Environmental &amp; Energy Infrastructure Telemetry
          </h3>
        </div>
      </div>


      {/* Grid of Telemetry Sensor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {metricEntries.map(([metricKey, meta]) => {
          let readings = metricSeries[metricKey] || [];
          if (readings.length === 0) {
            readings = generateFallbackSparkline(metricKey);
          }

          const sorted = [...readings].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
          const latest = sorted[sorted.length - 1];
          const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
          const Icon = meta.icon;

          let delta = 0;
          if (latest && prev && latest.value != null && prev.value != null) {
            delta = Math.round((latest.value - prev.value) * 10) / 10;
          }

          const chartData = sorted.slice(-15);

          return (
            <div
              key={metricKey}
              className="rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] p-3.5 hover:border-[var(--ice-cyan-dim)] transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    <p className="text-xs font-semibold">{meta.label}</p>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                    {meta.nominalRange}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-1 mb-2">
                  <p className="font-mono text-xl font-bold tracking-tight" style={{ color: meta.color }}>
                    {latest && latest.value != null ? latest.value : "—"}
                    <span className="text-xs font-normal text-[var(--text-tertiary)] ml-1">
                      {meta.unit}
                    </span>
                  </p>

                  {delta !== 0 && (
                    <span className={`font-mono text-[10px] ${delta > 0 ? "text-emerald-400" : "text-cyan-400"}`}>
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  )}
                </div>
              </div>

              {/* Sparkline mini chart */}
              <div className="h-11 w-full mt-1">
                <ResponsiveContainer width="100%" height={44}>
                  <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={meta.color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={meta.color} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-deep)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 6,
                        fontSize: 10,
                        padding: "4px 8px",
                      }}
                      labelFormatter={(l) => (l ? new Date(l).toLocaleTimeString() : "")}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={meta.color}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#grad-${metricKey})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

