import apiService from '@/service/apiService';
import { ICarrier, ICommonUsdotData } from '@/types';
import {  useState } from 'react';

const cleanPhone = (phone: string = '') => {
  return phone.replace(/\D/g, '');
};

const useGetUsDotData = (type: 'customer' | 'carrier', setValue?: any) => {
  const [data, setData] = useState<ICommonUsdotData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchData = async (usdot:string) => {
    if (!usdot) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getDataByUsdotNumber(usdot);
      
      if (response?.data) {
        
        const commonData:ICommonUsdotData = {
          billingAddress:response.data.billingAddress,
          shippingAddress:response.data.shippingAddress,
          mcNumber: response?.data?.mc_mx_ff_numbers || '',
          usdot: response?.data?.usdot || '',
          phone: response?.data?.phone || "",
          entity_type:response?.data?.entity_type || '',
          dba_name:response?.data?.dba_name || '',
          legal_name:response?.data?.legal_name || '',
          operating_status:response?.data?.operating_status || '',
          physical_address:response?.data?.physical_address || '',
          mailing_address:response?.data?.mailing_address || '',
          carrier_operation:response?.data?.carrier_operation || [],
          out_of_service_date:response?.data?.out_of_service_date || '',
          company: response?.data?.legal_name || response?.data?.dba_name || '',
        };
        setData(commonData);

        // Update form fields if setValue is provided (for customer form)
        if (setValue) {
          setValue('company', commonData.company);
          setValue('phone', commonData.phone);
          // address details
          setValue("billingAddress",commonData.billingAddress)
          setValue("shippingAddress",commonData.shippingAddress)
          setValue('address', commonData.shippingAddress?.address ?? "");
          setValue('city', commonData.shippingAddress?.city ?? "");
          setValue("zipCode",commonData.shippingAddress?.zipCode)
          setValue("state",commonData.shippingAddress?.state)
          setValue('mcNumber', commonData.mcNumber);
          setValue("entityDetails.entity_type",commonData.entity_type)
          setValue("entityDetails.dba_name",commonData.dba_name)
          setValue("entityDetails.legal_name",commonData.legal_name)
          setValue("entityDetails.operating_status",commonData.operating_status)
          setValue("entityDetails.physical_address",commonData.physical_address)
          setValue("entityDetails.mailing_address",commonData.mailing_address)
          setValue("entityDetails.carrier_operation",commonData.carrier_operation)
          setValue("entityDetails.out_of_service_date",commonData.out_of_service_date)
        }
      }
    } catch (err) {
      console.warn("errrrr",err)
      setError(err instanceof Error ? err : new Error('Failed to fetch USDOT data'));
      setData(null);
      // Update form fields if setValue is provided (for customer form)
     if (setValue) {
      setValue('company', '');
      setValue('phone', '');
      setValue('address', '');
      setValue('mcNumber', '');
      setValue("zipCode","")
      setValue("state","")
      setValue("entityDetails.entity_type","")
      setValue("entityDetails.dba_name","")
      setValue("entityDetails.legal_name","")
      setValue("entityDetails.operating_status","")
      setValue("entityDetails.physical_address","")
      setValue("entityDetails.mailing_address","")
      setValue("entityDetails.carrier_operation",[])
      setValue("entityDetails.out_of_service_date","")
    }
   
    } finally {
      setLoading(false);
    }
  };
   const handleSubmit = (value:string) => {
     if(setValue){
       setValue('usdot',value);
     }
     if(setValue ){
      setValue('usdot',value);
     }
     fetchData(value);
  };
  return { 
    usDotData: data, 
    loading, 
    error ,
    handleSubmit
  };
};
export const MatchUSDotDataCarrier = async (
  carrierData: ICarrier,
  response: { data: any }
) => {
  let data: ICommonUsdotData | null = null;

  try {
    if (response?.data) {
      const commonData:ICommonUsdotData = {
          billingAddress:response.data.billingAddress,
          shippingAddress:response.data.shippingAddress,
          mcNumber: response?.data?.mc_mx_ff_numbers || '',
          usdot: response?.data?.usdot || '',
          phone: response?.data?.phone || "",
          entity_type:response?.data?.entity_type || '',
          dba_name:response?.data?.dba_name || '',
          legal_name:response?.data?.legal_name || '',
          operating_status:response?.data?.operating_status || '',
          physical_address:response?.data?.physical_address || '',
          mailing_address:response?.data?.mailing_address || '',
          carrier_operation:response?.data?.carrier_operation || [],
          out_of_service_date:response?.data?.out_of_service_date || '',
          company: response?.data?.legal_name || response?.data?.dba_name || '',
        };
    }
  } catch (err) {
    data = {
      usdot:"",
      company: "",
      phone: "",
      mcNumber: "",
      entity_type: "",
      dba_name: "",
      legal_name: "",
      operating_status: undefined,
      physical_address: "",
      mailing_address: "",
      carrier_operation: [],
      out_of_service_date: "",
    };
  }

  if (!data) return {};
  const compareProperties: (keyof ICommonUsdotData)[] = [
    "mcNumber",
    "usdot",
    "phone",
    "company",
    "company",
    "entity_type",
    "dba_name",
    "legal_name",
    "operating_status",
    "physical_address",
    "mailing_address",
    "carrier_operation",
    "out_of_service_date"
  ];
  
  const entityDetailKeys = new Set<keyof ICommonUsdotData>([
    "entity_type", "dba_name", "legal_name", "operating_status",
    "physical_address", "mailing_address", "carrier_operation", "out_of_service_date",
  ]);

  const comparisonResult = compareProperties.reduce(
    (acc, key) => {
      const oldValue = entityDetailKeys.has(key)
        ? (carrierData.entityDetails as any)?.[key]
        : (carrierData as any)[key];
      const newValue = data?.[key];
      // Handle arrays separately (like carrier_operation)
      const isEqual = Array.isArray(oldValue) && Array.isArray(newValue)
        ? oldValue.length === newValue.length &&
          oldValue.every((val, idx) => val === newValue[idx])
        : oldValue === newValue;
  
      if (isEqual) {
        acc.matched[key] = newValue as any;
      } else {
        acc.nonMatched[key] = 
          newValue
      }
  
      return acc;
    },
    {
      matched: {} as Partial<ICommonUsdotData>,
      nonMatched: {} as Record<
        keyof ICommonUsdotData,
        any
      >,
    }
  );
  
  return Object.keys(comparisonResult.nonMatched).length > 0 ? comparisonResult.nonMatched : null;
  
};


export const useGetUsDotDataForCustomer = ( setValue: any) => {
  return useGetUsDotData('customer', setValue);
};

export const useUSDOTForCarrier = (setValue:Function) => {
  return useGetUsDotData('carrier',setValue);
};
