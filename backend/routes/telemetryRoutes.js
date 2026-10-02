import { Router } from "express";
import { listTelemetry, ingestTelemetry, getAnalytics, ingestMqttTelemetry } from "../controllers/telemetryController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/ingest/mqtt", ingestMqttTelemetry); // Public/Device Token IoT Hardware Ingestion Endpoint
router.get("/:code/analytics", requireAuth, getAnalytics);
router.get("/:code", requireAuth, listTelemetry);
router.post("/:code", requireAuth, ingestTelemetry);

export default router;
