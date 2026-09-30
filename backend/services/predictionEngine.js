// AI Prediction & Risk Engine for Antarctic Stations
// Evaluates real-time telemetry streams, component thermal/mechanical dynamics,
// and environmental forecasts to answer: "What could go wrong NEXT?"

export function evaluateStationRisk(station, latestTelemetry = {}) {
  const code = station.code.toUpperCase();
  const disasters = station.activeDisasters || (station.activeDisaster ? [station.activeDisaster] : []);
  const mitigation = station.mitigationApplied;

  // Baseline nominal prediction
  let riskScore = 8; // 8% nominal base
  let status = "nominal";
  let alert = null;
  let ttfMinutes = null;
  let ttfFormatted = "No critical risk detected (>72h reserve)";
  let primaryThreat = "None (Station operating within nominal polar envelope)";
  let rootCauses = [];
  let degradationCurve = [];
  let recommendations = [];

  // Inspect recent telemetry values
  const powerReadings = latestTelemetry["power-plant"] || [];
  const genReadings = latestTelemetry["generator-shed"] || [];
  const waterReadings = latestTelemetry["water-plant"] || [];
  const quartersReadings = latestTelemetry["living-quarters"] || [];

  const latestBattery = powerReadings.find((r) => r.metric === "battery_pct")?.value ?? 84;
  const latestLoad = powerReadings.find((r) => r.metric === "power_load_kw")?.value ?? 62;
  const latestGenHealth = genReadings.find((r) => r.metric === "generator_health_pct")?.value ?? 94;
  const latestTemp = quartersReadings.find((r) => r.metric === "temperature_c")?.value ?? -22;
  const latestInternalTemp = quartersReadings.find((r) => r.metric === "internal_temp_c")?.value ?? 20.4;
  const latestWater = waterReadings.find((r) => r.metric === "water_level_pct")?.value ?? 78;

  // Multi-Disaster Compound Assessment (e.g. Satellite Drop + Generator Failure simultaneously)
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
    
    alert = {
      level: "critical",
      title: `🚨 COMPOUND DUAL-CRISIS IN PROGRESS: ${activeNames.join(" & ")}`,
      message: `Simultaneous multi-subsystem failure detected at ${code}. Autonomous Edge AI coordinating parallel mitigation SOPs. Immediate commander intervention mandatory.`,
      time: new Date(),
    };

    ttfMinutes = 90;
    ttfFormatted = "1h 30m (Compound cascade failure window)";
    primaryThreat = `Multi-Vector Emergency: ${activeNames.join(" + ")}`;

    if (disasters.includes("comms_blackout")) {
      rootCauses.push("ISRO GSAT-30 / GSAT-14 SATCOM downlink offline · Local Edge mode buffering in IndexedDB");
      recommendations.push({
        id: "activate_deicing",
        label: "SOP 09-C: Activate Radome Thermal De-Icer & Aux HF Link",
        action: "apply_mitigation",
        protocol: "activate_deicing",
        riskDelta: "-30%",
      });
    }
    if (disasters.includes("generator_failure")) {
      rootCauses.push("Diesel Generator #1 bearing seizure & vibration spike (18% output health)");
      recommendations.push({
        id: "switch_backup_gen",
        label: "SOP 02-B: Engage Backup Kirloskar Diesel Gen #2",
        action: "apply_mitigation",
        protocol: "switch_backup_gen",
        riskDelta: "-45%",
      });
    }
    if (disasters.includes("battery_drain")) {
      rootCauses.push("Inverter bus thermal overload · Rapid battery SOC depletion");
      recommendations.push({
        id: "shed_load_aux_gen",
        label: "SOP 04-A: Shed Non-Essential Loads & Start Aux Gen",
        action: "apply_mitigation",
        protocol: "shed_load_aux_gen",
        riskDelta: "-40%",
      });
    }
    if (disasters.includes("blizzard")) {
      rootCauses.push("Category 4 Katabatic wind gusts (145 km/h) & -52°C exterior thermal plunge");
      recommendations.push({
        id: "storm_lockdown",
        label: "SOP 07-S: Full Station Blizzard Lockdown & Shutter Seal",
        action: "apply_mitigation",
        protocol: "storm_lockdown",
        riskDelta: "-35%",
      });
    }
    if (disasters.includes("water_freeze")) {
      rootCauses.push("Glacial melt intake line blocked by sub-zero ice accumulation");
      recommendations.push({
        id: "melt_trace_heat",
        label: "SOP 05-W: Energize Auxiliary Glycol Trace Heat Exchanger",
        action: "apply_mitigation",
        protocol: "melt_trace_heat",
        riskDelta: "-30%",
      });
    }

    degradationCurve = [
      { timeOffset: "Now", gridStability: 28, risk: 98 },
      { timeOffset: "+30m", gridStability: 18, risk: 99 },
      { timeOffset: "+1h", gridStability: 8, risk: 100 },
      { timeOffset: "+1h30m", gridStability: 0, risk: 100 },
    ];
  }

  // Single Disaster Cases
  else if (disasters.includes("battery_drain")) {
    if (mitigation === "shed_load_aux_gen") {
      riskScore = 32;
      status = "warning";
      alert = {
        level: "warning",
        title: "⚡ MITIGATION ACTIVE: Aux Gen #2 Online, Non-Essential Loads Shed",
        message: "Battery discharge stabilized at 2.1 kW. Buffer extended by +9h 15m. Grid load normalized.",
        time: new Date(),
      };
      ttfMinutes = 580;
      ttfFormatted = "9h 40m (Stabilized by Aux Gen #2)";
      primaryThreat = "Auxiliary Gen Fuel Consumption Rate Elevated";
      rootCauses = [
        "Primary battery bank isolating cell #4",
        "Load shed active: Laboratory & secondary heat coils unpowered",
        "Estimated fuel burn increased +12 L/h on Gen #2",
      ];
      recommendations = [
        {
          id: "restore_nominal",
          label: "Cold-restart Primary Battery Inverter (Reset)",
          action: "resolve_disaster",
          riskDelta: "-24%",
        },
      ];
      degradationCurve = [
        { timeOffset: "Now", battery: Math.round(latestBattery), risk: 32 },
        { timeOffset: "+1h", battery: Math.max(15, Math.round(latestBattery - 2)), risk: 30 },
        { timeOffset: "+2h", battery: Math.max(15, Math.round(latestBattery - 4)), risk: 28 },
        { timeOffset: "+4h", battery: Math.max(15, Math.round(latestBattery - 7)), risk: 26 },
        { timeOffset: "+6h", battery: Math.max(15, Math.round(latestBattery - 10)), risk: 25 },
        { timeOffset: "+12h", battery: Math.max(15, Math.round(latestBattery - 14)), risk: 22 },
      ];
    } else {
      riskScore = 94;
      status = "critical";
      alert = {
        level: "critical",
        title: "🚨 CRITICAL ALERT: Rapid Battery Depletion Detected",
        message: "Battery is predicted to reach critical level in 4h 20m. Main Power Inverter experiencing high thermal load.",
        time: new Date(),
      };
      ttfMinutes = 260; // 4h 20m
      ttfFormatted = "4h 20m";
      primaryThreat = "Total Station Power Loss (Habitat Blackout & Freeze Threat)";
      rootCauses = [
        "Inverter Bus Phase B overload (89 kW draw)",
        "Ambient sub-cooling (-38°C) degraded chemical cell efficiency by 42%",
        "Unmitigated depletion rate: -14.8% SOC per hour",
      ];
      recommendations = [
        {
          id: "shed_load_aux_gen",
          label: "Execute SOP 04-A: Shed Non-Essential Loads & Start Aux Gen #2",
          action: "apply_mitigation",
          protocol: "shed_load_aux_gen",
          riskDelta: "-62% (Extends buffer to +9h 40m)",
        },
        {
          id: "isolate_lab",
          label: "Emergency Isolate Lab & Cryo Sensors",
          action: "apply_mitigation",
          protocol: "isolate_lab",
          riskDelta: "-35%",
        },
      ];
      degradationCurve = [
        { timeOffset: "Now", battery: 52, risk: 94 },
        { timeOffset: "+1h", battery: 38, risk: 96 },
        { timeOffset: "+2h", battery: 26, risk: 98 },
        { timeOffset: "+4h", battery: 14, risk: 100 },
        { timeOffset: "+4h20m", battery: 10, risk: 100 },
        { timeOffset: "+6h", battery: 2, risk: 100 },
      ];
    }
  }

  // Case 2: Active or Simulated Disaster - GENERATOR FAILURE
  else if (disasters.includes("generator_failure")) {
    if (mitigation === "switch_backup_gen") {
      riskScore = 28;
      status = "warning";
      alert = {
        level: "warning",
        title: "⚙️ MITIGATION ACTIVE: Backup Diesel Gen #3 Engaged",
        message: "Primary Gen #1 isolated. Gen #3 running at 1500 RPM. Power bus synced.",
        time: new Date(),
      };
      ttfMinutes = 720;
      ttfFormatted = "12h 00m (Stable on Backup Gen)";
      primaryThreat = "Gen #3 Operating Near Continuous Rated Capacity";
      rootCauses = [
        "Primary Gen #1 turbocharger bearing failure",
        "Backup Gen #3 carrying 84% station electrical & heating demand",
      ];
      recommendations = [
        {
          id: "restore_nominal",
          label: "Clear Alarm & Finalize Maintenance Handover",
          action: "resolve_disaster",
          riskDelta: "-20%",
        },
      ];
      degradationCurve = [
        { timeOffset: "Now", genHealth: 60, risk: 28 },
        { timeOffset: "+1h", genHealth: 62, risk: 26 },
        { timeOffset: "+2h", genHealth: 64, risk: 25 },
        { timeOffset: "+4h", genHealth: 65, risk: 24 },
        { timeOffset: "+6h", genHealth: 65, risk: 22 },
        { timeOffset: "+12h", genHealth: 65, risk: 20 },
      ];
    } else {
      riskScore = 91;
      status = "critical";
      alert = {
        level: "critical",
        title: "🚨 CRITICAL ALERT: Main Diesel Generator #1 Mechanical Failure",
        message: "Generator health collapsed to 18%. High vibration & oil pressure drop. Grid collapse in 1h 45m.",
        time: new Date(),
      };
      ttfMinutes = 105;
      ttfFormatted = "1h 45m";
      primaryThreat = "Primary Power Grid Trip & Diesel Fuel Gel in Lines";
      rootCauses = [
        "Mechanical friction spike detected: Vibration @ 8.4 mm/s (Warning > 3.0)",
        "Oil viscosity spike from -44°C cold soak",
        "Station power drawing directly from emergency battery buffer",
      ];
      recommendations = [
        {
          id: "switch_backup_gen",
          label: "Execute SOP 02-B: Engage Backup Diesel Generator #3",
          action: "apply_mitigation",
          protocol: "switch_backup_gen",
          riskDelta: "-63% (Restores 12h full operational stability)",
        },
      ];
      degradationCurve = [
        { timeOffset: "Now", genHealth: 18, risk: 91 },
        { timeOffset: "+30m", genHealth: 12, risk: 95 },
        { timeOffset: "+1h", genHealth: 6, risk: 98 },
        { timeOffset: "+1h45m", genHealth: 0, risk: 100 },
        { timeOffset: "+4h", genHealth: 0, risk: 100 },
      ];
    }
  }

  // Case 3: Active or Simulated Disaster - POLAR BLIZZARD / KATABATIC STORM
  else if (disasters.includes("blizzard")) {
    if (mitigation === "storm_lockdown") {
      riskScore = 40;
      status = "warning";
      alert = {
        level: "warning",
        title: "⚡ MITIGATION ACTIVE: Station Storm Lockdown Engaged",
        message: "Katabatic shutters locked, solar arrays retracted, exterior vents sealed. Thermal integrity preserved.",
        time: new Date(),
      };
      ttfMinutes = 1440;
      ttfFormatted = "24h 00m (Lockdown Buffer)";
      primaryThreat = "Severe Wind Gusts (148 km/h) & Antenna Tower Drift";
      rootCauses = [
        "Category 4 Polar Storm front active over Queen Maud / Larsemann hills",
        "Exterior temp -54°C, Wind Chill -72°C",
      ];
      recommendations = [
        {
          id: "restore_nominal",
          label: "De-escalate Storm Protocol (When Winds Drop < 50 km/h)",
          action: "resolve_disaster",
          riskDelta: "-32%",
        },
      ];
      degradationCurve = [
        { timeOffset: "Now", windKmh: 135, temp: -52, risk: 40 },
        { timeOffset: "+2h", windKmh: 142, temp: -53, risk: 42 },
        { timeOffset: "+4h", windKmh: 128, temp: -50, risk: 36 },
        { timeOffset: "+8h", windKmh: 95, temp: -44, risk: 28 },
        { timeOffset: "+12h", windKmh: 62, temp: -35, risk: 20 },
      ];
    } else {
      riskScore = 88;
      status = "critical";
      alert = {
        level: "critical",
        title: "🚨 CRITICAL ALERT: Extreme Katabatic Blizzard Incoming",
        message: "Wind speed 145 km/h with -52°C plunge. Habitation heat loss predicted in 3h 10m without storm seal.",
        time: new Date(),
      };
      ttfMinutes = 190;
      ttfFormatted = "3h 10m";
      primaryThreat = "Structural Envelope Breaches & Comms Tower Ice Overload";
      rootCauses = [
        "Katabatic wind velocity surging @ 145 km/h",
        "Exterior temperature dropped -26°C in 45 minutes",
        "Heat trace coils in Living Quarters reaching 96% maximum heating load",
      ];
      recommendations = [
        {
          id: "storm_lockdown",
          label: "Execute SOP 07-S: Full Station Blizzard Lockdown & Shutter Seal",
          action: "apply_mitigation",
          protocol: "storm_lockdown",
          riskDelta: "-48% (Preserves internal +21°C habitat heat)",
        },
      ];
      degradationCurve = [
        { timeOffset: "Now", windKmh: 135, internalTemp: 19.8, risk: 88 },
        { timeOffset: "+1h", windKmh: 145, internalTemp: 16.2, risk: 92 },
        { timeOffset: "+2h", windKmh: 152, internalTemp: 12.0, risk: 96 },
        { timeOffset: "+3h10m", windKmh: 158, internalTemp: 7.5, risk: 100 },
        { timeOffset: "+6h", windKmh: 160, internalTemp: 2.0, risk: 100 },
      ];
    }
  }

  // Case 4: Active or Simulated Disaster - SATELLITE COMMS BLACKOUT (ISRO GSAT-30 / GSAT-14)
  else if (disasters.includes("comms_blackout")) {
    riskScore = 65;
    status = "warning";
    alert = {
      level: "warning",
      title: "📡 CRITICAL COMMS ALERT: ISRO GSAT-30 / GSAT-14 SATCOM Uplink Severed",
      message: "Direct GSAT-30 polar footprint link lost. Station operating autonomously via Offline-First Edge AI Sync Layer.",
      time: new Date(),
    };
    ttfMinutes = null;
    ttfFormatted = "Autonomous Mode Active (IndexedDB queueing)";
    primaryThreat = "Telemetry Telecommand Isolation from ISRO / NCPOR Goa Command";
    rootCauses = [
      "Heavy snow accumulation on 4.5m tracking radome dish",
      "Azimuth gimbal frozen at 142.6° tracking GSAT-30 transponder",
      "Offline sync layer capturing all local incidents, SOS, and sensor writes",
    ];
    recommendations = [
      {
        id: "activate_deicing",
        label: "Execute SOP 09-C: Activate Radome Thermal De-Icer & Aux HF Link",
        action: "apply_mitigation",
        protocol: "activate_deicing",
        riskDelta: "-45%",
      },
      {
        id: "restore_nominal",
        label: "Recalibrate SATCOM & Flush Offline Telemetry Queue",
        action: "resolve_disaster",
        riskDelta: "-55%",
      },
    ];
    degradationCurve = [
      { timeOffset: "Now", latencyMs: 9999, queueWrites: 12, risk: 65 },
      { timeOffset: "+1h", latencyMs: 9999, queueWrites: 48, risk: 68 },
      { timeOffset: "+2h", latencyMs: 9999, queueWrites: 96, risk: 70 },
      { timeOffset: "+6h", latencyMs: 9999, queueWrites: 280, risk: 75 },
    ];
  }

  // Case 5: Active or Simulated Disaster - WATER INTAKE FREEZE
  else if (disasters.includes("water_freeze")) {
    if (mitigation === "melt_trace_heat") {
      riskScore = 22;
      status = "nominal";
      alert = {
        level: "info",
        title: "💧 MITIGATION ACTIVE: Thermal Melt Trace Line Energized",
        message: "Lake melt intake unfrozen. Fresh water flow restored to 32 L/min.",
        time: new Date(),
      };
      ttfMinutes = 2880;
      ttfFormatted = "48h+ (Water Intake Restored)";
      primaryThreat = "None (Reservoir refilling nominal)";
      recommendations = [
        {
          id: "restore_nominal",
          label: "Reset Water Plant Alarm State",
          action: "resolve_disaster",
          riskDelta: "-14%",
        },
      ];
      degradationCurve = [
        { timeOffset: "Now", waterReserveL: 16000, risk: 22 },
        { timeOffset: "+2h", waterReserveL: 17200, risk: 18 },
        { timeOffset: "+6h", waterReserveL: 18400, risk: 12 },
      ];
    } else {
      riskScore = 78;
      status = "warning";
      alert = {
        level: "warning",
        title: "💧 CRITICAL ALERT: Lake Melt Intake Line Freezing Detected",
        message: "Intake flow dropped to 0 L/min. Water treatment reserve will deplete in 18h 30m at current crew draw.",
        time: new Date(),
      };
      ttfMinutes = 1110;
      ttfFormatted = "18h 30m";
      primaryThreat = "Station Water Shortage & Habitat Sanitation Freeze";
      rootCauses = [
        "Schirmacher / Larsemann surface ice depth +18cm",
        "Intake pipe heating element circuit #2 tripped",
        "Reserve dropping at 42 L/hr",
      ];
      recommendations = [
        {
          id: "melt_trace_heat",
          label: "Execute SOP 05-W: Energize Auxiliary Glycol Heat Exchanger",
          action: "apply_mitigation",
          protocol: "melt_trace_heat",
          riskDelta: "-56% (Thaws intake in 15 mins)",
        },
      ];
      degradationCurve = [
        { timeOffset: "Now", waterReserveL: 16000, risk: 78 },
        { timeOffset: "+4h", waterReserveL: 13500, risk: 82 },
        { timeOffset: "+8h", waterReserveL: 10000, risk: 88 },
        { timeOffset: "+14h", waterReserveL: 4500, risk: 95 },
        { timeOffset: "+18h30m", waterReserveL: 200, risk: 100 },
      ];
    }
  }

  // Case 6: Baseline Nominal Operations (Predictive check on raw telemetry)
  else {
    // Check if any telemetry is drifting towards thresholds
    if (latestBattery < 65) {
      riskScore = 45;
      status = "warning";
      primaryThreat = "Moderate Battery Degradation Drift";
      ttfFormatted = "14h 30m at current draw";
    } else if (latestGenHealth < 75) {
      riskScore = 42;
      status = "warning";
      primaryThreat = "Generator #1 Filter Silt Accumulation";
      ttfFormatted = "22h until scheduled overhaul needed";
    } else {
      riskScore = 8;
      status = "nominal";
      primaryThreat = "None (All systems nominal)";
      ttfFormatted = "No critical risk (>72h stable buffer)";
    }

    degradationCurve = [
      { timeOffset: "Now", stabilityPct: 98, risk: riskScore },
      { timeOffset: "+2h", stabilityPct: 97, risk: riskScore },
      { timeOffset: "+4h", stabilityPct: 96, risk: riskScore + 1 },
      { timeOffset: "+8h", stabilityPct: 95, risk: riskScore + 2 },
      { timeOffset: "+12h", stabilityPct: 94, risk: riskScore + 3 },
      { timeOffset: "+24h", stabilityPct: 92, risk: riskScore + 5 },
    ];

    recommendations = [
      {
        id: "routine_check",
        label: "Maintain Routine Polar Night Watch SOP",
        action: "none",
        riskDelta: "0%",
      },
    ];
  }

  return {
    stationCode: code,
    stationName: station.name,
    evaluatedAt: new Date(),
    status,
    riskScore, // 0 to 100
    alert,
    timeToFailure: {
      minutes: ttfMinutes,
      formatted: ttfFormatted,
    },
    primaryThreat,
    rootCauses,
    degradationCurve,
    recommendations,
    activeDisaster: disasters[0] || null,
    activeDisasters: disasters,
    mitigationApplied: mitigation,
  };
}
