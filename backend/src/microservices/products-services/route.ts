import { Router } from "express";
import {createItemService,getAllItemServices,getItemServiceById,updateItemService,deleteItemService,importProductServices} from './product-service.controller'
import { Middleware } from "middlewares";
import multer from "multer";
const {verifyToken,requestValidate}=Middleware
import { ProductServiceSchema } from "./product-service.validate";
const router = Router();

const tempUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/import", verifyToken, tempUpload.single('file'), importProductServices);
router.post("/", verifyToken,requestValidate(ProductServiceSchema) , createItemService);
router.get("/", verifyToken, getAllItemServices);
router.put("/:id", verifyToken,requestValidate(ProductServiceSchema) , updateItemService);
router.delete("/:id", verifyToken, deleteItemService);
router.get("/:id", getItemServiceById);

export default router;
