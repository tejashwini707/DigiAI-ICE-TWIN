export const DEFAULT_STATIONS = {
  MAITRI: {
    code: "MAITRI",
    name: "Maitri Station",
    location: { lat: -70.7669, lng: 11.7333, region: "Schirmacher Oasis, Queen Maud Land" },
    commissioned: 1989,
    crewCapacity: 25,
    elevation: "117m",
    connectivity: { status: "online", lastSyncedAt: new Date().toISOString(), latencyMs: 340, signalQuality: "Good (92%)" },
    activeDisaster: null,
    mitigationApplied: null,
    zones: [
      { zoneId: "power-plant", label: "Power Plant (Main Grid)", type: "power", status: "nominal", loadKw: 64, capacityKw: 120, tempC: 22 },
      { zoneId: "generator-shed", label: "Generator Shed (Diesel #1/#2)", type: "generator", status: "nominal", healthPct: 94, rpm: 1500, vibrationMm: 1.2 },
      { zoneId: "fuel-depot", label: "Fuel Depot (Polar Diesel & ATF)", type: "fuel", status: "nominal", flowLph: 14.2, tempC: -8, leakDetected: false },
      { zoneId: "living-quarters", label: "Living Quarters (Habitat Block)", type: "habitat", status: "nominal", internalTempC: 20.4, co2Ppm: 540, humidityPct: 38 },
      { zoneId: "research-lab", label: "Research Laboratory & Earth Sensors", type: "lab", status: "nominal", internalTempC: 19.8, activeExperiments: 6 },
      { zoneId: "comms-tower", label: "Satellite Comms & Nav Array", type: "comms", status: "nominal", signalDb: -68, iceLoadPct: 5 },
      { zoneId: "medical-bay", label: "Medical Bay & Hyperbaric Unit", type: "medical", status: "nominal", internalTempC: 21.5, o2SupplyPct: 98 },
      { zoneId: "supply-storage", label: "Supply Storage & Cryo Storage", type: "storage", status: "nominal", tempC: -5.0, doorSealed: true },
      { zoneId: "water-plant", label: "Water Treatment & Melt Intake", type: "water", status: "nominal", reserveLitres: 18400, flowRateLpm: 35, freezeAlert: false },
    ],
  },
  BHARATI: {
    code: "BHARATI",
    name: "Bharati Station",
    location: { lat: -69.4082, lng: 76.1911, region: "Larsemann Hills, East Antarctica" },
    commissioned: 2012,
    crewCapacity: 47,
    elevation: "35m (Coastal Hill)",
    connectivity: { status: "online", lastSyncedAt: new Date().toISOString(), latencyMs: 290, signalQuality: "Optimal (98%)" },
    activeDisaster: null,
    mitigationApplied: null,
    zones: [
      { zoneId: "power-plant", label: "Combined Heat & Power (CHP)", type: "power", status: "nominal", loadKw: 88, capacityKw: 200, tempC: 24 },
      { zoneId: "generator-shed", label: "GenSet Cluster (Kirloskar 3x)", type: "generator", status: "nominal", healthPct: 96, rpm: 1500, vibrationMm: 0.9 },
      { zoneId: "fuel-depot", label: "Automated Fuel Storage", type: "fuel", status: "nominal", flowLph: 18.5, tempC: -4, leakDetected: false },
      { zoneId: "living-quarters", label: "Modular Habitat & Mess", type: "habitat", status: "nominal", internalTempC: 21.0, co2Ppm: 490, humidityPct: 42 },
      { zoneId: "research-lab", label: "Oceanography & Atmospheric Lab", type: "lab", status: "nominal", internalTempC: 20.2, activeExperiments: 11 },
      { zoneId: "comms-tower", label: "High-Gain Polar Ground Station", type: "comms", status: "nominal", signalDb: -62, iceLoadPct: 2 },
      { zoneId: "medical-bay", label: "Telemedicine & Surgical Facility", type: "medical", status: "nominal", internalTempC: 22.0, o2SupplyPct: 100 },
      { zoneId: "supply-storage", label: "Automated Container Warehouse", type: "storage", status: "nominal", tempC: -4.0, doorSealed: true },
      { zoneId: "water-plant", label: "Desalination & Lake Melt Plant", type: "water", status: "nominal", reserveLitres: 29000, flowRateLpm: 60, freezeAlert: false },
    ],
  },
  DAKSHIN_GANGOTRI: {
    code: "DAKSHIN_GANGOTRI",
    name: "Dakshin Gangotri Post",
    location: { lat: -70.0833, lng: 12.0000, region: "Princess Astrid Coast, Ice Shelf" },
    commissioned: 1983,
    crewCapacity: 12,
    elevation: "0m (Ice Shelf)",
    connectivity: { status: "online", lastSyncedAt: new Date().toISOString(), latencyMs: 410, signalQuality: "Good (88%)" },
    activeDisaster: null,
    mitigationApplied: null,
    zones: [
      { zoneId: "power-plant", label: "Solar-Wind-Diesel Microgrid", type: "power", status: "nominal", loadKw: 38, capacityKw: 75, tempC: 18 },
      { zoneId: "generator-shed", label: "Automated Kirloskar GenSet", type: "generator", status: "nominal", healthPct: 92, rpm: 1500, vibrationMm: 1.1 },
      { zoneId: "fuel-depot", label: "Deep Ice Fuel Vault", type: "fuel", status: "nominal", flowLph: 9.8, tempC: -14, leakDetected: false },
      { zoneId: "living-quarters", label: "Sub-Ice Observation Pod", type: "habitat", status: "nominal", internalTempC: 19.5, co2Ppm: 510, humidityPct: 35 },
      { zoneId: "research-lab", label: "Ice Sheet Velocity & Core Vault", type: "lab", status: "nominal", internalTempC: 18.0, activeExperiments: 4 },
      { zoneId: "comms-tower", label: "Automated V-SAT Repeater Mast", type: "comms", status: "nominal", signalDb: -72, iceLoadPct: 8 },
      { zoneId: "medical-bay", label: "Automated Tele-First Aid Station", type: "medical", status: "nominal", internalTempC: 20.0, o2SupplyPct: 95 },
      { zoneId: "supply-storage", label: "Sub-Ice Logistics Depot", type: "storage", status: "nominal", tempC: -12.0, doorSealed: true },
      { zoneId: "water-plant", label: "Sub-surface Thermal Melter", type: "water", status: "nominal", reserveLitres: 12000, flowRateLpm: 22, freezeAlert: false },
    ],
  },
};

