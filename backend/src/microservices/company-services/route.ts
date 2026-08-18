import { Router } from "express";
import {createCompanyService,getAllCompanyServices,getCompanyServiceById,updateCompanyService,deleteCompanyService} from './company.controller'

import { createCompanyServiceSchema } from "./company.validate";
import { Role } from "microservices/auth-service/types";
import multer from "multer";
import path from "path";
import { AppError } from "middlewares/error";
import { v4 as uuidv4 } from 'uuid';
import { COMPANY_LOGO_DIR } from "config";
import { Middleware } from "middlewares";
const {requireRole,requestValidate,decryptDataMiddleware}=Middleware
const router = Router();
// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
    cb(null, path.join(COMPANY_LOGO_DIR));
    },
    filename: function (_req, file, cb) {
      const uniqueId = uuidv4();
      const ext = path.extname(file.originalname);
      cb(null, `company-logo-${uniqueId}${ext}`);
    }
  });
  
  const fileFilter = (_req: any, file: any, cb: any) => {
   try {
      if (file.mimetype.includes("image")) {
        cb(null, true);
      } else {
         throw new AppError('Invalid file type. Only Images are allowed.', 400);
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
router.post("/",requireRole([Role.ADMIN,Role.MANAGER]),upload.single('logo'),decryptDataMiddleware,requestValidate(createCompanyServiceSchema), createCompanyService);
router.get("/", requireRole([Role.ADMIN,Role.MANAGER,Role.ACCOUNTANT,Role.SUPERADMIN]), getAllCompanyServices);
router.put("/:id", requireRole([Role.ADMIN,Role.MANAGER]),upload.single('logo'),decryptDataMiddleware,requestValidate(createCompanyServiceSchema), updateCompanyService);
router.delete("/:id", requireRole([Role.ADMIN,Role.MANAGER]), deleteCompanyService);
router.get("/:id", getCompanyServiceById);

export default router;
