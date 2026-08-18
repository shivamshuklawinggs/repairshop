import express from 'express';
import * as invoiceController from './estimate.controller';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { INVOICE_DIR } from 'config';
import { ensureDirectoryExists } from 'libs';
import { Middleware } from 'middlewares';
try {
  ensureDirectoryExists(INVOICE_DIR);
} catch (error) {
  console.warn('Error setting up upload directories:', error);
}
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, INVOICE_DIR); // Make sure this directory exists
  },
  filename: function (_req, file, cb) {
    cb(null, `customer-invoice-${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// Invoice routes
const router = express.Router();
// More specific routes first
router.get("/",Middleware.requirePermission("view",["accounting"]), invoiceController.getInvoices)
router.post("/convert-estimate-to-invoice/:estimateId",Middleware.requirePermission("create",["accounting"]), invoiceController.createInvoiceByEstimateId)
router.post("/acceptEstimate/:estimateId",Middleware.requirePermission("create",["accounting"]), invoiceController.AcceptEstimate)
router.get("/getInvoiceById/:invoiceId",Middleware.requirePermission("view",["accounting"]), invoiceController.getInvoiceById)

router.post('/generate/:type',
  // Handle file uploads if any
  upload.array('files'),
 Middleware.requirePermission("create",["accounting"]),
  Middleware.decryptDataMiddleware,
  invoiceController.generateInvoice
);
router.route('/update/:invoiceId/:type').put(
 Middleware.requirePermission("update",["accounting"]),
  upload.array('files'),
  Middleware.decryptDataMiddleware,
  invoiceController.updateInvoice
);
router.get('/:invoiceId', invoiceController.generatePDF);
router.delete('/:invoiceId',Middleware.requirePermission("delete",["accounting"]), invoiceController.deleteInvoice);


export default router;
