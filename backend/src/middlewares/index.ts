import { Request, Response, NextFunction } from "express";
import multer from 'multer';
import path from 'path';
import { AnySchema } from 'yup';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from 'middlewares/error';
import { UPLOAD_BASE_DIR } from 'config';
import { encrypt } from "libs/encrypt";
import { Role } from "microservices/auth-service/types";
import  { IUserDocument } from "models/user.model";
import { createRateLimiter } from "utils/rateLimiter";
import { clean } from "./cleanRequestBodyMiddleware";
import { JWTMiddleware } from "./jwt";
declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}
export class Middleware {
    constructor() {

    }

    // File filter function
    private static fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        // Check file type
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'));
        }
    };
    static verifyToken = JWTMiddleware.verifyToken;
    
    // Middleware factory for permission checking
    static  requirePermission=JWTMiddleware.requirePermission;
  // Role-based middleware
  static  requireRole(roles: Role | Role[]) {
    return JWTMiddleware.requireRole(Array.isArray(roles) ? roles.map(r => r.toString()) : [roles.toString()]);
  }
    static decryptDataMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const isbodyEmpty = Object.keys(req.body).length === 0;
            const isisRequestedENcrypted = req.headers.isencrypted == "true";
            if (!isbodyEmpty && isisRequestedENcrypted) {
                if (req.method === 'POST' || req.method === 'PUT' && req.body.payload) {
                    req.body = await encrypt.decryptData(req.body.payload);
                }
            }
            if (req.body && typeof req.body === "object") {
                clean(req.body);
            }

            next();
        } catch (error) {
            next(error);
        }
    }

    static encryptResponseMiddleware(req: Request, res: Response, next: NextFunction) {
        try {
           
            if (req.headers.isencrypted == "true") {
                const originalJson = res.json;
                res.json = function (data) {
                    const jsonStr = JSON.stringify(data);
                    const encrypted = encrypt.encryptData(jsonStr);
                    return originalJson.call(this, { payload: encrypted });
                };

            }
            next();
        } catch (error) {
            next(error);
        }
    }
    static loginLimiter = createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 5, // e.g., 5 login attempts per window
    });
    // Configure multer
    static upload = ({ destination = UPLOAD_BASE_DIR, fileSize = 5, maxFiles = 1 }: { destination?: string, fileSize?: number, maxFiles?: number }) => {
        return multer({
            storage: multer.diskStorage({
                destination: (_req, _file, cb) => {
                    cb(null, destination);
                },
                filename: (_req, file, cb) => {
                    // Generate unique filename with timestamp and UUID
                    const uniqueSuffix = Date.now() + '-' + uuidv4();
                    const extension = path.extname(file.originalname);
                    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
                }
            }),
            limits: {
                fileSize: fileSize * 1024 * 1024, // filesize * MB limit
                files: maxFiles // Maximum  files
            },
            fileFilter: this.fileFilter
        })
    }
    // Error handling middleware
    static handleUploadError = (error: any, _req: any, _res: any, next: any) => {
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                throw new AppError('File too large. Maximum size is 5MB.', 400);
            }
            if (error.code === 'LIMIT_FILE_COUNT') {
                throw new AppError('Too many files. Maximum 10 files allowed.', 400);
            }
            if (error.code === 'LIMIT_UNEXPECTED_FILE') {
                throw new AppError('Unexpected field name for file upload.', 400);
            }
        }

        if (error.message.includes('Only image files')) {
            throw new AppError(error.message, 400);
        }

        next(error);
    };
    static requestValidate = (schema: AnySchema) => async (req: Request, _res: Response, next: NextFunction) => {
        try {
            console.info('Original Request Body:', req.body);
            if (req.body && typeof req.body === "object") {
                clean(req.body);
            }
            req.body = await schema.validate(req.body, { abortEarly: false, stripUnknown: true });
            console.info('New Request Body:', req.body);
            next();
        } catch (err: any) {
            next(err);
        }
    };
    static verifyHost = async (_req: Request, _res: Response, next: NextFunction) => {
        try {

            //   const configHost = process.env.API_KEY
            //   const API_KEY=req.headers["x-api-key"]


            // if(whitelist.some(item=>req.originalUrl.startsWith(item))){
            //   return next();
            // }
            //  else  if(API_KEY !== configHost){
            //   return next(new AppError("Unauthorized host", 403));
            // }
            next();

        } catch (error) {

            next(error);
        }
    };
}