export function generateDefaultTelemetry(stationCode = "MAITRI") {
  const code = (stationCode || "MAITRI").toUpperCase();
  const isMaitri = code === "MAITRI";
  const isBharati = code === "BHARATI";
  const now = Date.now();

  const metrics = [
    { metric: "temperature_c", base: isMaitri ? -22.4 : isBharati ? -18.2 : -28.6, variance: 2, zoneId: "living-quarters" },
    { metric: "wind_speed_kmh", base: isMaitri ? 38.5 : isBharati ? 44.0 : 52.0, variance: 6, zoneId: "living-quarters" },
    { metric: "power_load_kw", base: isMaitri ? 64.2 : isBharati ? 88.5 : 36.0, variance: 4, zoneId: "power-plant" },
    { metric: "battery_pct", base: isMaitri ? 82.0 : isBharati ? 88.0 : 79.0, variance: 2, zoneId: "power-plant" },
    { metric: "generator_health_pct", base: isMaitri ? 94.5 : isBharati ? 96.2 : 91.5, variance: 1, zoneId: "generator-shed" },
    { metric: "fuel_flow_lph", base: isMaitri ? 14.8 : isBharati ? 18.5 : 9.5, variance: 1.5, zoneId: "generator-shed" },
    { metric: "water_level_pct", base: isMaitri ? 74.0 : isBharati ? 82.5 : 68.0, variance: 2, zoneId: "water-plant" },
    { metric: "internal_temp_c", base: isMaitri ? 20.6 : isBharati ? 21.2 : 19.5, variance: 0.8, zoneId: "living-quarters" },
  ];

  const byZone = {};
  for (const m of metrics) {
    if (!byZone[m.zoneId]) byZone[m.zoneId] = [];
    for (let i = 10; i >= 0; i--) {
      const spread = (Math.sin(i * 0.9) + (Math.random() - 0.5)) * m.variance;
      byZone[m.zoneId].push({
        stationCode: code,
        zoneId: m.zoneId,
        metric: m.metric,
        value: Math.round((m.base + spread) * 10) / 10,
        recordedAt: new Date(now - i * 30000).toISOString(),
      });
    }
  }
  return byZone;
}

