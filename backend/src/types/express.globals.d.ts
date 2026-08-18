import { Role } from "microservices/auth-service/types";
// Extend the Response.locals interface to include userId
declare global {
    namespace Express {
        interface Locals {
            companyId: string
        }
    }
}
