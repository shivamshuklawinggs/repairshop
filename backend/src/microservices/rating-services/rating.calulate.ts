import Carrier from "models/Carrier.model";
import {  interfaceRatingUpdate, RatingSummary } from "./constant";
import { getCustomerRatingSummary, updateCustomerPlatformRating } from "./customer-rating";
import Customer from "models/Customer.model";





export async function updateEntityRating({
  entityType,
  entityId
}:interfaceRatingUpdate): Promise<RatingSummary | null> {

  let rating :RatingSummary= {
    score: 80,
    stars: 4,
  }
  switch (entityType) {
    case "carrier":
      await Carrier.updateOne({ _id: entityId }, {
        $set: {
          autoScore: rating.score,
          stars: rating.stars
        }
      });
     break;
     
     case "customer":
      rating = await getCustomerRatingSummary(entityId);
      
    const customer=  await Customer.findOneAndUpdate({ _id: entityId }, {
        $set: {
          autoScore: rating.score,
          stars: rating.stars
        }
      },{
        new:true
      });
      customer?.truckDetails?.vinNumber && await updateCustomerPlatformRating(customer?.truckDetails?.vinNumber)
      break;
     default:
    
  }

  return rating;
}

