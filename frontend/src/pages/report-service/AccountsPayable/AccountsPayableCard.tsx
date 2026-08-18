import { FC } from "react";
import SharedAgingReportCard from '@/components/common/SharedAgingReportCard/SharedAgingReportCard';
import { IAccountsPayableReportData } from "@/types";
import { paths } from "@/utils/paths";

interface AccountsPayableCardProps {
  reportData: IAccountsPayableReportData;
}

const AccountsPayableCard: FC<AccountsPayableCardProps> = ({ reportData }) => {
  return (
    <SharedAgingReportCard
      reportData={reportData}
      navigationPath={(customerId) => `${paths.vendortransactionlist}/${customerId}`}
      type="AccountsPayable"
    />
  );
};

export default AccountsPayableCard;
