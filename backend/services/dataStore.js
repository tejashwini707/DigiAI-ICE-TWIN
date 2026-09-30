// Comprehensive in-memory & dual-mode data store for Indian Antarctic Research Stations
// Maintains full live state for MAITRI and BHARATI stations with instant reactivity

const INITIAL_STATIONS = [
  {
    code: "MAITRI",
    name: "Maitri Station",
    location: { lat: -70.7669, lng: 11.7333, region: "Schirmacher Oasis, Queen Maud Land" },
    commissioned: 1989,
    crewCapacity: 25,
    elevation: "117m",
    connectivity: { status: "online", lastSyncedAt: new Date(), latencyMs: 340, signalQuality: "Good (92%)" },
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
  {
    code: "BHARATI",
    name: "Bharati Station",
    location: { lat: -69.4082, lng: 76.1911, region: "Larsemann Hills, East Antarctica" },
    commissioned: 2012,
    crewCapacity: 47,
    elevation: "35m (Coastal Hill)",
    connectivity: { status: "online", lastSyncedAt: new Date(), latencyMs: 290, signalQuality: "Optimal (98%)" },
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
];

const INITIAL_RESOURCES = {
  MAITRI: [
    { _id: "res-m1", stationCode: "MAITRI", category: "fuel", name: "Arctic Grade Polar Diesel (Bulk)", unit: "litres", quantity: 42000, dailyConsumptionRate: 340, reorderThresholdDays: 45 },
    { _id: "res-m2", stationCode: "MAITRI", category: "fuel", name: "Aviation Turbine Fuel (Helicopter)", unit: "litres", quantity: 8200, dailyConsumptionRate: 15, reorderThresholdDays: 60 },
    { _id: "res-m3", stationCode: "MAITRI", category: "water", name: "Pribarshini Lake Melt Reserve", unit: "litres", quantity: 18400, dailyConsumptionRate: 920, reorderThresholdDays: 15 },
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
};

const INITIAL_PERSONNEL = {
  MAITRI: [
    { _id: "per-m1", stationCode: "MAITRI", name: "Dr. Anil Kartha", role: "Station Commander", shift: "day", healthStatus: "fit", vitals: { hr: 72, spo2: 99, temp: 36.8 }, lastCheckInAt: new Date() },
    { _id: "per-m2", stationCode: "MAITRI", name: "Ritika Bose", role: "Medical Officer", shift: "day", healthStatus: "fit", vitals: { hr: 68, spo2: 98, temp: 36.6 }, lastCheckInAt: new Date() },
    { _id: "per-m3", stationCode: "MAITRI", name: "Suresh Nair", role: "Chief Engineer (Power Systems)", shift: "day", healthStatus: "fit", vitals: { hr: 75, spo2: 98, temp: 36.7 }, lastCheckInAt: new Date() },
    { _id: "per-m4", stationCode: "MAITRI", name: "Prakash Iyer", role: "Glaciologist & Core Driller", shift: "day", healthStatus: "fit", vitals: { hr: 70, spo2: 99, temp: 36.5 }, lastCheckInAt: new Date() },
    { _id: "per-m5", stationCode: "MAITRI", name: "Meena Chandran", role: "Communications & SAT Officer", shift: "night", healthStatus: "fit", vitals: { hr: 69, spo2: 98, temp: 36.7 }, lastCheckInAt: new Date() },
    { _id: "per-m6", stationCode: "MAITRI", name: "Farhan Sheikh", role: "Logistics & Habitat Specialist", shift: "night", healthStatus: "fit", vitals: { hr: 74, spo2: 97, temp: 36.6 }, lastCheckInAt: new Date() },
  ],
  BHARATI: [
    { _id: "per-b1", stationCode: "BHARATI", name: "Cmdr. Vikram Rathore", role: "Station Commander", shift: "day", healthStatus: "fit", vitals: { hr: 70, spo2: 99, temp: 36.7 }, lastCheckInAt: new Date() },
    { _id: "per-b2", stationCode: "BHARATI", name: "Dr. Aisha Menon", role: "Senior Medical Officer", shift: "day", healthStatus: "fit", vitals: { hr: 66, spo2: 99, temp: 36.6 }, lastCheckInAt: new Date() },
    { _id: "per-b3", stationCode: "BHARATI", name: "Rajeev Pillai", role: "Chief Electrical Engineer", shift: "day", healthStatus: "fit", vitals: { hr: 73, spo2: 98, temp: 36.8 }, lastCheckInAt: new Date() },
    { _id: "per-b4", stationCode: "BHARATI", name: "Nandini Shetty", role: "Atmospheric Scientist", shift: "day", healthStatus: "fit", vitals: { hr: 68, spo2: 99, temp: 36.5 }, lastCheckInAt: new Date() },
    { _id: "per-b5", stationCode: "BHARATI", name: "Karan Vohra", role: "Telecommunications Specialist", shift: "night", healthStatus: "fit", vitals: { hr: 71, spo2: 98, temp: 36.7 }, lastCheckInAt: new Date() },
    { _id: "per-b6", stationCode: "BHARATI", name: "Sana Qureshi", role: "Life Support & Water Engineer", shift: "night", healthStatus: "fit", vitals: { hr: 67, spo2: 99, temp: 36.6 }, lastCheckInAt: new Date() },
  ],
};

const INITIAL_INCIDENTS = {
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
      createdAt: new Date(Date.now() - 1000 * 60 * 180),
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
      createdAt: new Date(Date.now() - 1000 * 60 * 300),
    },
  ],
};

class DataStore {
  constructor() {
    this.stations = JSON.parse(JSON.stringify(INITIAL_STATIONS));
    this.resources = JSON.parse(JSON.stringify(INITIAL_RESOURCES));
    this.personnel = JSON.parse(JSON.stringify(INITIAL_PERSONNEL));
    this.incidents = JSON.parse(JSON.stringify(INITIAL_INCIDENTS));
    // Telemetry buffer holds historical readings per station per zone
    this.telemetryBuffer = {
      MAITRI: {},
      BHARATI: {},
    };
  }

  getStations() {
    return this.stations;
  }

  getStation(code) {
    return this.stations.find((s) => s.code.toUpperCase() === code.toUpperCase());
  }

  updateStation(code, updates) {
    const station = this.getStation(code);
    if (!station) return null;
    Object.assign(station, updates);
    return station;
  }

  setConnectivity(code, status) {
    const station = this.getStation(code);
    if (!station) return null;
    station.connectivity.status = status;
    if (status === "online") {
      station.connectivity.lastSyncedAt = new Date();
    }
    return station;
  }

  setDisaster(code, disasterType, append = false) {
    const station = this.getStation(code);
    if (!station) return null;
    if (!station.activeDisasters) {
      station.activeDisasters = station.activeDisaster ? [station.activeDisaster] : [];
    }

    if (append) {
      if (!station.activeDisasters.includes(disasterType)) {
        station.activeDisasters.push(disasterType);
      }
    } else {
      station.activeDisasters = [disasterType];
    }
    station.activeDisaster = station.activeDisasters[0] || null;
    station.mitigationApplied = null;
    return station;
  }

  toggleDisaster(code, disasterType) {
    const station = this.getStation(code);
    if (!station) return null;
    if (!station.activeDisasters) {
      station.activeDisasters = station.activeDisaster ? [station.activeDisaster] : [];
    }

    const idx = station.activeDisasters.indexOf(disasterType);
    if (idx >= 0) {
      station.activeDisasters.splice(idx, 1);
    } else {
      station.activeDisasters.push(disasterType);
    }
    station.activeDisaster = station.activeDisasters[0] || null;
    station.mitigationApplied = null;
    return station;
  }

  applyMitigation(code, mitigationAction) {
    const station = this.getStation(code);
    if (!station) return null;
    station.mitigationApplied = mitigationAction;
    return station;
  }

  clearDisaster(code) {
    const station = this.getStation(code);
    if (!station) return null;
    station.activeDisaster = null;
    station.activeDisasters = [];
    station.mitigationApplied = null;
    // reset zones to nominal
    station.zones.forEach((z) => {
      z.status = "nominal";
    });
    return station;
  }

  getResources(code) {
    return this.resources[code.toUpperCase()] || [];
  }

  updateResource(id, updates) {
    for (const code of Object.keys(this.resources)) {
      const item = this.resources[code].find((r) => r._id === id);
      if (item) {
        Object.assign(item, updates);
        return item;
      }
    }
    return null;
  }

  getPersonnel(code) {
    return this.personnel[code.toUpperCase()] || [];
  }

  updatePersonnel(id, updates) {
    for (const code of Object.keys(this.personnel)) {
      const person = this.personnel[code].find((p) => p._id === id);
      if (person) {
        Object.assign(person, updates);
        return person;
      }
    }
    return null;
  }

  raiseSOS(id) {
    for (const code of Object.keys(this.personnel)) {
      const person = this.personnel[code].find((p) => p._id === id);
      if (person) {
        person.healthStatus = "critical";
        person.lastCheckInAt = new Date();
        // Add emergency incident
        const inc = {
          _id: `inc-sos-${Date.now()}`,
          stationCode: code,
          zoneId: "medical-bay",
          title: `🚨 EMERGENCY SOS: ${person.name} (${person.role})`,
          description: `Medical SOS beacon activated for ${person.name}. Immediate medical dispatch requested at ${code} station.`,
          severity: "critical",
          status: "open",
          reportedBy: "Automated SOS Beacon",
          createdAt: new Date(),
        };
        this.addIncident(code, inc);
        return { person, incident: inc };
      }
    }
    return null;
  }

  getIncidents(code) {
    return this.incidents[code.toUpperCase()] || [];
  }

  addIncident(code, incident) {
    const list = this.incidents[code.toUpperCase()] || (this.incidents[code.toUpperCase()] = []);
    const newInc = {
      _id: incident._id || `inc-${Math.random().toString(36).substr(2, 9)}`,
      ...incident,
      stationCode: code.toUpperCase(),
      createdAt: incident.createdAt ? new Date(incident.createdAt) : new Date(),
    };
    list.unshift(newInc);
    return newInc;
  }

  updateIncident(id, updates) {
    for (const code of Object.keys(this.incidents)) {
      const inc = this.incidents[code].find((i) => i._id === id);
      if (inc) {
        Object.assign(inc, updates);
        return inc;
      }
    }
    return null;
  }

  pushTelemetry(code, readings) {
    const stationCode = code.toUpperCase();
    if (!this.telemetryBuffer[stationCode]) {
      this.telemetryBuffer[stationCode] = {};
    }
    const buf = this.telemetryBuffer[stationCode];

    for (const r of readings) {
      if (!buf[r.zoneId]) buf[r.zoneId] = [];
      buf[r.zoneId].push(r);
      // Keep last 30 readings per zone
      if (buf[r.zoneId].length > 30) {
        buf[r.zoneId].shift();
      }
    }
  }

  getTelemetry(code, zoneId = null) {
    const stationCode = code.toUpperCase();
    const buf = this.telemetryBuffer[stationCode] || {};
    if (zoneId) {
      return buf[zoneId] || [];
    }
    return buf;
  }
}

export const dataStore = new DataStore();
export default dataStore;
