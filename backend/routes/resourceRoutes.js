import { Router } from "express";
import {
  listResources,
  updateResource,
  createResource,
} from "../controllers/resourceController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/:code", requireAuth, listResources);
router.post("/:code", requireAuth, createResource);
router.patch("/item/:id", requireAuth, updateResource);

export default router;