export function generateDefaultPrediction(stationCode = "MAITRI") {
  const code = (stationCode || "MAITRI").toUpperCase();
  const stationName = code === "MAITRI" ? "Maitri Station" : code === "BHARATI" ? "Bharati Station" : "Dakshin Gangotri Post";

  return {
    stationCode: code,
    stationName,
    evaluatedAt: new Date().toISOString(),
    status: "nominal",
    riskScore: 8,
    alert: null,
    timeToFailure: { minutes: 4320, formatted: "No critical risk (>72h stable buffer)" },
    primaryThreat: "None (All systems operating inside nominal safety envelope)",
    rootCauses: [],
    degradationCurve: [
      { timeOffset: "Now", stabilityPct: 98, risk: 8 },
      { timeOffset: "+2h", stabilityPct: 97, risk: 8 },
      { timeOffset: "+4h", stabilityPct: 96, risk: 9 },
      { timeOffset: "+8h", stabilityPct: 95, risk: 10 },
      { timeOffset: "+12h", stabilityPct: 94, risk: 11 },
      { timeOffset: "+24h", stabilityPct: 92, risk: 13 },
    ],
    recommendations: [
      {
        id: "routine_check",
        label: "Maintain Routine Polar Night Watch SOP",
        action: "none",
        riskDelta: "0%",
      },
    ],
    activeDisaster: null,
    mitigationApplied: null,
    regressionModel: {
      batterySlopePerHour: -0.12,
      genDecayPerHour: -0.05,
      confidenceR2: 0.98,
    },
  };
}

