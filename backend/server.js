import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns";

// Fix for Node.js querySrv ECONNREFUSED on Windows with local ISP DNS
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {
  console.warn("Custom DNS servers setting skipped:", err.message);
}

import authRoutes from "./routes/authRoutes.js";
import stationRoutes from "./routes/stationRoutes.js";
import telemetryRoutes from "./routes/telemetryRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import personnelRoutes from "./routes/personnelRoutes.js";
import incidentRoutes from "./routes/incidentRoutes.js";
import { startSimulator } from "./services/simulator.js";

dotenv.config();

const app = express();

// Permissive CORS to allow all local dev ports (5173, 5174, 5175, 5176, 5177, etc.)
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    service: "Antarctic Station Digital Twin API",
    time: new Date(),
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/personnel", personnelRoutes);
app.use("/api/incidents", incidentRoutes);

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(frontendDistPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(frontendDistPath, "index.html"), (err) => {
    if (err) next();
  });
});

app.use((err, req, res, next) => {
  console.error("Express error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

// Attempt MongoDB connection asynchronously with a short timeout
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 4000 })
    .then(() => {
      console.log("✓ MongoDB Atlas connected successfully");
    })
    .catch((err) => {
      console.warn("⚠ MongoDB connection unavailable:", err.message);
      console.log("✓ Operating in High-Availability In-Memory / Dual-Mode Store");
    });
} else {
  console.log("✓ Operating in High-Availability In-Memory / Dual-Mode Store");
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`❄ Antarctic Station Digital Twin Server running on :${PORT}`);
    console.log(`❄ Telemetry Simulator active (3000ms real-time tick)`);
    console.log(`❄ AI Prediction & Risk Engine initialized`);
    console.log(`=======================================================`);
    startSimulator(3000); // 3s live tick interval
  });
}

export default app;
