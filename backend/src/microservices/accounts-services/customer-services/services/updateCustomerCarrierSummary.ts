import BillModal from "models/Bill.model";
import Carrier from "models/Carrier.model";
import Customer from "models/Customer.model";
import InvoiceModal from "models/Invoice.model";
import { ClientSession, Types } from "mongoose";
export const updateCustomerSummary = async ({session,customerId}:{
  session: ClientSession,
  customerId: Types.ObjectId
}) => {
  const [summary] = await InvoiceModal.aggregate([
    {
      $match: {
        customerId:new Types.ObjectId(customerId)
      }
    },
    {
      $group: {
        _id: null,
        subTotal: { $sum: "$summary.subTotal" },
        taxTotal:{$sum:"$summary.taxTotal"},
        discount:{$sum:"$summary.discount"},
        finalAmount:{$sum:"$summary.finalAmount"},
        totalRecieved:{$sum:"$summary.totalRecieved"},
        balanceDue:{$sum:"$summary.balanceDue"},
      }
    }
  ]).session(session)
   if(!summary){
     await Customer.updateOne({ _id: customerId }, { $unset: { summary: 1 } }).session(session)
     return
    }
  await Customer.updateOne({ _id: customerId }, { $set: { summary: summary } }).session(session)
};
export const updateCarrierSummary = async ({session,vendorId}:{
  session: ClientSession,
  vendorId: Types.ObjectId
}) => {
  const [summary] = await BillModal.aggregate([
    {
      $match: {
        vendorId: new Types.ObjectId(vendorId)
      }
    },
    {
      $group: {
        _id: null,
        subTotal: { $sum: "$summary.subTotal" },
        taxTotal:{$sum:"$summary.taxTotal"},
        discount:{$sum:"$summary.discount"},
        finalAmount:{$sum:"$summary.finalAmount"},
        totalRecieved:{$sum:"$summary.totalRecieved"},
        balanceDue:{$sum:"$summary.balanceDue"},
      }
    }
  ]).session(session)
  if(!summary){
     await Carrier.updateOne({ _id: vendorId }, { $unset: { summary: 1 } }).session(session)
     return 
    }
  await Carrier.updateOne({ _id: vendorId }, { $set: { summary: summary } }).session(session)
};
