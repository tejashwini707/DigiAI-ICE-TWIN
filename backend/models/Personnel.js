import mongoose from "mongoose";

const personnelSchema = new mongoose.Schema(
  {
    stationCode: { type: String, required: true, index: true },
    name: { type: String, required: true },
    role: { type: String, required: true }, // "Station Commander", "Medical Officer", "Glaciologist"...
    shift: {
      type: String,
      enum: ["day", "night", "on-call", "off-duty"],
      default: "day",
    },
    healthStatus: {
      type: String,
      enum: ["fit", "monitoring", "critical"],
      default: "fit",
    },
    lastCheckInAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Personnel", personnelSchema);
