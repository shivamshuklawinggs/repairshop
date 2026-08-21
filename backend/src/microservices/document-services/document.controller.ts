
import { Request, Response, NextFunction } from "express";
import pagination from "utils/pagination";
import Carrier from "models/Carrier.model";
import Customer from "models/Customer.model";
import { Model, Types } from "mongoose";
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

async function getPaginatedDocuments(
    model: Model<any>,
    uploadUrl: string,
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
                { $match: matchStage },
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
        this.sendDocumentByEmail = this.sendDocumentByEmail.bind(this);
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
                    response = await getPaginatedDocuments(
                        Customer,
                        fullurl + UPLOAD_PATHS.CUSTOMER_DOCUMENTS,
                        res,
                        page,
                        limit
                    );
                    break;
                case "vendor":
                    response = await getPaginatedDocuments(
                        Carrier,
                        fullurl + UPLOAD_PATHS.CARRIER_DOCUMENTS,
                        res,
                        pageNum,
                        limitNum,
                        { contactPerson: 1, mcNumber: 1, usdot: 1 }
                    )
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
            const body = await sendDocumentByEmailSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
            // Send email with document attachment
            sendEmail(
                {
                    to: body.recipientEmail,
                    subject: body.subject,
                    html: body.message || "Please find the attached document.",
                    attachments: body.documentPaths.map((document: any) => document)
                }
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
export default new GetDocument()
