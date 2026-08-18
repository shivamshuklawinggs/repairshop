import dotenv from "dotenv";
import path from "path";
import developmentConfig from "./development";
import stagingConfig from "./staging";
import productionConfig from "./production";

dotenv.config();

export type NODE_ENVTYPE = "development" | "production" | "staging";

export const sessionExpireTime = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
export const NODE_ENV: NODE_ENVTYPE = (process.env.NODE_ENV as NODE_ENVTYPE) || "development";

const envConfig =
  NODE_ENV === "production"
    ? productionConfig
    : NODE_ENV === "staging"
    ? stagingConfig
    : developmentConfig;

export const {
  PORT,
  JWT_EXPIRE,
  JWT_SECRET,
  REFRESH_TOKEN_SECRET,
  MONGO_URI,
  FRONTEND_URL,
  RUN_ON_CLUSTER,
  RABBITMQ_URL,
  fullurl,
  isProduction,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  NHTSA_URL,
  TIME_FORMAT,
  DATE_TIME_ZONE,
  TIME_FORMAT_HOURS
} = envConfig;

// Upload directories
export const UPLOAD_BASE_DIR = path.join(process.cwd(), "uploads");
export const PUBLIC_BASE_DIR = path.join(process.cwd(), "public");
export const EXPENSE_DIR = path.join(UPLOAD_BASE_DIR, "expense");
export const REPORT_DIR = path.join(UPLOAD_BASE_DIR, "report");
export const LOAD_DIR = path.join(UPLOAD_BASE_DIR, "loads");
export const CARRIER_DOCUMENTS_DIR = path.join(UPLOAD_BASE_DIR, "carrier-documents");
export const CUSTOMER_DIR = path.join(UPLOAD_BASE_DIR, "customer");
export const CHECKOUT_DIR = path.join(UPLOAD_BASE_DIR, "checkout");
export const DRIVING_LICENSE_DIR = path.join(UPLOAD_BASE_DIR, "driving-license");
export const INVOICE_DIR = path.join(UPLOAD_BASE_DIR, "invoice");
export const CUSTOMER_DOCUMENTS_DIR = path.join(UPLOAD_BASE_DIR, "customer-documents");
export const CUSTOMER_INSURANCE_DOCUMENTS_DIR = path.join(UPLOAD_BASE_DIR, "customer-insurance-documents");
export const CARRIER_INSURANCE_DOCUMENTS_DIR = path.join(UPLOAD_BASE_DIR, "carrier-insurance-documents");
export const COMPANY_LOGO_DIR = path.join(UPLOAD_BASE_DIR, "company-logo");
export const JOURNAL_ENTRY_DIR = path.join(UPLOAD_BASE_DIR, "journal-entry");

export const ALL_DIRECTORY_LIST = [
  UPLOAD_BASE_DIR,
  EXPENSE_DIR,
  LOAD_DIR,
  CARRIER_DOCUMENTS_DIR,
  CUSTOMER_DIR,
  CHECKOUT_DIR,
  INVOICE_DIR,
  CUSTOMER_DOCUMENTS_DIR,
  COMPANY_LOGO_DIR,
  CUSTOMER_INSURANCE_DOCUMENTS_DIR,
  CARRIER_INSURANCE_DOCUMENTS_DIR,
  DRIVING_LICENSE_DIR,
  JOURNAL_ENTRY_DIR,
  REPORT_DIR,
];

export default {
  PORT,
  JWT_SECRET,
  JWT_EXPIRE,
  REFRESH_TOKEN_SECRET,
  FRONTEND_URL,
  MONGO_URI,
  RABBITMQ_URL,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  NHTSA_URL,
  NODE_ENV,
  isProduction,
  sessionExpireTime,
  fullurl,
  UPLOAD_BASE_DIR,
  PUBLIC_BASE_DIR,
  EXPENSE_DIR,
  REPORT_DIR,
  LOAD_DIR,
  CARRIER_DOCUMENTS_DIR,
  CUSTOMER_DIR,
  CHECKOUT_DIR,
  DRIVING_LICENSE_DIR,
  INVOICE_DIR,
  CUSTOMER_DOCUMENTS_DIR,
  CUSTOMER_INSURANCE_DOCUMENTS_DIR,
  CARRIER_INSURANCE_DOCUMENTS_DIR,
  COMPANY_LOGO_DIR,
  JOURNAL_ENTRY_DIR,
  ALL_DIRECTORY_LIST,
  RUN_ON_CLUSTER
};