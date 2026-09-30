import Station from "../models/Station.js";
import Telemetry from "../models/Telemetry.js";
import dataStore from "./dataStore.js";

// Realistic Antarctic profiles
const METRIC_PROFILES = {
  temperature_c: { base: -22, variance: 4, threshold: { warning: -35, critical: -45 }, invert: true },
  wind_speed_kmh: { base: 38, variance: 18, threshold: { warning: 80, critical: 120 } },
  power_load_kw: { base: 64, variance: 8, threshold: { warning: 85, critical: 95 } },
  generator_health_pct: { base: 94, variance: 4, threshold: { warning: 60, critical: 40 }, invert: true },
  battery_pct: { base: 82, variance: 6, threshold: { warning: 30, critical: 15 }, invert: true },
  fuel_flow_lph: { base: 14.5, variance: 2.5, threshold: { warning: 22, critical: 28 } },
  water_level_pct: { base: 74, variance: 8, threshold: { warning: 25, critical: 12 }, invert: true },
  internal_temp_c: { base: 20.5, variance: 1.5, threshold: { warning: 14, critical: 9 }, invert: true },
};

const ZONE_METRICS = {
  "power-plant": ["power_load_kw", "battery_pct"],
  "generator-shed": ["generator_health_pct", "fuel_flow_lph"],
  "fuel-depot": ["fuel_flow_lph"],
  "living-quarters": ["internal_temp_c", "temperature_c", "wind_speed_kmh"],
  "research-lab": ["internal_temp_c", "power_load_kw"],
  "comms-tower": ["power_load_kw", "wind_speed_kmh"],
  "medical-bay": ["internal_temp_c"],
  "supply-storage": ["temperature_c"],
  "water-plant": ["water_level_pct"],
};

function randomWalk(profile, disasterModifier = 0) {
  const spread = (Math.random() - 0.5) * profile.variance;
  const val = profile.base + spread + disasterModifier;
  return Math.round(val * 10) / 10;
}

