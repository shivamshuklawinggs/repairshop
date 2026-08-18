
import { allowedreports } from '@/types';

 const Reporttitle:Record<allowedreports,string>={
        "AccountsPayable":"A/C Payable Report",
        "AccountsReceiveable":"A/C Recievable Report",
        "balance-sheet":"Balance Sheet",
        "profit-and-loss":"Profit & Loss",
        "profit-and-loss-month":"Profit & Loss By Month",
        "AccountsPayableDetail":"Aging Report",
        "AccountsRecieveableDetail":"Aging Report",
        "TrialBalanceReport":"Trial Balance Report",
        "GeneralLedgerReport":"General Ledger Report"
        
}
const reports:Array<{
    name:string;
    path:allowedreports;
    description: string,
    favorite: boolean
}> = [
    {
        name: 'Profit and Loss',
        path:"profit-and-loss",
        description: 'View your income and expenses.', // done 
        favorite: true 
    },
    {
        name: 'Profit and Loss By Month',
        path:"profit-and-loss-month",
        description: 'View your income and expenses.', // done 
        favorite: true
    },
    {
        name: 'Balance Sheet',
        path: "balance-sheet",
        description: 'A snapshot of your financial health.', // done 
        favorite: true
    },
    {
        name: 'Accounts receivable aging summary',
        path:"AccountsReceiveable",
        description: 'A snapshot of your financial health.',
        favorite: true
    },
    {
        name: 'Accounts payable aging summary',
        path:"AccountsPayable",
        description: 'A snapshot of your financial health.',
        favorite: true
    },
    {
        name: 'Accounts payable aging Report Detail',
        path:"AccountsPayableDetail",
        description: 'A snapshot of your financial health.',
        favorite: true
    },
    {
        name: 'Accounts Receivable aging Report Detail',
        path:"AccountsRecieveableDetail",
        description: 'A snapshot of your financial health.',
        favorite: true
    },
    
    {
        name: 'Trial Balance Report',
        path:"TrialBalanceReport",
        description: 'View your income and expenses.',
        favorite: true
    },
    {
        name: 'General Ledger Report',
        path:"GeneralLedgerReport",
        description: 'View your income and expenses.',
        favorite: true
    },
];
const bucketLabels: Record<string, string> = {
    due_90_plus: '90+ days past due',
  due_61_90: '61 - 90 days past due',
  due_31_60: '31 - 60 days past due',
  due_0_30: '1 - 30 days past due',
  '90+': '90+ days past due',
  '61-90': '61 - 90 days past due',
  '31-60': '31 - 60 days past due',
  '0-30': '1 - 30 days past due',
  current: 'CURRENT',
};
export {reports,Reporttitle,bucketLabels}