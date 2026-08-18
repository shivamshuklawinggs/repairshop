import { PipelineStage } from 'mongoose';

type CustomerStages = Array<
  PipelineStage.Lookup | PipelineStage.Unwind
>;
export const customerPipeLine = (localField: 'customerId' | 'entries.nameId'):CustomerStages=> [
  {
    $lookup: {
      from: 'customers',
      localField: localField,
      foreignField: '_id',
      pipeline: [
        {
          $project: {
            _id: 1,
            company:1,
            email: 1,
            billingAddress: {
              address: { $ifNull: ['$address', '$billingAddress.address'] },
              city: { $ifNull: ['$city', '$billingAddress.city'] },
              state: { $ifNull: ['$state', '$billingAddress.state'] },
              zipCode: { $ifNull: ['$zipCode', '$billingAddress.zipCode'] },
              country: { $ifNull: ['$country', '$billingAddress.country'] },
            },
            shippingAddress: {
              address: { $ifNull: ['$address', '$shippingAddress.address'] },
              city: { $ifNull: ['$city', '$shippingAddress.city'] },
              state: { $ifNull: ['$state', '$shippingAddress.state'] },
              zipCode: { $ifNull: ['$zipCode', '$shippingAddress.zipCode'] },
              country: { $ifNull: ['$country', '$shippingAddress.country'] },
            },
            phone: 1,
            paymentMethod: 1,
          },
        },
      ],
      as: 'customer',
    },
  },

  {
    $unwind: { path: '$customer', preserveNullAndEmptyArrays: true },
  },
] as CustomerStages

export const vendorPipeLine = (localField: 'vendorId' | 'entries.nameId' | 'customerId'): CustomerStages => [
  {
    $lookup: {
      from: 'carriers',
      localField: localField,
      foreignField: '_id',
      pipeline: [
        {
          $project: {
            _id: 1,
            company: {
              $ifNull: [
                '$company',
                "N/A"
              ],
            },
            rate:1,
            email: 1,
            billingAddress: {
              address: { $ifNull: ['$address', '$billingAddress.address'] },
              city: { $ifNull: ['$city', '$billingAddress.city'] },
              state: { $ifNull: ['$state', '$billingAddress.state'] },
              zipCode: { $ifNull: ['$zipCode', '$billingAddress.zipCode'] },
              country: { $ifNull: ['$country', '$billingAddress.country'] },
            },
            shippingAddress: {
              address: { $ifNull: ['$address', '$shippingAddress.address'] },
              city: { $ifNull: ['$city', '$shippingAddress.city'] },
              state: { $ifNull: ['$state', '$shippingAddress.state'] },
              zipCode: { $ifNull: ['$zipCode', '$shippingAddress.zipCode'] },
              country: { $ifNull: ['$country', '$shippingAddress.country'] },
            },
            phone: 1,
            paymentMethod: 1,
          },
        },
      ],
      as: 'carrier',
    },
  },

  {
    $unwind: { path: '$carrier', preserveNullAndEmptyArrays: true },
  },
] as CustomerStages;

