import express from "express";
import { Middleware } from "middlewares";
const {verifyToken}=Middleware
import documentController from "./document.controller";
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
router.get("/",verifyToken,documentController.getDocuments)
router.get("/subdocument",verifyToken,documentController.getSubDocuments)
router.post("/sendDocumentByEmail",verifyToken,documentController.sendDocumentByEmail)
export default router
