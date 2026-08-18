export type OpraStatus = "NOT AUTHORIZED" | "OUT-OF-SERVICE"
export interface ICommonUsdotData {
   billingAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }
  mcNumber: string;
  usdot: string;
  phone: string;
  company?: string;
  entity_type?: string
  dba_name?: string
  legal_name?: string
  operating_status?: OpraStatus
  physical_address?: string
  mailing_address?: string
  carrier_operation?: string[]
  out_of_service_date?: string
}