
import { colorPresets } from "@/data/colors";
import {  ICompany } from "@/types";
export const initialCompanyData: ICompany = {
    _id: '',
    address: '',
    phone: '',
    color:colorPresets.teal.main,
    label: '',
    prefix: '',
    mcNumber: '',
     usdot: '',
    email: '',
    termsandconditions:"", 
    logo: null
  }