import dotenv from "dotenv"
import { daysToMs } from "utils/daysToMs";
dotenv.config()
type EnvConfig = {
  PORT: number;
  MONGO_URI: string;
  FRONTEND_URL: string;
  RABBITMQ_URL: string;
  fullurl: string;
  isProduction: boolean;
  REDIS_HOST: string,
  REDIS_PORT: string,
  REDIS_PASSWORD: string;
  JWT_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
  JWT_EXPIRE: number
  NHTSA_URL: string
  RUN_ON_CLUSTER: string,
  DATE_TIME_ZONE: string
  TIME_FORMAT:string
  TIME_FORMAT_HOURS:string
};

const productionConfig: EnvConfig = {
  NHTSA_URL: process.env.NHTSA_URL as string,
  TIME_FORMAT:'MM/DD/YYYY',
  TIME_FORMAT_HOURS:'MM/DD/YYYY hh:mm A',
  RUN_ON_CLUSTER: process.env.RUN_ON_CLUSTER as string,
  DATE_TIME_ZONE: process.env.DATE_TIME_ZONE as string,
  PORT: Number(process.env.PORT_PRODUCTION || process.env.PORT || 3000),
  JWT_SECRET: process.env.JWT_SECRET as string,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
  JWT_EXPIRE: daysToMs(365),
  MONGO_URI: process.env.MONGO_URI_PRODUCTION || process.env.MONGO_URI || "",
  FRONTEND_URL: process.env.FRONTEND_URL_PRODUCTION || process.env.FRONTEND_URL || "",
  RABBITMQ_URL: process.env.RABBITMQ_URL_PRODUCTION || "",
  fullurl: process.env.PRODUCTIONURL || process.env.DEVELOPMENTURL || "",
  isProduction: true,
  REDIS_HOST: process.env.REDIS_HOST_PRODUCTION as string,
  REDIS_PORT: process.env.REDIS_PORT_PRODUCTION as string,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD_PRODUCTION as string
};
// Validate staging configuration

for (const field of Object.keys(productionConfig)) {

  const value = productionConfig[field as keyof EnvConfig];
  if (typeof value !== 'boolean' && !value) {
    throw new Error(`Missing required development configuration: ${field}`);
  }
}
export default productionConfig;
