import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser, createUser,
  deleteUser,
  userActivate,
  userBlock,
  renewPlan,
} from "./user.controller";
import { CreateuserSchema, updateUserSchema, ActiveUserSchema, BlockUserSchema } from "./user-service.validate";
import { Role } from "microservices/auth-service/types";
import { Middleware } from "middlewares";
const {verifyToken,requireRole,requestValidate}=Middleware
const router = Router();
router.route("/")
.get(requireRole([Role.SUPERADMIN, Role.ADMIN,Role.MANAGER]), getAllUsers)
.post(requireRole([Role.SUPERADMIN, Role.ADMIN,Role.MANAGER]), requestValidate(CreateuserSchema), createUser);

router.put("/activate/:id", requireRole([Role.SUPERADMIN, Role.ADMIN,Role.MANAGER]), requestValidate(ActiveUserSchema), userActivate);
router.route("/block/:id")
.put(requireRole([Role.SUPERADMIN]), requestValidate(BlockUserSchema), userBlock);
router.post("/renew-plan/:id", requireRole([Role.SUPERADMIN]), renewPlan);

router.route("/:id")
.get(verifyToken,getUserById)
.put(requireRole([Role.SUPERADMIN, Role.ADMIN,Role.MANAGER]), requestValidate(updateUserSchema), updateUser)
.delete(requireRole([Role.SUPERADMIN, Role.ADMIN,Role.MANAGER]), deleteUser);

export default router;
