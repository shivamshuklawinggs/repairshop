import { masterType } from 'models/AccountType.model';
import { PaymentType } from "models/payment.model"
import { PipelineStage, Types } from "mongoose"
import { customerPipeLine, vendorPipeLine } from 'utils/transactionPipelines';


interface PaymentBaseSetupItem {
  main: string;
  foreignField: string;
  numberField: string;
  idListField: string;
  paidby: masterType;
}

interface PaymentBaseSetupCollections {
  invoice: PaymentBaseSetupItem;
  bill: PaymentBaseSetupItem;
}
/**
 * Base collection map
 */
export const PaymentBaseSetupCOLLECTIONS = {
  invoice: {
    main: "accountsinvoices",
    foreignField: "customerId",
    numberField: "invoiceNumber",
    idListField: "invoiceIds",
    paidby: masterType.customer
  },
  bill: {
    main: "vendorbills",
    foreignField: "vendorId",
    numberField: "BillNumber",
    idListField: "billids",
    paidby: masterType.vendor
  }
} as PaymentBaseSetupCollections;
/**
 * COMMON pipeline for matched / non-matched payments
 */
const getReceivedPaymentsPipeline = (
  match: Record<string, any>,
  isMatched: boolean
): PipelineStage[] => {
  return [
    { $match: match },

    // check if payment exists
    {
      $match: {
        $expr: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: "$recievedPaymentAmount",
                  as: "p",
                  cond: {
                    [isMatched ? "$eq" : "$ne"]: [
                      "$$p.recievedPaymentId",
                      "$$paymentId"
                    ]
                  }
                }
              }
            },
            0
          ]
        }
      }
    },

    // filter matched or non matched
    {
      $addFields: {
        recievedPaymentAmount: {
          $filter: {
            input: "$recievedPaymentAmount",
            as: "p",
            cond: {
              [isMatched ? "$eq" : "$ne"]: [
                "$$p.recievedPaymentId",
                "$$paymentId"
              ]
            }
          }
        }
      }
    },
    { $unwind: { path: "$recievedPaymentAmount", preserveNullAndEmptyArrays: true } },

    {
      $project: {
        amountWithTax: "$summary.finalAmount",
        totalAmountWithTax: "$summary.finalAmount",
        totalTaxAmount:"$summary.taxTotal",
        totalAmount:"$summary.subTotal",
        recievedAmount:"$summary.totalRecieved",
        balanceDue: "$summary.balanceDue",
        invoiceId: "$_id",
        invoiceNumber: { $ifNull: ["$invoiceNumber", "$BillNumber"] },
        amount: { $ifNull: ["$recievedPaymentAmount.amount", 0] },
        OriginalAmount: { $ifNull: ["$recievedPaymentAmount.amount", 0] },
        _id: "$recievedPaymentAmount._id",
        recievedPaymentId: "$recievedPaymentAmount.recievedPaymentId",
        PaymentAllocateId:"$recievedPaymentAmount.PaymentAllocateId"
      }
    }
  ];
};





/**
 * MASTER PIPELINE
 * One function for invoice + bill
 */
const getInvoiceBillPipeline = (
  type: PaymentType.bill | PaymentType.invoice,
  match: Record<string, any>,
  id: string
) => {
  const cfg = PaymentBaseSetupCOLLECTIONS[type];

  return [
    { $match: { _id: new Types.ObjectId(id) } },
    // --- MATCHED payments
    {
      $lookup: {
        from: cfg.main,
        let: { paymentId: "$_id" },
        pipeline: getReceivedPaymentsPipeline(match, true),
        as: "recievedPayments"
      }
    },

    // // --- NON MATCHED payments
    // {
    //   $lookup: {
    //     from: cfg.main,
    //     let: { paymentId: "$_id" },
    //     pipeline: getReceivedPaymentsPipeline(match, false),
    //     as: "nonRecievedPayments"
    //   }
    // },
         ...(type === "invoice"
      ? customerPipeLine("customerId")
      : vendorPipeLine("customerId")),
    {
      $addFields:{
         customer: type === "invoice" ? "$customer" : "$carrier",
      }
     },
    {
      $project: {
        paymentDate: 1,
        status: 1,
        amount: 1,
        referenceNo: 1,
        depositTo: 1,
        paymentMethod: 1,
        credits: 1,
        settledAmount: 1,
        customerId:1,
        customer:1,
        recievedPayments: 1,
        nonRecievedPayments: 1
      }
    },
    
   
    
  ] as PipelineStage[]
};



export {getInvoiceBillPipeline  }
