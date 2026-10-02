import mongoose from "mongoose";
import Telemetry from "../models/Telemetry.js";
import Station from "../models/Station.js";
import dataStore from "../services/dataStore.js";
import { evaluateStationRisk } from "../services/predictionEngine.js";

const METRICS_META = {
  temperature_c: { label: "Outside Temp", unit: "°C", nominalRange: "-10°C to -35°C", threshold: { warning: -35, critical: -45 }, invert: true },
  wind_speed_kmh: { label: "Katabatic Wind", unit: "km/h", nominalRange: "20 to 80 km/h", threshold: { warning: 80, critical: 120 } },
  power_load_kw: { label: "Power Grid Load", unit: "kW", nominalRange: "50 to 85 kW", threshold: { warning: 85, critical: 95 } },
  generator_health_pct: { label: "GenSet Health", unit: "%", nominalRange: "> 70%", threshold: { warning: 60, critical: 40 }, invert: true },
  battery_pct: { label: "Battery Bank SOC", unit: "%", nominalRange: "> 30%", threshold: { warning: 30, critical: 15 }, invert: true },
  fuel_flow_lph: { label: "Diesel Fuel Flow", unit: "L/h", nominalRange: "10 to 22 L/h", threshold: { warning: 22, critical: 28 } },
  water_level_pct: { label: "Water Storage", unit: "%", nominalRange: "> 25%", threshold: { warning: 25, critical: 12 }, invert: true },
  internal_temp_c: { label: "Habitat Temp", unit: "°C", nominalRange: "18°C to 22°C", threshold: { warning: 14, critical: 9 }, invert: true },
};

export async function listTelemetry(req, res) {
  const { code } = req.params;
  const { metric, zoneId, limit = 100 } = req.query;
  const stationCode = code.toUpperCase();

  try {
    if (mongoose.connection.readyState === 1) {
      const query = { stationCode };
      if (metric) query.metric = metric;
      if (zoneId) query.zoneId = zoneId;
      const readings = await Telemetry.find(query)
        .sort({ recordedAt: -1 })
        .limit(Number(limit));
      if (readings && readings.length > 0) return res.json(readings);
    }
  } catch (err) {
    console.warn("DB listTelemetry fallback:", err.message);
  }

  const inMemory = dataStore.getTelemetry(stationCode, zoneId);
  const flattened = Array.isArray(inMemory)
    ? inMemory
    : Object.values(inMemory).flat();

  const filtered = metric ? flattened.filter((r) => r.metric === metric) : flattened;
  res.json(filtered.slice(-Number(limit)));
}

