import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import api from "../services/api.js";
import {
  enqueueWrite,
  getQueue,
  getQueueCount,
  removeFromQueue,
  removeBatchFromQueue,
  bumpAttempts,
  clearQueue,
} from "../offline/offlineQueue.js";

const ConnectivityContext = createContext(null);

export function ConnectivityProvider({ children }) {
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [browserOnline, setBrowserOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState(new Date());
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);
  const syncListenersRef = useRef(new Set());

  const isOffline = simulatedOffline || !browserOnline;

  useEffect(() => {
    const on = () => setBrowserOnline(true);
    const off = () => setBrowserOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const refreshQueueCount = useCallback(async () => {
    try {
      setQueueCount(await getQueueCount());
    } catch {
      // safe fallback
    }
  }, []);

  useEffect(() => {
    refreshQueueCount();
  }, [refreshQueueCount]);

  const addSyncListener = useCallback((fn) => {
    syncListenersRef.current.add(fn);
    return () => {
      syncListenersRef.current.delete(fn);
    };
  }, []);

  const notifySyncListeners = useCallback(() => {
    syncListenersRef.current.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.warn("Sync listener notification error:", err);
      }
    });
  }, []);

  // Helper to sanitize endpoint paths
  const formatApiUrl = (url) => {
    if (!url) return "/";
    let formatted = url;
    if (formatted.startsWith("/api/")) formatted = formatted.replace("/api/", "/");
    if (!formatted.startsWith("/")) formatted = "/" + formatted;
    return formatted;
  };

  // Core write function: queues locally in IndexedDB if offline, sends directly if online with graceful queue fallback.
  const write = useCallback(
    async ({ type, method = "POST", url, body }) => {
      const sanitizedUrl = formatApiUrl(url);

      if (isOffline) {
        await enqueueWrite({
          type,
          method,
          url: sanitizedUrl,
          body,
          priority: type === "sos" ? 0 : type === "incident" ? 1 : 2,
        });
        await refreshQueueCount();
        return { queued: true };
      }

      try {
        const res = await api.request({ method, url: sanitizedUrl, data: body, timeout: 6000 });
        return { queued: false, data: res.data };
      } catch (err) {
        await enqueueWrite({
          type,
          method,
          url: sanitizedUrl,
          body,
          priority: type === "sos" ? 0 : type === "incident" ? 1 : 2,
        });
        await refreshQueueCount();
        return { queued: true, failedOnline: true };
      }
    },
    [isOffline, refreshQueueCount]
  );

  // Main queue flusher and synchronizer
  const flushQueue = useCallback(
    async (forceOnline = false) => {
      if (syncingRef.current) return { inProgress: true };
      if (!forceOnline && isOffline) {
        return { success: false, isOffline: true, message: "Station satellite link currently disconnected" };
      }

      syncingRef.current = true;
      setSyncing(true);
      let syncedItemsCount = 0;

      try {
        const rawQueue = await getQueue();
        if (rawQueue.length === 0) {
          await refreshQueueCount();
          setLastSyncedAt(new Date());
          notifySyncListeners();
          return { success: true, syncedCount: 0, message: "All station telemetry is in sync with HQ." };
        }

        // Separate telemetry batches from individual commands (incidents, SOS, mitigations, disasters)
        const nonTelemetryItems = [];
        const telemetryByStation = {};

        for (const item of rawQueue) {
          if (item.type === "telemetry" && item.url) {
            const match = item.url.match(/\/telemetry\/([^/?]+)/);
            const code = (match ? match[1] : "MAITRI").toUpperCase();
            if (!telemetryByStation[code]) telemetryByStation[code] = { items: [], queueIds: [] };
            const rawBody = item.body;
            const payloadArray = Array.isArray(rawBody) ? rawBody : rawBody ? [rawBody] : [];
            const validReadings = payloadArray.filter((r) => r && typeof r === "object");
            if (validReadings.length > 0) {
              telemetryByStation[code].items.push(...validReadings);
            }
            telemetryByStation[code].queueIds.push(item.queueId);
          } else {
            nonTelemetryItems.push(item);
          }
        }

        // Flush telemetry in batches per station
        for (const [code, data] of Object.entries(telemetryByStation)) {
          if (data.items.length > 0) {
            try {
              const chunkSize = 200;
              for (let i = 0; i < data.items.length; i += chunkSize) {
                const chunk = data.items.slice(i, i + chunkSize);
                await api.post(`/telemetry/${code}`, chunk, { timeout: 8000 });
              }
              await removeBatchFromQueue(data.queueIds);
              syncedItemsCount += data.queueIds.length;
            } catch (err) {
              console.warn(`Batch telemetry sync notice for ${code}:`, err.message);
              if (err.response?.status >= 400 && err.response?.status < 500) {
                await removeBatchFromQueue(data.queueIds);
              } else {
                for (const id of data.queueIds) await bumpAttempts(id);
              }
            }
          } else if (data.queueIds.length > 0) {
            await removeBatchFromQueue(data.queueIds);
          }
        }

        // Flush priority items (SOS, incidents, station actions, disaster triggers)
        nonTelemetryItems.sort((a, b) => (a.priority ?? 2) - (b.priority ?? 2));
        for (const item of nonTelemetryItems) {
          try {
            const targetUrl = formatApiUrl(item.url);
            await api.request({
              method: item.method || "POST",
              url: targetUrl,
              data: item.body || {},
              timeout: 6000,
            });
            await removeFromQueue(item.queueId);
            syncedItemsCount++;
          } catch (err) {
            console.warn(`Item sync notice (${item.url}):`, err.message);
            if ((err.response && err.response.status >= 400 && err.response.status < 500) || (item.attempts >= 2)) {
              await removeFromQueue(item.queueId);
            } else {
              await bumpAttempts(item.queueId);
            }
          }
        }

        await refreshQueueCount();
        setLastSyncedAt(new Date());
        notifySyncListeners();

        return {
          success: true,
          syncedCount: syncedItemsCount,
          message: `Successfully synchronized ${syncedItemsCount} local records with Mainland HQ.`,
        };
      } catch (err) {
        console.error("Critical sync execution error:", err);
        return { success: false, error: err.message };
      } finally {
        syncingRef.current = false;
        setSyncing(false);
      }
    },
    [isOffline, notifySyncListeners, refreshQueueCount]
  );

  // Manual trigger wrapper for Sync Now button with automatic reconnection
  const triggerSync = useCallback(async () => {
    if (simulatedOffline) {
      setSimulatedOffline(false);
    }
    return flushQueue(true);
  }, [simulatedOffline, flushQueue]);

  const clearAllQueue = useCallback(async () => {
    try {
      await clearQueue();
      await refreshQueueCount();
    } catch (err) {
      console.warn("Failed to clear local write queue:", err);
    }
  }, [refreshQueueCount]);

  // Auto-flush whenever connection returns online
  useEffect(() => {
    if (!isOffline) {
      flushQueue(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline]);

  const value = {
    isOffline,
    simulatedOffline,
    setSimulatedOffline,
    browserOnline,
    queueCount,
    syncing,
    lastSyncedAt,
    write,
    flushQueue,
    triggerSync,
    clearAllQueue,
    addSyncListener,
    refreshQueueCount,
  };

  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export function useConnectivity() {
  const ctx = useContext(ConnectivityContext);
  if (!ctx) throw new Error("useConnectivity must be used within ConnectivityProvider");
  return ctx;
}