export async function generateTick() {
  const stations = dataStore.getStations();
  const allInserts = [];

  for (const station of stations) {
    const code = station.code;
    const disasters = station.activeDisasters || (station.activeDisaster ? [station.activeDisaster] : []);
    const mitigation = station.mitigationApplied;

    // Skip if simulated offline to preserve visual disconnect honesty
    if (station.connectivity.status === "offline") {
      continue;
    }

    const stationInserts = [];

    // Evaluate zone metrics with disaster states
    for (const zone of station.zones) {
      const metricNames = ZONE_METRICS[zone.zoneId] || ["temperature_c"];
      let zoneWorstStatus = "nominal";

      for (const metric of metricNames) {
        const profile = METRIC_PROFILES[metric];
        if (!profile) continue;

        let modifier = 0;
        let forcedValue = null;

        // Apply disaster dynamics (can apply multiple simultaneously)
        if (disasters.includes("battery_drain")) {
          if (metric === "battery_pct") {
            forcedValue = mitigation === "shed_load_aux_gen" ? 64 + Math.random() * 2 : 48 - Math.random() * 8;
          }
          if (metric === "power_load_kw") {
            forcedValue = mitigation === "shed_load_aux_gen" ? 58 + Math.random() * 4 : 94 + Math.random() * 5;
          }
        }
        if (disasters.includes("generator_failure")) {
          if (metric === "generator_health_pct") {
            forcedValue = mitigation === "switch_backup_gen" ? 78 + Math.random() * 3 : 18 + Math.random() * 4;
          }
          if (metric === "fuel_flow_lph") {
            forcedValue = mitigation === "switch_backup_gen" ? 16 + Math.random() * 2 : 26 + Math.random() * 3;
          }
        }
        if (disasters.includes("blizzard")) {
          if (metric === "wind_speed_kmh") {
            forcedValue = 138 + Math.random() * 20;
          }
          if (metric === "temperature_c") {
            forcedValue = -52 - Math.random() * 6;
          }
          if (metric === "internal_temp_c") {
            forcedValue = mitigation === "storm_lockdown" ? 20.2 + Math.random() * 1 : 14.5 - Math.random() * 3;
          }
        }
        if (disasters.includes("water_freeze")) {
          if (metric === "water_level_pct") {
            forcedValue = mitigation === "melt_trace_heat" ? 72 + Math.random() * 2 : 22 - Math.random() * 4;
          }
        }

        const value = forcedValue !== null ? Math.round(forcedValue * 10) / 10 : randomWalk(profile, modifier);

        // Derive threshold
        let status = "nominal";
        if (profile.threshold) {
          if (profile.invert) {
            if (profile.threshold.critical != null && value <= profile.threshold.critical) status = "critical";
            else if (profile.threshold.warning != null && value <= profile.threshold.warning) status = "warning";
          } else {
            if (profile.threshold.critical != null && value >= profile.threshold.critical) status = "critical";
            else if (profile.threshold.warning != null && value >= profile.threshold.warning) status = "warning";
          }
        }

        const rank = { nominal: 0, warning: 1, critical: 2, offline: 3 };
        if (rank[status] > rank[zoneWorstStatus]) {
          zoneWorstStatus = status;
        }

        stationInserts.push({
          stationCode: code,
          zoneId: zone.zoneId,
          metric,
          value,
          threshold: profile.threshold,
          recordedAt: new Date(),
        });
      }

      // If comms blackout disaster active
      if (disasters.includes("comms_blackout") && zone.zoneId === "comms-tower") {
        zoneWorstStatus = "critical";
      }

      // Update zone status
      zone.status = zoneWorstStatus;
    }

    // Push into in-memory buffer
    dataStore.pushTelemetry(code, stationInserts);
    allInserts.push(...stationInserts);

    // If MongoDB is connected, attempt persistence asynchronously
    try {
      if (Telemetry && Telemetry.db && Telemetry.db.readyState === 1) {
        Telemetry.insertMany(stationInserts).catch(() => {});
        Station.findOneAndUpdate(
          { code },
          { zones: station.zones, "connectivity.lastSyncedAt": new Date() }
        ).catch(() => {});
      }
    } catch {
      // safe in-memory fallback
    }
  }

  return allInserts.length;
}

let simulatorTimer = null;

export async function seedInitialHistory() {
  // Generate 10 past ticks spaced by 30 seconds for rich sparkline history
  const now = Date.now();
  for (let i = 10; i >= 1; i--) {
    const historicalTime = new Date(now - i * 30000);
    const stations = dataStore.getStations();
    for (const station of stations) {
      const code = station.code;
      const stationInserts = [];
      for (const zone of station.zones) {
        const metricNames = ZONE_METRICS[zone.zoneId] || ["temperature_c"];
        for (const metric of metricNames) {
          const profile = METRIC_PROFILES[metric];
          if (!profile) continue;
          const value = randomWalk(profile);
          stationInserts.push({
            stationCode: code,
            zoneId: zone.zoneId,
            metric,
            value,
            threshold: profile.threshold,
            recordedAt: historicalTime,
          });
        }
      }
      dataStore.pushTelemetry(code, stationInserts);
    }
  }
  // Generate current tick
  await generateTick().catch(() => {});
}

export function startSimulator(intervalMs = 3000) {
  if (simulatorTimer) clearInterval(simulatorTimer);
  // Seed history and run first tick immediately
  seedInitialHistory().catch((e) => console.warn("Simulator initial seed err:", e.message));
  simulatorTimer = setInterval(() => {
    generateTick().catch((e) => console.warn("Simulator tick err:", e.message));
  }, intervalMs);
  return simulatorTimer;
}

export function stopSimulator() {
  if (simulatorTimer) {
    clearInterval(simulatorTimer);
    simulatorTimer = null;
  }
}

