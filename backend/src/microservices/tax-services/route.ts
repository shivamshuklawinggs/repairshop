import { Router } from "express";
import {createItemService,getAllItemServices,getItemServiceById,updateItemService,deleteItemService,PurchaseTax, SalesTax, importTaxOptions} from './tax.controller'
import { Middleware } from "middlewares";
import { TaxSchema } from "./tax.validate";
import multer from "multer";
const {verifyToken,requestValidate}=Middleware
const router = Router();

const tempUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/import", verifyToken, tempUpload.single('file'), importTaxOptions);
router.post("/", verifyToken,requestValidate(TaxSchema), createItemService);
router.get("/",verifyToken, getAllItemServices);
router.get("/SalesTax",verifyToken, SalesTax);
router.get("/PurchaseTax",verifyToken, PurchaseTax);
router.put("/:id", verifyToken,requestValidate(TaxSchema), updateItemService);
router.delete("/:id", verifyToken, deleteItemService);
router.get("/:id", verifyToken, getItemServiceById);

export default router;
