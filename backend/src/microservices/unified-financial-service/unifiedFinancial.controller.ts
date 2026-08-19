import { Request, Response } from 'express';
import InvoiceModel from 'models/Invoice.model';
import BillModel from 'models/Bill.model';
import PaymentModel from 'models/payment.model';
import CustomerModel from 'models/Customer.model';
import CarrierModel from 'models/Carrier.model';
import UnifiedFinancialQueryBuilder,{ SearchQuery } from './UnifiedFinancialQueryBuilder';

import InvoiceController from 'microservices/accounts-services/invoice/invoice.controller';
import BillController from 'microservices/accounts-services/bill-services/bill.controller';
import { PaymentsCustomerPipeLine } from 'shared/pipelines/BaseLookups/BasePipelines';
import { getInvoiceSummaryPipeline } from 'utils/getInvoiceSummaryPipeline';
import { Types } from 'mongoose';


class UnifiedFinancialController {
  // GET all financial data with searchable queries
  async getAllFinancialData(req: Request, res: Response) {
    try {
      const companyId = new Types.ObjectId(res.locals.companyId);
      
      // Extract pagination parameters for each entity type
      const pagination = {
        invoices: {
          page: parseInt(req.query.invoicesPage as string) || 1,
          limit: parseInt(req.query.invoicesLimit as string) || 10
        },
        bills: {
          page: parseInt(req.query.billsPage as string) || 1,
          limit: parseInt(req.query.billsLimit as string) || 10
        },
        payments: {
          page: parseInt(req.query.paymentsPage as string) || 1,
          limit: parseInt(req.query.paymentsLimit as string) || 15
        },
        customers: {
          page: parseInt(req.query.customersPage as string) || 1,
          limit: parseInt(req.query.customersLimit as string) || 10
        },
        loads: {
          page: parseInt(req.query.loadsPage as string) || 1,
          limit: parseInt(req.query.loadsLimit as string) || 10
        },
        carriers: {
          page: parseInt(req.query.carriersPage as string) || 1,
          limit: parseInt(req.query.carriersLimit as string) || 10
        }
      };
      
      // Extract search parameters
      const query: SearchQuery = {
        search: req.query.search as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        status: req.query.status as string,
        paymentMethod: req.query.paymentMethod as string,
        invoiceNumber: req.query.invoiceNumber as string,
        billNumber: req.query.billNumber as string,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc',
        customerId: req.query.customerId as string,
        vendorId: req.query.vendorId as string,
        pagination
      };

      // Build filters and sort options
      const invoiceFilter = await UnifiedFinancialQueryBuilder.buildInvoiceFilter(query, companyId,req);
    
      const billFilter = await UnifiedFinancialQueryBuilder.buildBillFilter(query, companyId,req);
    
      const paymentFilter = await UnifiedFinancialQueryBuilder.buildPaymentFilter(query, companyId,req);
      const customerFilter = await UnifiedFinancialQueryBuilder.buildCustomerFilter(query, companyId,req);
      const carrierFilter = await UnifiedFinancialQueryBuilder.buildCarrierFilter(query, companyId,req);
      // permission
      const invPayBilAccess = await UnifiedFinancialQueryBuilder.hasAccessRole({action:"view",resource:["accounting"],req:req});
    
      const sortOptions = UnifiedFinancialQueryBuilder.buildSortOptions(query.sortBy, query.sortOrder);

      const invoicePipeline = UnifiedFinancialQueryBuilder.buildBasicPipeline(
        invoiceFilter, 
        sortOptions, 
        pagination.invoices.limit, 
        InvoiceController.InvoicePipline(),
        (pagination.invoices.page - 1) * pagination.invoices.limit
      );
      const billPipeline = UnifiedFinancialQueryBuilder.buildBasicPipeline(
        billFilter, 
        sortOptions, 
        pagination.bills.limit, 
        BillController.billPipline(),
        (pagination.bills.page - 1) * pagination.bills.limit
      );
      const paymentPipeline = UnifiedFinancialQueryBuilder.buildBasicPipeline(
        paymentFilter, 
        sortOptions, 
        pagination.payments.limit, 
        [
          ...PaymentsCustomerPipeLine(),
          {
            $lookup: {
              from: "chartofaccounts",
              localField: "depositTo",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    name: 1
                  }
                }
              ],
              as: "DespositeAccount"
            }
          },
          {
            $unwind: {
              preserveNullAndEmptyArrays: true,
              path: "$DespositeAccount"
            }
          },
          {
            $addFields: {
              type: {
                $cond: [
                  { $eq: ["$PaymentType", "invoice"] },
                  "Invoice",
                  {
                    $cond: [
                      { $eq: ["$PaymentType", "bill"] },
                      "Bill",
                      "Unsettled",
                    ],
                  },
                ],
              },
            },
          },
        ],
        (pagination.payments.page - 1) * pagination.payments.limit
      );
      const customerPipeline = UnifiedFinancialQueryBuilder.buildBasicPipeline(
        customerFilter, 
        sortOptions, 
        pagination.customers.limit,
        [
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
               // invoice calulate
             ...getInvoiceSummaryPipeline(),
        ],
        (pagination.customers.page - 1) * pagination.customers.limit
      );
      const carrierPipeline = UnifiedFinancialQueryBuilder.buildBasicPipeline(
        carrierFilter, 
        sortOptions, 
        pagination.carriers.limit,
        [
           ...getInvoiceSummaryPipeline(),
                
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
        ],
        (pagination.carriers.page - 1) * pagination.carriers.limit
      );


      // Get all data in parallel with filters
      const [
        invoices,
        bills,
        payments,
        customers,
        carriers,
        invoiceCount,
        billCount,
        paymentCount,
        customerCount,
        carrierCount
      ] = await Promise.all([
        invPayBilAccess ? InvoiceModel.aggregate(invoicePipeline) : [],
        invPayBilAccess ? BillModel.aggregate(billPipeline) : [],
        invPayBilAccess ? PaymentModel.aggregate(paymentPipeline) : [],
        invPayBilAccess ? CustomerModel.aggregate(customerPipeline) : [],
        invPayBilAccess ? CarrierModel.aggregate(carrierPipeline) : [],
        invPayBilAccess ? InvoiceModel.countDocuments(invoiceFilter) : 0,
        invPayBilAccess ? BillModel.countDocuments(billFilter) : 0,
        invPayBilAccess ? PaymentModel.countDocuments(paymentFilter) : 0,
        invPayBilAccess ? CustomerModel.countDocuments(customerFilter) : 0,
        invPayBilAccess ? CarrierModel.countDocuments(carrierFilter) : 0
      ]);

      // Calculate totals with filters
      const [totalInvoiceAmount, totalBillAmount, totalPaymentAmount] = await Promise.all([
        InvoiceModel.aggregate([
          { $match: invoiceFilter },
          { $group: { _id: null, total: { $sum: '$summary.finalAmount' } } }
        ]),
        BillModel.aggregate([
          { $match: billFilter },
          { $group: { _id: null, total: { $sum: '$summary.finalAmount' } } }
        ]),
        PaymentModel.aggregate([
          { $match: paymentFilter },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      // Calculate total pages for each entity type
      const calculateTotalPages = (count: number, limit: number) => Math.ceil(count / limit);

      res.status(200).json({
        success: true,
        data: {
          invoices: {
            data: invoices,
            count: invoiceCount,
            totalAmount: totalInvoiceAmount[0]?.total || 0,
            pagination: {
              currentPage: pagination.invoices.page,
              totalPages: calculateTotalPages(invoiceCount, pagination.invoices.limit),
              limit: pagination.invoices.limit,
              hasNext: pagination.invoices.page < calculateTotalPages(invoiceCount, pagination.invoices.limit),
              hasPrev: pagination.invoices.page > 1
            }
          },
          bills: {
            data: bills,
            count: billCount,
            totalAmount: totalBillAmount[0]?.total || 0,
            pagination: {
              currentPage: pagination.bills.page,
              totalPages: calculateTotalPages(billCount, pagination.bills.limit),
              limit: pagination.bills.limit,
              hasNext: pagination.bills.page < calculateTotalPages(billCount, pagination.bills.limit),
              hasPrev: pagination.bills.page > 1
            }
          },
          payments: {
            data: payments,
            count: paymentCount,
            totalAmount: totalPaymentAmount[0]?.total || 0,
            pagination: {
              currentPage: pagination.payments.page,
              totalPages: calculateTotalPages(paymentCount, pagination.payments.limit),
              limit: pagination.payments.limit,
              hasNext: pagination.payments.page < calculateTotalPages(paymentCount, pagination.payments.limit),
              hasPrev: pagination.payments.page > 1
            }
          },
          customers: {
            data: customers,
            count: customerCount,
            pagination: {
              currentPage: pagination.customers.page,
              totalPages: calculateTotalPages(customerCount, pagination.customers.limit),
              limit: pagination.customers.limit,
              hasNext: pagination.customers.page < calculateTotalPages(customerCount, pagination.customers.limit),
              hasPrev: pagination.customers.page > 1
            }
          },
         
          carriers: {
            data: carriers,
            count: carrierCount,
            pagination: {
              currentPage: pagination.carriers.page,
              totalPages: calculateTotalPages(carrierCount, pagination.carriers.limit),
              limit: pagination.carriers.limit,
              hasNext: pagination.carriers.page < calculateTotalPages(carrierCount, pagination.carriers.limit),
              hasPrev: pagination.carriers.page > 1
            }
          },
          summary: {
            totalRecords: invoiceCount + billCount + paymentCount + customerCount  + carrierCount,
            totalFinancialAmount: (totalInvoiceAmount[0]?.total || 0) + (totalBillAmount[0]?.total || 0) + (totalPaymentAmount[0]?.total || 0),
            filters: query,
            sortBy: query.sortBy || 'createdAt',
            sortOrder: query.sortOrder || 'desc'
          }
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch financial data'
      });
    }
  }
}

export default new UnifiedFinancialController();
