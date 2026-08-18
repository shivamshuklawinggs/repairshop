import { Router } from "express";
import { Role } from "microservices/auth-service/types";
import { Middleware } from "middlewares";
import { createPlan, deletePlan, getPlan, listPlans, setPlanActive, updatePlan } from "./plan.controller";
const {requireRole,decryptDataMiddleware}=Middleware

const router = Router();

router
  .route("/")
  .get(requireRole([Role.SUPERADMIN]), listPlans)
  .post(requireRole([Role.SUPERADMIN]), decryptDataMiddleware, createPlan);
router.put(
  "/activate/:id",
  requireRole([Role.SUPERADMIN]),
  decryptDataMiddleware,
  setPlanActive
);
router
  .route("/:id")
  .get(requireRole([Role.SUPERADMIN]), getPlan)
  .put(requireRole([Role.SUPERADMIN]), decryptDataMiddleware, updatePlan)
  .delete(requireRole([Role.SUPERADMIN]), deletePlan);



export default router;


