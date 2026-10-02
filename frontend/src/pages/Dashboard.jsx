import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useConnectivity } from "../context/ConnectivityContext.jsx";
import StationTwin from "../components/StationTwin.jsx";
import ConnectivityBar from "../components/ConnectivityBar.jsx";
import ResourcePanel from "../components/ResourcePanel.jsx";
import TelemetryPanel from "../components/TelemetryPanel.jsx";
import PersonnelPanel from "../components/PersonnelPanel.jsx";
import IncidentLog from "../components/IncidentLog.jsx";
import PredictionRiskPanel from "../components/PredictionRiskPanel.jsx";
import CriticalAlertBanner from "../components/CriticalAlertBanner.jsx";
import SatelliteTracker from "../components/SatelliteTracker.jsx";
import soundEngine from "../services/soundEngine.js";
import {
  DEFAULT_STATIONS,
  generateDefaultTelemetry,
  generateDefaultPrediction,
  DEFAULT_RESOURCES,
  DEFAULT_PERSONNEL,
  DEFAULT_INCIDENTS,
} from "../services/dataDefaults.js";
import { generateOfflineTick } from "../offline/edgePredictor.js";
import {
  Globe,
  Clock,
  RefreshCw,
  X,
  Radio,
  BarChart3,
  FlaskConical,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";

const STATIONS = [
  { code: "MAITRI", label: "Maitri Station (70°S)", region: "Schirmacher Oasis" },
  { code: "BHARATI", label: "Bharati Station (69°S)", region: "Larsemann Hills" },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { isOffline, write, addSyncListener } = useConnectivity();
  const [stationCode, setStationCode] = useState(user?.stationCode || "MAITRI");

  const [twin, setTwin] = useState(() => ({
    station: DEFAULT_STATIONS[user?.stationCode || "MAITRI"] || DEFAULT_STATIONS.MAITRI,
    telemetry: generateDefaultTelemetry(user?.stationCode || "MAITRI"),
    prediction: generateDefaultPrediction(user?.stationCode || "MAITRI"),
  }));

  const [resources, setResources] = useState(() => DEFAULT_RESOURCES[user?.stationCode || "MAITRI"] || DEFAULT_RESOURCES.MAITRI);
  const [personnel, setPersonnel] = useState(() => DEFAULT_PERSONNEL[user?.stationCode || "MAITRI"] || DEFAULT_PERSONNEL.MAITRI);
  const [incidents, setIncidents] = useState(() => DEFAULT_INCIDENTS[user?.stationCode || "MAITRI"] || DEFAULT_INCIDENTS.MAITRI);
  const [prediction, setPrediction] = useState(() => generateDefaultPrediction(user?.stationCode || "MAITRI"));
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [muted, setMuted] = useState(false);

  // Toggle Sound FX
  const handleToggleSound = () => {
    const nextState = !muted;
    setMuted(nextState);
    soundEngine.setMuted(nextState);
    if (!nextState) soundEngine.playPing();
  };

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update default data when switching station code
  useEffect(() => {
    const defaultStation = DEFAULT_STATIONS[stationCode] || DEFAULT_STATIONS.MAITRI;
    setTwin((prev) => ({
      station: defaultStation,
      telemetry: prev?.telemetry && Object.keys(prev.telemetry).length > 0 ? prev.telemetry : generateDefaultTelemetry(stationCode),
      prediction: prev?.prediction || generateDefaultPrediction(stationCode),
    }));
    setResources(DEFAULT_RESOURCES[stationCode] || DEFAULT_RESOURCES.MAITRI);
    setPersonnel(DEFAULT_PERSONNEL[stationCode] || DEFAULT_PERSONNEL.MAITRI);
    setIncidents(DEFAULT_INCIDENTS[stationCode] || DEFAULT_INCIDENTS.MAITRI);
    setPrediction(generateDefaultPrediction(stationCode));
  }, [stationCode]);

  const loadAll = useCallback(async () => {
    try {
      const [twinRes, resRes, perRes, incRes] = await Promise.all([
        api.get(`/stations/${stationCode}/twin`),
        api.get(`/resources/${stationCode}`),
        api.get(`/personnel/${stationCode}`),
        api.get(`/incidents/${stationCode}`),
      ]);

      if (twinRes.data && twinRes.data.station) {
        setTwin(twinRes.data);
        if (twinRes.data.prediction) setPrediction(twinRes.data.prediction);
      }
      if (resRes.data && Array.isArray(resRes.data) && resRes.data.length > 0) {
        setResources(resRes.data);
      }
      if (perRes.data && Array.isArray(perRes.data) && perRes.data.length > 0) {
        setPersonnel(perRes.data);
      }
      if (incRes.data && Array.isArray(incRes.data)) {
        setIncidents(incRes.data);
      }
    } catch (err) {
      console.warn("Telemetry live stream sync notice:", err.message);
    } finally {
      setLoading(false);
    }
  }, [stationCode]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Subscribe to sync completions from ConnectivityContext
  useEffect(() => {
    const unsub = addSyncListener(() => {
      soundEngine.playSuccess();
      loadAll();
    });
    return unsub;
  }, [addSyncListener, loadAll]);

  // Real-time polling every 3s when online
  useEffect(() => {
    if (isOffline) return;
    const id = setInterval(loadAll, 3000);
    return () => clearInterval(id);
  }, [isOffline, loadAll]);

  // Autonomous Edge AI & Telemetry generator when satellite connectivity drops
  useEffect(() => {
    if (!isOffline) return;
    const edgeInterval = setInterval(() => {
      setTwin((prev) => {
        if (!prev) return prev;
        const result = generateOfflineTick(prev.station, prev.telemetry);
        setPrediction(result.prediction);
        if (result.flatReadings.length > 0) {
          write({
            type: "telemetry",
            method: "POST",
            url: `/telemetry/${stationCode}`,
            body: result.flatReadings,
          }).catch(() => {});
        }
        return {
          ...prev,
          station: result.station || prev.station,
          telemetry: result.telemetryByZone,
          prediction: result.prediction,
        };
      });
    }, 3000);

    return () => clearInterval(edgeInterval);
  }, [isOffline, stationCode, write]);

  // Trigger Disaster Scenario with audio alert
  const handleTriggerDisaster = async (disasterType) => {
    soundEngine.playAlarm();
    const disasterTitles = {
      battery_drain: "🚨 CRITICAL: Inverter Overload & High Battery Drain Rate",
      generator_failure: "🚨 CRITICAL: Primary Diesel Generator #1 Mechanical Stall",
      blizzard: "🚨 CRITICAL: Category 4 Polar Katabatic Storm Incoming (145 km/h)",
      comms_blackout: "📡 WARNING: ISRO GSAT-30 / GSAT-14 Satellite Uplink Dropout & Dish Ice Lock",
      water_freeze: "💧 WARNING: Sub-zero Glacial Melt Intake Blockage",
    };

    const currentList = twin?.station?.activeDisasters || (twin?.station?.activeDisaster ? [twin.station.activeDisaster] : []);
    let updatedDisasters;
    if (currentList.includes(disasterType)) {
      updatedDisasters = currentList.filter((d) => d !== disasterType);
    } else {
      updatedDisasters = [...currentList, disasterType];
    }

    const newIncident = {
      _id: `inc-local-${Date.now()}`,
      stationCode,
      zoneId: disasterType === "battery_drain" ? "power-plant" : disasterType === "generator_failure" ? "generator-shed" : disasterType === "blizzard" ? "living-quarters" : disasterType === "water_freeze" ? "water-plant" : "comms-tower",
      title: disasterTitles[disasterType] || `Disaster Triggered: ${disasterType}`,
      description: `Sensor alarm triggered disaster scenario [${disasterType}]. Active count: ${updatedDisasters.length}. AI Prediction analyzing compound failure mode.`,
      severity: "critical",
      status: "open",
      reportedBy: "AI Telemetry Anomaly Guard (Edge AI)",
      createdAt: new Date(),
    };

    setIncidents((prev) => [newIncident, ...prev]);

    setTwin((prev) => {
      const updatedStation = {
        ...prev.station,
        activeDisaster: updatedDisasters[0] || null,
        activeDisasters: updatedDisasters,
        mitigationApplied: null,
      };
      const result = generateOfflineTick(updatedStation, prev.telemetry);
      setPrediction(result.prediction);
      return {
        ...prev,
        station: result.station,
        telemetry: result.telemetryByZone,
        prediction: result.prediction,
      };
    });

    setActionNotice(
      updatedDisasters.length > 0
        ? `🚨 Crisis state updated. Active disasters: [${updatedDisasters.join(" + ")}]`
        : `✅ All disaster scenarios cleared. System nominal.`
    );
    setTimeout(() => setActionNotice(null), 5000);

    await write({
      type: "station_disaster",
      method: "POST",
      url: `/stations/${stationCode}/disaster`,
      body: { disasterType, toggle: true, activeDisasters: updatedDisasters },
    });
  };

  // Mitigation SOP Execution Handler with success chime
  const handleExecuteMitigation = async (rec) => {
    try {
      soundEngine.playSuccess();
      if (rec.action === "resolve_disaster") {
        await handleResolveDisaster();
        return;
      }
      const protocol = rec.protocol || "shed_load_aux_gen";

      const mitigationIncident = {
        _id: `inc-mit-${Date.now()}`,
        stationCode,
        zoneId: "power-plant",
        title: `⚡ SOP Countermeasure Executed: [${protocol}]`,
        description: `Station commander authorized mitigation SOP ${protocol}. AI prediction recalculating failure probability buffer.`,
        severity: "info",
        status: "in_progress",
        reportedBy: "Station Commander",
        createdAt: new Date(),
      };

      setIncidents((prev) => [mitigationIncident, ...prev]);

      setTwin((prev) => {
        const updatedStation = {
          ...prev.station,
          mitigationApplied: protocol,
        };
        const result = generateOfflineTick(updatedStation, prev.telemetry);
        setPrediction(result.prediction);
        return {
          ...prev,
          station: result.station,
          telemetry: result.telemetryByZone,
          prediction: result.prediction,
        };
      });

      setActionNotice(`✅ Mitigation Protocol [${protocol}] executed. Station safety buffer stabilized.`);
      setTimeout(() => setActionNotice(null), 5000);

      await write({
        type: "station_mitigation",
        method: "POST",
        url: `/stations/${stationCode}/apply-mitigation`,
        body: { protocol },
      });
    } catch (err) {
      console.error("Mitigation execution failed:", err);
    }
  };

  // Resolve / Reset Disaster
  const handleResolveDisaster = async () => {
    try {
      soundEngine.playSuccess();
      const resolvedIncident = {
        _id: `inc-res-${Date.now()}`,
        stationCode,
        zoneId: "power-plant",
        title: "✅ System Nominal: Normal Polar Operations Restored",
        description: "All disaster triggers cleared. Digital Twin zones and power parameters restored to nominal safety envelope.",
        severity: "info",
        status: "resolved",
        reportedBy: "AI Telemetry Anomaly Guard",
        createdAt: new Date(),
      };

      setIncidents((prev) => [resolvedIncident, ...prev]);

      setTwin((prev) => {
        const nominalStation = {
          ...prev.station,
          activeDisaster: null,
          activeDisasters: [],
          mitigationApplied: null,
          zones: prev.station.zones.map((z) => ({ ...z, status: "nominal" })),
        };
        const result = generateOfflineTick(nominalStation, prev.telemetry);
        setPrediction(result.prediction);
        return {
          ...prev,
          station: result.station,
          telemetry: result.telemetryByZone,
          prediction: result.prediction,
        };
      });

      setActionNotice("✅ All disaster parameters reset to nominal polar safety envelope.");
      setTimeout(() => setActionNotice(null), 4000);

      await write({
        type: "station_resolve",
        method: "POST",
        url: `/stations/${stationCode}/resolve-disaster`,
        body: {},
      });
    } catch (err) {
      console.error("Disaster resolve failed:", err);
    }
  };

  const handleLocalIncidentAdded = (newInc) => {
    setIncidents((prev) => [newInc, ...prev]);
  };

  const selectedZoneData = twin?.station?.zones?.find((z) => z.zoneId === selectedZone);

  const uniqueZoneReadings = useMemo(() => {
    if (!selectedZone || !twin?.telemetry) return [];
    const raw = twin.telemetry[selectedZone] || [];
    const byMetric = {};
    for (const r of raw) {
      if (!byMetric[r.metric] || new Date(r.recordedAt) > new Date(byMetric[r.metric].recordedAt)) {
        byMetric[r.metric] = r;
      }
    }
    return Object.values(byMetric);
  }, [selectedZone, twin]);

  return (
    <div className="min-h-screen px-4 sm:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Centered Big Bold Mission Control Header */}
      <header className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] shadow-2xl relative space-y-4">
        {/* Top Utility Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] text-[var(--ice-cyan)] shadow-inner">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-mono text-[10px] tracking-[0.2em] font-bold text-[var(--ice-cyan)] uppercase">
                POLAR MISSION CONTROL
              </span>
              <p className="text-[11px] text-[var(--text-tertiary)] font-mono">
                Edge Command &amp; Telemetry
              </p>
            </div>
          </div>

          {/* Navigation, Station Switcher, Sound & User Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Audio Feedback Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-mono font-semibold ${
                muted
                  ? "bg-red-950/30 border-red-500/40 text-red-400"
                  : "bg-[var(--bg-deep)] border-[var(--border-subtle)] text-[var(--ice-cyan)] hover:border-[var(--ice-cyan)]"
              }`}
              title={muted ? "Unmute Mission Control Sound Effects" : "Mute Sound FX"}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{muted ? "Muted" : "Audio On"}</span>
            </button>

            {/* Historical Reports Navigation */}
            <Link
              to="/analytics"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] hover:border-[var(--ice-cyan)] text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--ice-cyan)] transition cursor-pointer"
              title="View Historical Analytics, Graphs & Tabular Reports"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[var(--ice-cyan)]" />
              <span>Reports</span>
            </Link>

            {/* Scenario Lab Button */}
            <Link
              to="/simulator"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-950/30 hover:bg-amber-950/60 text-amber-300 text-xs font-mono font-semibold transition cursor-pointer shadow-sm"
              title="Open Scenario Lab testing console to inject disasters"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Scenario Lab</span>
            </Link>

            {/* Station Switcher */}
            <div className="flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-1 overflow-hidden">
              {STATIONS.map((s) => (
                <button
                  key={s.code}
                  onClick={() => {
                    setStationCode(s.code);
                    setSelectedZone(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition-all cursor-pointer ${
                    stationCode === s.code
                      ? "bg-[var(--bg-panel-raised)] text-[var(--ice-cyan)] shadow-sm border border-[var(--ice-cyan-dim)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Time & User */}
            <div className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-secondary)]">
              <Clock className="w-3.5 h-3.5 text-[var(--ice-cyan)]" />
              <span>UTC: {currentTime.toUTCString().slice(17, 25)}</span>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)]">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-[var(--text-primary)]">{user?.name || "Commander"}</p>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono">{user?.role || "HQ Admin"}</p>
              </div>
              <button
                onClick={logout}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-red-400 hover:border-red-500/40 transition cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Big Bold Centered Title */}
        <div className="text-center py-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-xl">
            <span className="text-[var(--ice-cyan)] font-extrabold">DigiAI ICE TWIN</span>
            <span className="text-gray-400 font-normal mx-2 sm:mx-3">-</span>
            <span className="text-white font-extrabold">Antarctic Intelligence &amp; Digital Twin</span>
          </h1>
        </div>
      </header>

      {/* Satellite Connectivity Bar */}
      <ConnectivityBar />

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-[var(--ice-cyan)] text-cyan-200 text-xs font-mono flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[var(--ice-cyan)] animate-spin" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="cursor-pointer text-cyan-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Critical Alert Banner */}
      <CriticalAlertBanner
        prediction={prediction}
        onExecuteMitigation={handleExecuteMitigation}
      />

      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] space-y-3">
          <RefreshCw className="w-8 h-8 text-[var(--ice-cyan)] animate-spin mx-auto" />
          <p className="text-sm font-mono text-[var(--text-secondary)]">
            Synchronizing Antarctic Digital Twin Telemetry…
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-Column Left Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live 2D Schematic Digital Twin */}
            <StationTwin
              station={twin?.station}
              isOffline={isOffline || twin?.station?.connectivity?.status === "offline"}
              selectedZone={selectedZone}
              onSelectZone={(z) => setSelectedZone(z === selectedZone ? null : z)}
            />

            {/* Selected Zone Inspection Modal */}
            {selectedZone && selectedZoneData && (
              <div className="rounded-2xl border border-[var(--ice-cyan-dim)] bg-[var(--bg-panel)] p-5 space-y-3 shadow-2xl relative animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--ice-cyan)]/20 text-[var(--ice-cyan)] border border-[var(--ice-cyan-dim)] uppercase font-bold">
                      Zone Diagnostic Drilldown
                    </span>
                    <h4 className="font-display font-semibold text-base text-[var(--text-primary)]">
                      {selectedZoneData.label} [{(selectedZoneData.type || "zone").toUpperCase()}]
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedZone(null)}
                    className="p-1 rounded-lg hover:bg-[var(--bg-panel-raised)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)]">
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono">Operating Status</p>
                    <p className="font-mono text-sm font-bold mt-0.5" style={{ color: selectedZoneData.status === "critical" ? "#FF5D5D" : selectedZoneData.status === "warning" ? "#F4A93B" : "#4ADE80" }}>
                      {(selectedZoneData.status || "nominal").toUpperCase()}
                    </p>
                  </div>

                  {uniqueZoneReadings.map((r, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)]">
                      <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono truncate">
                        {r.metric.replace(/_/g, " ")}
                      </p>
                      <p className="font-mono text-sm font-bold text-[var(--ice-cyan)] mt-0.5">
                        {r.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real-time telemetry stream */}
            <TelemetryPanel
              telemetryByZone={twin?.telemetry || {}}
              zones={twin?.station?.zones || []}
            />

            {/* AI Predictive Risk & Automated SOP Countermeasures */}
            <PredictionRiskPanel
              prediction={prediction}
              onExecuteMitigation={handleExecuteMitigation}
            />

            {/* Incident Log */}
            <IncidentLog
              incidents={incidents}
              stationCode={stationCode}
              onRefresh={loadAll}
              onLocalIncidentAdded={handleLocalIncidentAdded}
            />
          </div>

          {/* Right Column: Satellite Radar, Logistics & Crew Panels */}
          <div className="space-y-6">
            <SatelliteTracker isOffline={isOffline} />
            <ResourcePanel resources={resources} />
            <PersonnelPanel personnel={personnel} onRefresh={loadAll} onLocalSOSIncident={handleLocalIncidentAdded} />
          </div>
        </div>
      )}
    </div>
  );
}
