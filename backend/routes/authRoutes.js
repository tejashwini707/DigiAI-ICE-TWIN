import { Router } from "express";
import { login, register, me } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", requireAuth, me);

export default router;

