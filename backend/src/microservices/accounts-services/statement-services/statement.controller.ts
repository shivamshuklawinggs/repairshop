import { Request, Response, NextFunction } from 'express';
import StatementService from 'models/statement.model';
import { AppError } from 'middlewares/error';
import mongoose, { ClientSession, Types } from 'mongoose';
import InvoiceModal from 'models/Invoice.model';
import { ICustomer } from 'models/Customer.model';
import path from 'path';
import ejs from "ejs"
import { Producer } from 'config/rabbitmq/producers';
import { formatDate } from 'utils';

const genearateStatementServiceSendEmail = async (id:Types.ObjectId,session:ClientSession): Promise<void> => {
  try {
    const statement = await StatementService.findById(id).populate<{customerId:ICustomer}>('customerId').session(session).lean()
    if (!statement) {
      throw new AppError("Statement not found", 404)
    }
   // / Render EJS template to HTML
    if (statement.customerId?.email) {
      const templatePath = path.join(__dirname, './statements-template.ejs');
      // Format dates properly for email
      const formattedStatement = {
        ...statement,
        createdAt:formatDate(statement.createdAt as Date),
        data: statement.data.map(item => ({
          ...item,
          invoiceDate: new Date(item.invoiceDate).toLocaleDateString(),
          dueDate: new Date(item.dueDate).toLocaleDateString()
        }))
      };
      
      const templateData = {
        statement: formattedStatement,
        unsubscribeUrl: `${process.env.COMPANY_WEBSITE || 'https://yourcompany.com'}/unsubscribe?email=${statement.customerId.email}`,
        companyWebsite: process.env.COMPANY_WEBSITE || 'https://yourcompany.com',
        companyName: process.env.COMPANY_NAME || 'Your Company',
        companyAddress: process.env.COMPANY_ADDRESS || '123 Business St, City, State 12345'
      };
      
      const html = await ejs.renderFile(templatePath, templateData, { async: true });
     await Producer.SendEmail({to:statement.customerId?.email, subject:"Account Statement", html});
    } else {
      throw new AppError("Customer email not found", 400)
    }
  } catch (error) {
    throw error
  }
};
/**
 * @description Create a new item service
 * @type POST
 * @path /api/item-services
 */
const createStatementService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  await session.startTransaction();

  try {
    req.body.createdBy = req.user?._id;
    req.body.updatedBy = req.user?._id;
    req.body.manager=req.user?.manager
    req.body.ownerAdminId=req.user?.ownerAdminId
    req.body.companyId = res.locals.companyId
    const  [data] = await StatementService.create([req.body], { session })
    if (!data) {
      throw new AppError("Statement not created", 400)
    }

    await genearateStatementServiceSendEmail(data._id,session)
    await session.commitTransaction()
    // send email to customer 
    res.status(201).json({ data: data, success: true, statusCode: 201, message: "Statement created and email sent successfully" });
  } catch (error) {
    await session.abortTransaction()
    next(error);
  }finally{
      await session.endSession();
    }
};
// 
const genearateStatementService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id = "", } = req.params
    const { startDate, endDate, } = req.query
    // pickup date

    const match: Record<string, any> =
    {
      customerId: new Types.ObjectId(id as string),
      companyId: new Types.ObjectId(res.locals.companyId),
    }

    if (startDate && endDate) {
      let satrt = new Date(startDate as string)
      let end = new Date(endDate as string)
      satrt.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      match['dueDate'] = { $lte: end, $gte: satrt }
    }
    else if (startDate) {
      let start = new Date(startDate as string)
      let end = new Date(startDate as string)
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      match['dueDate'] = { $lte: end, $gte: start }
    }
    else if (endDate) {
      let start = new Date(endDate as string)
      let end = new Date(endDate as string)
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      match['dueDate'] = { $lte: end, $gte: start }
    }
    const [result] = await InvoiceModal.aggregate([
      {
        $match: match
      },
      {
        $match: {
          "summary.balanceDue": { $gt: 0 }
        }
      },
      {
        $facet: {
          data: [
            {
              $project: {
                type: 1,
                invoiceNumber: 1,
                invoiceDate: 1,
                dueDate: 1,
                status: 1,
                totalAmount: "$summary.finalAmount",
                recievedAmount: "$summary.totalRecieved",
                balanceDue: "$summary.balanceDue",
              }
            }
          ],
          total: [
            {
              $lookup: {
                from: "customers",
                localField: "customerId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      company: "$company",
                      email: 1,
                      billingAddress: {
                        address: { $ifNull: ["$address", "$billingAddress.address"] },
                        city: { $ifNull: ["$city", "$billingAddress.city"] },
                        state: { $ifNull: ["$state", "$billingAddress.state"] },
                        zipCode: { $ifNull: ["$zipCode", "$billingAddress.zipCode"] },
                        country: { $ifNull: ["$country", "$billingAddress.country"] }
                      },
                      shippingAddress: {
                        address: { $ifNull: ["$address", "$shippingAddress.address"] },
                        city: { $ifNull: ["$city", "$shippingAddress.city"] },
                        state: { $ifNull: ["$state", "$shippingAddress.state"] },
                        zipCode: { $ifNull: ["$zipCode", "$shippingAddress.zipCode"] },
                        country: { $ifNull: ["$country", "$shippingAddress.country"] }
                      },
                      phone: 1,
                      paymentMethod: 1,
                    }
                  },
                ],
                as: "customer"
              }
            },

            {
              $unwind: { path: "$customer", preserveNullAndEmptyArrays: true }
            },

            {
              $addFields: {
                customer: {
                  $ifNull: ["$customer", {
                    company: "",
                    email: "",
                    billingAddress: {
                      address: "",
                      city: "",
                      state: "",
                      zipCode: "",
                      country: ""
                    },
                    shippingAddress: {
                      address: "",
                      city: "",
                      state: "",
                      zipCode: "",
                      country: ""
                    },
                    phone: "",
                    paymentMethod: ""
                  }]
                }
              }
            },
            {
              $group: {
                _id: null,
                totalBalance: { $sum: "$summary.finalAmount" },
                totalRecievedAmount: { $sum: "$summary.totalRecieved" },
                totalBalanceDue: { $sum: "$summary.balanceDue" },
                customer: { $first: "$customer" },
              
              }
            },
            {
              $project: {
                _id: 1,
                totalBalance: 1,
                totalRecievedAmount: 1,
                totalBalanceDue: 1,
                email: "$customer.email",
                phone: "$customer.phone",
                paymentMethod: "$customer.paymentMethod",
                company: "$customer.company",
                billingAddress: "$customer.billingAddress",
                account: "$customer.account",
              }
            }
          ]
        }
      },
      {
        $project: {
          data: 1,
          customer: { $arrayElemAt: ["$total", 0] }
        }
      }
    ])
    res.status(200).json({
      data: result,
      success: true,
      statusCode: 200,
      message: "Estimates fetched successfully"
    })
  } catch (error) {
    next(error)
  }
};

