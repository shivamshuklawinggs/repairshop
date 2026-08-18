import mongoose, { PipelineStage, Schema, Types } from "mongoose";
import { existsValidator } from "./shared/existsValidator";
import { getDocumentByType } from "utils/ledgerHelpers";
import pagination from "utils/pagination";
import {  validateBalancedEntries } from "utils/CalculateInvoiceBillInput";
import { round2 } from "helpers/round";
import { AppError } from "middlewares/error";
import JournalEntry from "./journal-entry.model";
import PaymentModal from "./payment.model";
import BillModal from "./Bill.model";
import InvoiceModal from "./Invoice.model";
import { updateCarrierSummary, updateCustomerSummary } from "microservices/accounts-services/customer-services/services/updateCustomerCarrierSummary";

interface summary  {
  subTotal?: number;
  taxTotal?: number;
  discount?: number;
  finalAmount?: number;
  totalRecieved?:number;
  balanceDue?:number
  settledAmount?:number;
  credits?:number;
  appliedAmount?: number;
  remainingAmount?: number;
}
/* ================= ENUMS ================= */

export enum TransactionType {
  INVOICE = "INVOICE",
  PAYMENT = "PAYMENT",
  BILL = "BILL",
  JOURNAL = "JOURNAL",
  TAX = "TAX",
  DISCOUNT = "DISCOUNT",
}
export enum ReferenceType {
  INVOICE = "Invoice",
  BILL = "Bill",
  INVOICE_PAYMENT = "Invoice-Payment",
  BILL_PAYMENT = "Bill-Payment",
  JOURNAL_ENTRY = "Journal-Entry",
  SALES_TAX = "Sales-Tax",
  SALES_DISCOUNT = "Sales-Discount",
  PURCHASE_DISCOUNT = "Purchase-Discount",
  PURCHASE_TAX = "Purchase-Tax",
  CREDIT_NOTE = "Credit-Note",
  DEBIT_NOTE = "Debit-Note"
}

export enum EntryType {
  CREDIT = "CREDIT",
  DEBIT = "DEBIT"
}

/* ================= INTERFACE ================= */

export interface LedgerTransaction {
  accountId: Types.ObjectId;
  transactionType: TransactionType;
  type: ReferenceType;
  referenceId: Types.ObjectId;
  amount: number;
  entryType: EntryType;
  postingDate: Date;
  companyId: Types.ObjectId;
  description: string;
  customerId?: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  credit: number;
  debit: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  refrenceNo:string;
  totalRecieved?: number;
  balanceDue?: number;
  dueDate?:Date;
  credits?:number;
  settledAmount?:number;
  txnstatus?:string
  lastPaymentDate?: Date;
  summary?: summary;
}
type AccountRegisterParams = {
  page: number;
  limit: number;
  matchStage:Record<string,any>
};

type AccountRegisterItem = {
  _id: mongoose.Types.ObjectId;
  customer: { name: string } | "N/A";
  amount?: number;
  debit?: number;
  credit?: number;
  postingDate: Date;
  balanceDue: string;
  transactionType: TransactionType;
  referenceId: mongoose.Types.ObjectId;
  type:ReferenceType
};

type AccountRegisterResponse = {
  data: AccountRegisterItem[];
  total: number;
};
/* ================= SCHEMA ================= */

const transactionSchema:Schema<LedgerTransaction> = new Schema<LedgerTransaction>(
  {
    credit: {
      type: Number,
      default: 0, set: round2
    },
      summary: {
        subTotal: { type: Number, default: 0, set: round2 },
        taxTotal: { type: Number, default: 0, set: round2 },
        discount: { type: Number, default: 0, set: round2 },
        finalAmount: { type: Number, default: 0, set: round2 },
        totalRecieved: { type: Number, default: 0, set: round2 },
        balanceDue: { type: Number, default: 0, set: round2, min: [0, 'Balance due cannot be negative'] },
        settledAmount: { type: Number, default: 0, set: round2 },
        credits: { type: Number, default: 0, set: round2 },
        appliedAmount: { type: Number, default: 0, set: round2 },
        remainingAmount:{type: Number, default: 0, set: round2}
        
      },
    lastPaymentDate: { type: Date },
    credits:{
      type: Number,
      default: 0, set: round2
    },
    debit: {
      type: Number,
      default: 0, set: round2
    },
    settledAmount: { type: Number, required: true, set: round2},
    txnstatus:String,
    totalRecieved: { type: Number, default: 0 , set: round2},
    balanceDue: { type: Number, default: 0 , set: round2},
    accountId: { type: Schema.Types.ObjectId, required: true,ref:"chartofaccounts"  },
    transactionType: { type: String,enum:Object.values(TransactionType), required: true,  },
    type: { type: String,enum:Object.values(ReferenceType), required: true,  },
    referenceId: { type: Schema.Types.ObjectId, required: true,  },
    amount: { type: Number, required: true, set: round2 },
    entryType: { type: String, required: true,  },
    postingDate: { type: Date, required: true,  },
    companyId: { type: Schema.Types.ObjectId, required: true,immutable: true,  },
    vendorId: {
      type: Schema.Types.ObjectId, ref: 'Carrier', immutable: true, validate: {
        validator: existsValidator(
          (_ctx, value) => ({
            _id: value,
            
          }),
          "Carrier"
        ),
        message: "Vendor  is not associated with this Company"
      }
    },
    dueDate:Date,
    description: {
      type:String,
      required:true
    },
    refrenceNo: {
      type:String,
      required:true
    },
    customerId: {
      type: Schema.Types.ObjectId, ref: 'Customer', immutable: true, validate: {
        validator: existsValidator(
          (_ctx, value) => ({
            _id: value,
            
          }),
          "Customer"
        ),
        message: "Customer  is not associated with this Company"
      }
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      immutable: true,
      required: [true, 'Please Add Created By']
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please Add Updated By']
    },
  },
  { timestamps: true,
    collection:"ledgertransactions"
   }
);