// Full Historical Analytics and Report for disaster tracking and trend analysis
export async function getAnalytics(req, res) {
  const { code } = req.params;
  const { timeframe = "24h", metric, zoneId } = req.query;
  const stationCode = code.toUpperCase();
  const station = dataStore.getStation(stationCode) || { name: stationCode === "MAITRI" ? "Maitri Station" : "Bharati Station" };

  let since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (timeframe === "1h") since = new Date(Date.now() - 60 * 60 * 1000);
  else if (timeframe === "6h") since = new Date(Date.now() - 6 * 60 * 60 * 1000);
  else if (timeframe === "7d") since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  else if (timeframe === "all") since = new Date(0);

  let rawReadings = [];

  try {
    if (mongoose.connection.readyState === 1) {
      const query = {
        stationCode,
        recordedAt: { $gte: since },
      };
      if (metric) query.metric = metric;
      if (zoneId) query.zoneId = zoneId;

      rawReadings = await Telemetry.find(query)
        .sort({ recordedAt: 1 })
        .limit(1000);
    }
  } catch (err) {
    console.warn("Analytics DB query fallback:", err.message);
  }

  // Fallback to in-memory buffer if DB query returned few or no readings
  if (!rawReadings || rawReadings.length === 0) {
    const memData = dataStore.getTelemetry(stationCode, zoneId);
    const flattened = Array.isArray(memData) ? memData : Object.values(memData).flat();
    rawReadings = flattened
      .filter((r) => (!metric || r.metric === metric) && (!zoneId || r.zoneId === zoneId))
      .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
  }

  // Aggregate statistics per metric
  const summaryByMetric = {};
  for (const [mKey, meta] of Object.entries(METRICS_META)) {
    const series = rawReadings.filter((r) => r.metric === mKey);
    const values = series.map((r) => r.value);
    const count = values.length;
    const avg = count > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / count) * 10) / 10 : 0;
    const min = count > 0 ? Math.min(...values) : 0;
    const max = count > 0 ? Math.max(...values) : 0;
    const latest = count > 0 ? values[values.length - 1] : 0;

    let warningCount = 0;
    let criticalCount = 0;
    for (const r of series) {
      if (meta.threshold) {
        if (meta.invert) {
          if (meta.threshold.critical != null && r.value <= meta.threshold.critical) criticalCount++;
          else if (meta.threshold.warning != null && r.value <= meta.threshold.warning) warningCount++;
        } else {
          if (meta.threshold.critical != null && r.value >= meta.threshold.critical) criticalCount++;
          else if (meta.threshold.warning != null && r.value >= meta.threshold.warning) warningCount++;
        }
      }
    }

    summaryByMetric[mKey] = {
      label: meta.label,
      unit: meta.unit,
      nominalRange: meta.nominalRange,
      count,
      avg,
      min,
      max,
      latest,
      warningCount,
      criticalCount,
      anomalyRiskRatePct: count > 0 ? Math.round(((warningCount + criticalCount * 2) / count) * 100) : 0,
      recentSeries: series.slice(-30),
    };
  }

  // AI Prediction & Risk Assessment for this station
  const latestTelemetry = dataStore.getTelemetry(stationCode);
  const prediction = evaluateStationRisk(station, latestTelemetry);

  res.json({
    stationCode,
    stationName: station.name,
    timeframe,
    totalRecords: rawReadings.length,
    generatedAt: new Date(),
    summaryByMetric,
    prediction,
    readings: rawReadings.slice(-250), // Last 250 for detailed tabular view
  });
}

// Ingest telemetry (single or batch) from offline-first sync flush
export async function ingestTelemetry(req, res) {
  try {
    const { code } = req.params;
    const stationCode = code.toUpperCase();
    const rawPayload = req.body || [];
    const payload = Array.isArray(rawPayload) ? rawPayload : [rawPayload];

    const docs = payload
      .filter((r) => r && typeof r === "object")
      .map((r) => ({
        ...r,
        stationCode,
        zoneId: r.zoneId || "power-plant",
        metric: r.metric || "power_load_kw",
        value: typeof r.value === "number" ? r.value : parseFloat(r.value) || 0,
        syncedFromOffline: true,
        recordedAt: r.recordedAt ? new Date(r.recordedAt) : new Date(),
      }));

    if (docs.length > 0) {
      dataStore.pushTelemetry(stationCode, docs);

      // Attempt DB persist if connected
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          await Telemetry.insertMany(docs, { ordered: false });
        } catch (dbErr) {
          console.warn("DB telemetry insert notice:", dbErr.message);
        }
      }
    }

    res.status(201).json({ inserted: docs.length, readings: docs });
  } catch (err) {
    console.error("Telemetry ingestion exception:", err);
    res.status(500).json({ error: "Telemetry ingestion failed", message: err.message });
  }
}

// Real Hardware / IoT MQTT Field Gateway Ingestion Endpoint
export async function ingestMqttTelemetry(req, res) {
  try {
    const { stationCode = "MAITRI", zoneId = "power-plant", metric = "power_load_kw", value, deviceId } = req.body || {};
    const code = stationCode.toUpperCase();
    const numericValue = typeof value === "number" ? value : parseFloat(value) || 0;

    const doc = {
      stationCode: code,
      zoneId,
      metric,
      value: numericValue,
      deviceId: deviceId || "iot-field-gateway-01",
      recordedAt: new Date(),
      syncedFromOffline: false,
    };

    dataStore.pushTelemetry(code, [doc]);

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Telemetry.create(doc);
      } catch (err) {
        console.warn("MQTT DB insert notice:", err.message);
      }
    }

    res.status(201).json({ status: "success", ingested: doc });
  } catch (err) {
    res.status(500).json({ error: "IoT MQTT Ingestion Error", message: err.message });
  }
}