/**
 * @description Get all item services
 * @type GET
 * @path /api/item-services
 */
const getAllStatementServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const match: Record<string, any> = {
      companyId: new Types.ObjectId(res.locals.companyId),
      customerId: new Types.ObjectId(req.query.customerId as string)
    }
    const statementServices = await StatementService.aggregate([
      {
        $match: match
      },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                company: "$company",
                email: 1,
                billingAddress: {
                  address: { $ifNull: ["$address", "$billingAddress.address"] },
                  city: { $ifNull: ["$city", "$billingAddress.city"] },
                  state: { $ifNull: ["$state", "$billingAddress.state"] },
                  zipCode: { $ifNull: ["$zipCode", "$billingAddress.zipCode"] },
                  country: { $ifNull: ["$country", "$billingAddress.country"] }
                },
                shippingAddress: {
                  address: { $ifNull: ["$address", "$shippingAddress.address"] },
                  city: { $ifNull: ["$city", "$shippingAddress.city"] },
                  state: { $ifNull: ["$state", "$shippingAddress.state"] },
                  zipCode: { $ifNull: ["$zipCode", "$shippingAddress.zipCode"] },
                  country: { $ifNull: ["$country", "$shippingAddress.country"] }
                },
                phone: 1,
                paymentMethod: 1,
              }
            },
          ],
          as: "customer"
        }
      },

      {
        $unwind: { path: "$customer", preserveNullAndEmptyArrays: true }
      },

      {
        $addFields: {
          customer: {
            $ifNull: ["$customer", {
              company: "",
              email: "",
              billingAddress: {
                address: "",
                city: "",
                state: "",
                zipCode: "",
                country: ""
              },
              shippingAddress: {
                address: "",
                city: "",
                state: "",
                zipCode: "",
                country: ""
              },
              phone: "",
              paymentMethod: ""
            }]
          }
        }
      },
    ])
    res.status(200).json({ data: statementServices, success: true, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Get an item service by ID
 * @type GET
 * @path /api/item-services/:id
 */
const getStatementServiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await StatementService.findById(req.params.id);
    if (data) {
      res.status(200).json({ data: data, success: true, statusCode: 200 });
    } else {
      throw new AppError('Item Service not found', 404);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @description Update an item service by ID
 * @type PUT
 * @path /api/item-services/:id
 */
const updateStatementService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    req.body.updatedBy = req.user?._id;
    const updated = await StatementService.findOneAndUpdate({_id:req.params.id,companyId:res.locals.companyId}, req.body, { new: true, runValidators: true });
    if (updated) {
      res.status(200).json({ data: updated, success: true, statusCode: 200 });
    } else {
      throw new AppError('Item Service not found', 404);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @description Delete an item service by ID
 * @type DELETE
 * @path /api/item-services/:id
 */
const deleteStatementService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deleted = await StatementService.findByIdAndDelete(req.params.id);
    if (deleted) {
      res.status(204).json({ success: true, statusCode: 204 });
    } else {
      throw new AppError('Item Service not found', 404);
    }
  } catch (error) {
    next(error);
  }
};


export { createStatementService, getAllStatementServices, getStatementServiceById, updateStatementService, deleteStatementService, genearateStatementService };
