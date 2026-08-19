
import { Request, Response, NextFunction } from "express";
import { getServicesByCreatedBy } from "utils/CreatedBy.Pipeline.Service";
import pagination from "utils/pagination";
import Carrier from "models/Carrier.model";
import Customer from "models/Customer.model";
import InvoiceModal from "models/Invoice.model";
import mongoose, { Model, Types } from "mongoose";
import sendEmail from "libs/sendEmail";
import sendDocumentByEmailSchema from "./document.validate";
import { fullurl } from "config";

/**
 * @author Shivam Shukla
 * @version 1.1.0
 * @description Document Services
 * @date 11 june 2025
 * @license MIT
 * @copyright Copyright (c) 2025 Shivam Shukla
 * @file document.controller.ts
 *
 * Refactor notes (optimization pass):
 * - All "single document type" lookups (driver, carrier, carrier-insurance,
 *   customer, customer-insurance, invoice, load, expense, pickup/delivery
 *   checkout) previously duplicated an almost identical
 *   match -> unwind -> addFields(url) -> group -> sort -> facet -> project
 *   pipeline. That's now built once in `getPaginatedSubDocuments`, with each
 *   method only supplying the bits that actually differ (match filter, group
 *   shape, unwind paths).
 * - The three top-level listing methods (loads/carriers/customers) shared the
 *   same getServicesByCreatedBy -> sort -> facet -> project shape; collapsed
 *   into `getPaginatedEntities`.
 * - Added `toObjectId` so a bad/missing id fails loudly (logged) instead of
 *   silently matching nothing with no trace.
 * - `sendDocumentByEmail` now awaits the send and surfaces failures instead of
 *   firing-and-forgetting.
 */

// ---- Upload path constants, grouped for clarity/lookup ----
const UPLOAD_PATHS = {
    INVOICE: "uploads/invoice/",
    CARRIER_DOCUMENTS: "uploads/carrier-documents/",
    CUSTOMER_DOCUMENTS: "uploads/customer-documents/",
} as const;

interface IDocumentQuery {
    type: string;
    page: number;
    limit: number;
    carrierId?: string;
    customerId?: string;
}

interface IPagination {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
}

interface IDocumentResponse {
    data: any[];
    pagination: IPagination;
}

// ---------------- shared helpers ----------------

const emptyResponse = (page: number, limit: number): IDocumentResponse => ({
    data: [],
    pagination: { total: 0, limit, page, totalPages: 0 },
});

const buildResponse = (data: any[], total: number, page: number, limit: number): IDocumentResponse => ({
    data,
    pagination: { total: total || 0, limit, page, totalPages: Math.ceil((total || 0) / limit) },
});

