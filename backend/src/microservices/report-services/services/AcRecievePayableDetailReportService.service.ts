import { PipelineStage } from "mongoose"
import pagination from "utils/pagination";
import { customerPipeLine } from "shared/pipelines/BaseLookups/BasePipelines";
import { masterType } from 'models/AccountType.model';
import { getAgingBucketFields } from "helpers/aging.bucket.utils";

const AcRecievePayableDetailReportService = ({
  allowedreporttype,
  page,
  limit,
  end,
}: {
  allowedreporttype: "AccountsPayableDetail" | "AccountsRecieveableDetail";
  page: number;
  limit: number;
  end: Date;
}): PipelineStage[] => {
  const referenceDate = end;

const date30 = new Date(referenceDate);
date30.setDate(referenceDate.getDate() - 30);

const date60 = new Date(referenceDate);
date60.setDate(referenceDate.getDate() - 60);

const date90 = new Date(referenceDate);
date90.setDate(referenceDate.getDate() - 90);
const bucketFields = getAgingBucketFields(
  referenceDate,
  date30,
  date60,
  date90
);
const isPayable = allowedreporttype === "AccountsPayableDetail";
return [
  {
    $addFields: {
      ...bucketFields,
    },
  },
  {
    $project: {
      date: "$postingDate",
      num: "$refrenceNo",
      dueDate: "$dueDate",
      transactionType: isPayable ? "BILL" : "INVOICE",
      amount: "$amount",
      ...(isPayable
        ? { vendorId: 1 }
        : { customerId: 1 }),
      openBalance: "$balanceDue",
      bucket: 1,
      bucketOrder: 1,
      _id:"$referenceId"
    },
  },
  { $sort: { bucketOrder: 1 } },
  ...customerPipeLine(allowedreporttype==="AccountsPayableDetail"?masterType.vendor:masterType.customer),
  {
    $addFields: {
      daysPastDue: {
        $dateDiff: {
          startDate: "$dueDate",
          endDate: "$$NOW",
          unit: "day",
        },
      },
      vendorDisplayName: "$customer.name",
    },
  },
  {
    $group: {
      _id: "$bucket",
      bucket: { $first: "$bucket" },
      bucketOrder: { $first: "$bucketOrder" },
      invoices: { $push: "$$ROOT" },
      totalAmount: { $sum: "$amount" },
      totalOpenBalance: { $sum: "$openBalance" },
    },
  },
  { $sort: { bucketOrder: 1 } },
  ...pagination(page, limit) as any,
];
};

export { AcRecievePayableDetailReportService }