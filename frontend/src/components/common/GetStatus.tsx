import React from "react";
import { ICustomerInvoicesPaymentDetails, STATUS_MAP, TransactionType } from "@/types";
import { Chip, Box, Typography } from "@mui/material";
import { getTransactionStatus } from "@/utils";

const GetStatus: React.FC<{ invoice: ICustomerInvoicesPaymentDetails }> = ({ invoice }) => {
  const cfg = STATUS_MAP[invoice.status] ?? { color: '#374151', bg: '#f9fafb', border: '#e5e7eb' };

const {label,subtext}=getTransactionStatus(invoice.balanceDue || 0, invoice.dueDate, invoice.transactionType, invoice.status ,invoice.credits)
  return (
   <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
      <Chip
        label={label}
        sx={{
          height: 'auto',
          fontWeight: 600,
          fontSize: '0.7rem',
          bgcolor: cfg.bg,
          color: cfg.color,
          border: `1px solid ${cfg.border}`,
          '& .MuiChip-label': { px: 1 },
        }}
      />
      {subtext && (
        <Typography variant="caption" sx={{ color: cfg.color, fontSize: '0.65rem', fontWeight: 500, textAlign:'center', whiteSpace:'nowrap'}}>
          {subtext}
        </Typography>
      )}
    </Box>
  );
};

export default GetStatus;
