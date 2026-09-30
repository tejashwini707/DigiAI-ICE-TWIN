import mongoose from "mongoose";

// Each "zone" is a physical structure at the station, mapped 1:1 to a shape
// in the frontend SVG twin. status is derived server-side from live readings
// (see controllers/telemetryController.js) so the twin always reflects reality.
const zoneSchema = new mongoose.Schema(
  {
    zoneId: { type: String, required: true }, // e.g. "power-plant", "living-quarters"
    label: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "power",
        "fuel",
        "habitat",
        "lab",
        "comms",
        "medical",
        "storage",
        "generator",
        "water",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["nominal", "warning", "critical", "offline"],
      default: "nominal",
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const stationSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // "MAITRI" | "BHARATI"
    name: { type: String, required: true },
    location: {
      lat: Number,
      lng: Number,
      region: String,
    },
    commissioned: Number,
    crewCapacity: Number,
    zones: [zoneSchema],
    connectivity: {
      status: {
        type: String,
        enum: ["online", "degraded", "offline"],
        default: "online",
      },
      lastSyncedAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Station", stationSchema);
