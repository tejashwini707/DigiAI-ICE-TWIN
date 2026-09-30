import { Router } from "express";
import {
  listStations,
  getStationTwin,
  setConnectivity,
  triggerDisaster,
  resolveDisaster,
  applyMitigation,
  getPredictions,
  triggerTick,
} from "../controllers/stationController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, listStations);
router.get("/:code/twin", requireAuth, getStationTwin);
router.get("/:code/predictions", requireAuth, getPredictions);
router.patch("/:code/connectivity", requireAuth, setConnectivity);
router.post("/:code/disaster", requireAuth, triggerDisaster);
router.post("/:code/resolve-disaster", requireAuth, resolveDisaster);
router.post("/:code/apply-mitigation", requireAuth, applyMitigation);
router.post("/:code/telemetry/tick", requireAuth, triggerTick);

export default router;
