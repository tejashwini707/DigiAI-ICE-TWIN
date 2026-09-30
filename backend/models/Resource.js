import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    stationCode: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ["fuel", "food", "medical", "spare_parts", "water"],
      required: true,
    },
    name: { type: String, required: true }, // "Diesel (Arctic grade)", "Rice", "Antibiotics"
    unit: { type: String, required: true }, // "litres", "kg", "units"
    quantity: { type: Number, required: true },
    dailyConsumptionRate: { type: Number, required: true }, // used to project depletion
    reorderThresholdDays: { type: Number, default: 30 }, // alert when projected days-left < this
    lastRestockedAt: Date,
  },
  { timestamps: true }
);

// Virtual: days remaining at current consumption rate — this is what powers
// the "Diesel will run out in 47 days" projection in the UI.
resourceSchema.virtual("projectedDaysRemaining").get(function () {
  if (!this.dailyConsumptionRate || this.dailyConsumptionRate <= 0) return null;
  return Math.round(this.quantity / this.dailyConsumptionRate);
});

resourceSchema.set("toJSON", { virtuals: true });
resourceSchema.set("toObject", { virtuals: true });

export default mongoose.model("Resource", resourceSchema);
