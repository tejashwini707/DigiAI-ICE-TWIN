import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

// Fix for Node.js querySrv ECONNREFUSED on Windows with local ISP DNS
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import Station from "./models/Station.js";
import Resource from "./models/Resource.js";
import Personnel from "./models/Personnel.js";
import Incident from "./models/Incident.js";
import User from "./models/User.js";
import { generateTick } from "./services/simulator.js";

dotenv.config();

const stations = [
  {
    code: "MAITRI",
    name: "Maitri Station",
    location: { lat: -70.7669, lng: 11.7333, region: "Schirmacher Oasis, Queen Maud Land" },
    commissioned: 1989,
    crewCapacity: 25,
    connectivity: { status: "online", lastSyncedAt: new Date() },
    zones: [
      { zoneId: "power-plant", label: "Power Plant", type: "power", status: "nominal" },
      { zoneId: "generator-shed", label: "Generator Shed", type: "generator", status: "nominal" },
      { zoneId: "fuel-depot", label: "Fuel Depot", type: "fuel", status: "nominal" },
      { zoneId: "living-quarters", label: "Living Quarters", type: "habitat", status: "nominal" },
      { zoneId: "research-lab", label: "Research Laboratory", type: "lab", status: "nominal" },
      { zoneId: "comms-tower", label: "Communications Tower", type: "comms", status: "nominal" },
      { zoneId: "medical-bay", label: "Medical Bay", type: "medical", status: "nominal" },
      { zoneId: "supply-storage", label: "Supply Storage", type: "storage", status: "nominal" },
      { zoneId: "water-plant", label: "Water Treatment", type: "water", status: "nominal" },
    ],
  },
  {
    code: "BHARATI",
    name: "Bharati Station",
    location: { lat: -69.4082, lng: 76.1911, region: "Larsemann Hills, East Antarctica" },
    commissioned: 2012,
    crewCapacity: 47,
    connectivity: { status: "online", lastSyncedAt: new Date() },
    zones: [
      { zoneId: "power-plant", label: "Power Plant", type: "power", status: "nominal" },
      { zoneId: "generator-shed", label: "Generator Shed", type: "generator", status: "nominal" },
      { zoneId: "fuel-depot", label: "Fuel Depot", type: "fuel", status: "nominal" },
      { zoneId: "living-quarters", label: "Living Quarters", type: "habitat", status: "nominal" },
      { zoneId: "research-lab", label: "Research Laboratory", type: "lab", status: "nominal" },
      { zoneId: "comms-tower", label: "Communications Tower", type: "comms", status: "nominal" },
      { zoneId: "medical-bay", label: "Medical Bay", type: "medical", status: "nominal" },
      { zoneId: "supply-storage", label: "Supply Storage", type: "storage", status: "nominal" },
      { zoneId: "water-plant", label: "Water Treatment", type: "water", status: "nominal" },
    ],
  },
];

const resourcesFor = (code, crew) => [
  { stationCode: code, category: "fuel", name: "Diesel (Arctic grade)", unit: "litres", quantity: 42000, dailyConsumptionRate: 340, reorderThresholdDays: 45 },
  { stationCode: code, category: "fuel", name: "Aviation Turbine Fuel", unit: "litres", quantity: 8000, dailyConsumptionRate: 15, reorderThresholdDays: 60 },
  { stationCode: code, category: "food", name: "Rice", unit: "kg", quantity: 1200, dailyConsumptionRate: Math.round(crew * 0.35), reorderThresholdDays: 30 },
  { stationCode: code, category: "food", name: "Dal / Pulses", unit: "kg", quantity: 600, dailyConsumptionRate: Math.round(crew * 0.15), reorderThresholdDays: 30 },
  { stationCode: code, category: "food", name: "Frozen Vegetables", unit: "kg", quantity: 900, dailyConsumptionRate: Math.round(crew * 0.4), reorderThresholdDays: 25 },
  { stationCode: code, category: "medical", name: "Broad-spectrum Antibiotics", unit: "units", quantity: 340, dailyConsumptionRate: 2, reorderThresholdDays: 90 },
  { stationCode: code, category: "medical", name: "IV Fluids", unit: "units", quantity: 150, dailyConsumptionRate: 1, reorderThresholdDays: 90 },
  { stationCode: code, category: "spare_parts", name: "Generator Filters", unit: "units", quantity: 24, dailyConsumptionRate: 0.3, reorderThresholdDays: 60 },
  { stationCode: code, category: "water", name: "Treated Water Reserve", unit: "litres", quantity: 18000, dailyConsumptionRate: Math.round(crew * 90), reorderThresholdDays: 15 },
];

const rolesMaitri = [
  ["Dr. Anil Kartha", "Station Commander"],
  ["Ritika Bose", "Medical Officer"],
  ["Suresh Nair", "Chief Engineer (Power)"],
  ["Prakash Iyer", "Glaciologist"],
  ["Meena Chandran", "Communications Officer"],
  ["Farhan Sheikh", "Logistics Officer"],
];
const rolesBharati = [
  ["Cmdr. Vikram Rathore", "Station Commander"],
  ["Dr. Aisha Menon", "Medical Officer"],
  ["Rajeev Pillai", "Chief Engineer (Power)"],
  ["Nandini Shetty", "Atmospheric Scientist"],
  ["Karan Vohra", "Communications Officer"],
  ["Sana Qureshi", "Logistics Officer"],
];

const personnelFor = (code, list) =>
  list.map(([name, role], i) => ({
    stationCode: code,
    name,
    role,
    shift: i % 3 === 0 ? "night" : "day",
    healthStatus: "fit",
    lastCheckInAt: new Date(),
  }));

const incidentsFor = (code) => [
  {
    stationCode: code,
    zoneId: "generator-shed",
    title: "Generator 2 filter change overdue",
    description: "Scheduled filter replacement delayed by 6 days due to weather window.",
    severity: "warning",
    status: "acknowledged",
    reportedBy: "Chief Engineer",
  },
  {
    stationCode: code,
    zoneId: "comms-tower",
    title: "Brief satellite uplink dropout",
    description: "3-minute uplink loss during storm front, auto-recovered.",
    severity: "info",
    status: "resolved",
    reportedBy: "Communications Officer",
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Wiping existing demo data...");

  await Promise.all([
    Station.deleteMany({}),
    Resource.deleteMany({}),
    Personnel.deleteMany({}),
    Incident.deleteMany({}),
    User.deleteMany({}),
  ]);

  await Station.insertMany(stations);
  await Resource.insertMany([
    ...resourcesFor("MAITRI", 25),
    ...resourcesFor("BHARATI", 47),
  ]);
  await Personnel.insertMany([
    ...personnelFor("MAITRI", rolesMaitri),
    ...personnelFor("BHARATI", rolesBharati),
  ]);
  await Incident.insertMany([...incidentsFor("MAITRI"), ...incidentsFor("BHARATI")]);

  await User.create([
    { name: "HQ Admin", email: "hq@moes.gov.in", password: "password123", role: "hq_admin" },
    { name: "Dr. Anil Kartha", email: "maitri@moes.gov.in", password: "password123", role: "station_commander", stationCode: "MAITRI" },
    { name: "Cmdr. Vikram Rathore", email: "bharati@moes.gov.in", password: "password123", role: "station_commander", stationCode: "BHARATI" },
  ]);

  console.log("Generating initial telemetry tick...");
  await generateTick();
  await generateTick(); // two ticks so charts have a visible line, not one dot

  console.log("Seed complete.");
  console.log("Login with: hq@moes.gov.in / password123 (or maitri@ / bharati@)");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
