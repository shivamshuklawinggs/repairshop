import express from 'express';
import paymentController from './payment.controller';
import { Middleware } from "middlewares";
const {verifyToken,requestValidate}=Middleware
import { RecievedPamentSchema,UpdateRecievedPamentSchema } from './payment.validate';
// Invoice routes
const router = express.Router();
// More specific routes first
router.route("/").post(verifyToken,requestValidate(RecievedPamentSchema), paymentController.createPayments)
.get(verifyToken,paymentController.getAllPayments)
// More specific routes first
router.route("/allocatedPayments").post(verifyToken,requestValidate(RecievedPamentSchema), paymentController.createPayments)
.get(verifyToken,paymentController.getAllPayments)
router.route("/recived/:id")
.get(verifyToken,paymentController.getPayment)
.put(verifyToken,requestValidate(UpdateRecievedPamentSchema),paymentController.updatePayment)
.delete(verifyToken,paymentController.deletePayment)




export default router;
