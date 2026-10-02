import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useConnectivity } from "../context/ConnectivityContext.jsx";
import { generateDefaultTelemetry, generateDefaultPrediction } from "../services/dataDefaults.js";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  Download,
  Calendar,
  Filter,
  Activity,
  FileText,
  Table as TableIcon,
  LineChart as ChartIcon,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Radio,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const STATIONS = [
  { code: "MAITRI", label: "Maitri Station (70°S)" },
  { code: "BHARATI", label: "Bharati Station (69°S)" },
];

const METRICS_CONFIG = {
  temperature_c: { label: "Outside Temperature", unit: "°C", color: "#6FE7DD", domain: [-60, 5] },
  wind_speed_kmh: { label: "Katabatic Wind Velocity", unit: "km/h", color: "#9B8CFF", domain: [0, 160] },
  power_load_kw: { label: "Main Grid Power Load", unit: "kW", color: "#F4A93B", domain: [20, 120] },
  generator_health_pct: { label: "Diesel GenSet Health Index", unit: "%", color: "#4ADE80", domain: [0, 100] },
  battery_pct: { label: "Battery Bank Reserve SOC", unit: "%", color: "#38BDF8", domain: [0, 100] },
  fuel_flow_lph: { label: "Polar Diesel Fuel Flow Rate", unit: "L/h", color: "#FB923C", domain: [0, 40] },
  water_level_pct: { label: "Glacial Melt Water Reserve", unit: "%", color: "#60A5FA", domain: [0, 100] },
  internal_temp_c: { label: "Living Habitat Core Temperature", unit: "°C", color: "#A78BFA", domain: [5, 30] },
};

