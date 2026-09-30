import { Router } from "express";
import {
  listPersonnel,
  updatePersonnel,
  raiseSOS,
} from "../controllers/personnelController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/:code", requireAuth, listPersonnel);
router.patch("/item/:id", requireAuth, updatePersonnel);
router.post("/item/:id/sos", requireAuth, raiseSOS);

export default router;
