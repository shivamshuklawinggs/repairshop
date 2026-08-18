import SharedAgingDetailCard from '@/components/common/SharedAgingDetailCard/SharedAgingDetailCard';
import { IAccountsRecieveableDetail } from '@/types';
import { paths } from '@/utils/paths';

const AccountsRecieveableDetailCard: React.FC<{ reportData: IAccountsRecieveableDetail }> = ({ reportData }) => {
  return (
    <SharedAgingDetailCard
      reportData={reportData}
      transactionType="Invoice"
      navigationPath={(invoiceId) => `${paths.editinvoice}/${invoiceId}`}
      type="AccountsRecieveableDetail"
    />
  );
};

export default AccountsRecieveableDetailCard