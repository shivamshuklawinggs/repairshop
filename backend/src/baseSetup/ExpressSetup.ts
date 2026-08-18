import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { ALL_DIRECTORY_LIST, UPLOAD_BASE_DIR,PUBLIC_BASE_DIR } from "config";
import { corsOptions } from "utils/CorsOptions";
import { ensureDirectoryExists } from "libs";
export const applyBaseSetup = (app: Express): void => {
  // Ensure required directories exist
  ALL_DIRECTORY_LIST.forEach((dir) => {
    ensureDirectoryExists(dir);
  });

  // Set view engine and trust proxy
  app.set('view engine', 'ejs');
  app.set('trust proxy', 1);

  // Apply compression middleware
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));



  // Enable CORS with proper configuration
  app.use(cors(corsOptions as any));

  // Apply security headers with Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          imgSrc: ["'self'", "data:", "https:", "http:"],
          fontSrc: ["'self'", "data:", "https:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'"],
          connectSrc: ["'self'", "https:"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      permittedCrossDomainPolicies: false,
      xssFilter: true,
    })
  );

  // Parse JSON and URL-encoded bodies with size limits
  app.use(express.json({
    limit: '10mb',
    strict: true,
    type: 'application/json'
  }));
  
  app.use(express.urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 1000
  }));

  // Serve static files with proper headers
  app.use('/uploads', express.static(UPLOAD_BASE_DIR, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));
  app.use('/public', express.static(PUBLIC_BASE_DIR, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));
};