export const DEFAULT_RESOURCES = {
  MAITRI: [
    { _id: "res-m1", stationCode: "MAITRI", category: "fuel", name: "Arctic Grade Polar Diesel (Bulk)", unit: "litres", quantity: 42000, dailyConsumptionRate: 340, reorderThresholdDays: 45 },
    { _id: "res-m2", stationCode: "MAITRI", category: "fuel", name: "Aviation Turbine Fuel (Helicopter)", unit: "litres", quantity: 8200, dailyConsumptionRate: 15, reorderThresholdDays: 60 },
    { _id: "res-m3", stationCode: "MAITRI", category: "water", name: "Priyadarshini Lake Melt Reserve", unit: "litres", quantity: 18400, dailyConsumptionRate: 920, reorderThresholdDays: 15 },
    { _id: "res-m4", stationCode: "MAITRI", category: "food", name: "Freeze-Dried Rations & Grains", unit: "kg", quantity: 2700, dailyConsumptionRate: 18, reorderThresholdDays: 30 },
    { _id: "res-m5", stationCode: "MAITRI", category: "medical", name: "Emergency Trauma & Antibiotics Kit", unit: "units", quantity: 380, dailyConsumptionRate: 2, reorderThresholdDays: 90 },
    { _id: "res-m6", stationCode: "MAITRI", category: "spare_parts", name: "Diesel Generator High-Flow Filters", unit: "units", quantity: 26, dailyConsumptionRate: 0.25, reorderThresholdDays: 40 },
  ],
  BHARATI: [
    { _id: "res-b1", stationCode: "BHARATI", category: "fuel", name: "Polar Ultra-Low Sulfur Diesel", unit: "litres", quantity: 78000, dailyConsumptionRate: 520, reorderThresholdDays: 45 },
    { _id: "res-b2", stationCode: "BHARATI", category: "fuel", name: "Aviation Fuel Jet-A1", unit: "litres", quantity: 14500, dailyConsumptionRate: 25, reorderThresholdDays: 60 },
    { _id: "res-b3", stationCode: "BHARATI", category: "water", name: "Desalinated Fresh Water Reserve", unit: "litres", quantity: 29000, dailyConsumptionRate: 1450, reorderThresholdDays: 15 },
    { _id: "res-b4", stationCode: "BHARATI", category: "food", name: "Hydroponics & Packed Provisions", unit: "kg", quantity: 4500, dailyConsumptionRate: 32, reorderThresholdDays: 30 },
    { _id: "res-b5", stationCode: "BHARATI", category: "medical", name: "Critical Care Surgical Supplies", unit: "units", quantity: 510, dailyConsumptionRate: 3, reorderThresholdDays: 90 },
    { _id: "res-b6", stationCode: "BHARATI", category: "spare_parts", name: "Wind Turbine & CHP Spares", unit: "units", quantity: 42, dailyConsumptionRate: 0.3, reorderThresholdDays: 40 },
  ],
  DAKSHIN_GANGOTRI: [
    { _id: "res-dg1", stationCode: "DAKSHIN_GANGOTRI", category: "fuel", name: "Automated Polar Diesel Cache", unit: "litres", quantity: 24000, dailyConsumptionRate: 160, reorderThresholdDays: 60 },
    { _id: "res-dg2", stationCode: "DAKSHIN_GANGOTRI", category: "water", name: "Sub-surface Melt Reserve", unit: "litres", quantity: 12000, dailyConsumptionRate: 300, reorderThresholdDays: 20 },
    { _id: "res-dg3", stationCode: "DAKSHIN_GANGOTRI", category: "food", name: "Automated Survival Rations", unit: "kg", quantity: 1400, dailyConsumptionRate: 8, reorderThresholdDays: 45 },
    { _id: "res-dg4", stationCode: "DAKSHIN_GANGOTRI", category: "spare_parts", name: "Autonomous Wind & Battery Spares", unit: "units", quantity: 18, dailyConsumptionRate: 0.1, reorderThresholdDays: 60 },
  ],
};