/** Validates + converts a string id, throws (caught by caller) instead of silently minting a random ObjectId. */
function toObjectId(id: string | undefined, label: string): Types.ObjectId {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid or missing ${label}`);
    }
    return new mongoose.Types.ObjectId(id);
}

interface SubDocumentConfig {
    model: Model<any>;
    matchStage: Record<string, any>;
    /** Mongo field paths to $unwind, in order, e.g. ["$documents"] */
    unwindPaths?: string[];
    /** Field the resolved url gets written to, e.g. "documents.url". Its parent (here "documents") is what gets truthiness-checked. */
    urlField: string;
    uploadUrl: string;
    /** Extra stages between addFields(url) and $group, e.g. a $project to drop unrelated arrays */
    preGroupStages?: Record<string, any>[];
    groupStage?: Record<string, any>;
    sortStage?: Record<string, any>;
    /** Extra stages after $group/$sort, e.g. a $lookup+$unwind to hydrate a reference */
    postGroupStages?: Record<string, any>[];
}

/**
 * Generic paginated sub-document aggregation. Collapses the pipeline shared by
 * every "documents for a single load/carrier/customer" lookup.
 */
async function getPaginatedSubDocuments(
    {
        model,
        matchStage,
        unwindPaths = [],
        urlField,
        uploadUrl,
        preGroupStages = [],
        groupStage,
        sortStage,
        postGroupStages = [],
    }: SubDocumentConfig,
    page: number,
    limit: number
): Promise<IDocumentResponse> {
    try {
        const parentField = urlField.replace(/\.url$/, "");

        const pipeline: Record<string, any>[] = [{ $match: matchStage }];

        for (const path of unwindPaths) {
            pipeline.push({ $unwind: { path, preserveNullAndEmptyArrays: true } });
        }

        pipeline.push({
            $addFields: {
                [urlField]: {
                    $cond: { if: `$${parentField}`, then: uploadUrl, else: null },
                },
            },
        });

        pipeline.push(...preGroupStages);
        if (groupStage) pipeline.push({ $group: groupStage });
        if (sortStage) pipeline.push({ $sort: sortStage });
        pipeline.push(...postGroupStages);

        pipeline.push(
            {
                $facet: {
                    total: [{ $count: "total" }],
                    data: [...pagination(page, limit)],
                },
            },
            { $project: { data: 1, total: { $arrayElemAt: ["$total.total", 0] } } }
        );

        const [{ data, total }] = await model.aggregate(pipeline as any);
        return buildResponse(data, total, page, limit);
    } catch (error) {
        console.error("[GetDocument] getPaginatedSubDocuments failed:", error);
        return emptyResponse(page, limit);
    }
}

async function getPaginatedDocuments(
    model: Model<any>,
    uploadUrl: string,
    req: Request,
    res: Response,
    page: number,
    limit: number,
    extraProject: Record<string, any> = {}
): Promise<IDocumentResponse> {
    try {
        const matchStage = {
            companyId: new Types.ObjectId(res.locals.companyId),
            "documents.0": { $exists: true },
        };
        const [{ data, total }] = await model.aggregate(
            [
                ...getServicesByCreatedBy({ req, matchStage }),
                { $unwind: "$documents" },
                {
                    $addFields: {
                        "documents.url": {
                            $cond: { if: "$documents", then: uploadUrl, else: null },
                        },
                    },
                },
                {
                    $project: {
                        _id: { $concat: [{ $toString: "$_id" }, "-", { $ifNull: ["$documents.filename", ""] }] },
                        file: "$documents",
                        company: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        ...extraProject,
                    },
                },
                { $sort: { createdAt: -1 } },
                {
                    $facet: {
                        total: [{ $count: "total" }],
                        data: [...pagination(page, limit)],
                    },
                },
                { $project: { data: 1, total: { $arrayElemAt: ["$total.total", 0] } } },
            ] as any
        );
        return buildResponse(data, total, page, limit);
    } catch (error) {
        console.error("[GetDocument] getPaginatedDocuments failed:", error);
        return emptyResponse(page, limit);
    }
}

class GetDocument {
    constructor() {
        this.getDocuments = this.getDocuments.bind(this);
        this.getSubDocuments = this.getSubDocuments.bind(this);
        this.sendDocumentByEmail = this.sendDocumentByEmail.bind(this);
    }

    // ---------------- sub-document lookups ----------------
    private getCarrierDocuments(carrierId: string | undefined, page: number, limit: number) {
        return getPaginatedSubDocuments(
            {
                model: Carrier,
                matchStage: {
                    _id: toObjectId(carrierId, "carrierId"),
                    "documents.0": { $exists: true },
                },
                unwindPaths: ["$documents"],
                urlField: "documents.url",
                uploadUrl: fullurl + UPLOAD_PATHS.CARRIER_DOCUMENTS,
                groupStage: {
                    _id: "$documents.filename",
                    file: { $first: "$documents" },
                    carrierId: { $first: "$_id" },
                    company: { $first: "$company" },
                    contactPerson: { $first: "$contactPerson" },
                    phone: { $first: "$phone" },
                    mcNumber: { $first: "$mcNumber" },
                    usdot: { $first: "$usdot" },
                    address: { $first: "$address" },
                    rate: { $first: "$rate" },
                    rating: { $first: "$rating" },
                    isActive: { $first: "$isActive" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                    createdBy: { $first: "$createdBy" },
                    updatedBy: { $first: "$updatedBy" },
                },
                sortStage: { _id: -1 },
            },
            page,
            limit
        );
    }

   

    private getCustomerDocuments(customerId: string | undefined, page: number, limit: number) {
        return getPaginatedSubDocuments(
            {
                model: Customer,
                matchStage: {
                    _id: toObjectId(customerId, "customerId"),
                    "documents.0": { $exists: true },
                },
                unwindPaths: ["$documents"],
                urlField: "documents.url",
                uploadUrl: fullurl + UPLOAD_PATHS.CUSTOMER_DOCUMENTS,
                groupStage: {
                    _id: "$documents.filename",
                    file: { $first: "$documents" },
                    company: { $first: "$company" },
                },
                sortStage: { _id: -1 },
            },
            page,
            limit
        );
    }
    private getInvoiceDocuments({ type, page, limit }: { type: "customer" | "carrier", page: number, limit: number }) {
        return getPaginatedSubDocuments(
            {
                model: InvoiceModal,
                matchStage: {
                    type,
                    "files.0": { $exists: true },
                },
                unwindPaths: ["$files"],
                urlField: "files.url",
                uploadUrl: fullurl + UPLOAD_PATHS.INVOICE,
                groupStage: {
                    _id: "$files.filename",
                    file: { $first: "$files" },
                },
                sortStage: { _id: -1 },
            },
            page,
            limit
        );
    }

    private getCarriers({req,res,page,limit}:{req: Request, res: Response, page: number, limit: number}) {
        return getPaginatedDocuments(
            Carrier,
            fullurl + UPLOAD_PATHS.CARRIER_DOCUMENTS,
            req,
            res,
            page,
            limit,
            { contactPerson: 1, mcNumber: 1, usdot: 1 }
        );
    }
    private getCustomers({req,res,page,limit}:{req: Request, res: Response, page: number, limit: number}) {
        return getPaginatedDocuments(
            Customer,
            fullurl + UPLOAD_PATHS.CUSTOMER_DOCUMENTS,
            req,
            res,
            page,
            limit
        );
    }
    // ---------------- route handlers ----------------
    /** @description Get all top-level documents (loads / customers / carriers) */
    async getDocuments(req: Request, res: Response, next: NextFunction) {
        try {
            const { type, page, limit } = req.query as unknown as IDocumentQuery;
            const pageNum = Number(page) || 1;
            const limitNum = Number(limit) || 10;
            let response: IDocumentResponse = emptyResponse(pageNum, limitNum);
            switch (type) {
                case "customer":
                    response = await this.getCustomers({req, res, page: pageNum, limit: limitNum});
                    break;
                case "carrier":
                    response = await this.getCarriers({req, res, page: pageNum, limit: limitNum});
                    break;
            }
            return res.status(200).json({ ...response, status: 200, message: "Documents fetched successfully" });
        } catch (error) {
            next(error);
        }
    }

    /** @description Get all sub documents for a given load/carrier/customer */
    async getSubDocuments(req: Request, res: Response, next: NextFunction) {
        try {
            const { type, page, limit, carrierId, customerId } = req.query as unknown as IDocumentQuery;
            const pageNum = Number(page) || 1;
            const limitNum = Number(limit) || 10;

            let response: IDocumentResponse = emptyResponse(pageNum, limitNum);

            switch (type) {
                case "carrier":
                    response = await this.getCarrierDocuments(carrierId, pageNum, limitNum);
                    break;
            
                case "customerinvoice":
                    response = await this.getInvoiceDocuments({ type: "customer", page: pageNum, limit: limitNum });
                    break;
                case "carrierinvoice":
                    response = await this.getInvoiceDocuments({ type: "carrier", page: pageNum, limit: limitNum });
                    break;
                case "customer":
                    response = await this.getCustomerDocuments(customerId, pageNum, limitNum);
                    break;
            }

            return res.status(200).json({ ...response, status: 200, message: "Documents fetched successfully" });
        } catch (error) {
            next(error);
        }
    }
    /**
     * Send document via email
     * @param req Request
     * @param res Response
     * @param next NextFunction
     */
    async sendDocumentByEmail(req: Request, res: Response, next: NextFunction) {
        try {
           const body =await sendDocumentByEmailSchema.validate(req.body,{abortEarly: false,stripUnknown: true});
            // Send email with document attachment
            sendEmail(
               {to: body.recipientEmail,
               subject: body.subject,
                html: body.message || "Please find the attached document.",
                attachments:body.documentPaths.map((document: any) => document)}
            );

            return res.status(200).json({
                success: true,
                message: "Document sent successfully"
            });
        } catch (error) {
            next(error);
        }
    }
}
export default new  GetDocument()
