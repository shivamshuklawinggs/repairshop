import ProductService from "models/product-service.model";
import { AppError } from "middlewares/error";
import mongoose from "mongoose";
import { IInvoiceBilExpense } from "models/shared/schemas";
import { Response,Request } from "express";
import { JOB_DELAYS, JOB_PRIORITIES, producers } from "config/bullmq";

type ExpenseItem = { productservice: string; qty: number };

export const updateProductService = async (
  expense: IInvoiceBilExpense[],
  oldexpense: IInvoiceBilExpense[],
  isNew: boolean,
  session: mongoose.ClientSession,
  purchaseType: "invoice" | "bill",
  res:Response,
  req:Request
) => {
  
  // Aggregate by product
  const aggregateByProduct = (list: ExpenseItem[]) =>
    (list || [])?.reduce<Record<string, number>>((map, { productservice, qty }) => {
      map[productservice] = (map[productservice] || 0) + qty;
      return map;
    }, {});

  const newMap = aggregateByProduct(expense as unknown as ExpenseItem[]);
  const oldMap = aggregateByProduct(oldexpense as unknown as ExpenseItem[]);
  const allProductIds = new Set([...Object.keys(newMap), ...Object.keys(oldMap)]);

  // Decide stock impact rule
  const getDiff = (newQty: number, oldQty: number) => {
    if (isNew) return newQty; // new entry
    return newQty - oldQty;  // update case
  };

  // For each product, compute stock change & validate
  for (const productId of allProductIds) {
    const newQty = newMap[productId] || 0;
    const oldQty = oldMap[productId] || 0;
    let diff = getDiff(newQty, oldQty);

    // Determine whether to add or subtract stock
    if (purchaseType === "invoice") {
      diff = -diff; // invoices always reduce stock
    } else if (purchaseType === "bill") {
      diff = diff; // bills add stock unless load exists
    }

    if (diff === 0) continue;

    const product = await ProductService.findById(productId).session(session);
    if (!product) throw new AppError(`Product ${productId} not found`, 404);

    if (product.category === "inventory") {
      // Validation: ensure enough stock for negative adjustments
      if (diff < 0 && product.currentLevel < Math.abs(diff)) {
        const reorderStock = Math.abs(diff) - product.currentLevel;
        throw new AppError(
          `Insufficient stock. Available: ${product.currentLevel}, Requested: ${Math.abs(diff)} Reorder Stock: ${reorderStock}`,
          400
        );
      }

      // Apply stock update
      const UpdatedProduct = await ProductService.findOneAndUpdate(
        { _id: productId, companyId: res.locals.companyId },
        { $inc: { currentLevel: diff } },
        { session, new: true }
      );
      // send notifcation
      if (UpdatedProduct) {
        await producers.notification.productServiceReminder({
          productServiceId: UpdatedProduct._id,
          userId:req.user?._id
        },
        {priority:JOB_PRIORITIES.HIGH,delay:JOB_DELAYS.SECONDS_30}
        )
        // Save or send notification
      }
     

    }
  }
};
export const updateMockProductService = async (
  expense: IInvoiceBilExpense[],
  oldexpense: IInvoiceBilExpense[],
  isNew: boolean,
  session: mongoose.ClientSession,
  purchaseType: "invoice" | "bill",
  companyId:mongoose.Types.ObjectId
) => {
  // Aggregate by product
  const aggregateByProduct = (list: ExpenseItem[]) =>
    list.reduce<Record<string, number>>((map, { productservice, qty }) => {
      map[productservice] = (map[productservice] || 0) + qty;
      return map;
    }, {});

  const newMap = aggregateByProduct(expense as unknown as ExpenseItem[]);
  const oldMap = aggregateByProduct(oldexpense as unknown as ExpenseItem[]);
  const allProductIds = new Set([...Object.keys(newMap), ...Object.keys(oldMap)]);

  // Decide stock impact rule
  const getDiff = (newQty: number, oldQty: number) => {
    if (isNew) return newQty; // new entry
    return newQty - oldQty;  // update case
  };

  // For each product, compute stock change & validate
  for (const productId of allProductIds) {
    const newQty = newMap[productId] || 0;
    const oldQty = oldMap[productId] || 0;
    let diff = getDiff(newQty, oldQty);

    // Determine whether to add or subtract stock
    if (purchaseType === "invoice") {
      diff = -diff; // invoices always reduce stock
    } else if (purchaseType === "bill") {
      diff = diff; // bills add stock unless load exists
    }

    if (diff === 0) continue;

    const product = await ProductService.findById(productId).session(session);
    if (!product) throw new AppError(`Product ${productId} not found`, 404);

    if (product.category === "inventory") {
      // Validation: ensure enough stock for negative adjustments
      if (diff < 0 && product.currentLevel < Math.abs(diff)) {
        const reorderStock = Math.abs(diff) - product.currentLevel;
        throw new AppError(
          `Insufficient stock. Available: ${product.currentLevel}, Requested: ${Math.abs(diff)} Reorder Stock: ${reorderStock}`,
          400
        );
      }

      // Apply stock update
      await ProductService.findOneAndUpdate(
        { _id: productId ,companyId:companyId},
        { $inc: { currentLevel: diff } },
        { session,new:true }
      );
    }
  }
};
