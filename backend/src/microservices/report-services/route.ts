import { Router } from "express";
import { ReportController } from "./report.controller";
import { Middleware } from "middlewares";
const {verifyToken}=Middleware
const router = Router();

router.get("/",verifyToken, ReportController.generateReport);
router.get("/export/chart-of-accounts",verifyToken, ReportController.exportChartOfAccounts);
router.get("/export",verifyToken, ReportController.exportReport);

export default router;
