// Client-Side Edge AI Risk & Telemetry Engine for Antarctic Digital Twin
// Runs autonomously when satellite connectivity drops, ensuring continuous live telemetry,
// degradation forecasting, zone status updates, and local persistence without server dependency.

const METRIC_PROFILES = {
  temperature_c: { base: -22, variance: 3, threshold: { warning: -35, critical: -45 }, invert: true },
  wind_speed_kmh: { base: 38, variance: 14, threshold: { warning: 80, critical: 120 } },
  power_load_kw: { base: 64, variance: 6, threshold: { warning: 85, critical: 95 } },
  generator_health_pct: { base: 94, variance: 3, threshold: { warning: 60, critical: 40 }, invert: true },
  battery_pct: { base: 82, variance: 4, threshold: { warning: 30, critical: 15 }, invert: true },
  fuel_flow_lph: { base: 14.5, variance: 2, threshold: { warning: 22, critical: 28 } },
  water_level_pct: { base: 74, variance: 5, threshold: { warning: 25, critical: 12 }, invert: true },
  internal_temp_c: { base: 20.5, variance: 1.2, threshold: { warning: 14, critical: 9 }, invert: true },
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

export function evaluateOfflineRisk(station, telemetryByZone) {
  const disasters = station?.activeDisasters || (station?.activeDisaster ? [station.activeDisaster] : []);
  const mitigation = station?.mitigationApplied;
  const stationName = station?.name || "Maitri Station";

  let riskScore = 8;
  let status = "nominal";
  let alert = null;
  let ttf = { minutes: null, formatted: "No critical risk (>72h stable buffer)" };
  let primaryThreat = "None (All edge subsystems operating within nominal safety envelope)";
  const rootCauses = [];
  const recommendations = [];

  if (disasters.length >= 2) {
    riskScore = 98;
    status = "critical";
    const disasterLabels = {
      battery_drain: "Battery Bank Rapid Drain",
      generator_failure: "Primary Diesel Gen #1 Stall",
      blizzard: "Katabatic Blizzard Storm",
      comms_blackout: "ISRO GSAT-30 SATCOM Uplink Severed",
      water_freeze: "Sub-zero Melt Intake Freeze",
    };
    const activeNames = disasters.map((d) => disasterLabels[d] || d);
    primaryThreat = `Multi-Vector Emergency: ${activeNames.join(" + ")}`;
    ttf = { minutes: 90, formatted: "1h 30m (Compound cascade failure window)" };
    alert = {
      level: "critical",
      title: `COMPOUND DUAL-CRISIS IN PROGRESS: ${activeNames.join(" & ")}`,
      message: `Simultaneous multi-subsystem failure detected. Edge AI managing parallel telemetry queues and emergency protocols.`,
    };

    if (disasters.includes("comms_blackout")) {
      rootCauses.push("ISRO GSAT-30 SATCOM link disconnected · Edge local mode active");
      recommendations.push({
        id: "mit_comms",
        protocol: "activate_deicing",
        label: "SOP-19: Activate Radome Thermal De-Icer & Aux HF Link",
        action: "mitigate",
        riskDelta: "-30%",
      });
    }
    if (disasters.includes("generator_failure")) {
      rootCauses.push("GenSet #1 health dropped to critical (18%) · Vibration spike");
      recommendations.push({
        id: "mit_gen",
        protocol: "switch_backup_gen",
        label: "SOP-08: Auto-Start Backup Diesel Generator #2",
        action: "mitigate",
        riskDelta: "-45%",
      });
    }
    if (disasters.includes("battery_drain")) {
      rootCauses.push("Inverter bus thermal overload · Rapid battery SOC depletion");
      recommendations.push({
        id: "mit_battery",
        protocol: "shed_load_aux_gen",
        label: "SOP-14: Shed Non-Essential Labs & Engage Aux GenSet",
        action: "mitigate",
        riskDelta: "-40%",
      });
    }
    if (disasters.includes("blizzard")) {
      rootCauses.push("Category 4 Katabatic wind gusts (145 km/h) & -52°C plunge");
      recommendations.push({
        id: "mit_storm",
        protocol: "storm_lockdown",
        label: "SOP-22: Full Polar Storm Lockdown & Trace Heating",
        action: "mitigate",
        riskDelta: "-35%",
      });
    }
    if (disasters.includes("water_freeze")) {
      rootCauses.push("Intake pipeline ice core build-up detected");
      recommendations.push({
        id: "mit_water",
        protocol: "melt_trace_heat",
        label: "SOP-31: Engage Thermal Trace Heating on Intake",
        action: "mitigate",
        riskDelta: "-30%",
      });
    }
  } else if (disasters.includes("battery_drain")) {
    if (mitigation === "shed_load_aux_gen") {
      riskScore = 28;
      status = "warning";
      primaryThreat = "Auxiliary GenSet in parallel · Load shed active";
      ttf = { minutes: 1440, formatted: "~24h stabilized buffer" };
      recommendations.push({
        id: "resolve_disaster",
        label: "Restore Normal Polar Grid Baseline",
        action: "resolve_disaster",
        riskDelta: "-20% (Normalize)",
      });
    } else {
      riskScore = 92;
      status = "critical";
      primaryThreat = "Severe Inverter Bus Thermal Runaway & Battery Depletion";
      ttf = { minutes: 260, formatted: "4h 20m remaining until habitat power drop" };
      rootCauses.push("Main Inverter Bank #1 thermal threshold breach (>68°C)");
      rootCauses.push("Battery state-of-charge draining at 12.4% / hr");
      alert = {
        level: "critical",
        title: "CRITICAL BATTERY BANK RAPID DRAIN & INVERTER OVERLOAD",
        message: "Predicted total station blackout in 4h 20m. AI Recommends immediate non-essential load shedding.",
      };
      recommendations.push({
        id: "mit_battery",
        protocol: "shed_load_aux_gen",
        label: "SOP-14: Shed Non-Essential Labs & Engage Aux GenSet",
        action: "mitigate",
        riskDelta: "-64% risk reduction",
      });
    }
  } else if (disasters.includes("generator_failure")) {
    if (mitigation === "switch_backup_gen") {
      riskScore = 22;
      status = "warning";
      primaryThreat = "Running on Backup Kirloskar Diesel Unit #2";
      ttf = { minutes: 2880, formatted: ">48h stable backup operation" };
      recommendations.push({
        id: "resolve_disaster",
        label: "Re-engage Primary GenSet Cluster",
        action: "resolve_disaster",
        riskDelta: "-14% (Normalize)",
      });
    } else {
      riskScore = 95;
      status = "critical";
      primaryThreat = "Primary Diesel Generator #1 Mechanical Stall";
      ttf = { minutes: 105, formatted: "1h 45m until reserve thermal collapse" };
      rootCauses.push("GenSet #1 health dropped to critical (18%)");
      rootCauses.push("High vibration spike & secondary fuel injector pressure drop");
      alert = {
        level: "critical",
        title: "PRIMARY DIESEL GENERATOR #1 STALL ANOMALY",
        message: "Predicted heat dissipation failure in 1h 45m. Auto-start protocol for Backup Diesel Gen #2 required.",
      };
      recommendations.push({
        id: "mit_gen",
        protocol: "switch_backup_gen",
        label: "SOP-08: Auto-Start Backup Diesel Generator #2",
        action: "mitigate",
        riskDelta: "-73% risk reduction",
      });
    }
  } else if (disasters.includes("blizzard")) {
    if (mitigation === "storm_lockdown") {
      riskScore = 32;
      status = "warning";
      primaryThreat = "Category 4 Blizzard · Habitat Thermal Barrier Active";
      ttf = { minutes: 2160, formatted: "36h lockdown structural buffer" };
      recommendations.push({
        id: "resolve_disaster",
        label: "Clear Blizzard Storm Warning",
        action: "resolve_disaster",
        riskDelta: "-24% (Normalize)",
      });
    } else {
      riskScore = 88;
      status = "critical";
      primaryThreat = "Category 4 Polar Katabatic Storm (145 km/h gusts & -52°C)";
      ttf = { minutes: 360, formatted: "6h 00m until external line freeze" };
      rootCauses.push("Wind velocity 142 km/h breaching structural design tolerances");
      rootCauses.push("Habitat envelope delta-T exceeding -50°C gradient");
      alert = {
        level: "critical",
        title: "CATEGORY 4 KATABATIC BLIZZARD INCOMING",
        message: "Predicted external service line freeze in 6 hours. Execute station storm lockdown protocol.",
      };
      recommendations.push({
        id: "mit_storm",
        protocol: "storm_lockdown",
        label: "SOP-22: Full Polar Storm Lockdown & Trace Heating",
        action: "mitigate",
        riskDelta: "-56% risk reduction",
      });
    }
  } else if (disasters.includes("comms_blackout")) {
    riskScore = 35;
    status = "warning";
    primaryThreat = "ISRO GSAT-30 / GSAT-14 Polar Uplink Lost · Autonomous Edge Mode Active";
    ttf = { minutes: 4320, formatted: ">72h autonomous operation buffer" };
    rootCauses.push("ISRO GSAT-30 SATCOM ground tracking dish iced or simulated offline");
    alert = {
      level: "warning",
      title: "ISRO GSAT-30 POLAR SATELLITE COMMS DROPOUT",
      message: "Autonomous Edge AI running locally. Local telemetry and mitigation actions cached in IndexedDB.",
    };
    recommendations.push({
      id: "resolve_disaster",
      label: "Restore GSAT Satellite Uplink Handshake",
      action: "resolve_disaster",
      riskDelta: "-27% (Normalize)",
    });
  } else if (disasters.includes("water_freeze")) {
    if (mitigation === "melt_trace_heat") {
      riskScore = 18;
      status = "nominal";
      primaryThreat = "Lake Melt Trace Heat Active · Fluid Flow Normal";
      ttf = { minutes: 4320, formatted: ">72h water supply intact" };
      recommendations.push({
        id: "resolve_disaster",
        label: "Reset Water System Baseline",
        action: "resolve_disaster",
        riskDelta: "-10% (Normalize)",
      });
    } else {
      riskScore = 78;
      status = "warning";
      primaryThreat = "Lake Melt Intake Sub-Zero Freeze Anomaly";
      ttf = { minutes: 1080, formatted: "18h reserve water capacity" };
      rootCauses.push("Intake pipeline ice core build-up detected");
      alert = {
        level: "warning",
        title: "GLACIAL LAKE MELT INTAKE LINE FREEZE",
        message: "Fresh water reserves declining. Engage high-voltage trace heating lines on intake duct.",
      };
      recommendations.push({
        id: "mit_water",
        protocol: "melt_trace_heat",
        label: "SOP-31: Engage Thermal Trace Heating on Intake",
        action: "mitigate",
        riskDelta: "-60% risk reduction",
      });
    }
  } else {
    recommendations.push({
      id: "routine_check",
      label: "Maintain Routine Polar Night Watch SOP",
      action: "none",
      riskDelta: "0%",
    });
  }

  // Generate 12-hour degradation curve
  const degradationCurve = [
    { timeOffset: "Now", stabilityPct: Math.max(5, 100 - riskScore), risk: riskScore },
    { timeOffset: "+2h", stabilityPct: Math.max(5, 100 - Math.min(100, Math.round(riskScore * 1.08))), risk: Math.min(100, Math.round(riskScore * 1.08)) },
    { timeOffset: "+4h", stabilityPct: Math.max(5, 100 - Math.min(100, Math.round(riskScore * 1.18))), risk: Math.min(100, Math.round(riskScore * 1.18)) },
    { timeOffset: "+8h", stabilityPct: Math.max(5, 100 - Math.min(100, Math.round(riskScore * 1.30))), risk: Math.min(100, Math.round(riskScore * 1.30)) },
    { timeOffset: "+12h", stabilityPct: Math.max(5, 100 - Math.min(100, Math.round(riskScore * 1.45))), risk: Math.min(100, Math.round(riskScore * 1.45)) },
    { timeOffset: "+24h", stabilityPct: Math.max(5, 100 - Math.min(100, Math.round(riskScore * 1.60))), risk: Math.min(100, Math.round(riskScore * 1.60)) },
  ];

  return {
    stationCode: station?.code || "MAITRI",
    stationName,
    evaluatedAt: new Date().toISOString(),
    status,
    riskScore,
    alert,
    timeToFailure: ttf,
    primaryThreat,
    rootCauses,
    degradationCurve,
    recommendations,
    activeDisaster: disasters[0] || null,
    activeDisasters: disasters,
    mitigationApplied: mitigation,
    isOfflineEdgeMode: true,
  };
}

export function generateOfflineTick(station, previousTelemetry = {}) {
  const stationCode = station?.code || "MAITRI";
  const disasters = station?.activeDisasters || (station?.activeDisaster ? [station.activeDisaster] : []);
  const mitigation = station?.mitigationApplied;
  const newByZone = { ...previousTelemetry };
  const flatReadings = [];

  const rawZones = station?.zones || [];
  const updatedZones = rawZones.map((z) => {
    let zoneStatus = "nominal";
    if (disasters.includes("battery_drain") && z.zoneId === "power-plant") {
      zoneStatus = mitigation === "shed_load_aux_gen" ? "warning" : "critical";
    }
    if (disasters.includes("generator_failure") && z.zoneId === "generator-shed") {
      zoneStatus = mitigation === "switch_backup_gen" ? "warning" : "critical";
    }
    if (disasters.includes("blizzard")) {
      if (z.zoneId === "living-quarters") zoneStatus = mitigation === "storm_lockdown" ? "warning" : "critical";
      if (z.zoneId === "comms-tower") zoneStatus = "warning";
    }
    if (disasters.includes("comms_blackout") && z.zoneId === "comms-tower") {
      zoneStatus = "critical";
    }
    if (disasters.includes("water_freeze") && z.zoneId === "water-plant") {
      zoneStatus = mitigation === "melt_trace_heat" ? "nominal" : "warning";
    }
    return { ...z, status: zoneStatus };
  });

  for (const zone of updatedZones) {
    const metricNames = ZONE_METRICS[zone.zoneId] || ["temperature_c"];
    if (!newByZone[zone.zoneId]) newByZone[zone.zoneId] = [];

    for (const metric of metricNames) {
      const profile = METRIC_PROFILES[metric];
      if (!profile) continue;

      let forcedValue = null;
      if (disasters.includes("battery_drain")) {
        if (metric === "battery_pct") forcedValue = mitigation === "shed_load_aux_gen" ? 64 + Math.random() * 2 : 48 - Math.random() * 8;
        if (metric === "power_load_kw") forcedValue = mitigation === "shed_load_aux_gen" ? 58 + Math.random() * 4 : 94 + Math.random() * 5;
      }
      if (disasters.includes("generator_failure")) {
        if (metric === "generator_health_pct") forcedValue = mitigation === "switch_backup_gen" ? 78 + Math.random() * 3 : 18 + Math.random() * 4;
        if (metric === "fuel_flow_lph") forcedValue = mitigation === "switch_backup_gen" ? 16 + Math.random() * 2 : 26 + Math.random() * 3;
      }
      if (disasters.includes("blizzard")) {
        if (metric === "wind_speed_kmh") forcedValue = 138 + Math.random() * 20;
        if (metric === "temperature_c") forcedValue = -52 - Math.random() * 6;
        if (metric === "internal_temp_c") forcedValue = mitigation === "storm_lockdown" ? 20.2 + Math.random() * 1 : 14.5 - Math.random() * 3;
      }
      if (disasters.includes("water_freeze")) {
        if (metric === "water_level_pct") forcedValue = mitigation === "melt_trace_heat" ? 72 + Math.random() * 2 : 22 - Math.random() * 4;
      }

      const spread = (Math.random() - 0.5) * profile.variance;
      const val = forcedValue !== null ? forcedValue : profile.base + spread;
      const rounded = Math.round(val * 10) / 10;

      const reading = {
        stationCode,
        zoneId: zone.zoneId,
        metric,
        value: rounded,
        threshold: profile.threshold,
        recordedAt: new Date().toISOString(),
        syncedFromOffline: true,
      };

      newByZone[zone.zoneId].push(reading);
      if (newByZone[zone.zoneId].length > 30) {
        newByZone[zone.zoneId].shift();
      }
      flatReadings.push(reading);
    }
  }

  const updatedStation = {
    ...station,
    zones: updatedZones,
    activeDisasters: disasters,
  };

  const prediction = evaluateOfflineRisk(updatedStation, newByZone);

  return {
    station: updatedStation,
    telemetryByZone: newByZone,
    flatReadings,
    prediction,
  };
}

