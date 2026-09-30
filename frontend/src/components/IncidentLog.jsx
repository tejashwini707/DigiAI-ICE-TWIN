import { useState } from "react";
import { useConnectivity } from "../context/ConnectivityContext.jsx";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

const SEVERITY_COLOR = {
  info: "var(--ice-cyan)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
};

export default function IncidentLog({ incidents, stationCode, onRefresh, onLocalIncidentAdded }) {
  const { write, isOffline } = useConnectivity();
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("info");
  const [submitting, setSubmitting] = useState(false);
  const [justQueued, setJustQueued] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    const clientId = `${stationCode}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    const newInc = {
      _id: clientId,
      clientId,
      stationCode,
      title: title.trim(),
      severity,
      status: "open",
      reportedBy: "Duty Officer",
      createdAt: new Date().toISOString(),
      createdOfflineAt: isOffline ? new Date().toISOString() : undefined,
      isLocalDraft: isOffline,
    };

    // Optimistically show locally immediately
    onLocalIncidentAdded?.(newInc);

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

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
          Incident &amp; Anomaly Log
        </h3>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase">
          {incidents.length} Event{incidents.length === 1 ? "" : "s"} Recorded
        </span>
      </div>

      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Log a new incident or manual inspection note…"
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
          {submitting ? "Logging…" : "Log Event"}
        </button>
      </form>

      {justQueued && (
        <div className="text-xs mb-3 px-3 py-2 rounded-xl flex items-center gap-2 animate-fadeIn bg-amber-950/40 border border-amber-500/40 text-amber-300 font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>No satellite connection — incident saved locally in IndexedDB and queued for auto-sync.</span>
        </div>
      )}

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {incidents.map((inc) => (
          <div
            key={inc._id || inc.clientId}
            className="flex items-start gap-3 p-2.5 rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] hover:border-[var(--ice-cyan-dim)] transition"
          >
            <span
              className="w-2 h-2 rounded-full mt-1.5 shrink-0"
              style={{ background: SEVERITY_COLOR[inc.severity] || "var(--ice-cyan)" }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[var(--text-primary)]">{inc.title}</p>
                {inc.isLocalDraft && (
                  <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                    QUEUED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                {inc.reportedBy || "Duty Officer"} · Status: <span className="uppercase">{inc.status || "open"}</span>
                {inc.syncedFromOffline && " · synced from local offline queue"}
                <span className="ml-2 font-mono text-[10px]">
                  {new Date(inc.createdAt || Date.now()).toLocaleTimeString()}
                </span>
              </p>
            </div>
          </div>
        ))}
        {incidents.length === 0 && (
          <p className="text-xs text-[var(--text-tertiary)] text-center py-4">No incidents logged for this station.</p>
        )}
      </div>
    </div>
  );
}

