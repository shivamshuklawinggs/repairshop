import SharedAgingDetailCard from '@/components/common/SharedAgingDetailCard/SharedAgingDetailCard';
import { IAccountsPayableDetail } from '@/types';
import { paths } from '@/utils/paths';

const AccountsPayableDetailCard: React.FC<{ reportData: IAccountsPayableDetail }> = ({ reportData }) => {
  return (
    <SharedAgingDetailCard
      reportData={reportData}
      transactionType="Bill"
      navigationPath={(invoiceId) => `${paths.editbill}/${invoiceId}`}
      type="AccountsPayableDetail"
    />
  );
};

export default AccountsPayableDetailCard