import { ICarrier, ICustomerTransactionDetails } from '@/types'
import UniversalEntityForm from '@/components/common/UniversalEntityForm';

const UniversalVendorForm = ({data,onClose,open,id}:{data:ICustomerTransactionDetails,onClose:()=>void,open:boolean,id:string}) => {
 
  return (
    <UniversalEntityForm
      entityType={"vendor"}
      open={open}
      id={id}
      onClose={onClose}
    />
  );
}

export default UniversalVendorForm