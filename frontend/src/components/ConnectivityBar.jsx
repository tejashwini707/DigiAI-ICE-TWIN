import { useState } from "react";
import { useConnectivity } from "../context/ConnectivityContext.jsx";
import { RefreshCw, Radio, CheckCircle2, AlertTriangle, Database, Wifi, WifiOff } from "lucide-react";

export default function ConnectivityBar() {
  const {
    isOffline,
    simulatedOffline,
    setSimulatedOffline,
    queueCount,
    syncing,
    lastSyncedAt,
    triggerSync,
    clearAllQueue,
  } = useConnectivity();

  const [feedback, setFeedback] = useState(null);

  const handleSyncClick = async () => {
    setFeedback({ type: "info", text: "Initiating station synchronization with Mainland HQ…" });
    const result = await triggerSync();
    if (result?.success) {
      setFeedback({
        type: "success",
        text: result.message || "Station twin & telemetry synchronized with Mainland HQ.",
      });
    } else if (result?.error) {
      setFeedback({
        type: "warning",
        text: result.error,
      });
    } else if (result?.isOffline) {
      setFeedback({
        type: "warning",
        text: "Satellite link unreachable. Station running in Autonomous Edge Mode. Telemetry cached locally.",
      });
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleClearQueue = async (e) => {
    e.stopPropagation();
    await clearAllQueue?.();
    setFeedback({ type: "info", text: "Local IndexedDB write cache cleared." });
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3.5 border transition-all duration-300 shadow-md"
        style={{
          background: isOffline ? "rgba(30, 20, 30, 0.75)" : "var(--bg-panel)",
          borderColor: isOffline ? "rgba(255, 93, 93, 0.4)" : "var(--border-subtle)",
        }}
      >
        {/* Left: Satellite & Link status */}
        <div className="flex items-center gap-3.5">
          <div
            className={`p-2 rounded-xl flex items-center justify-center border ${
              isOffline
                ? "bg-red-500/10 text-red-400 border-red-500/30 ring-1 ring-red-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            }`}
          >
            {isOffline ? <WifiOff className="w-4 h-4 animate-pulse" /> : <Wifi className="w-4 h-4" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-xs font-bold tracking-wider uppercase"
                style={{ color: isOffline ? "var(--status-critical)" : "var(--status-nominal)" }}
              >
                {isOffline ? "ISRO GSAT-30 SATCOM DROPOUT · AUTONOMOUS EDGE AI ACTIVE" : "ISRO GSAT-30 / GSAT-14 POLAR SATCOM ACTIVE · CONNECTED TO HQ"}
              </span>

              {isOffline && (
                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 uppercase font-bold animate-pulse">
                  Local Mode
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-tertiary)] mt-0.5">
              <span>
                {queueCount > 0 ? (
                  <span className="text-amber-300 font-mono font-medium flex items-center gap-1.5">
                    <span>📦 {queueCount} update{queueCount === 1 ? "" : "s"} cached locally (IndexedDB)</span>
                    <button
                      onClick={handleClearQueue}
                      className="text-[10px] underline text-amber-400/80 hover:text-amber-200 cursor-pointer ml-1"
                      title="Clear local cached writes"
                    >
                      (clear cache)
                    </button>
                  </span>
                ) : (
                  <span>All local telemetry in sync with ISRO ground link</span>
                )}
              </span>
              <span>•</span>
              <span className="font-mono">
                {syncing
                  ? "Transmitting telemetry frames via GSAT transponder…"
                  : `Last synced: ${new Date(lastSyncedAt).toLocaleTimeString()}`}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Always Visible Sync Now Button */}
          <button
            onClick={handleSyncClick}
            disabled={syncing}
            className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all cursor-pointer shadow-sm disabled:opacity-50"
            style={{
              borderColor: isOffline ? "var(--border-subtle)" : "var(--ice-cyan)",
              background: syncing ? "rgba(111, 231, 221, 0.15)" : "var(--bg-deep)",
              color: isOffline ? "var(--text-secondary)" : "var(--ice-cyan)",
            }}
            title="Synchronize all local telemetry, incidents, and station state with Mainland HQ"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-[var(--ice-cyan)]" : ""}`} />
            <span>{syncing ? "Syncing…" : "Sync now"}</span>
            {queueCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[var(--ice-cyan)] text-black font-bold">
                {queueCount}
              </span>
            )}
          </button>

          {/* Simulate Disconnect Toggle */}
          <button
            onClick={() => setSimulatedOffline((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-all cursor-pointer"
            style={{
              background: simulatedOffline ? "rgba(111, 231, 221, 0.2)" : "var(--bg-deep)",
              color: simulatedOffline ? "var(--ice-cyan)" : "var(--text-secondary)",
              border: `1px solid ${simulatedOffline ? "var(--ice-cyan)" : "var(--border-subtle)"}`,
            }}
            title="Demo control: Simulates losing ISRO GSAT satellite connection (satellite blackout)"
          >
            <Radio className={`w-3.5 h-3.5 ${simulatedOffline ? "text-[var(--ice-cyan)] animate-spin" : ""}`} />
            <span>{simulatedOffline ? "Restore GSAT Satellite Link" : "Simulate GSAT Drop"}</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Toast / Banner */}
      {feedback && (
        <div
          className={`px-4 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between border animate-fadeIn shadow-lg ${
            feedback.type === "success"
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
              : feedback.type === "warning"
              ? "bg-amber-950/60 border-amber-500/40 text-amber-200"
              : "bg-cyan-950/60 border-cyan-500/40 text-cyan-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : feedback.type === "warning" ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer ml-3 font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

