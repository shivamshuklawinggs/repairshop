
import { pipelineTypes } from "types/pipelineTypes";
import { wrap } from "./Caluculation";
// ─── Public API ───────────────────────────────────────────────────────────────
export interface InvoiceSummaryOptions {
  type: "customer" | "vendor";
  openBalance?: boolean;
  onlyPaymentScore?: boolean;
  rating?: boolean;
  matchStage: Record<string, any>
}

export function getInvoiceSummaryPipeline(): pipelineTypes {
  // ── 2. Top-level $lookup + $unwind ─────────────────────────────────────────
  const pipeline: pipelineTypes = [
    {
      $addFields: {
        totalAmountWithTax: wrap("$summary.finalAmount"),
        totalTaxAmount:  wrap("$summary.taxTotal"),
        balanceDue:  wrap("$summary.balanceDue"),
      }
    }
  ];
  return pipeline;
}