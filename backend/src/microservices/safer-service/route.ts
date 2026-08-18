import { Router } from "express";
import {
  getDataByUSDOT,
} from "./saferapi.controller";
import { Middleware } from "middlewares";
const {verifyToken}=Middleware
const router = Router();
router.get("/usdot/:usdotnumber", verifyToken,getDataByUSDOT);

export default router;
