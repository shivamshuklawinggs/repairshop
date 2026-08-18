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
  JWT_EXPIRE: number;
  NHTSA_URL: string;
  RUN_ON_CLUSTER: string,
  DATE_TIME_ZONE: string,
  TIME_FORMAT:string
  TIME_FORMAT_HOURS:string
};

const stagingConfig: EnvConfig = {
  RUN_ON_CLUSTER: process.env.RUN_ON_CLUSTER as string,
  TIME_FORMAT:'MM/DD/YYYY',
  TIME_FORMAT_HOURS:'MM/DD/YYYY hh:mm A',
  NHTSA_URL: process.env.NHTSA_URL as string,
  DATE_TIME_ZONE: process.env.DATE_TIME_ZONE as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
  JWT_EXPIRE: daysToMs(365),
  PORT: Number(process.env.PORT_STAGING),
  MONGO_URI: process.env.MONGO_URI_STAGING as string,
  FRONTEND_URL: process.env.FRONTEND_URL_STAGING as string,
  RABBITMQ_URL: process.env.RABBITMQ_URL_STAGING as string,
  fullurl: process.env.STAGINGTURL as string,
  isProduction: false,
  REDIS_HOST: process.env.REDIS_HOST_STAGING as string,
  REDIS_PORT: process.env.REDIS_PORT_STAGING as string,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD_STAGING as string
};

// Validate staging configuration

for (const field of Object.keys(stagingConfig)) {

  const value = stagingConfig[field as keyof EnvConfig];
  if (typeof value !== 'boolean' && !value) {
    throw new Error(`Missing required development configuration: ${field}`);
  }
}

export default stagingConfig;