/* 🚀 CRITICAL INDEX (SaaS + UPSERT SAFE) */
transactionSchema.index(
  { companyId: 1, referenceId: 1, accountId: 1, entryType: 1, transactionType: 1 },
  { unique: true }
);
transactionSchema.index({
  accountId: 1,
  companyId: 1,
})

/* ================= MODEL ================= */

export const LedgerTransactionModel = mongoose.model<LedgerTransaction>(
  "LedgerTransaction",
  transactionSchema
);

/* ================= CORE ENGINE ================= */

export class LedgerAdapter {

  /**
   * 🚀 ULTRA FAST UPSERT (NO DELETE)
   */
  async updateTransactionLedgers(
    transactions: Omit<LedgerTransaction, "id">[],
    session: mongoose.ClientSession
  ): Promise<void> {
    if (!transactions?.length) return;
// ================================
// 9. CALL VALIDATION BEFORE SAVE
// ================================

validateBalancedEntries(transactions);

    const ops = transactions.map((txn) => ({
      updateOne: {
        filter: {
          companyId: txn.companyId,              // ✅ SaaS isolation
          referenceId: txn.referenceId,
          accountId: txn.accountId,
          entryType: txn.entryType,
          transactionType: txn.transactionType
        },
        update: { $set: txn },
        upsert: true
      }
    }));
    await LedgerTransactionModel.bulkWrite(ops, {
      session,
      ordered: false // 🚀 faster
    });
  }

