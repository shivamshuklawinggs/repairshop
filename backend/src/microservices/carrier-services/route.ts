import { Router } from "express";
import CarrierController from './carrier.controller'
import multer from "multer";
import path from "path";
import { AppError } from "middlewares/error";
import { v4 as uuidv4 } from 'uuid';
import { CARRIER_DOCUMENTS_DIR, CARRIER_INSURANCE_DOCUMENTS_DIR } from "config";
import { Middleware } from "middlewares";
const { verifyToken, requirePermission, decryptDataMiddleware } = Middleware
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
      cb(null, path.join(CARRIER_DOCUMENTS_DIR));
    } else {
      cb(null, path.join(CARRIER_INSURANCE_DOCUMENTS_DIR));
    }
  },
  filename: function (_req, file, cb) {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `carrier-${uniqueId}${ext}`);
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
// add powerunit
router.get('/export', Middleware.requirePermission("export", ["carriers"]), CarrierController.ExportCustomers);
router.post('/import', Middleware.requirePermission("import", ["carriers"]), tempUpload.single('file'), decryptDataMiddleware, CarrierController.ImportCustomers);


router.get("/filters", verifyToken, CarrierController.getAllCarriersFilters);

router.get("/allvendorsandcarriers", requirePermission('view', ["accounting"]), verifyToken, CarrierController.getAllVendorsAndCarriers);
router.route("/vendors").post(requirePermission('create', ["accounting"]), upload.fields([{ name: 'documents', maxCount: 10 }]), decryptDataMiddleware, CarrierController.createVendor)
.get(requirePermission('view', ["accounting"]), CarrierController.getAllVendors)
router.route("/vendors/:id")
  .put(requirePermission('update', ["accounting"]), upload.fields([{ name: 'documents', maxCount: 10 }]), decryptDataMiddleware, CarrierController.updateVendor)
  .delete(requirePermission('delete', ["accounting"]), CarrierController.deleteVendor).get(requirePermission('view', ["accounting"]), CarrierController.getVendor)

router.
  put("/:id/documents", requirePermission('update', ['carriers']), verifyToken, upload.array('documents'), decryptDataMiddleware, CarrierController.updateCarrierDocument);
router.get("/:id/documents", requirePermission('view', ['carriers']), CarrierController.getCarrierDocuments);

export default router;
