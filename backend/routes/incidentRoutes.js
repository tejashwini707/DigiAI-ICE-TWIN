import { Router } from "express";
import {
  listIncidents,
  createIncident,
  updateIncident,
} from "../controllers/incidentController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/:code", requireAuth, listIncidents);
router.post("/:code", requireAuth, createIncident);
router.patch("/item/:id", requireAuth, updateIncident);

export default router;
