import { Request, Response, NextFunction } from 'express';
import Carrier, { ICarrier } from 'models/Carrier.model';
import pagination from 'utils/pagination';
import { AppError } from 'middlewares/error';
import { FileService } from './carrier.file.service';
import { IFile } from 'types/file';
import { parseJSON } from 'libs';
import { ValidateVendorSchema } from './carrier.validate';
import mongoose, {  Types } from 'mongoose';
import { Parser } from 'json2csv';
import { generateUniqueId } from 'models/universalid.model';
import { unflatten } from 'utils/unflatten';
import PaymentTerms from 'models/PaymentTerms.model';
import { parseCsvToJson } from 'utils/parseCsvToJson';
import { CarrierFilters, CarriersGroup } from './filter.service';
import { clean, parseCleanValidate } from 'middlewares/cleanRequestBodyMiddleware';
import { getInvoiceSummaryPipeline } from 'utils/getInvoiceSummaryPipeline';

export default class CarrierController {

  /**
   * @description Get all vendors
   * @type GET
   * @path /api/vendors
   */
  static getAllVendors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 10, isAll = "1" } = req.query;


      const { initmatchStage, matchStage } = CarrierFilters(req, {
        isCarrier: false,
        companyId: new mongoose.Types.ObjectId(res.locals.companyId)
      })
      if (isAll) {
        delete initmatchStage.isCarrier
      }
      const result = await Carrier.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(res.locals.companyId),
            ...initmatchStage
          }
        },
        {
          $addFields: {
            carrier: {
              rate: "$rate"
            }
          }
        },
       ...getInvoiceSummaryPipeline(),
        {
          $match: matchStage
        },
        // end invoice calculate
        {
          $addFields: {
            company: { $ifNull: ["$company", "$company"] },
            billingAddress: {
              address: { $ifNull: ["$billingAddress.address", "$address"] },
              city: { $ifNull: ["$billingAddress.city", "$city"] },
              state: { $ifNull: ["$billingAddress.state", "$state"] },
              zipCode: { $ifNull: ["$billingAddress.zipCode", "$zipCode"] },
              country: { $ifNull: ["$billingAddress.country", "$country"] }
            },
            shippingAddress: {
              address: { $ifNull: ["$shippingAddress.address", "$address"] },
              city: { $ifNull: ["$shippingAddress.city", "$city"] },
              state: { $ifNull: ["$shippingAddress.state", "$state"] },
              zipCode: { $ifNull: ["$shippingAddress.zipCode", "$zipCode"] },
              country: { $ifNull: ["$shippingAddress.country", "$country"] }
            },
          }
        },
        {
          $lookup: {
            from: "paymentterms",
            localField: "paymentTerms",
            foreignField: "_id",
            as: "paymenttermsdata"
          }
        },
        {
          $unwind: {
            path: "$paymenttermsdata",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            paymenttermsdata: {
              $ifNull: ["$paymenttermsdata", ""]
            }
          }
        },

        {
          $sort: { createdAt: -1 }
        },
        {
          $facet: {
            data: pagination(page as string, limit as string), // Ensure pagination returns an array of valid pipeline stages
            total: [{ $count: "total" }]
          }
        },
        {
          $project: {
            data: 1,
            total: { $arrayElemAt: ["$total.total", 0] }, // Extract total count correctly
          }
        }
      ])
      // Ensure result is not empty and extract data correctly
      const data = result.length > 0 ? result[0].data : [];
      const total = result.length > 0 ? result[0].total || 0 : 0;


      res.status(200).json({
        data: data, success: true,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: total,
          totalPages: Math.ceil(total / Number(limit)),
        },
        statusCode: 200
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Get all customer Filters
   * @type GET
   * @path /api/carriers/Filters
   */
  static getAllCarriersFilters = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await CarriersGroup(res)
      res.status(200).json({
        data: data, success: true,
        statusCode: 200
      });
    } catch (error) {
      console.warn(error)
      next(error);
    }
  };

  static updateCarrierDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deletedfiles = parseJSON(req?.body?.deletedfiles)
      const files = req.files as IFile[]

      const updated = await Carrier.findOne({ _id: req.params.id });
      if (!updated) {
        throw new AppError('Carrier not found', 404);
      }

      if (files as IFile[] && files.length > 0) {
        files.forEach((file) => {
          updated.documents?.push(file);
        });
      }
      if (deletedfiles && deletedfiles?.length) {
        await FileService.deleteFiles(deletedfiles)
        updated.documents = updated.documents?.filter((file) => !deletedfiles.includes(file.filename));
      }
      await updated.save();

      res.status(200).json({ data: updated, success: true, statusCode: 200 });
    } catch (error) {
      next(error);
    }
  };
  static getCarrierDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const carrier = await Carrier.findOne({ _id: req.params.id }, { documents: 1 });

      res.status(200).json({ data: carrier?.documents || [], success: true, statusCode: 200 });

    } catch (error) {
      next(error);
    }
  };
 
  /**
   * @description Create a new vendor
   * @type POST
   * @path /api/carriers/vendor
   */
  static createVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession()
    await session.startTransaction()
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      req.body = await parseCleanValidate(req.body.carrierData, ValidateVendorSchema)
      // Assign both types of documents
      req.body.documents = files.documents;

      req.body.createdBy = req.user?._id;
      req.body.updatedBy = req.user?._id;
      req.body.manager=req.user?.manager
      req.body.ownerAdminId=req.user?.ownerAdminId
      req.body.companyId = res.locals.companyId
      req.body.isCarrier = false
      req.body.id = await generateUniqueId({prefix:"VENDOR-", session,companyId:res.locals.companyId as unknown as Types.ObjectId})

      const [carrier] = await Carrier.create([req.body], { session: session });
      await session.commitTransaction()
      res.status(201).json({ data: carrier, success: true, statusCode: 201 });
    } catch (error) {
      console.warn(error)
      await session.abortTransaction()
      next(error);
    }finally{
      await session.endSession();
    }
  };
  /**
   * @description Update a vendor by ID
   * @type PUT
   * @path /api/carriers/vendor/:id
   */
  static updateVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession()
    await session.startTransaction()
    try {
      // Add new files if uploaded
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
       req.body = await parseCleanValidate(req.body.carrierData, ValidateVendorSchema)  
       req.body.updatedBy = req.user?._id;
      const { insuranceDocuments, documents, ...payload } = req.body
      // Handle deleted files
      const carrier = await Carrier.findById(req.params.id).session(session);
      if (!carrier) {
        throw new AppError('vendor not found', 404);
      }

      // Delete files if specified
      if (req?.body?.deletedfiles?.length > 0) {
        await FileService.deleteFiles(req?.body?.deletedfiles);
        carrier.documents = carrier.documents?.filter((file) => !req?.body?.deletedfiles.includes(file.filename));
      }

      if (files?.documents) {
        carrier.documents?.push(...files.documents);
      }
      // if (carrier?.documents?.length == 0) {
      //   throw new AppError('Please Upload Documents', 400);
      // }
      carrier.set(payload)
      await carrier.save({ session: session });
      await session.commitTransaction()
      res.status(200).json({
        status: 'success',
        data: carrier
      });
    } catch (error) {
      await session.abortTransaction()
      next(error);
    }finally{
      await session.endSession();
    }
  };
  /**
   * @description Delete a vendor by ID
   * @type DELETE
   * @path /api/carriers/vendor/:id
   */
  static deleteVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    await session.startTransaction();
    try {
      const carrierId = req.params.id;

      const carrier = await Carrier.findById(carrierId).session(session);
      if (!carrier) {
        throw new AppError('Vendor not found', 404);
      }
      // Delete carrier-related files
      await Promise.all([
        FileService.deleteExistedFiles(carrier.documents || []),
      ]);

      // Delete the carrier
      await carrier.deleteOne({ session });

      await session.commitTransaction();
      res.status(204).json({ success: true, statusCode: 204 });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    }finally{
      await session.endSession();
    }
  };
  static getVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await Carrier.findById(req.params.id);
      if (vendor) {
        res.status(200).json({ data: vendor, success: true, statusCode: 200 });
      } else {
        throw new AppError('Vendor not found', 404);
      }
    } catch (error) {
      next(error);
    }
  };
  static getAllVendorsAndCarriers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const { initmatchStage, matchStage } = CarrierFilters(req, {
        companyId: new mongoose.Types.ObjectId(res.locals.companyId),
      })
      const result = await Carrier.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(res.locals.companyId),
            ...initmatchStage
          }
        },
        {
          $addFields: {
            carrier: {
              rate: "$rate"
            }
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        ...getInvoiceSummaryPipeline(),
        {
          $match: matchStage
        },
        {
          $facet: {
            data: pagination(page as string, limit as string), // Ensure pagination returns an array of valid pipeline stages
            total: [{ $count: "total" }]
          }
        },
        {
          $project: {
            data: 1,
            total: { $arrayElemAt: ["$total.total", 0] }, // Extract total count correctly
          }
        }
      ])

      // Ensure result is not empty and extract data correctly
      const data = result.length > 0 ? result[0].data : [];
      const total = result.length > 0 ? result[0].total || 0 : 0;


      res.status(200).json({
        data: data, success: true,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: total,
          totalPages: Math.ceil(total / Number(limit)),
        },
        statusCode: 200
      });
    } catch (error) {
      next(error);
    }
  };
  static ImportCustomers = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    await session.startTransaction();

    try {
      const companyId = res.locals.companyId;
      const file = req.file as Express.Multer.File;
      if (!file) throw new AppError('No file uploaded', 400);

      // Parse CSV
      const parsedData = parseCsvToJson(file, {
        companyId,
        createdBy: req.user?._id,
        updatedBy: req.user?._id,
        testing: true,
        isCarrier: true,
        ownerAdminId: req.user?.ownerAdminId,
        manager: req.user?.manager
      });

      // ✅ Transform flat addresses into nested objects
      const transformedData = parsedData.map(record => {
        clean(record)
        return unflatten(record)
      });
      /** ----------------- TERMS ----------------- */
      const termsIds = [...new Set(transformedData.map((item: any) => item.paymentTerms))];
      const terms = await PaymentTerms.find(
        { name: { $in: termsIds }, companyId },
        { _id: 1, name: 1 }
      ).session(session);
      const termsMap = new Map(terms.map((c: any) => [c.name, c._id]));
      // Check for any terms in the CSV that do not exist in the DB
      const invalidTerms = termsIds.filter(term => term && !termsMap.has(term));
      if (invalidTerms.length > 0) {
        throw new AppError(`The following payment terms do not exist: ${invalidTerms.join(', ')}`, 400);
      }
      //  add terms in trnasform data
      for (const item of transformedData as ICarrier[]) {
        item.id = await generateUniqueId({prefix:"VENDOR-", session,companyId:res.locals.companyId as unknown as Types.ObjectId});
        if (item.paymentTerms) {
          item.paymentTerms = termsMap.get(item.paymentTerms);
        }
      }
      // ✅ Insert into DB
      for (const carrierData of transformedData) {
        const carrier = new Carrier(carrierData);
        await carrier.validate(); // throws if documents required and missing
        await carrier.save({ session });
      }

      // If all validated successfully, insertMany


      await session.commitTransaction();
      res.status(201).json({ success: true, data: transformedData });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    }finally{
      await session.endSession();
    }
  };
  static ExportCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let { page = 1, limit = 10 } = req.query


      const { initmatchStage, matchStage } = CarrierFilters(req, {
        companyId: new mongoose.Types.ObjectId(res.locals.companyId)
      })
      // use aggregate 
      const result = await Carrier.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(res.locals.companyId),
            ...initmatchStage
          }
        },

        {
          $lookup:
          {
            from: 'paymentterms',
            localField: 'paymentTerms',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  days: 1
                }
              }
            ],
            as: 'paymentTerms'
          }
        },
        {
          $unwind: { path: '$paymentTerms', preserveNullAndEmptyArrays: true }
        },
        {
          $lookup:
          {
            from: 'carriers',
            localField: 'parentCustomer',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  rate: 1,
                  displayCustomerName: 1,

                }
              }
            ],
            as: 'parentCustomer'
          }
        },
        {
          $unwind: { path: '$parentCustomer', preserveNullAndEmptyArrays: true }
        },
        {
          $addFields: {
            carrier: {
              rate: "$rate"
            }
          }
        },
         ...getInvoiceSummaryPipeline(),
        {
          $match: matchStage
        },
        {
          $sort: {
            createdAt: -1
          }
        },
        ...pagination(page as string, limit as string)
        ,

      ])
      // Ensure result is not empty and extract data correctly
      const data = result.map((customer) => ({
        ...customer,
        address: customer.shippingAddress?.address,
        balanceDue: customer.balanceDue,
        paymentTerms: typeof customer?.paymentTerms === 'object' ? `${customer?.paymentTerms?.name} (${customer?.paymentTerms?.days} days)` || "N/A" : 'N/A',
        parentCustomer: typeof customer?.parentCustomer === 'object' ? `${customer?.parentCustomer?.title} ` || "N/A" : 'N/A'
      }))

      const fields = [
        { value: "id", label: "ID" },
        { value: "name", label: "Name" },
        { value: "company", label: "Company" },
        { value: "displayCustomerName", label: "Display Customer Name" },
        { value: "email", label: "Email" },
        { value: "phone", label: "Phone" },
        { value: "mobileNo", label: "Mobile No" },
        { value: "billingAddress", label: "Billing Address" },
        { value: "shippingAddress", label: "Shipping Address" },
        { value: "paymentMethod", label: "Payment Method" },
        { value: "paymentTerms", label: "Payment Terms" },
        { value: "balanceDue", label: "Open Balance" },
        { value: "status", label: "Status" },
        { value: "rating", label: "Rating" },
        { value: "fax", label: "Fax" },
        { value: "other", label: "Other" },
        { value: "website", label: "Website" },
        { value: "nameToPrintOnCheck", label: "Name To Print On Check" },
        { value: "parentCustomer", label: "Parent Customer" },
        { value: "notes", label: "Notes" },
      ]
      const parser = new Parser({ fields });
      const csv = parser.parse(data); // CSV string

      const buffer = Buffer.from(csv, 'utf-8');
      const base64 = buffer.toString('base64');

      res.status(200).json({
        success: true, statusCode: 204,
        data: {
          filename: 'vendors.csv',
          mimeType: 'text/csv',
          base64: base64
        }
      });
    } catch (error) {
      console.warn(error)
      next(error);
    }
  };
}
