import { FC } from "react";
import SharedAgingReportCard from '@/components/common/SharedAgingReportCard/SharedAgingReportCard';
import { IAccountsReceiveableReportData } from "@/types";
import { paths } from "@/utils/paths";

interface AccountsReceiveableCardProps {
  reportData: IAccountsReceiveableReportData;
}

const AccountsReceiveableCard: FC<AccountsReceiveableCardProps> = ({ reportData }) => {
  return (
    <SharedAgingReportCard
      reportData={reportData}
      navigationPath={(customerId) => `${paths.customertransactionlist}/${customerId}`}
      type="AccountsReceiveable"
    />
  );
};

export default AccountsReceiveableCard;