export default function ReportsAnalytics() {
  const { isOffline } = useConnectivity();
  const [stationCode, setStationCode] = useState("MAITRI");
  const [timeframe, setTimeframe] = useState("24h");
  const [activeTab, setActiveTab] = useState("graphs"); // "graphs" | "tabular" | "risk_summary"
  const [selectedMetric, setSelectedMetric] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/telemetry/${stationCode}/analytics`, {
        params: { timeframe },
      });
      setAnalyticsData(res.data);
    } catch (err) {
      console.warn("Analytics fetch error, generating local report:", err.message);
      // Generate rich local report fallback
      const defaultData = generateDefaultTelemetry(stationCode);
      const flat = Object.values(defaultData).flat();
      const summaryByMetric = {};

      for (const [mKey, meta] of Object.entries(METRICS_CONFIG)) {
        const series = flat.filter((r) => r.metric === mKey);
        const values = series.map((r) => r.value);
        const count = values.length;
        const avg = count > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / count) * 10) / 10 : 0;
        summaryByMetric[mKey] = {
          label: meta.label,
          unit: meta.unit,
          nominalRange: "-10 to +80",
          count,
          avg,
          min: count > 0 ? Math.min(...values) : 0,
          max: count > 0 ? Math.max(...values) : 0,
          latest: count > 0 ? values[values.length - 1] : 0,
          warningCount: 0,
          criticalCount: 0,
          anomalyRiskRatePct: 0,
          recentSeries: series,
        };
      }

      setAnalyticsData({
        stationCode,
        stationName: stationCode === "MAITRI" ? "Maitri Station" : "Bharati Station",
        timeframe,
        totalRecords: flat.length,
        generatedAt: new Date(),
        summaryByMetric,
        prediction: generateDefaultPrediction(stationCode),
        readings: flat,
      });
    } finally {
      setLoading(false);
    }
  }, [stationCode, timeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const readings = analyticsData?.readings || [];
  const summaryByMetric = analyticsData?.summaryByMetric || {};

  // Filtered readings for table
  const filteredReadings = useMemo(() => {
    return readings.filter((r) => {
      const matchesMetric = selectedMetric === "all" || r.metric === selectedMetric;
      const matchesQuery =
        !searchQuery ||
        r.zoneId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.metric?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMetric && matchesQuery;
    });
  }, [readings, selectedMetric, searchQuery]);

  // Paginated table data
  const totalPages = Math.ceil(filteredReadings.length / itemsPerPage) || 1;
  const paginatedReadings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReadings.slice(start, start + itemsPerPage);
  }, [filteredReadings, currentPage]);

  // Export to CSV
  const handleExportCSV = () => {
    if (readings.length === 0) return;
    const headers = ["Timestamp,Station,Zone ID,Metric,Value,Unit,Threshold Warning,Threshold Critical"];
    const rows = readings.map((r) => {
      const meta = METRICS_CONFIG[r.metric] || {};
      const time = new Date(r.recordedAt).toISOString();
      return `"${time}","${r.stationCode}","${r.zoneId}","${r.metric}",${r.value},"${meta.unit || ''}","${r.threshold?.warning || ''}","${r.threshold?.critical || ''}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Antarctica_Twin_${stationCode}_Telemetry_${timeframe}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen px-4 sm:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] shadow-xl">
        <div className="flex items-center gap-3.5">
          <Link
            to="/"
            className="p-2.5 rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] text-[var(--ice-cyan)] hover:border-[var(--ice-cyan-dim)] transition cursor-pointer"
            title="Return to Main Mission Control"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="font-mono text-[10px] tracking-[0.2em] font-bold text-[var(--ice-cyan)] uppercase">
              HISTORICAL TELEMETRY &amp; AUDIT REPORTS
            </span>
            <p className="text-xs text-[var(--text-secondary)] font-mono">
              Database Records &amp; Trend Analysis
            </p>
          </div>
        </div>

        {/* Top Center Title: DigiAI ICE TWIN */}
        <div className="text-center mx-auto order-first sm:order-none w-full sm:w-auto py-1">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-md">
            <span className="text-[var(--ice-cyan)] font-extrabold">DigiAI ICE TWIN</span>
            <span className="text-gray-400 font-normal mx-2">-</span>
            <span className="text-white font-bold">Antarctic Intelligence &amp; Digital Twin</span>
          </h1>
        </div>

        {/* Controls: Station Switcher & Export */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Station selector */}
          <div className="flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-1 overflow-hidden">
            {STATIONS.map((s) => (
              <button
                key={s.code}
                onClick={() => {
                  setStationCode(s.code);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-display transition-all cursor-pointer ${
                  stationCode === s.code
                    ? "bg-[var(--bg-panel-raised)] text-[var(--ice-cyan)] shadow-sm border border-[var(--ice-cyan-dim)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Timeframe Selector */}
          <div className="flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-1 overflow-hidden text-xs font-mono">
            {["1h", "6h", "24h", "7d", "all"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-2.5 py-1.5 rounded-lg transition-all uppercase cursor-pointer ${
                  timeframe === t
                    ? "bg-[var(--ice-cyan)] text-black font-bold"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-display bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg cursor-pointer transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* View Mode Tabs (Scrollable on mobile) */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab("graphs")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold font-display transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "graphs"
                ? "bg-[var(--ice-cyan)]/20 text-[var(--ice-cyan)] border border-[var(--ice-cyan-dim)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-panel)]"
            }`}
          >
            <ChartIcon className="w-4 h-4" />
            <span>Multi-Metric Graphs</span>
          </button>

          <button
            onClick={() => setActiveTab("tabular")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold font-display transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "tabular"
                ? "bg-[var(--ice-cyan)]/20 text-[var(--ice-cyan)] border border-[var(--ice-cyan-dim)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-panel)]"
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Tabular Audit Log</span>
          </button>

          <button
            onClick={() => setActiveTab("risk_summary")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold font-display transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "risk_summary"
                ? "bg-[var(--ice-cyan)]/20 text-[var(--ice-cyan)] border border-[var(--ice-cyan-dim)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-panel)]"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Risk Summary</span>
          </button>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:bg-[var(--bg-panel-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer shrink-0"
          title="Refresh Historical Report"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>


      {/* TAB 1: INDIVIDUAL METRIC TIME-SERIES GRAPHS */}
      {activeTab === "graphs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Object.entries(METRICS_CONFIG).map(([metricKey, meta]) => {
            const summary = summaryByMetric[metricKey] || {};
            const recent = summary.recentSeries || [];
            const chartData = recent.map((r) => ({
              time: new Date(r.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              value: r.value,
            }));

            return (
              <div
                key={metricKey}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 space-y-3 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
                      {meta.label}
                    </h3>
                    <p className="font-mono text-[10px] text-[var(--text-tertiary)]">
                      Nominal: {meta.nominalRange || "Standard Safety Envelope"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-base font-bold" style={{ color: meta.color }}>
                      {summary.latest != null ? `${summary.latest} ${meta.unit}` : "—"}
                    </p>
                    <p className="font-mono text-[10px] text-[var(--text-tertiary)]">
                      Avg: {summary.avg || 0} | Min: {summary.min || 0} | Max: {summary.max || 0}
                    </p>
                  </div>
                </div>

                <div className="h-44 w-full pt-1">
                  <ResponsiveContainer width="100%" height={170}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-rep-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={meta.color} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={meta.color} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.5} />
                      <XAxis dataKey="time" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--text-tertiary)" fontSize={10} domain={meta.domain} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--bg-deep)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: 6,
                          fontSize: 11,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name={meta.label}
                        stroke={meta.color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#grad-rep-${metricKey})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: TABULAR AUDIT DATA LOG */}
      {activeTab === "tabular" && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 space-y-4 shadow-xl">
          {/* Table Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search zone, metric, or event…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-4 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--ice-cyan)] w-60 font-mono"
                />
              </div>

              <select
                value={selectedMetric}
                onChange={(e) => {
                  setSelectedMetric(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none font-mono"
              >
                <option value="all">All Metrics</option>
                {Object.entries(METRICS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <p className="font-mono text-xs text-[var(--text-tertiary)]">
              Showing {filteredReadings.length} recorded database entries
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--bg-panel-raised)] border-b border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                  <th className="p-3">Timestamp (UTC/Local)</th>
                  <th className="p-3">Station</th>
                  <th className="p-3">Zone Module</th>
                  <th className="p-3">Sensor Metric</th>
                  <th className="p-3">Value</th>
                  <th className="p-3">Nominal Envelope</th>
                  <th className="p-3">Source Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                {paginatedReadings.map((r, i) => {
                  const meta = METRICS_CONFIG[r.metric] || {};
                  return (
                    <tr key={i} className="hover:bg-[var(--bg-panel-raised)] transition">
                      <td className="p-3 text-[var(--text-secondary)]">
                        {new Date(r.recordedAt).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-[var(--ice-cyan)]">{r.stationCode}</td>
                      <td className="p-3 text-[var(--text-primary)]">{r.zoneId}</td>
                      <td className="p-3 text-[var(--text-secondary)]">{meta.label || r.metric}</td>
                      <td className="p-3 font-bold" style={{ color: meta.color || "#FFF" }}>
                        {r.value} {meta.unit}
                      </td>
                      <td className="p-3 text-[var(--text-tertiary)]">{meta.nominalRange || "—"}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                            r.syncedFromOffline
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          }`}
                        >
                          {r.syncedFromOffline ? "OFFLINE SYNC" : "DIRECT TELEMETRY"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {paginatedReadings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[var(--text-tertiary)]">
                      No historical readings found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-2">
            <p className="font-mono text-xs text-[var(--text-tertiary)]">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] disabled:opacity-40 text-xs font-mono transition cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] disabled:opacity-40 text-xs font-mono transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISASTER RISK & ANOMALY SUMMARY */}
      {activeTab === "risk_summary" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(summaryByMetric).map(([key, item]) => (
              <div
                key={key}
                className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] space-y-2 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-xs font-semibold text-[var(--text-primary)]">{item.label}</p>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                      item.criticalCount > 0
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : item.warningCount > 0
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {item.criticalCount > 0 ? "HIGH RISK" : item.warningCount > 0 ? "ELEVATED" : "NOMINAL"}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <p className="font-mono text-xl font-bold" style={{ color: METRICS_CONFIG[key]?.color }}>
                    {item.latest} <span className="text-xs font-normal text-[var(--text-tertiary)]">{item.unit}</span>
                  </p>
                  <p className="font-mono text-xs text-[var(--text-tertiary)]">
                    {item.anomalyRiskRatePct}% Anomaly Rate
                  </p>
                </div>

                <div className="text-[10px] font-mono text-[var(--text-tertiary)] pt-1 border-t border-[var(--border-subtle)] flex justify-between">
                  <span>Warnings: {item.warningCount || 0}</span>
                  <span>Critical Excursions: {item.criticalCount || 0}</span>
                </div>
              </div>
            ))}
          </div>

          {/* AI Disaster Projection Assessment Card */}
          {analyticsData?.prediction && (
            <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] space-y-3 shadow-xl">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--aurora-violet)]" />
                <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                  Long-Term AI Threat &amp; Vulnerability Matrix
                </h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Dynamic risk calculation derived from historical variance across power buses, generator wear indices, and katabatic storm weather patterns.
              </p>
              <div className="p-4 rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-mono text-[var(--text-tertiary)]">Primary Polar Risk</p>
                  <p className="font-display text-sm font-semibold text-[var(--text-primary)] mt-1">
                    {analyticsData.prediction.primaryThreat}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-mono text-[var(--text-tertiary)]">Projected Time-To-Failure (TTF)</p>
                  <p className="font-mono text-sm font-bold text-emerald-400 mt-1">
                    {analyticsData.prediction.timeToFailure?.formatted || "Stable Buffer (>72h)"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-mono text-[var(--text-tertiary)]">Station Stability Index</p>
                  <p className="font-mono text-sm font-bold text-[var(--ice-cyan)] mt-1">
                    {100 - (analyticsData.prediction.riskScore || 8)}% Nominal
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
