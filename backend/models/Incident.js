import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
  {
    stationCode: { type: String, required: true, index: true },
    zoneId: String,
    title: { type: String, required: true },
    description: String,
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
    },
    status: {
      type: String,
      enum: ["open", "acknowledged", "resolved"],
      default: "open",
    },
    reportedBy: String,
    // client-generated id lets the offline queue avoid duplicate submissions
    // when the same incident is synced twice (e.g. retried after a failed sync)
    clientId: { type: String, unique: true, sparse: true },
    createdOfflineAt: Date, // original timestamp if logged while disconnected
    syncedFromOffline: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Incident", incidentSchema);
