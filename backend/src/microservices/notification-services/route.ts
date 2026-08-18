import { Router } from "express";
import {createNotificationservice,getAllNotificationservices,getNotificationserviceById,updateNotificationservice,deleteNotificationservice,readAllNotifications,} from './Notification.controller'
import { Middleware } from "middlewares";

const {verifyToken}=Middleware
const router = Router();

router.post("/", verifyToken, createNotificationservice);
router.get("/", verifyToken, getAllNotificationservices);
router.put("/readall", verifyToken, readAllNotifications);
router.put("/:id", verifyToken, updateNotificationservice);
router.delete("/:id", verifyToken, deleteNotificationservice);
router.get("/:id", verifyToken, getNotificationserviceById);

export default router;
