import express from "express";
import TransactionController from "./transaction.controller";
import { Middleware } from "middlewares";
const {verifyToken}=Middleware
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
router.post("/sendDocumentByEmail",verifyToken,TransactionController.sendDocumentByEmail)
router.get("/getEstimates",verifyToken,TransactionController.getEstimates)

router.get("/getTransactions",verifyToken,TransactionController.TransactionList)
router.get("/getCustomerInvoiceDetails",verifyToken,TransactionController.getCustomerInvoiceDetails)
router.get("/getCustomerBillDetails",verifyToken,TransactionController.getCustomerBillsDetails)
router.get("/getCustomerBillTransaction",verifyToken,TransactionController.BillTransactionList)
router.get("/TotalTransactionCount",verifyToken,TransactionController.TotalTransactionCount)
router.get("/export",verifyToken,TransactionController.export)


export default router
