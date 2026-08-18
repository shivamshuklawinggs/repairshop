import { Router } from "express";
import { Middleware } from "middlewares";
import { Role } from "../auth-service/types";
import ProjectoverviewData from "./freightbooks-data.json";
import {
  getStats,
  getAnalytics,
  generateProjectDoc,
} from "./superadmin.controller";
import path from "path";
import ejs from "ejs";
const { requireRole } = Middleware;
const router = Router();

/**
 * All routes require SUPERADMIN role
 */

// Get business analytics
router.get(
  "/analytics",
  requireRole([Role.SUPERADMIN]),
  getAnalytics
);

// Get system statistics
router.get(
  "/stats",
  requireRole([Role.SUPERADMIN]),
  getStats
);

router.get(
  "/doc",
  requireRole([Role.SUPERADMIN]),
  generateProjectDoc
);
router.get("/", async (_req: any, res: any,next: any) => {
  try {
    const templatePath = path.join(__dirname, 'PROJECTOVERVIEW.ejs');
    const html = await ejs.renderFile(templatePath, { data: ProjectoverviewData });
    res.send(html);
  } catch (error) {
    next(error);
  }
});

export default router;
