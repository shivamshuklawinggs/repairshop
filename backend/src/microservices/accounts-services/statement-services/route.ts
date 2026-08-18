import { Router } from "express";
import {createStatementService,getAllStatementServices,getStatementServiceById,updateStatementService,deleteStatementService,genearateStatementService} from './statement.controller'
import { Middleware } from "middlewares";
import { StatementSchema } from "./statement.validate";
const router = Router();

router.post("/",Middleware.requirePermission("create",["accounting"]),Middleware.requestValidate(StatementSchema), createStatementService);
router.get("/generate/:id",Middleware.requirePermission("view",["accounting"]), genearateStatementService);
router.get("/",Middleware.requirePermission("view",["accounting"]), getAllStatementServices);
router.put("/:id",Middleware.requirePermission("create",["accounting"]),Middleware.requestValidate(StatementSchema),updateStatementService);
router.delete("/:id",Middleware.requirePermission("delete",["accounting"]), deleteStatementService);
router.get("/:id",Middleware.requirePermission("view",["accounting"]), getStatementServiceById);
export default router;
