import Station from "../models/Station.js";
import Telemetry from "../models/Telemetry.js";
import dataStore from "../services/dataStore.js";
import { evaluateStationRisk } from "../services/predictionEngine.js";
import { generateTick } from "../services/simulator.js";

export async function listStations(req, res) {
  try {
    if (Station.db && Station.db.readyState === 1) {
      const stations = await Station.find().select("code name location connectivity crewCapacity");
      if (stations && stations.length > 0) return res.json(stations);
    }
  } catch {
    // fallback to dataStore
  }
  const memoryStations = dataStore.getStations().map((s) => ({
    code: s.code,
    name: s.name,
    location: s.location,
    connectivity: s.connectivity,
    crewCapacity: s.crewCapacity,
    activeDisaster: s.activeDisaster,
  }));
  res.json(memoryStations);
}

// Returns the full twin state: zones + latest reading per metric + AI prediction
export async function getStationTwin(req, res) {
  const { code } = req.params;
  const stationCode = code.toUpperCase();
  const station = dataStore.getStation(stationCode);

  if (!station) {
    return res.status(404).json({ error: "Station not found" });
  }

  let latestByZone = dataStore.getTelemetry(stationCode);

  // If memory buffer is empty for any reason, trigger an initial tick
  if (Object.keys(latestByZone).length === 0) {
    await generateTick().catch(() => {});
    latestByZone = dataStore.getTelemetry(stationCode);
  }

  // Evaluate AI Risk & Prediction
  const prediction = evaluateStationRisk(station, latestByZone);

  res.json({
    station,
    telemetry: latestByZone,
    prediction,
  });
}

export async function getPredictions(req, res) {
  const { code } = req.params;
  const stationCode = code.toUpperCase();
  const station = dataStore.getStation(stationCode);

  if (!station) {
    return res.status(404).json({ error: "Station not found" });
  }

  const telemetry = dataStore.getTelemetry(stationCode);
  const prediction = evaluateStationRisk(station, telemetry);
  res.json(prediction);
}

export async function setConnectivity(req, res) {
  const { code } = req.params;
  const { status } = req.body; // "online" | "degraded" | "offline"
  const stationCode = code.toUpperCase();

  const station = dataStore.setConnectivity(stationCode, status);
  if (!station) return res.status(404).json({ error: "Station not found" });

  try {
    if (Station.db && Station.db.readyState === 1) {
      await Station.findOneAndUpdate(
        { code: stationCode },
        {
          "connectivity.status": status,
          ...(status === "online" ? { "connectivity.lastSyncedAt": new Date() } : {}),
        }
      );
    }
  } catch {
    // safe in memory
  }

  res.json(station);
}

// Trigger Live Disaster Simulation (supports multiple simultaneous disasters)
export async function triggerDisaster(req, res) {
  const { code } = req.params;
  const { disasterType, toggle = true, activeDisasters: incomingDisasters } = req.body; 
  const stationCode = code.toUpperCase();

  let station;
  if (Array.isArray(incomingDisasters)) {
    station = dataStore.getStation(stationCode);
    if (station) {
      station.activeDisasters = incomingDisasters;
      station.activeDisaster = incomingDisasters[0] || null;
      station.mitigationApplied = null;
    }
  } else if (toggle) {
    station = dataStore.toggleDisaster(stationCode, disasterType);
  } else {
    station = dataStore.setDisaster(stationCode, disasterType, false);
  }
  
  if (!station) return res.status(404).json({ error: "Station not found" });

  const disasterTitles = {
    battery_drain: "🚨 CRITICAL: Inverter Overload & High Battery Drain Rate",
    generator_failure: "🚨 CRITICAL: Primary Diesel Generator #1 Mechanical Stall",
    blizzard: "🚨 CRITICAL: Category 4 Polar Katabatic Storm Incoming (145 km/h)",
    comms_blackout: "📡 WARNING: ISRO GSAT-30 / GSAT-14 Satellite Uplink Dropout & Dish Ice Lock",
    water_freeze: "💧 WARNING: Sub-zero Glacial Melt Intake Blockage",
  };

  const currentDisasters = station.activeDisasters || (station.activeDisaster ? [station.activeDisaster] : []);

  if (currentDisasters.includes(disasterType)) {
    dataStore.addIncident(stationCode, {
      stationCode,
      zoneId: disasterType === "battery_drain" ? "power-plant" : disasterType === "generator_failure" ? "generator-shed" : disasterType === "blizzard" ? "living-quarters" : disasterType === "water_freeze" ? "water-plant" : "comms-tower",
      title: disasterTitles[disasterType] || `Disaster Triggered: ${disasterType}`,
      description: `Live disaster scenario [${disasterType}] active (Total active disasters: ${currentDisasters.length}). Prediction engine evaluating multi-failure risk.`,
      severity: "critical",
      status: "open",
      reportedBy: "AI Telemetry Anomaly Guard",
    });
  }

  // Run immediate tick to update digital twin
  await generateTick().catch(() => {});

  const telemetry = dataStore.getTelemetry(stationCode);
  const prediction = evaluateStationRisk(station, telemetry);

  res.json({
    message: `Disaster state updated. Active: [${currentDisasters.join(", ")}]`,
    station,
    telemetry,
    prediction,
  });
}

// Apply Mitigation SOP Countermeasure
export async function applyMitigation(req, res) {
  const { code } = req.params;
  const { protocol } = req.body; // e.g. "shed_load_aux_gen", "switch_backup_gen", "storm_lockdown", "melt_trace_heat"
  const stationCode = code.toUpperCase();

  const station = dataStore.applyMitigation(stationCode, protocol);
  if (!station) return res.status(404).json({ error: "Station not found" });

  // Add Incident note
  dataStore.addIncident(stationCode, {
    stationCode,
    zoneId: "power-plant",
    title: `⚡ SOP Countermeasure Executed: [${protocol}]`,
    description: `Station commander authorized mitigation SOP ${protocol}. AI prediction recalculating failure probability buffer.`,
    severity: "info",
    status: "in_progress",
    reportedBy: "Station Commander",
  });

  // Run immediate tick to reflect stabilization
  await generateTick().catch(() => {});

  const telemetry = dataStore.getTelemetry(stationCode);
  const prediction = evaluateStationRisk(station, telemetry);

  res.json({
    message: `Mitigation protocol [${protocol}] executed`,
    station,
    telemetry,
    prediction,
  });
}

// Clear/Resolve Disaster (Return to Nominal)
export async function resolveDisaster(req, res) {
  const { code } = req.params;
  const stationCode = code.toUpperCase();

  const station = dataStore.clearDisaster(stationCode);
  if (!station) return res.status(404).json({ error: "Station not found" });

  dataStore.addIncident(stationCode, {
    stationCode,
    zoneId: "power-plant",
    title: "✅ System Nominal: Normal Polar Operations Restored",
    description: "All disaster triggers cleared. Digital Twin zones and power parameters restored to nominal safety envelope.",
    severity: "info",
    status: "resolved",
    reportedBy: "AI Telemetry Anomaly Guard",
  });

  await generateTick().catch(() => {});

  const telemetry = dataStore.getTelemetry(stationCode);
  const prediction = evaluateStationRisk(station, telemetry);

  res.json({
    message: "Disaster resolved, station operating in nominal mode",
    station,
    telemetry,
    prediction,
  });
}

export async function triggerTick(req, res) {
  const count = await generateTick().catch(() => 0);
  res.json({ status: "ok", inserts: count, time: new Date() });
}
