import express from 'express';
import invoiceRoutes from './invoice/route'
import customerRoutes from './customer-services/route'
import estimateRoutes from './estimate/route'
import statementRoutes from './statement-services/route'
import billRoutes from './bill-services/route'

// Invoice routes
const router = express.Router();
router.use("/invoices",invoiceRoutes) 
router.use("/bills",billRoutes)
router.use("/customers",customerRoutes)
router.use("/estimates",estimateRoutes)
router.use("/statements",statementRoutes)
export default router