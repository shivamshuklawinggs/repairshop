import  { Types } from "mongoose";
import User from "models/user.model";
import Invoice from "models/Invoice.model";
import Bill from "models/Bill.model";
import   Payment  from "models/payment.model";
import JournalEntry from "models/journal-entry.model";
import Carrier from "models/Carrier.model";
import Customer from "models/Customer.model";
import { subtract } from "utils/Caluculation";
import { Role } from "microservices/auth-service/types";
/**
 * Get system statistics for a company or globally
 */
/**
 * Get business analytics for superadmin dashboard
 * Includes user growth, revenue trends, geographic distribution, and company performance
 */
export const getBusinessAnalytics = async (page: number = 1, limit: number = 10) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // User growth by country (based on user's country field from IP geolocation)
    const usersByCountryResult = await User.aggregate([
      {
        $match: {
          role: Role.ADMIN
        }
      },
      {
        $group: {
          _id: '$country',
          totalUsers: { $sum: 1 },
          adminIds: { $addToSet: '$ownerAdminId' }
        }
      },
      {
        $addFields: {
          totalAdmins: { $size: '$adminIds' }
        }
      },
      {
        $project: {
          _id: 1,
          totalUsers: 1,
          totalAdmins: 1
        }
      },
      { $sort: { totalUsers: -1 } },
      {
        $facet: {
          // Get top 10 countries for display
          countries: [
            { $limit: 10 }
          ],
          // Get total count of countries
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ]);

    const usersByCountry = usersByCountryResult[0]?.countries || [];
    const totalCountries = usersByCountryResult[0]?.totalCount[0]?.count || 0;

    // Admin user performance analysis - growth, stable, or loss
    const adminPerformance = await User.aggregate([
      {
        $match: {
          role:Role.ADMIN
        }
      },
      {
        $lookup: {
          from: 'accountsinvoices',
          let: { adminId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$ownerAdminId', '$$adminId'] } } },
            {
              $facet: {
                last30Days: [
                  { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                  { $group: { _id: null, revenue: { $sum: '$summary.finalAmount' } } }
                ],
                previous30Days: [
                  { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
                  { $group: { _id: null, revenue: { $sum: '$summary.finalAmount' } } }
                ],
                last90Days: [
                  { $match: { createdAt: { $gte: ninetyDaysAgo } } },
                  { $group: { _id: null, revenue: { $sum: '$summary.finalAmount' } } }
                ]
              }
            }
          ],
          as: 'revenueData'
        }
      },
      {
        $lookup: {
          from: 'vendorbills',
          let: { adminId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$ownerAdminId', '$$adminId'] } } },
            {
              $facet: {
                last30Days: [
                  { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                  { $group: { _id: null, expenses: { $sum: '$summary.finalAmount' } } }
                ],
                previous30Days: [
                  { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
                  { $group: { _id: null, expenses: { $sum: '$summary.finalAmount' } } }
                ]
              }
            }
          ],
          as: 'expenseData'
        }
      },
      {
        $addFields: {
          revenueDataFlat: { $arrayElemAt: ['$revenueData', 0] },
          expenseDataFlat: { $arrayElemAt: ['$expenseData', 0] }
        }
      },
      {
        $project: {
          adminId: '$_id',
          adminName: '$name',
          adminEmail: '$email',
          country: { $ifNull: ['$country', 'Unknown'] },
          currentRevenue: { 
            $ifNull: [
              { $arrayElemAt: ['$revenueDataFlat.last30Days.revenue', 0] },
              0
            ]
          },
          previousRevenue: { 
            $ifNull: [
              { $arrayElemAt: ['$revenueDataFlat.previous30Days.revenue', 0] },
              0
            ]
          },
          totalRevenue90Days: { 
            $ifNull: [
              { $arrayElemAt: ['$revenueDataFlat.last90Days.revenue', 0] },
              0
            ]
          },
          currentExpenses: { 
            $ifNull: [
              { $arrayElemAt: ['$expenseDataFlat.last30Days.expenses', 0] },
              0
            ]
          },
          previousExpenses: { 
            $ifNull: [
              { $arrayElemAt: ['$expenseDataFlat.previous30Days.expenses', 0] },
              0
            ]
          }
        }
      },
      {
        $addFields: {
          currentProfit: { $subtract: ['$currentRevenue', '$currentExpenses'] },
          previousProfit: { $subtract: ['$previousRevenue', '$previousExpenses'] },
          growthRate: {
            $cond: {
              if: { $eq: ['$previousRevenue', 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: [
                    { $subtract: ['$currentRevenue', '$previousRevenue'] },
                    '$previousRevenue'
                  ] },
                  100
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          performanceStatus: {
            $cond: {
              if: { $gte: ['$growthRate', 10] },
              then: 'growth',
              else: {
                $cond: {
                  if: { $and: [{ $gte: ['$growthRate', -5] }, { $lt: ['$growthRate', 10] }] },
                  then: 'stable',
                  else: 'loss'
                }
              }
            }
          }
        }
      },
      { $sort: { totalRevenue90Days: -1 } },
      {
        $facet: {
          // Get paginated data
          paginatedData: [
            { $skip: (page - 1) * limit },
            { $limit: limit }
          ],
          // Get total count
          totalCount: [
            { $count: 'count' }
          ],
          // Get performance summary
          performanceSummary: [
            {
              $group: {
                _id: '$performanceStatus',
                count: { $sum: 1 },
                totalRevenue: { $sum: '$totalRevenue90Days' }
              }
            }
          ],
          // Get all data for top admins (before pagination)
          allData: [
            { $limit: 10 }
          ]
        }
      }
    ]);

    // Extract results from facet
    const facetResult = adminPerformance[0];
    const paginatedAdmins = facetResult.paginatedData || [];
    const totalAdmins = facetResult.totalCount[0]?.count || 0;
    
    // Build performance summary from aggregation
    const performanceSummary = facetResult.performanceSummary.reduce(
      (acc: any, item: any) => {
        acc[item._id] = item.count;
        acc.totalRevenue += item.totalRevenue;
        return acc;
      },
      { growth: 0, stable: 0, loss: 0, totalRevenue: 0 }
    );

    // User registration trends (last 12 months)
    const userGrowthTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              {
                $switch: {
                  branches: [
                    { case: { $eq: ['$_id.month', 1] }, then: 'Jan' },
                    { case: { $eq: ['$_id.month', 2] }, then: 'Feb' },
                    { case: { $eq: ['$_id.month', 3] }, then: 'Mar' },
                    { case: { $eq: ['$_id.month', 4] }, then: 'Apr' },
                    { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                    { case: { $eq: ['$_id.month', 6] }, then: 'Jun' },
                    { case: { $eq: ['$_id.month', 7] }, then: 'Jul' },
                    { case: { $eq: ['$_id.month', 8] }, then: 'Aug' },
                    { case: { $eq: ['$_id.month', 9] }, then: 'Sep' },
                    { case: { $eq: ['$_id.month', 10] }, then: 'Oct' },
                    { case: { $eq: ['$_id.month', 11] }, then: 'Nov' },
                    { case: { $eq: ['$_id.month', 12] }, then: 'Dec' }
                  ],
                  default: 'Unknown'
                }
              },
              ' ',
              { $toString: '$_id.year' }
            ]
          },
          count: 1
        }
      }
    ]);

    // Monthly invoice creation activity (last 12 months)
    const invoiceActivityTrend = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$summary.finalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              {
                $switch: {
                  branches: [
                    { case: { $eq: ['$_id.month', 1] }, then: 'Jan' },
                    { case: { $eq: ['$_id.month', 2] }, then: 'Feb' },
                    { case: { $eq: ['$_id.month', 3] }, then: 'Mar' },
                    { case: { $eq: ['$_id.month', 4] }, then: 'Apr' },
                    { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                    { case: { $eq: ['$_id.month', 6] }, then: 'Jun' },
                    { case: { $eq: ['$_id.month', 7] }, then: 'Jul' },
                    { case: { $eq: ['$_id.month', 8] }, then: 'Aug' },
                    { case: { $eq: ['$_id.month', 9] }, then: 'Sep' },
                    { case: { $eq: ['$_id.month', 10] }, then: 'Oct' },
                    { case: { $eq: ['$_id.month', 11] }, then: 'Nov' },
                    { case: { $eq: ['$_id.month', 12] }, then: 'Dec' }
                  ],
                  default: 'Unknown'
                }
              },
              ' ',
              { $toString: '$_id.year' }
            ]
          },
          year: '$_id.year',
          monthNumber: '$_id.month',
          invoiceCount: '$count',
          revenue: '$totalRevenue'
        }
      }
    ]);

    // Monthly bill creation activity (last 12 months)
    const billActivityTrend = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalExpenses: { $sum: '$summary.finalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              {
                $switch: {
                  branches: [
                    { case: { $eq: ['$_id.month', 1] }, then: 'Jan' },
                    { case: { $eq: ['$_id.month', 2] }, then: 'Feb' },
                    { case: { $eq: ['$_id.month', 3] }, then: 'Mar' },
                    { case: { $eq: ['$_id.month', 4] }, then: 'Apr' },
                    { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                    { case: { $eq: ['$_id.month', 6] }, then: 'Jun' },
                    { case: { $eq: ['$_id.month', 7] }, then: 'Jul' },
                    { case: { $eq: ['$_id.month', 8] }, then: 'Aug' },
                    { case: { $eq: ['$_id.month', 9] }, then: 'Sep' },
                    { case: { $eq: ['$_id.month', 10] }, then: 'Oct' },
                    { case: { $eq: ['$_id.month', 11] }, then: 'Nov' },
                    { case: { $eq: ['$_id.month', 12] }, then: 'Dec' }
                  ],
                  default: 'Unknown'
                }
              },
              ' ',
              { $toString: '$_id.year' }
            ]
          },
          year: '$_id.year',
          monthNumber: '$_id.month',
          billCount: '$count',
          expenses: '$totalExpenses'
        }
      }
    ]);

    // Monthly customer acquisition (last 12 months)
    const customerAcquisitionTrend = await Customer.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              {
                $switch: {
                  branches: [
                    { case: { $eq: ['$_id.month', 1] }, then: 'Jan' },
                    { case: { $eq: ['$_id.month', 2] }, then: 'Feb' },
                    { case: { $eq: ['$_id.month', 3] }, then: 'Mar' },
                    { case: { $eq: ['$_id.month', 4] }, then: 'Apr' },
                    { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                    { case: { $eq: ['$_id.month', 6] }, then: 'Jun' },
                    { case: { $eq: ['$_id.month', 7] }, then: 'Jul' },
                    { case: { $eq: ['$_id.month', 8] }, then: 'Aug' },
                    { case: { $eq: ['$_id.month', 9] }, then: 'Sep' },
                    { case: { $eq: ['$_id.month', 10] }, then: 'Oct' },
                    { case: { $eq: ['$_id.month', 11] }, then: 'Nov' },
                    { case: { $eq: ['$_id.month', 12] }, then: 'Dec' }
                  ],
                  default: 'Unknown'
                }
              },
              ' ',
              { $toString: '$_id.year' }
            ]
          },
          year: '$_id.year',
          monthNumber: '$_id.month',
          customerCount: '$count'
        }
      }
    ]);

    // Combined monthly activity for comprehensive view
    const monthlyActivityMap = new Map();
    
    // Merge all trends into a single comprehensive dataset
    userGrowthTrend.forEach((item: any) => {
      monthlyActivityMap.set(item.month, {
        month: item.month,
        userRegistrations: item.count,
        invoices: 0,
        bills: 0,
        customers: 0,
        revenue: 0,
        expenses: 0
      });
    });

    invoiceActivityTrend.forEach((item: any) => {
      const existing = monthlyActivityMap.get(item.month) || { month: item.month, userRegistrations: 0, invoices: 0, bills: 0, customers: 0, revenue: 0, expenses: 0 };
      existing.invoices = item.invoiceCount;
      existing.revenue = item.revenue;
      monthlyActivityMap.set(item.month, existing);
    });

    billActivityTrend.forEach((item: any) => {
      const existing = monthlyActivityMap.get(item.month) || { month: item.month, userRegistrations: 0, invoices: 0, bills: 0, customers: 0, revenue: 0, expenses: 0 };
      existing.bills = item.billCount;
      existing.expenses = item.expenses;
      monthlyActivityMap.set(item.month, existing);
    });

    customerAcquisitionTrend.forEach((item: any) => {
      const existing = monthlyActivityMap.get(item.month) || { month: item.month, userRegistrations: 0, invoices: 0, bills: 0, customers: 0, revenue: 0, expenses: 0 };
      existing.customers = item.customerCount;
      monthlyActivityMap.set(item.month, existing);
    });

    const monthlyActivity = Array.from(monthlyActivityMap.values());

    // Peak activity analysis - identify months with highest activity
    const peakUserRegistration = userGrowthTrend.reduce((max: any, item: any) => 
      item.count > (max?.count || 0) ? item : max, null);
    
    const peakInvoiceActivity = invoiceActivityTrend.reduce((max: any, item: any) => 
      item.invoiceCount > (max?.invoiceCount || 0) ? item : max, null);
    
    const peakBillActivity = billActivityTrend.reduce((max: any, item: any) => 
      item.billCount > (max?.billCount || 0) ? item : max, null);
    
    const peakCustomerAcquisition = customerAcquisitionTrend.reduce((max: any, item: any) => 
      item.customerCount > (max?.customerCount || 0) ? item : max, null);

    const peakActivity = {
      userRegistration: peakUserRegistration ? {
        month: peakUserRegistration.month,
        count: peakUserRegistration.count
      } : null,
      invoiceCreation: peakInvoiceActivity ? {
        month: peakInvoiceActivity.month,
        count: peakInvoiceActivity.invoiceCount,
        revenue: peakInvoiceActivity.revenue
      } : null,
      billCreation: peakBillActivity ? {
        month: peakBillActivity.month,
        count: peakBillActivity.billCount,
        expenses: peakBillActivity.expenses
      } : null,
      customerAcquisition: peakCustomerAcquisition ? {
        month: peakCustomerAcquisition.month,
        count: peakCustomerAcquisition.customerCount
      } : null
    };

    // Top performing admins by revenue (from facet allData)
    const topAdmins = facetResult.allData
      .filter((a: any) => a.totalRevenue90Days > 0)
      .map((a: any) => ({
        adminId: a.adminId,
        adminName: a.adminName,
        adminEmail: a.adminEmail,
        country: a.country,
        revenue: a.totalRevenue90Days,
        growthRate: a.growthRate,
        status: a.performanceStatus
      }));

    return {
      data: {
        usersByCountry,
        totalCountries,
        adminPerformance: paginatedAdmins.map((a: any) => ({
          adminId: a.adminId,
          adminName: a.adminName,
          adminEmail: a.adminEmail,
          country: a.country,
          currentRevenue: a.currentRevenue,
          previousRevenue: a.previousRevenue,
          totalRevenue90Days: a.totalRevenue90Days,
          currentProfit: a.currentProfit,
          previousProfit: a.previousProfit,
          growthRate: Math.round(a.growthRate * 100) / 100,
          performanceStatus: a.performanceStatus
        })),
        performanceSummary,
        userGrowthTrend,
        invoiceActivityTrend,
        billActivityTrend,
        customerAcquisitionTrend,
        monthlyActivity,
        peakActivity,
        topAdmins,
        timestamp: new Date()
      },
      pagination: {
        page,
        limit,
        total: totalAdmins,
        totalPages: Math.ceil(totalAdmins / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching business analytics:', error);
    throw error;
  }
};

export const getSystemStats = async (companyId?: string) => {
  try {
    const companyFilter = companyId ? { companyId: new Types.ObjectId(companyId) } : {};

  const [
    userCount,
    invoiceCount,
    billCount,
    paymentCount,
    carrierCount,
    customerCount,
    journalEntryCount,
  ] = await Promise.all([
    User.countDocuments( {}),
    Invoice.countDocuments(companyFilter),
    Bill.countDocuments(companyFilter),
    Payment.countDocuments(companyFilter),
    Carrier.countDocuments(companyFilter),
    Customer.countDocuments(companyFilter),
    JournalEntry.countDocuments(companyFilter),
  ]);

  const [invoiceSummary] = await Invoice.aggregate([
    { $match: companyFilter },
    {
      $addFields:{
        totalInvoiceAmount: { $sum: "$summary.finalAmount" },
        totalPaidAmount: { $sum: "$summary.totalRecieved" },
        totalTaxAmount: { $sum: "$summary.taxTotal" },
        totalDueAmount: { $sum: "$summary.balanceDue" },
      }
    },
    {
      $addFields:{
         invoicePaidAmt: subtract("$totalInvoiceAmount", "$totalPaidAmount") ,
      }
    },
    {
      $group: {
        _id: null,
        totalInvoiceAmount: { $sum: "$totalInvoiceAmount" },
        totalPaidAmount: { $sum: "$totalPaidAmount" },
        totalDueAmount: { $sum: "$totalDueAmount" },
        invoicePaidAmt: { $sum: "$invoicePaidAmt" },
      },
    },
  ]);
  const [BillSummary] = await Bill.aggregate([
    { $match: companyFilter },
    {
      $addFields:{
        totalInvoiceAmount: { $sum: "$summary.finalAmount" },
        totalPaidAmount: { $sum: "$summary.totalRecieved" },
        totalTaxAmount: { $sum: "$summary.taxTotal" },
        totalDueAmount: { $sum: "$summary.balanceDue" },
      }
    },
    {
      $addFields:{
         billPaidAmt: subtract("$totalInvoiceAmount", "$totalPaidAmount") ,
      }
    },
    {
      $group: {
        _id: null,
        totalInvoiceAmount: { $sum: "$totalInvoiceAmount" },
        totalPaidAmount: { $sum: "$totalPaidAmount" },
        totalDueAmount: { $sum: "$totalDueAmount" },
        billPaidAmt: { $sum: "$billPaidAmt" },
      },
    },
  ]);
  const [PaymentSummary] = await Payment.aggregate([
    { $match: companyFilter },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        totalPayments: { $sum: 1 },
      },
    },
  ]);

  

  return {
    counts: {
      users: userCount,
      invoices: invoiceCount,
      bills: billCount,
      payments: paymentCount,
  
      carriers: carrierCount,
      customers: customerCount,
      journalEntries: journalEntryCount,
    },
    invoicesSummary: invoiceSummary || {
      totalInvoiceAmount: 0,
      totalPaidAmount: 0,
      totalDueAmount: 0,
      invoicePaidAmt: 0,
      
    },
    billsSummary: BillSummary || {
      totalInvoiceAmount: 0,
      totalPaidAmount: 0,
      totalDueAmount: 0,
      billPaidAmt: 0,
    },
    paymentsSummary: PaymentSummary || {
      totalAmount: 0,
      totalPayments: 0,
    },
   
    companyId: companyId || "all",
    timestamp: new Date(),
    totalRevenue: (invoiceSummary?.invoicePaidAmt || 0) - (BillSummary?.billPaidAmt || 0),
  };
  } catch (error) {
    console.error("Error fetching system stats:", error);
    throw error;
  }
};




