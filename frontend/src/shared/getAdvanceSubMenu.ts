import { MenuAction } from "@/components/VerticalMenu";
import { Advance, TransactionType } from "@/types";
import { paths } from "@/utils/paths";
import { NavigateFunction } from "react-router-dom";
import React from "react";
import { Box, Chip, Typography } from "@mui/material";

interface GetAdvanceSubMenuProps {
  advances?: Advance[];
  type: TransactionType;
  navigate: NavigateFunction;
  onAdvanceClick?: () => void;
}

export const getAdvanceSubMenu = ({
  advances = [],
  type,
  navigate,
  onAdvanceClick,
}: GetAdvanceSubMenuProps): MenuAction => {

  const handleNavigate = (adv: Advance) => {
    if (type === TransactionType.INVOICE) {
      navigate(`${paths.recievedpayment}/${adv._id}`);
    } else {
      navigate(`${paths.recievedbill}/${adv._id}`);
    }
  };

  return {
    label:type===TransactionType.INVOICE?"Receive Payment":"Bill Payment",
    icon: "creditCard",

    onClick: () => {
      onAdvanceClick?.();
    },

    subMenu:advances.map((adv) => ({
      label: `Ref No:${adv.referenceNo}`,
      description: React.createElement(
        Box,
        { sx: { display: 'flex', alignItems: 'center', gap: 0.75, mt:0 }},
        React.createElement(Typography, { variant: 'caption', color: '#00a870',fontWeight: 700,fontSize: '0.8rem' },
          `$${adv.amount.toFixed(2)}`
        ),
        React.createElement(Chip, {
          size: 'small',
          label: `Left $${adv.credits.toFixed(2)}`,
          color: adv.credits > 0 ? 'error' : 'success',
          variant: 'outlined',
          sx: { height: 17, fontSize: '0.78rem', fontWeight: 700, '& .MuiChip-label': { px: 0.75 } },
        }),
      ),
      icon: adv.credits > 0 ? "accountBalanceWallet" : "checkCircle",
      onClick: () => handleNavigate(adv),
    })),
  };
};