import { Request, Response, NextFunction } from 'express';
import Customer, { ICustomer } from 'models/Customer.model';
import pagination from 'utils/pagination';
import { AppError } from 'middlewares/error';
import mongoose, { Types } from 'mongoose';
import { IFile } from 'types/file';
import { FileService } from './services/file.service';
import { getInvoiceSummaryPipeline } from 'utils/getInvoiceSummaryPipeline';
import { parseCsvToJson } from 'utils/parseCsvToJson';
import { unflatten } from 'utils/unflatten';
import PaymentTerms, { IPaymentTerms } from 'models/PaymentTerms.model';
import { generateUniqueId } from 'models/universalid.model';
import { parseJsonToCsv } from 'utils/parseJsonToCsv';
import { clean, parseCleanValidate } from 'middlewares/cleanRequestBodyMiddleware';
import { CustomerFilters } from './services/filter.service';
import { accountingCustomerSchema } from 'shared/CustomerSchema';
type CustomerWithpaymentTerms = Omit<ICustomer, 'paymentTerms' | 'parentCustomer'> & { paymentTerms: IPaymentTerms, balanceDue: number, parentCustomer: ICustomer };
export default class CustomerController {
  constructor() {
    // this.validateInvoice = this.validateInvoice.bind(this);
  }
  /**
   * @description Create a new customer
   * @type POST
   * @path /api/customers
   */
  static createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession()
    await session.startTransaction()
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Check for required documents
      req.body = await parseCleanValidate(req.body.CustomerData, accountingCustomerSchema)
      const userId = req.user?._id
      req.body.documents = files.documents as IFile[]
      req.body.createdBy = userId
      req.body.updatedBy = userId
      req.body.manager = req.user?.manager
      req.body.ownerAdminId = req.user?.ownerAdminId
      req.body.companyId = res.locals.companyId

      if (!req.body.paymentTerms) {
        req.body.paymentTerms = undefined
      }
      req.body.id = await generateUniqueId({ prefix: "CUSTOMER-", session, companyId: res.locals.companyId as unknown as Types.ObjectId })
      const [data] = await Customer.create([req.body], { session: session });
      await session.commitTransaction()
      res.status(201).json({ data: data, success: true, statusCode: 201 });
    } catch (error) {
      console.warn(error)
      await session.abortTransaction()
      next(error);
    } finally {
      await session.endSession();
    }
  };

  /**
   * @description Get all customers
   * @type GET
   * @path /api/customers
   */
  static getAllCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let { page = 1, limit = 10, } = req.query
      const { matchStage, initmatchStage } = CustomerFilters(req, {
        companyId: new Types.ObjectId(res.locals.companyId),
      })
      // use aggregate 
      const [result] = await Customer.aggregate([
        {
          $match: initmatchStage
        },

        // invoice calulate
        ...getInvoiceSummaryPipeline(),
        {
          $match: matchStage
        },
        {
          $sort: {
            createdAt: -1
          }
        },
        {
          $facet: {
            data: [...pagination(page as string, limit as string),
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
                from: 'customers',
                localField: 'parentCustomer',
                foreignField: '_id',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
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
            ], // Ensure pagination returns an array of valid pipeline stages
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
      const data = result?.data || [];
      const total = result?.total || 0;

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
      console.warn(error)
      next(error);
    }
  };



  /**
   * @description Get a customer by ID
   * @type GET
   * @path /api/customers/:id
   */
  static getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [customer] = await Customer.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(req.params.id)
          }
        },
        {
          $lookup:
          {
            from: "paymentterms",
            localField: "paymentTerms",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  days: 1
                }
              }
            ],
            as: "paymentTermsData"
          }
        }
      ])
      if (customer) {
        res.status(200).json({ data: customer, success: true, statusCode: 200 });
      } else {
        throw new AppError('Customer not found', 404);
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Update a customer by ID
   * @type PUT
   * @path /api/customers/:id
   */
  static updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession()
    await session.startTransaction()
    try {
      const userId = req.user?._id
      // Add new files if uploaded
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      req.body = await parseCleanValidate(req.body.CustomerData, accountingCustomerSchema)
      req.body.updatedBy = userId
      const {  documents, ...CustomerData } = req.body

      const data = await Customer.findById(req.params.id).session(session);
      if (!data) {
        throw new AppError('Customer not found', 404);
      }
      // Delete files if specified
      let updatedata = {
        ...CustomerData,
        updatedBy: userId
      }
      if (req?.body?.deletedfiles?.length > 0) {
        await FileService.deleteFiles(req?.body?.deletedfiles);
        data.documents = data.documents?.filter((file) => !req?.body?.deletedfiles.includes(file.filename));
      }

      if (files?.documents) {
        data.documents?.push(...files.documents);
      }


      if (data?.documents?.length === 0) {
        data.documents = [];
      }

      data.set(updatedata)
      if (!data.paymentTerms) {
        delete (data as any).paymentTerms;
      }
      await data.save({ session: session });
      await session.commitTransaction()
      res.status(200).json({ data: data, success: true, statusCode: 200 });
    } catch (error) {
      await session.abortTransaction()
      next(error);
    } finally {
      await session.endSession();
    }
  };

  /**
   * @description Delete a customer by ID
   * @type DELETE
   * @path /api/customers/:id
   */
  static deleteCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    await session.startTransaction();
    try {
      const customerId = req.params.id;


      const customer = await Customer.findById(customerId).session(session);
      if (!customer) {
        throw new AppError('Customer not found', 404);
      }

      // Delete customer-related files
      await Promise.all([
        FileService.deleteExistedFiles(customer.documents || []),
      ]);

      // Delete the customer
      await customer.deleteOne({ session });

      await session.commitTransaction();

      res.status(204).json({ success: true, statusCode: 204 });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      await session.endSession();
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
        ownerAdminId: req.user?.ownerAdminId,
        manager: req.user?.manager,
      });

      // ✅ Transform flat addresses into nested objects
      const transformedData = parsedData.map(record => {
        clean(record)
        return unflatten(record)
      })
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
      for (const item of transformedData as ICustomer[]) {
        item.id = await generateUniqueId({ prefix: "CUSTOMER-", session, companyId: res.locals.companyId as unknown as Types.ObjectId });
        if (item.paymentTerms) {
          item.paymentTerms = termsMap.get(item.paymentTerms);
        }
      }
    
  
      // ✅ Insert into DB
      for (const carrierData of transformedData) {
        const carrier = new Customer(carrierData);
        await carrier.validate(); // throws if documents required and missing
        await carrier.save({ session });
      }
      await session.commitTransaction();
      res.status(201).json({ success: true, data: transformedData });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      await session.endSession();
    }
  };


  static ExportCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let { page = 1, limit = 10, } = req.query

      const { matchStage, initmatchStage } = CustomerFilters(req, { companyId: new Types.ObjectId(res.locals.companyId), })
      // use aggregate 
      const result = await Customer.aggregate<CustomerWithpaymentTerms>([
        {
          $match: initmatchStage
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
            from: 'customers',
            localField: 'parentCustomer',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: 1,
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
        parentCustomer: typeof customer?.parentCustomer === 'object' ? `${customer?.parentCustomer?.company} ` || "N/A" : 'N/A'
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
        // { value: "parentCustomer", label: "Parent Customer" },
        { value: "notes", label: "Notes" },
      ]

      const base64 = parseJsonToCsv(data, fields)

      res.status(200).json({
        success: true, statusCode: 204,
        data: {
          filename: 'customers.csv',
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

