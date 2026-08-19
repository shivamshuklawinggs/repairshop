import { Role } from "microservices/auth-service/types"
import { ICompany } from "models/company.model"
import { IUserPlanDocument } from "models/user.plans.model"
import { Document, Types } from "mongoose"

export const defaultPlans = ({ superAdminId }: { superAdminId: Types.ObjectId }) => {
    const plans: Omit<IUserPlanDocument, keyof Document>[] = [
        {
            name: 'Free Plan',
            description: 'This is a free plan with limited features.',
            price: 0,
            noOfUsers: 2,
            noOfDays: 15,
            createdBy: superAdminId,
            updatedBy: superAdminId,
            isActive: true,
            noOfCompanies: 1,
            isUnlimited: false,
        },
        {
            name: 'Basic Plan',
            description: 'Basic plan for small businesses.',
            price: 29,
            noOfUsers: 10,
            noOfDays: 30,
            createdBy: superAdminId,
            updatedBy: superAdminId,
            isActive: true,
            noOfCompanies: 2,
            isUnlimited: false,
        },
        {
            name: 'Pro Plan',
            description: 'Professional plan for growing businesses.',
            price: 79,
            noOfUsers: 25,
            noOfDays: 30,
            createdBy: superAdminId,
            updatedBy: superAdminId,
            isActive: true,
            noOfCompanies: 5,
            isUnlimited: false,
        },
        {
            name: 'Enterprise Plan',
            description: 'Enterprise plan for large organizations.',
            price: 199,
            noOfUsers: 100,
            noOfDays: 365,
            createdBy: superAdminId,
            updatedBy: superAdminId,
            isActive: true,
            noOfCompanies: 10,
            isUnlimited: false,
        }
    ]
    return plans
}
export const defaultAdmin = ({ superAdminId }: { superAdminId: Types.ObjectId }) => {
    return {
        name: 'Admin',
        email: 'admin@freightbooks.net',
        password: '12345678',
        role: Role.ADMIN,
        createdBy: superAdminId,
        updatedBy: superAdminId,
    }
}
export const defaultSuperAdmin = () => {
    return {
        name: 'Super Admin',
        email: 'superadmin@freightbooks.net',
        password: '12345678',
        role: Role.SUPERADMIN,
    }
}
export const defaultCompany = (userId: Types.ObjectId) => {
    const company: Omit<ICompany, keyof Document> = {
        label: "Test-Company",
        description: "Test-Company",
        physicalDetails: {
            phone: "8459784241",
            email: "jenaro.xavian@dropmeon.com",
            address: "Test",
        },
        billingDetails: {
            phone: "8459784241",
            email: "jenaro.xavian@dropmeon.com",
            address: "Test",
        },
        mcNumber: "1631030",
        usdot: "4220124",
        prefix: "TEST",
        createdBy: userId,
        updatedBy: userId,
        ownerAdminId: userId,
        test: true,
        color: "#C2410C"
    }
    return company;
}



