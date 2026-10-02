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
  Cpu,
  Layers,
  Activity,
  BrainCircuit,
  Package,
  Users,
  Shield,
  Menu,
} from "lucide-react";

const STATIONS = [
  { code: "MAITRI", label: "Maitri (70°S)", fullLabel: "Maitri Station (70°S)", region: "Schirmacher Oasis" },
  { code: "BHARATI", label: "Bharati (69°S)", fullLabel: "Bharati Station (69°S)", region: "Larsemann Hills" },
];

const MOBILE_VIEWS = [
  { id: "all", label: "All Panels", icon: Layers },
  { id: "twin", label: "Station Twin", icon: Cpu },
  { id: "telemetry", label: "Telemetry", icon: Activity },
  { id: "prediction", label: "AI Risk Engine", icon: BrainCircuit },
  { id: "satcom", label: "Satcom & Cargo", icon: Package },
  { id: "crew", label: "Crew & Logs", icon: Users },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { isOffline, write, addSyncListener } = useConnectivity();
  const [stationCode, setStationCode] = useState(user?.stationCode || "MAITRI");
  const [mobileView, setMobileView] = useState("all");

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
    <div className="min-h-screen min-h-[100dvh] px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Centered Futuristic Mission Control Header */}
      <header className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-panel)]/95 border border-[var(--border-subtle)] shadow-2xl backdrop-blur-xl relative space-y-3.5">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[var(--border-subtle)] pb-3">
          {/* Logo & Operational Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] text-[var(--ice-cyan)] shadow-inner shrink-0">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] font-bold text-[var(--ice-cyan)] uppercase block truncate">
                POLAR MISSION CONTROL
              </span>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-tertiary)] font-mono truncate">
                ISRO GSAT Telemetry &amp; Autonomous Twin
              </p>
            </div>
          </div>

          {/* Controls: Audio, Reports, Scenario Lab, Station Switcher & User */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-mono font-semibold shrink-0 ${
                muted
                  ? "bg-red-950/30 border-red-500/40 text-red-400"
                  : "bg-[var(--bg-deep)] border-[var(--border-subtle)] text-[var(--ice-cyan)] hover:border-[var(--ice-cyan)]"
              }`}
              title={muted ? "Unmute Mission Control Sound Effects" : "Mute Sound FX"}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden md:inline">{muted ? "Muted" : "Audio"}</span>
            </button>

            {/* Historical Reports Navigation */}
            <Link
              to="/analytics"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] hover:border-[var(--ice-cyan)] text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--ice-cyan)] transition cursor-pointer shrink-0"
              title="View Historical Analytics, Graphs & Tabular Reports"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[var(--ice-cyan)]" />
              <span className="hidden xs:inline">Reports</span>
            </Link>

            {/* Scenario Lab Button */}
            <Link
              to="/simulator"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500/40 bg-amber-950/30 hover:bg-amber-950/60 text-amber-300 text-xs font-mono font-semibold transition cursor-pointer shadow-sm shrink-0"
              title="Open Scenario Lab testing console to inject disasters"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Scenario Lab</span>
            </Link>

            {/* Station Switcher */}
            <div className="flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-1 overflow-hidden shrink-0">
              {STATIONS.map((s) => (
                <button
                  key={s.code}
                  onClick={() => {
                    setStationCode(s.code);
                    setSelectedZone(null);
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition-all cursor-pointer ${
                    stationCode === s.code
                      ? "bg-[var(--bg-panel-raised)] text-[var(--ice-cyan)] shadow-sm border border-[var(--ice-cyan-dim)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span className="sm:hidden">{s.label}</span>
                  <span className="hidden sm:inline">{s.fullLabel}</span>
                </button>
              ))}
            </div>

            {/* User Badge & Sign Out */}
            <div className="flex items-center gap-2 pl-1.5 border-l border-[var(--border-subtle)]">
              <div className="text-right hidden lg:block">
                <p className="text-xs font-medium text-[var(--text-primary)]">{user?.name || "Commander"}</p>
                <p className="text-[9px] text-[var(--text-tertiary)] uppercase font-mono">{user?.clearance || user?.role || "HQ Admin"}</p>
              </div>
              <button
                onClick={logout}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-red-400 hover:border-red-500/40 transition cursor-pointer shrink-0"
                title="Sign out of mission session"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Big Bold Centered Title */}
        <div className="text-center py-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-xl font-display">
            <span className="text-[var(--ice-cyan)] font-extrabold">DigiAI ICE TWIN</span>
            <span className="text-gray-400 font-normal mx-2 sm:mx-3">-</span>
            <span className="text-white font-extrabold">Antarctic Intelligence &amp; Digital Twin</span>
          </h1>
          <p className="font-mono text-[10px] sm:text-xs text-[var(--text-tertiary)] mt-1">
            Maitri (70°S · Schirmacher Oasis) &amp; Bharati (69°S · Larsemann Hills) Polar Stations
          </p>
        </div>
      </header>

      {/* Satellite Connectivity Bar */}
      <ConnectivityBar />

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-[var(--ice-cyan)] text-cyan-200 text-xs font-mono flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-4 h-4 text-[var(--ice-cyan)] animate-spin shrink-0" />
            <span className="truncate">{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="cursor-pointer text-cyan-300 hover:text-white shrink-0 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Critical Alert Banner */}
      <CriticalAlertBanner
        prediction={prediction}
        onExecuteMitigation={handleExecuteMitigation}
      />

      {/* Mobile Category Navigation Pill Bar (High-Tech Cockpit Tab Switcher) */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
        {MOBILE_VIEWS.map((tab) => {
          const Icon = tab.icon;
          const isActive = mobileView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMobileView(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                isActive
                  ? "bg-[var(--ice-cyan)] text-black font-bold shadow-md shadow-cyan-500/20"
                  : "bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-[var(--ice-cyan)]"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] space-y-3">
          <RefreshCw className="w-8 h-8 text-[var(--ice-cyan)] animate-spin mx-auto" />
          <p className="text-sm font-mono text-[var(--text-secondary)]">
            Synchronizing Antarctic Digital Twin Telemetry…
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Main Left Column (Twin, Telemetry, Risk, Incident) */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">
            {/* 1. Live 2D Schematic Digital Twin */}
            {(mobileView === "all" || mobileView === "twin") && (
              <StationTwin
                station={twin?.station}
                isOffline={isOffline || twin?.station?.connectivity?.status === "offline"}
                selectedZone={selectedZone}
                onSelectZone={(z) => setSelectedZone(z === selectedZone ? null : z)}
              />
            )}

            {/* Selected Zone Inspection Modal */}
            {selectedZone && selectedZoneData && (
              <div className="rounded-2xl border border-[var(--ice-cyan-dim)] bg-[var(--bg-panel)] p-4 sm:p-5 space-y-3 shadow-2xl relative animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] sm:text-xs px-2 py-0.5 rounded bg-[var(--ice-cyan)]/20 text-[var(--ice-cyan)] border border-[var(--ice-cyan-dim)] uppercase font-bold shrink-0">
                      Zone Diagnostic Drilldown
                    </span>
                    <h4 className="font-display font-semibold text-sm sm:text-base text-[var(--text-primary)] truncate">
                      {selectedZoneData.label} [{(selectedZoneData.type || "zone").toUpperCase()}]
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedZone(null)}
                    className="p-1 rounded-lg hover:bg-[var(--bg-panel-raised)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
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

            {/* 2. Real-time telemetry stream */}
            {(mobileView === "all" || mobileView === "telemetry") && (
              <TelemetryPanel
                telemetryByZone={twin?.telemetry || {}}
                zones={twin?.station?.zones || []}
              />
            )}

            {/* 3. AI Predictive Risk & Automated SOP Countermeasures */}
            {(mobileView === "all" || mobileView === "prediction") && (
              <PredictionRiskPanel
                prediction={prediction}
                onExecuteMitigation={handleExecuteMitigation}
              />
            )}

            {/* 4. Incident Log (Desktop or Crew/Logs tab) */}
            {(mobileView === "all" || mobileView === "crew") && (
              <IncidentLog
                incidents={incidents}
                stationCode={stationCode}
                onRefresh={loadAll}
                onLocalIncidentAdded={handleLocalIncidentAdded}
              />
            )}
          </div>

          {/* Right Column: Satellite Radar, Logistics & Crew Panels */}
          <div className="space-y-5 sm:space-y-6">
            {(mobileView === "all" || mobileView === "satcom") && (
              <>
                <SatelliteTracker isOffline={isOffline} />
                <ResourcePanel resources={resources} />
              </>
            )}

            {(mobileView === "all" || mobileView === "crew") && (
              <PersonnelPanel personnel={personnel} onRefresh={loadAll} onLocalSOSIncident={handleLocalIncidentAdded} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