export const DEFAULT_PERSONNEL = {
  MAITRI: [
    { _id: "per-m1", stationCode: "MAITRI", name: "Dr. Anil Kartha", role: "Station Commander", shift: "day", healthStatus: "fit", vitals: { hr: 72, spo2: 99, temp: 36.8 }, lastCheckInAt: new Date().toISOString() },
    { _id: "per-m2", stationCode: "MAITRI", name: "Ritika Bose", role: "Medical Officer", shift: "day", healthStatus: "fit", vitals: { hr: 68, spo2: 98, temp: 36.6 }, lastCheckInAt: new Date().toISOString() },
    { _id: "per-m3", stationCode: "MAITRI", name: "Suresh Nair", role: "Chief Engineer (Power Systems)", shift: "day", healthStatus: "fit", vitals: { hr: 75, spo2: 98, temp: 36.7 }, lastCheckInAt: new Date().toISOString() },
    { _id: "per-m4", stationCode: "MAITRI", name: "Prakash Iyer", role: "Glaciologist & Core Driller", shift: "day", healthStatus: "fit", vitals: { hr: 70, spo2: 99, temp: 36.5 }, lastCheckInAt: new Date().toISOString() },
    { _id: "per-m5", stationCode: "MAITRI", name: "Meena Chandran", role: "Communications & SAT Officer", shift: "night", healthStatus: "fit", vitals: { hr: 69, spo2: 98, temp: 36.7 }, lastCheckInAt: new Date().toISOString() },
    { _id: "per-m6", stationCode: "MAITRI", name: "Farhan Sheikh", role: "Logistics & Habitat Specialist", shift: "night", healthStatus: "fit", vitals: { hr: 74, spo2: 97, temp: 36.6 }, lastCheckInAt: new Date().toISOString() },
  ],
  BHARATI: [
    { _id: "per-b1", stationCode: "BHARATI", name: "Cmdr. Vikram Rathore", role: "Station Commander", shift: "day", healthStatus: "fit", vitals: { hr: 70, spo2: 99, temp: 36.7 }, lastCheckInAt: new Date().toISOString() },
    { _id: "per-b2", stationCode: "BHARATI", name: "Dr. Aisha Menon", role: "Senior Medical Officer", shift: "day", healthStatus: "fit", vitals: { hr: 66, spo2: 99, temp: 36.6 }, lastCheckInAt: new Date().toISOString() },
    { _id: "per-b3", stationCode: "BHARATI", name: "Rajeev Pillai", role: "Chief Electrical Engineer", shift: "day", healthStatus: "fit", vitals: { hr: 73, spo2: 98, temp: 36.8 }, lastCheckInAt: new Date().toISOString() },
    { _id: "per-b4", stationCode: "BHARATI", name: "Nandini Shetty", role: "Atmospheric Scientist", shift: "day", healthStatus: "fit", vitals: { hr: 68, spo2: 99, temp: 36.5 }, lastCheckInAt: new Date().toISOString() },
    { _id: "per-b5", stationCode: "BHARATI", name: "Karan Vohra", role: "Telecommunications Specialist", shift: "night", healthStatus: "fit", vitals: { hr: 71, spo2: 98, temp: 36.7 }, lastCheckInAt: new Date().toISOString() },
    { _id: "per-b6", stationCode: "BHARATI", name: "Sana Qureshi", role: "Life Support & Water Engineer", shift: "night", healthStatus: "fit", vitals: { hr: 67, spo2: 99, temp: 36.6 }, lastCheckInAt: new Date().toISOString() },
  ],
  DAKSHIN_GANGOTRI: [
    { _id: "per-dg1", stationCode: "DAKSHIN_GANGOTRI", name: "Dr. Somesh Banerjee", role: "Post Custodian & Meteorologist", shift: "day", healthStatus: "fit", vitals: { hr: 69, spo2: 98, temp: 36.7 }, lastCheckInAt: new Date().toISOString() },
    { _id: "per-dg2", stationCode: "DAKSHIN_GANGOTRI", name: "Harpreet Singh", role: "Telemetry & Power Technician", shift: "night", healthStatus: "fit", vitals: { hr: 72, spo2: 99, temp: 36.6 }, lastCheckInAt: new Date().toISOString() },
  ],
};

export const DEFAULT_INCIDENTS = {
  MAITRI: [
    {
      _id: "inc-m1",
      stationCode: "MAITRI",
      zoneId: "generator-shed",
      title: "Generator #2 Secondary Filter Overhaul",
      description: "Routine scheduled filter maintenance completed ahead of polar night window.",
      severity: "info",
      status: "resolved",
      reportedBy: "Suresh Nair (Chief Engineer)",
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      eventHash: "sha256-e4a8b2...99f0",
      seqNo: 1042,
    },
  ],
  BHARATI: [
    {
      _id: "inc-b1",
      stationCode: "BHARATI",
      zoneId: "comms-tower",
      title: "SATCOM High-Gain Antenna Calibration",
      description: "Auto-tracking azimuth adjusted +1.4° for GSAT-30 winter alignment.",
      severity: "info",
      status: "resolved",
      reportedBy: "Karan Vohra (SAT Officer)",
      createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      eventHash: "sha256-b7f3c1...88a2",
      seqNo: 1043,
    },
  ],
  DAKSHIN_GANGOTRI: [
    {
      _id: "inc-dg1",
      stationCode: "DAKSHIN_GANGOTRI",
      zoneId: "power-plant",
      title: "Autonomous Microgrid Battery Cycle",
      description: "Winter-season deep cycle test passed with 99.2% charge retention.",
      severity: "info",
      status: "resolved",
      reportedBy: "Automated Telemetry Controller",
      createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
      eventHash: "sha256-c1d9f8...77e4",
      seqNo: 1044,
    },
  ],
};

