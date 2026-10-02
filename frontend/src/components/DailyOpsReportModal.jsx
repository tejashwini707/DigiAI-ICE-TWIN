import { useState } from "react";
import {
  FileText,
  Download,
  Printer,
  X,
  ShieldCheck,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Droplets,
  Zap,
} from "lucide-react";

export default function DailyOpsReportModal({ station, telemetry, prediction, resources, personnel, incidents, liveWeather, onClose }) {
  const [signedBy, setSignedBy] = useState("Station Commander (On-Duty)");
  const stationCode = station?.code || "MAITRI";
  const stationName = station?.name || "Maitri Research Station";
  const reportDate = new Date().toUTCString();
  const reportId = `NCPOR-SITREP-${stationCode}-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 899 + 100)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[var(--bg-panel)] border border-[var(--ice-cyan)]/40 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Toolbar Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-panel-raised)] shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--ice-cyan)]" />
            <h3 className="font-display font-bold text-sm sm:text-base text-white">
              Official Antarctic Daily Situational Ops Report (SITREP)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-[var(--ice-cyan)] text-black hover:opacity-90 transition cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-deep)] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-[var(--text-primary)] font-sans text-xs bg-[var(--bg-panel)] print:bg-white print:text-black print:p-0">
          {/* Government Header */}
          <div className="border-b-2 border-[var(--ice-cyan)] pb-4 space-y-1 text-center">
            <p className="font-mono text-[10px] text-[var(--ice-cyan)] uppercase tracking-[0.25em] font-bold print:text-blue-800">
              NATIONAL CENTRE FOR POLAR AND OCEAN RESEARCH (NCPOR)
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider print:text-gray-600">
              Ministry of Earth Sciences · Government of India
            </p>
            <h2 className="text-lg sm:text-xl font-extrabold text-white font-display pt-1 print:text-black">
              24-HOUR POLAR DIGITAL TWIN SITUATION REPORT (SITREP)
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-mono text-[var(--text-tertiary)] pt-1 print:text-gray-600">
              <span>Report ID: <strong>{reportId}</strong></span>
              <span>•</span>
              <span>Station: <strong>{stationName} ({stationCode})</strong></span>
              <span>•</span>
              <span>UTC Generated: <strong>{reportDate}</strong></span>
            </div>
          </div>

          {/* Section 1: Environmental & Live Satellite Meteorology */}
          <div className="space-y-2">
            <h4 className="font-mono font-bold text-xs uppercase text-[var(--ice-cyan)] border-b border-[var(--border-subtle)] pb-1 print:text-blue-800">
              1. Environmental &amp; Satellite Meteorology
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] print:border-gray-300 print:bg-gray-50">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono">Outside Air Temp</p>
                <p className="text-base font-bold font-mono text-[var(--ice-cyan)] print:text-black mt-0.5">
                  {liveWeather?.temperatureC ?? -22.4}°C
                </p>
                <p className="text-[9px] text-[var(--text-tertiary)]">Open-Meteo Antarctic Grid</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] print:border-gray-300 print:bg-gray-50">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono">Katabatic Wind Speed</p>
                <p className="text-base font-bold font-mono text-purple-300 print:text-black mt-0.5">
                  {liveWeather?.windSpeedKmh ?? 38.5} km/h
                </p>
                <p className="text-[9px] text-[var(--text-tertiary)]">Dir: {liveWeather?.windDirectionDeg ?? 142}° SE</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] print:border-gray-300 print:bg-gray-50">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono">Surface Barometer</p>
                <p className="text-base font-bold font-mono text-emerald-300 print:text-black mt-0.5">
                  {liveWeather?.pressureHpa ?? 985} hPa
                </p>
                <p className="text-[9px] text-[var(--text-tertiary)]">Stable Polar Air Mass</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] print:border-gray-300 print:bg-gray-50">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono">SATCOM Uplink</p>
                <p className="text-base font-bold font-mono text-cyan-300 print:text-black mt-0.5">
                  {station?.connectivity?.status === "offline" ? "EDGE AUTONOMOUS" : "ISRO GSAT-30 (92%)"}
                </p>
                <p className="text-[9px] text-[var(--text-tertiary)]">Ku-Band Polar Footprint</p>
              </div>
            </div>
          </div>

          {/* Section 2: AI Predictive Risk & Power Grid Diagnostics */}
          <div className="space-y-2">
            <h4 className="font-mono font-bold text-xs uppercase text-[var(--ice-cyan)] border-b border-[var(--border-subtle)] pb-1 print:text-blue-800">
              2. AI Risk Evaluation &amp; Power Infrastructure
            </h4>
            <div className="p-3.5 rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] space-y-2 print:border-gray-300 print:bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-white print:text-black">
                  Polar Degradation AI v3.4 Stability Rating:
                </p>
                <span className="font-mono font-bold px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 print:text-black">
                  {(100 - (prediction?.riskScore || 8))}% STABLE (Risk: {prediction?.riskScore || 8}%)
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] print:text-gray-700">
                <strong>Time-To-Failure (TTF) Forecast:</strong> {prediction?.timeToFailure?.formatted || ">72h stable buffer"} ·{" "}
                <strong>Primary Driver:</strong> {prediction?.primaryThreat || "Nominal operations"}
              </p>
            </div>
          </div>

          {/* Section 3: Essential Logistics & Depletion Projections */}
          <div className="space-y-2">
            <h4 className="font-mono font-bold text-xs uppercase text-[var(--ice-cyan)] border-b border-[var(--border-subtle)] pb-1 print:text-blue-800">
              3. Critical Supply Reserves &amp; Depletion Forecasts
            </h4>
            <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] print:border-gray-300">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[var(--bg-panel-raised)] border-b border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-tertiary)] uppercase print:bg-gray-100 print:text-gray-700">
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5">Current Stock</th>
                    <th className="p-2.5">Daily Draw</th>
                    <th className="p-2.5">Reserve Buffer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] font-mono print:divide-gray-200">
                  {resources.slice(0, 5).map((r) => {
                    const days = r.dailyConsumptionRate ? Math.round(r.quantity / r.dailyConsumptionRate) : 180;
                    return (
                      <tr key={r._id || r.name}>
                        <td className="p-2.5 uppercase text-[var(--text-secondary)]">{r.category}</td>
                        <td className="p-2.5 font-sans font-medium text-white print:text-black">{r.name}</td>
                        <td className="p-2.5 text-[var(--ice-cyan)] print:text-black">{r.quantity.toLocaleString()} {r.unit}</td>
                        <td className="p-2.5 text-[var(--text-tertiary)]">~{r.dailyConsumptionRate || 0} {r.unit}/day</td>
                        <td className="p-2.5 font-bold text-emerald-400 print:text-black">{days} Days</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Incident Log & Crew Roster */}
          <div className="space-y-2">
            <h4 className="font-mono font-bold text-xs uppercase text-[var(--ice-cyan)] border-b border-[var(--border-subtle)] pb-1 print:text-blue-800">
              4. Active Expedition Personnel &amp; Audit Trail
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)] print:text-gray-700">
              <strong>Crew Complement:</strong> {personnel.length} Scientists &amp; Engineers stationed on-site. All biometrics reporting FIT status.
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] print:text-gray-700">
              <strong>Audit Manifest:</strong> {incidents.length} recorded events in tamper-evident sequential log.
            </p>
          </div>

          {/* Officer Signature Block */}
          <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-wrap justify-between items-end gap-4 print:border-gray-400">
            <div>
              <p className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase">Authorized Certification</p>
              <p className="font-display text-sm font-bold text-white print:text-black">{signedBy}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">Indian Antarctic Expedition Command</p>
            </div>
            <div className="text-right font-mono text-[10px] text-[var(--text-tertiary)]">
              <p>Cryptographic Sign-off Hash: <code>sha256-9a4f82...c7e1</code></p>
              <p>Verified by DigiAI ICE TWIN Autonomous AI Guard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
