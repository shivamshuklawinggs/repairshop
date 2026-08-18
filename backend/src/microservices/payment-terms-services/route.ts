import { Router } from "express";
import { createPaymentTerm, getAllPaymentTerms, updatePaymentTerm, deletePaymentTerm, getPaymentTermById, importPaymentTerms } from "./paymentTerms.controller";
import { Middleware } from "middlewares";
import { paymentTermSchema } from "./payment-terms.validate";
import multer from "multer";
const router = Router();

const tempUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/import", Middleware.verifyToken, tempUpload.single('file'), importPaymentTerms);
router.post("/", Middleware.verifyToken,Middleware.requestValidate(paymentTermSchema), createPaymentTerm);
router.get("/", Middleware.verifyToken, getAllPaymentTerms);
router.put("/:id", Middleware.verifyToken,Middleware.requestValidate(paymentTermSchema), updatePaymentTerm);
router.delete("/:id", Middleware.verifyToken, deletePaymentTerm);
router.get("/:id", Middleware.verifyToken, getPaymentTermById);
export default router;
