import { Role } from "microservices/auth-service/types";
import User from "models/user.model";
import { defaultAdmin, defaultCompany, defaultSuperAdmin } from "./data";
import companyModel, { ICompany } from "models/company.model";
import { ClientSession, Types } from "mongoose";
import redisService from "config/redis/redisService";

export const createDefaultSuperAdmin = async ({ session }: { session: ClientSession }): Promise<{ superAdmin: Types.ObjectId }> => {
    try {
        const defaultSuperAdminData = defaultSuperAdmin();
        let superAdmin = await User.findOne({ role: Role.SUPERADMIN, email: defaultSuperAdminData.email }).session(session);
        if (superAdmin) {
            console.info("Super admin already exists, updating...");
            await superAdmin.set(defaultSuperAdminData).save({ session });
        } else {
            console.info("Creating super admin...");
            [superAdmin] = await User.create([defaultSuperAdminData], { session });
            console.info("Super admin created successfully");
        }
        if (!superAdmin) {
            throw new Error("Failed to create/update super admin");
        }
        return { superAdmin: superAdmin._id };
    } catch (error) {
        console.error("Error in createDefaultSuperAdmin:", error);
        throw error;
    }
};

export const createDefaultAdmin = async ({ superAdminId, session }: { superAdminId: Types.ObjectId; session: ClientSession }): Promise<{ admin: Types.ObjectId; companyId: Types.ObjectId }> => {
    try {
        let company: ICompany | null = null;
        const adminData = defaultAdmin({ superAdminId });
        let admin = await User.findOne({ role: Role.ADMIN, email: adminData.email }).session(session);
        if (admin) {
            console.info("Admin already exists, updating...");
            await admin.set(adminData).save({ session });
            company = await companyModel.findOneAndUpdate({ createdBy: admin._id }, defaultCompany(admin._id), { upsert: true, new: true, session });
            await redisService.deleteMatchingKeys('company-*');
        } else {
            console.info("Creating admin user...");
            [admin] = await User.create([adminData], { session });
            console.info("Admin user created successfully");
            company = await companyModel.findOneAndUpdate({ createdBy: admin._id }, defaultCompany(admin._id), { upsert: true, new: true, session });
            await redisService.deleteMatchingKeys('company-*');
        }
        return {
            admin: admin._id,
            companyId: company?._id,
        };
    } catch (error) {
        console.error("Error in createDefaultAdmin:", error);
        throw error;
    }
};
