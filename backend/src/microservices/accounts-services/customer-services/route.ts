import { Router } from "express";
import CustomerController from './customer.controller';
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from 'uuid';
import { CUSTOMER_DOCUMENTS_DIR, CUSTOMER_INSURANCE_DOCUMENTS_DIR } from "config";
import { AppError } from "middlewares/error";
import { Middleware } from "middlewares";
const router = Router();
const tempUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});
// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (_req, file, cb) {
    if (file.fieldname === 'documents') {
      cb(null, path.join(CUSTOMER_DOCUMENTS_DIR));
    } else {
      cb(null, path.join(CUSTOMER_INSURANCE_DOCUMENTS_DIR));
    }
  },
  filename: function (_req, file, cb) {
    const uniqueId = uuidv4();
    let name = file.fieldname === 'documents' ? 'customer' : 'insurance'
    const ext = path.extname(file.originalname);
    cb(null, `${name}-${uniqueId}${ext}`);
  }
});

const fileFilter = (_req: any, file: any, cb: any) => {
  try {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      throw new AppError('Invalid file type. Only JPEG, PNG, PDF and DOC files are allowed.', 400);
    }
  } catch (error) {
    cb(error, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});
router.post('/', Middleware.requirePermission("create",["accounting","customers"]), upload.fields([
  { name: 'documents', maxCount: 10 },
]), Middleware.decryptDataMiddleware, CustomerController.createCustomer);
// Get All Customers
router.get('/', Middleware.requirePermission("view",["accounting"]), CustomerController.getAllCustomers);
router.post('/import', Middleware.requirePermission("create",["accounting"]), tempUpload.single('file'), Middleware.decryptDataMiddleware, CustomerController.ImportCustomers);
router.get('/export', Middleware.requirePermission("export",["accounting"]), Middleware.decryptDataMiddleware, CustomerController.ExportCustomers);

// Get a Customer by ID
router.get('/:id', Middleware.requirePermission("view",["accounting"]), CustomerController.getCustomerById);

// Update a Customer by ID
router.put('/:id', Middleware.requirePermission("update",["accounting"]), upload.fields([
  { name: 'documents', maxCount: 10 }
]), Middleware.decryptDataMiddleware, CustomerController.updateCustomer);

// Delete a Customer by ID

router.delete('/:id', Middleware.requirePermission("delete",["accounting"]), CustomerController.deleteCustomer);
export default router;
