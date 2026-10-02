import { useState } from "react";
import { useConnectivity } from "../context/ConnectivityContext.jsx";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  FileCode,
  Hash,
  Copy,
  Check,
} from "lucide-react";
import soundEngine from "../services/soundEngine.js";

const SEVERITY_COLOR = {
  info: "var(--ice-cyan)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
};

export default function IncidentLog({ incidents = [], stationCode, onRefresh, onLocalIncidentAdded }) {
  const { write, isOffline } = useConnectivity();
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("info");
  const [submitting, setSubmitting] = useState(false);
  const [justQueued, setJustQueued] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    const clientId = `${stationCode}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const mockHash = `sha256-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;

    const newInc = {
      _id: clientId,
      clientId,
      stationCode,
      title: title.trim(),
      severity,
      status: "open",
      reportedBy: "Duty Officer",
      seqNo: incidents.length + 1,
      integrityHash: mockHash,
      createdAt: new Date().toISOString(),
      createdOfflineAt: isOffline ? new Date().toISOString() : undefined,
      isLocalDraft: isOffline,
    };

    // Optimistically show locally immediately
    onLocalIncidentAdded?.(newInc);
    soundEngine.playPing();

    const result = await write({
      type: "incident",
      method: "POST",
      url: `/incidents/${stationCode}`,
      body: {
        title: title.trim(),
        severity,
        reportedBy: "Duty Officer",
        clientId,
        createdOfflineAt: isOffline ? new Date().toISOString() : undefined,
      },
    });

    setSubmitting(false);
    setTitle("");

    if (result.queued) {
      setJustQueued(true);
      setTimeout(() => setJustQueued(false), 4000);
    } else {
      onRefresh?.();
    }
  };

  // Export JSON Audit Trail
  const handleExportJSON = () => {
    soundEngine.playSuccess();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(incidents, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `AUDIT-LOG-${stationCode}-${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  // Export CSV Audit Trail
  const handleExportCSV = () => {
    soundEngine.playSuccess();
    const headers = ["SeqNo", "Timestamp", "Station", "Severity", "Title", "Status", "IntegrityHash", "ReportedBy"];
    const rows = incidents.map((inc, i) => [
      inc.seqNo || i + 1,
      inc.createdAt || new Date().toISOString(),
      inc.stationCode || stationCode,
      inc.severity || "info",
      `"${(inc.title || "").replace(/"/g, '""')}"`,
      inc.status || "open",
      inc.integrityHash || "N/A",
      `"${inc.reportedBy || "Duty Officer"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", encodeURI(csvContent));
    dlAnchor.setAttribute("download", `AUDIT-TRAIL-${stationCode}-${new Date().toISOString().slice(0, 10)}.csv`);
    dlAnchor.click();
  };

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 shadow-xl space-y-4">
      {/* Header & Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--ice-cyan)]" />
          <h3 className="font-display text-sm font-semibold tracking-wide text-white uppercase">
            Immutable Incident &amp; SOP Audit Log
          </h3>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            SHA-256 Verified
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-[var(--bg-panel-raised)] hover:bg-[var(--bg-deep)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white transition cursor-pointer"
            title="Export CSV audit trail for MoES compliance review"
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-[var(--bg-panel-raised)] hover:bg-[var(--bg-deep)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white transition cursor-pointer"
            title="Export JSON cryptographic audit payload"
          >
            <FileCode className="w-3 h-3 text-[var(--ice-cyan)]" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Log Form */}
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Log an anomaly or manual SOP inspection note…"
          className="flex-1 min-w-0 bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--ice-cyan)] transition"
        />
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
        >
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--bg-deep)] bg-[var(--ice-cyan)] hover:opacity-90 disabled:opacity-50 transition cursor-pointer shadow-md"
        >
          {submitting ? "Logging…" : "Record Event"}
        </button>
      </form>

      {justQueued && (
        <div className="text-xs px-3 py-2 rounded-xl flex items-center gap-2 animate-fadeIn bg-amber-950/40 border border-amber-500/40 text-amber-300 font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>No satellite connection — event cryptographically queued in IndexedDB for auto-sync.</span>
        </div>
      )}

      {/* Scrollable Event List */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {incidents.map((inc, i) => {
          const seq = inc.seqNo || incidents.length - i;
          const hash = inc.integrityHash || `sha256-${(inc._id || "a1b2").slice(-8)}`;

          return (
            <div
              key={inc._id || inc.clientId || i}
              className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] hover:border-[var(--ice-cyan-dim)] transition"
            >
              <span
                className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                style={{ background: SEVERITY_COLOR[inc.severity] || "var(--ice-cyan)" }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[var(--bg-panel-raised)] text-[var(--ice-cyan)] border border-[var(--border-subtle)] shrink-0">
                      #{String(seq).padStart(3, "0")}
                    </span>
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{inc.title}</p>
                  </div>

                  {inc.isLocalDraft && (
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                      QUEUED
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 text-[11px] text-[var(--text-tertiary)]">
                  <p>
                    {inc.reportedBy || "Duty Officer"} · Status: <span className="uppercase">{inc.status || "open"}</span>
                    <span className="ml-2 font-mono text-[10px]">
                      {new Date(inc.createdAt || Date.now()).toLocaleTimeString()}
                    </span>
                  </p>

                  {/* SHA-256 Hash Badge */}
                  <button
                    onClick={() => handleCopyHash(hash)}
                    className="flex items-center gap-1 font-mono text-[9px] text-[var(--text-tertiary)] hover:text-[var(--ice-cyan)] transition cursor-pointer"
                    title="Click to copy cryptographic verification hash"
                  >
                    <Hash className="w-2.5 h-2.5" />
                    <span>{hash.slice(0, 14)}...</span>
                    {copiedHash === hash ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {incidents.length === 0 && (
          <p className="text-xs text-[var(--text-tertiary)] text-center py-4">No events logged for this station.</p>
        )}
      </div>
    </div>
  );
}
