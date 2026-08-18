import { ICustomer, ICustomerTransactionDetails } from '@/types'
import UniversalEntityForm from '@/components/common/UniversalEntityForm';

const UniversalCustomerForm = ({data,onClose,open,id}:{data:ICustomerTransactionDetails,onClose:()=>void,open:boolean,id:string}) => {
  const entityType =  'account-customer' 

  return (
    <UniversalEntityForm
      entityType={entityType}
      open={open}
      onClose={onClose}
      id={id}
    />
  );
}

export default UniversalCustomerForm