  /**
   * 🚀 FAST DELETE (SCOPED)
   */
  async deleteTransactionLedgers(
    { referenceId,
      companyId,
      session }: {
        referenceId: Types.ObjectId,
        companyId: Types.ObjectId,
        session: mongoose.ClientSession
      }
  ): Promise<void> {
    await LedgerTransactionModel.deleteMany(
      {
        referenceId,
        companyId // ✅ SaaS safe
      },
      { session }
    );
  }
  async recordLedgerById(
    {
      id,
      companyId,
      type,
      session
    }: {
      id: Types.ObjectId,
      companyId: Types.ObjectId,
      type: TransactionType.BILL | TransactionType.INVOICE | TransactionType.PAYMENT | TransactionType.JOURNAL,
      session: mongoose.ClientSession
    }
  ) {
    const transactions = await getDocumentByType(type, id, companyId, session);
    
    if (!transactions || transactions.length === 0) {
      throw new AppError('No transactions found for the given document', 404);
    }
    const [{customerId,vendorId,referenceId}]=transactions
    if (referenceId) {
      await ledgerAdapter.deleteTransactionLedgers({ referenceId: referenceId, companyId, session });
    
    }
    await ledgerAdapter.updateTransactionLedgers(transactions, session);
   
    if (customerId) {
     await updateCustomerSummary({ session, customerId: customerId })
    }
    if (vendorId) {
      await updateCarrierSummary({ session, vendorId: vendorId })
    }
  }
   async initiaTeAllData() {
    const session = await mongoose.startSession()
    try {
      console.log("ledger transactions started")
      await session.withTransaction(async () => {
        const invoices = await InvoiceModal.find({}, { _id: 1, companyId: 1 }).session(session);
        const bills = await BillModal.find({}, { _id: 1, companyId: 1 }).session(session);
        const payments = await PaymentModal.find({}, { _id: 1, companyId: 1 }).session(session);
        const journals = await JournalEntry.find({}, { _id: 1, companyId: 1 }).session(session);
        for (const invoice of invoices) {
          await this.recordLedgerById({ id: invoice._id, companyId: invoice.companyId, type: TransactionType.INVOICE, session });
        }

        for (const bill of bills) {
          await this.recordLedgerById({ id: bill._id, companyId: bill.companyId, type: TransactionType.BILL, session });
        }

        for (const payment of payments) {
          await this.recordLedgerById({ id: payment._id, companyId: payment.companyId, type: TransactionType.PAYMENT, session });
        }

        for (const journal of journals) {
          await this.recordLedgerById({ id: journal._id, companyId: journal.companyId, type: TransactionType.JOURNAL, session });
        }
      })
        console.log("ledger transactions ended")
    } catch (error) {
    } finally {
      await session.endSession()
    }
  }
  public ledgerFromChart(matchStage:Record<string,any>={}): PipelineStage[] {
    return [
    {
      $lookup: {
        from: "ledgertransactions",
        localField: "_id",
        foreignField: "accountId",
        pipeline: [
          {
            $match:matchStage
          },
          {
            $group: {
              _id: null,
              totalCredits: { $sum: "$credit" },
              totalDebits: { $sum: "$debit" }
            }
          },
          {
            $addFields: {
              endingBalanceNumeric: { $round: [{ $subtract: ["$totalDebits", "$totalCredits"] }, 2] },
              endingBalance: {
                $concat: [
                  { $toString: { $abs: { $round: [{ $subtract: ["$totalDebits", "$totalCredits"] }, 2] } } },
                  " ",
                  {
                    $cond: [
                      { $lt: [{ $subtract: ["$totalDebits", "$totalCredits"] }, 0] },
                      "Cr",
                      "Dr"
                    ]
                  }
                ]
              },
              symbol: {
                $cond: [
                  { $lt: [{ $subtract: ["$totalDebits", "$totalCredits"] }, 0] },
                  "Cr",
                  "Dr"
                ]
              }
            }
          },
        ],
        as: "ledger"
      }
    },
    {
      $unwind: {
        path: "$ledger",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $addFields: {
        endingBalanceNumeric: {
          $ifNull: ["$ledger.endingBalanceNumeric", 0]
        },
        endingBalance: {
          $ifNull: ["$ledger.endingBalance","0 Dr"]
        },
        symbol: {
          $ifNull: ["$ledger.symbol", "0 Dr"]
        }
      }
    },
    {
      $unset: "ledger"
    }

  ]
}

  async AccountRegister({
  page,
  limit,matchStage
}: AccountRegisterParams): Promise<AccountRegisterResponse> {
    const result = await LedgerTransactionModel.aggregate<{
      data: AccountRegisterItem[];
      total: number;
    }>([
      {
        $match: matchStage
      },
      {
        $sort: {
          postingDate: 1
        }
      },
      {
        $facet: {
          data: [
            ...pagination(page, limit),
            {
              $set: {
                signedAmount: {
                  $subtract: [
                    { $ifNull: ["$debit", 0] },
                    { $ifNull: ["$credit", 0] }
                  ]
                }
              }
            },
            {
              $setWindowFields: {
                sortBy: { postingDate: 1 },
                output: {
                  runningChange: {
                    $sum: "$signedAmount",
                    window: {
                      documents: [
                        "unbounded",
                        "current"
                      ]
                    }
                  }
                }
              }
            },
            {
              $set: {
                balanceDue: {
                  $concat: [
                    {
                      $toString: {
                        $round: [
                          { $abs: "$runningChange" },
                          2
                        ]
                      }
                    },
                    " ",
                    {
                      $cond: [
                        {
                          $gte: ["$runningChange", 0]
                        },
                        "Dr",
                        "Cr"
                      ]
                    }
                  ]
                },
                balanceDuenumeric: {
                  $round: [
                    { $abs: "$runningChange" },
                    2
                  ]
                }
              }
            },
            {
              $lookup: {
                from: "customers",
                localField: "customerId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      name: {
                        $ifNull: [
                          "$company",
                          "$company"
                        ]
                      },
                    }
                  }
                ],
                as: "customer"
              }
            },
            {
              $unwind: {
                path: "$customer",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: "carriers",
                localField: "vendorId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      name: {
                        $ifNull: [
                          "$company",
                          "$company"
                        ]
                      },
                    }
                  }
                ],
                as: "vendor"
              }
            },
            {
              $unwind: {
                path: "$vendor",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $addFields:{
                customer:{
                  $ifNull:["$customer","$vendor"]
                }
              }
            },
            {
              $project: {
                _id: 1,
                customer: { $ifNull: ["$customer.name", "N/A"] },
                amount: 1,
                debit: 1,
                credit: 1,
                postingDate: { $dateToString: { format: "%m-%d-%Y", date: "$postingDate" } },
                balanceDue: 1,
                balanceDuenumeric:1,
                transactionType: 1,
                referenceId: 1,
                type:1,
                description:1,
                refrenceNo:1
              }
            }
          ],
          total: [
            {
              $count: "total"
            }
          ]
        },
      },
      {
        $project: {
          data: 1,
          total: {
            $ifNull: [{ $arrayElemAt: ["$total.total", 0] }, 0]
          }
        }
      }
    ]).limit(1)
    const { data = [], total = 0 } = result[0] || {
      data:[],
      total:0
    };

    return { data, total };
  }

}

/* ================= EXPORT ================= */

export const ledgerAdapter = new LedgerAdapter()
export default LedgerTransaction;
