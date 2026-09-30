import { Router } from "express";
import { listTelemetry, ingestTelemetry, getAnalytics } from "../controllers/telemetryController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/:code/analytics", requireAuth, getAnalytics);
router.get("/:code", requireAuth, listTelemetry);
router.post("/:code", requireAuth, ingestTelemetry);

export default router;

