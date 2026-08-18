import express from "express";
import { Middleware } from "middlewares";
const {verifyToken}=Middleware
import dashboardController from "./dashboard.controller";
const router=express.Router()
/**
 * @author Shivam Shukla
 * @version 1.0.0
 * @description Document Services
 * @date 11 june 2025
 * @license MIT
 * @copyright Copyright (c) 2025 Shivam Shukla
 * @file document.controller.ts
 * 
 */
/**
 * @description Get all documents
 * @type GET
 * @path /api/document/
 */
router.get("/profitAndLoss",verifyToken,dashboardController.profitAndLoss)
router.get("/sales",verifyToken,dashboardController.sales)
router.get("/accountsReceivable",verifyToken,dashboardController.accountsReceivable)
router.get("/accountsPayable",verifyToken,dashboardController.accountsPayable)
router.get("/expense",verifyToken,dashboardController.expense)
router.get("/customer",verifyToken,dashboardController.getCustomerData)
router.get("/vendor",verifyToken,dashboardController.getVendorData)
router.get("/invoicesAndBillsSummary",verifyToken,dashboardController.invoicesAndBillsSummary)
router.get("/cashFlow",verifyToken,dashboardController.cashFlow)
export default router
