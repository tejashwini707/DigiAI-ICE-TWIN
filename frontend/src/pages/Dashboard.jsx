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
import DailyOpsReportModal from "../components/DailyOpsReportModal.jsx";
import NotificationModal from "../components/NotificationModal.jsx";
import soundEngine from "../services/soundEngine.js";
import { fetchLiveAntarcticWeather } from "../services/weatherService.js";
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
  Maximize2,
  Minimize2,
  FileText,
  Send,
  CloudSun,
  Wind,
  Thermometer,
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
  const [wallMode, setWallMode] = useState(false); // Mission Control Wall / TV Mode

  const [showReportModal, setShowReportModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [liveWeather, setLiveWeather] = useState(null);

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

  // Fetch Live Antarctic Weather Feed
  useEffect(() => {
    let mounted = true;
    fetchLiveAntarcticWeather(stationCode).then((data) => {
      if (mounted) setLiveWeather(data);
    });
    const wTimer = setInterval(() => {
      fetchLiveAntarcticWeather(stationCode).then((data) => {
        if (mounted) setLiveWeather(data);
      });
    }, 120000);
    return () => {
      mounted = false;
      clearInterval(wTimer);
    };
  }, [stationCode]);

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

  // INSTANT REACTIVE DISASTER INJECTION HANDLER
  const handleTriggerDisaster = async (disasterType) => {
    soundEngine.playSiren();

    const currentList = twin?.station?.activeDisasters || (twin?.station?.activeDisaster ? [twin?.station?.activeDisaster] : []);
    const updatedList = currentList.includes(disasterType)
      ? currentList.filter((d) => d !== disasterType)
      : [...currentList, disasterType];

    const updatedStation = {
      ...(twin?.station || DEFAULT_STATIONS[stationCode]),
      activeDisaster: updatedList[0] || null,
      activeDisasters: updatedList,
      mitigationApplied: null,
    };

    // Immediately calculate new telemetry & AI risk curve
    const edgeResult = generateOfflineTick(updatedStation, twin?.telemetry || {});
    setTwin((prev) => ({
      ...prev,
      station: edgeResult.station,
      telemetry: edgeResult.telemetryByZone,
      prediction: edgeResult.prediction,
    }));
    setPrediction(edgeResult.prediction);

    if (updatedList.length > 0) {
      setActionNotice(`🚨 Injected Disaster: [${updatedList.map((d) => d.toUpperCase()).join(" + ")}] active in ${stationCode}!`);
      const disasterLabels = {
        battery_drain: "Inverter Thermal Overload & Battery Drain",
        generator_failure: "Primary Diesel GenSet #1 Stall",
        blizzard: "Category 4 Katabatic Blizzard (145 km/h)",
        comms_blackout: "ISRO GSAT-30 SATCOM Dropout",
        water_freeze: "Glacial Melt Intake Sub-Zero Freeze",
      };
      const inc = {
        _id: `inc-dis-${Date.now()}`,
        stationCode,
        zoneId: disasterType === "battery_drain" ? "power-plant" : disasterType === "generator_failure" ? "generator-shed" : disasterType === "blizzard" ? "living-quarters" : disasterType === "water_freeze" ? "water-plant" : "comms-tower",
        title: `🚨 Emergency Injected: ${disasterLabels[disasterType] || disasterType.toUpperCase()}`,
        severity: "critical",
        status: "open",
        reportedBy: "AI Telemetry Anomaly Guard",
        createdAt: new Date().toISOString(),
      };
      setIncidents((prev) => [inc, ...prev]);
    } else {
      setActionNotice("✅ Cleared disaster. All station parameters nominal.");
    }
    setTimeout(() => setActionNotice(null), 5000);

    // Sync to backend / IndexedDB queue
    try {
      const res = await write({
        type: "station_disaster",
        method: "POST",
        url: `/stations/${stationCode}/disaster`,
        body: { disasterType, toggle: true, activeDisasters: updatedList },
      });
      if (res?.data?.prediction) {
        setPrediction(res.data.prediction);
      }
    } catch (e) {
      console.warn("Backend disaster sync note:", e.message);
    }
  };

  // INSTANT REACTIVE DISASTER RESOLUTION HANDLER
  const handleResolveDisaster = async () => {
    soundEngine.playSuccess();

    const updatedStation = {
      ...(twin?.station || DEFAULT_STATIONS[stationCode]),
      activeDisaster: null,
      activeDisasters: [],
      mitigationApplied: null,
    };

    const edgeResult = generateOfflineTick(updatedStation, twin?.telemetry || {});
    setTwin((prev) => ({
      ...prev,
      station: edgeResult.station,
      telemetry: edgeResult.telemetryByZone,
      prediction: edgeResult.prediction,
    }));
    setPrediction(edgeResult.prediction);
    setActionNotice("✅ All station alarms cleared. Normal polar power grid restored.");
    setTimeout(() => setActionNotice(null), 5000);

    try {
      await write({
        type: "station_resolve",
        method: "POST",
        url: `/stations/${stationCode}/resolve-disaster`,
        body: {},
      });
    } catch (e) {
      console.warn("Backend resolve note:", e.message);
    }
  };

  // Mitigation SOP Execution Handler with success chime
  const handleExecuteMitigation = async (rec) => {
    soundEngine.playSuccess();
    if (rec.action === "resolve_disaster") {
      await handleResolveDisaster();
      return;
    }
    const protocol = rec.protocol || "shed_load_aux_gen";

    const updatedStation = {
      ...(twin?.station || DEFAULT_STATIONS[stationCode]),
      mitigationApplied: protocol,
    };

    const edgeResult = generateOfflineTick(updatedStation, twin?.telemetry || {});
    setTwin((prev) => ({
      ...prev,
      station: edgeResult.station,
      telemetry: edgeResult.telemetryByZone,
      prediction: edgeResult.prediction,
    }));
    setPrediction(edgeResult.prediction);

    const mitigationIncident = {
      _id: `inc-mit-${Date.now()}`,
      stationCode,
      zoneId: "power-plant",
      title: `⚡ Auto-Executed SOP: ${rec.label || protocol}`,
      severity: "info",
      status: "resolved",
      reportedBy: "Polar-Twin Autonomous AI",
      createdAt: new Date().toISOString(),
    };
    setIncidents((prev) => [mitigationIncident, ...prev]);

    setActionNotice(`Executed SOP Protocol: ${rec.label || protocol}. Risk reduced by ${rec.riskDelta || "-15%"}.`);
    setTimeout(() => setActionNotice(null), 5000);

    try {
      await write({
        type: "station_mitigate",
        method: "POST",
        url: `/stations/${stationCode}/apply-mitigation`,
        body: { protocol },
      });
    } catch (e) {
      console.warn("Mitigation sync note:", e.message);
    }
  };

  const handleLocalIncidentAdded = (newInc) => {
    setIncidents((prev) => [newInc, ...prev]);
  };

  const utcString = currentTime.toUTCString().slice(17, 25);
  const antarcticaOffsetHours = stationCode === "BHARATI" ? 5 : 0;
  const localStationDate = new Date(currentTime.getTime() + antarcticaOffsetHours * 3600000);
  const localStationString = localStationDate.toUTCString().slice(17, 25);

  return (
    <div className={`min-h-screen text-[var(--text-primary)] transition-all ${wallMode ? "p-3 sm:p-4 tv-mode-grid bg-[#06080F]" : "p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6"}`}>
      {/* Top Mission Header */}
      {!wallMode && (
        <header className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
            {/* Live Clock & Mission Info */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl ice-pane frost-border text-[var(--aurora-teal)] shadow-lg shadow-teal-500/10">
                <Globe className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white tracking-widest uppercase">
                    UTC: {utcString}
                  </span>
                  <span className="text-[var(--text-tertiary)]">|</span>
                  <span className="font-mono text-xs font-semibold text-[var(--aurora-teal)] tracking-wider uppercase">
                    Station: {localStationString} (UTC{antarcticaOffsetHours >= 0 ? `+${antarcticaOffsetHours}` : antarcticaOffsetHours})
                  </span>
                </div>
                <p className="font-mono text-[10px] text-[var(--text-tertiary)]">
                  Autonomous Antarctic Operations &amp; Digital Twin · Aurora Polar Night
                </p>
              </div>
            </div>

            {/* Live Real-World Antarctic Weather Feed Pill */}
            {liveWeather && (
              <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl ice-pane frost-border text-xs font-mono">
                <div className="flex items-center gap-1.5 text-cyan-300">
                  <Thermometer className="w-3.5 h-3.5 text-[var(--aurora-teal)]" />
                  <span className="font-bold">{liveWeather.temperatureC}°C</span>
                </div>
                <span className="text-[var(--text-tertiary)]">•</span>
                <div className="flex items-center gap-1.5 text-amber-300">
                  <Wind className="w-3.5 h-3.5 text-amber-400" />
                  <span>{liveWeather.windSpeedKmh} km/h</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-[var(--aurora-teal)] border border-emerald-500/30">
                  ECMWF Live
                </span>
              </div>
            )}

            {/* Controls: Audio, Reports, SITREP, Dispatch, Wall Mode, Station Switcher & User */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {/* Audio Toggle */}
              <button
                onClick={handleToggleSound}
                className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-mono font-semibold shrink-0 ${
                  muted
                    ? "bg-red-950/30 border-red-500/40 text-red-400"
                    : "ice-pane frost-border text-[var(--aurora-teal)] hover:border-[var(--aurora-teal)]"
                }`}
                title={muted ? "Unmute Mission Control Sound Effects" : "Mute Sound FX"}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[var(--aurora-teal)]" />}
              </button>

              {/* SITREP Daily Report Modal Button */}
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--aurora-teal)]/40 ice-pane hover:bg-[var(--bg-panel-raised)] text-xs font-semibold text-[var(--aurora-teal)] transition cursor-pointer shrink-0 shadow-sm"
                title="Generate Official MoES Daily Situational Ops Report (SITREP)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Daily SITREP</span>
              </button>

              {/* Emergency Alert SATCOM Dispatcher */}
              <button
                onClick={() => setShowNotificationModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-950/60 text-red-300 text-xs font-semibold font-mono transition cursor-pointer shrink-0 shadow-sm"
                title="Dispatch Emergency SATCOM Alert to MoES / NEOC Command"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SATCOM Alert</span>
              </button>

              {/* Mission Control Wall / TV Mode Toggle */}
              <button
                onClick={() => setWallMode(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--aurora-cyan)]/40 bg-cyan-950/30 hover:bg-cyan-950/60 text-cyan-300 text-xs font-mono font-semibold transition cursor-pointer shrink-0 shadow-sm"
                title="Switch to Mission Control Wall / Full-Screen Display Mode"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Wall Display</span>
              </button>

              {/* Scenario Lab Button */}
              <Link
                to="/simulator"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500/40 bg-amber-950/30 hover:bg-amber-950/60 text-amber-300 text-xs font-mono font-semibold transition cursor-pointer shadow-sm shrink-0"
                title="Open Scenario Lab testing console"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Lab</span>
              </Link>

              {/* Historical Reports Navigation */}
              <Link
                to="/analytics"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-subtle)] ice-pane hover:border-[var(--aurora-teal)] text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--aurora-teal)] transition cursor-pointer shrink-0"
                title="View Analytics & Tabular Reports"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[var(--aurora-teal)]" />
              </Link>

              {/* 2-Station Switcher (Maitri & Bharati) */}
              <div className="flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-0.5 overflow-hidden shrink-0">
                {STATIONS.map((s) => (
                  <button
                    key={s.code}
                    onClick={() => {
                      setStationCode(s.code);
                      setSelectedZone(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition-all cursor-pointer ${
                      stationCode === s.code
                        ? "bg-[var(--bg-panel-raised)] text-[var(--aurora-teal)] shadow-sm border border-[var(--border-frozen)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Sign Out */}
              <button
                onClick={logout}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-red-400 hover:border-red-500/40 transition cursor-pointer shrink-0"
                title="Sign out of mission session"
              >
                Exit
              </button>
            </div>
          </div>

          {/* Big Bold Centered Title */}
          <div className="text-center py-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-xl font-display">
              <span className="text-[var(--aurora-teal)] font-extrabold">DigiAI ICE TWIN</span>
              <span className="text-gray-400 font-normal mx-2 sm:mx-3">-</span>
              <span className="text-white font-extrabold">Antarctic Station Intelligence Platform</span>
            </h1>
            <p className="font-mono text-[10px] sm:text-xs text-[var(--text-tertiary)] mt-1">
              Ministry of Earth Sciences (MoES) &amp; National Centre for Polar and Ocean Research (NCPOR)
            </p>
          </div>
        </header>
      )}

      {/* Wall / TV Display Mode Top Strip */}
      {wallMode && (
        <div className="flex items-center justify-between border-b border-[var(--aurora-teal)]/30 pb-2 mb-3 ice-pane p-3 rounded-xl frost-border">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[var(--aurora-teal)] animate-ping" />
            <h2 className="font-display font-bold text-lg text-white tracking-wide">
              MOES MISSION CONTROL WALL DISPLAY · {stationCode} POLAR TWIN
            </h2>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <div className="text-cyan-300">
              UTC: <span className="font-bold text-white">{utcString}</span>
            </div>
            {liveWeather && (
              <div className="text-amber-300 hidden sm:block">
                MET: {liveWeather.temperatureC}°C | {liveWeather.windSpeedKmh} km/h
              </div>
            )}
            <button
              onClick={() => setWallMode(false)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--bg-panel-raised)] border border-[var(--border-subtle)] hover:border-red-500 text-xs text-white transition cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Exit Wall Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* Satellite Connectivity Bar */}
      <ConnectivityBar />

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-950/80 to-purple-950/80 border border-[var(--aurora-teal)] text-teal-100 text-xs font-mono flex items-center justify-between animate-fadeIn shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-4 h-4 text-[var(--aurora-teal)] animate-spin shrink-0" />
            <span className="truncate">{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="cursor-pointer text-teal-300 hover:text-white shrink-0 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Critical Alert Banner */}
      <CriticalAlertBanner
        prediction={prediction}
        onExecuteMitigation={handleExecuteMitigation}
      />

      {/* Mobile Category Navigation Pill Bar */}
      {!wallMode && (
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
                    ? "bg-gradient-to-r from-[var(--aurora-teal)] to-[var(--aurora-cyan)] text-black font-bold shadow-md shadow-teal-500/20"
                    : "ice-pane border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-[var(--aurora-teal)]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center rounded-2xl ice-pane frost-border space-y-3">
          <RefreshCw className="w-8 h-8 text-[var(--aurora-teal)] animate-spin mx-auto" />
          <p className="text-sm font-mono text-[var(--text-secondary)]">
            Synchronizing Antarctic Digital Twin Telemetry…
          </p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${wallMode ? "lg:grid-cols-3 gap-4" : "lg:grid-cols-3 gap-5 sm:gap-6"}`}>
          {/* Main Left Column (Twin, Telemetry, Risk, Incident) */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">
            {/* 1. Live 2D Schematic Digital Twin */}
            {(mobileView === "all" || mobileView === "twin" || wallMode) && (
              <StationTwin
                station={twin?.station}
                isOffline={isOffline || twin?.station?.connectivity?.status === "offline"}
                selectedZone={selectedZone}
                onSelectZone={(z) => setSelectedZone(z === selectedZone ? null : z)}
                telemetryByZone={twin?.telemetry || {}}
              />
            )}

            {/* 2. Real-time telemetry stream */}
            {(mobileView === "all" || mobileView === "telemetry" || wallMode) && (
              <TelemetryPanel
                telemetryByZone={twin?.telemetry || {}}
                zones={twin?.station?.zones || []}
              />
            )}

            {/* 3. AI Predictive Risk & Automated SOP Countermeasures */}
            {(mobileView === "all" || mobileView === "prediction" || wallMode) && (
              <PredictionRiskPanel
                prediction={prediction}
                stationCode={stationCode}
                onExecuteMitigation={handleExecuteMitigation}
                onTriggerDisaster={handleTriggerDisaster}
                onResetNominal={handleResolveDisaster}
              />
            )}

            {/* 4. Incident Log (Desktop or Crew/Logs tab) */}
            {!wallMode && (mobileView === "all" || mobileView === "crew") && (
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
            {(mobileView === "all" || mobileView === "satcom" || wallMode) && (
              <>
                <SatelliteTracker isOffline={isOffline} />
                <ResourcePanel resources={resources} />
              </>
            )}

            {!wallMode && (mobileView === "all" || mobileView === "crew") && (
              <PersonnelPanel personnel={personnel} onRefresh={loadAll} onLocalSOSIncident={handleLocalIncidentAdded} />
            )}
          </div>
        </div>
      )}

      {/* Official Daily Ops SITREP Modal */}
      {showReportModal && (
        <DailyOpsReportModal
          station={twin?.station}
          telemetry={twin?.telemetry}
          prediction={prediction}
          resources={resources}
          personnel={personnel}
          incidents={incidents}
          liveWeather={liveWeather}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Emergency SATCOM Dispatch Modal */}
      {showNotificationModal && (
        <NotificationModal
          stationCode={stationCode}
          stationName={twin?.station?.name || `${stationCode} Station`}
          prediction={prediction}
          onClose={() => setShowNotificationModal(false)}
        />
      )}
    </div>
  );
}
