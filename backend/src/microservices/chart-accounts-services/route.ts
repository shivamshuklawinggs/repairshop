import { Router } from "express";
import { createChartAccount, getAllChartAccounts,getAccountTypes,getSubAccountTypes, updateChartAccount, deleteChartAccount, getChartAccountById,getAllTransactionsViAChartAccounts, getEndingBalance, importChartAccounts } from "./chartOfAccounts.controller";

import { chartAccountSchema } from "./chartAccount.validate";
import { Middleware } from "middlewares";
import multer from "multer";
const {requirePermission,requestValidate}=Middleware
const router = Router();

const tempUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/import", requirePermission('import',["accounting"]), tempUpload.single('file'), importChartAccounts);
router.post("/", requirePermission('create',["accounting"]), requestValidate(chartAccountSchema), createChartAccount);
router.get("/",requirePermission('view',["accounting"]), getAllChartAccounts);
router.get("/accounttypes",Middleware.verifyToken,getAccountTypes)

router.get("/subaccounttypes/:AccountTypeId", getSubAccountTypes);
router.get("/stats/:id", requirePermission('view',["accounting"]), getAllTransactionsViAChartAccounts);
router.get("/stats/:id/export", requirePermission('view',["accounting"]), getAllTransactionsViAChartAccounts);
router.put("/:id", requirePermission('update',["accounting"]), requestValidate(chartAccountSchema), updateChartAccount);
router.delete("/:id", requirePermission('delete',["accounting"]), deleteChartAccount);
router.get("/endingbalance/:id", requirePermission('view',["accounting"]), getEndingBalance);
router.get("/:id", requirePermission('view',["accounting"]), getChartAccountById);
export default router;
