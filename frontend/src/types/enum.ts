const paymentMethodsInfoObject = {
    "": {
        value: '',
        label: 'Payment Method',
        disabled: true,
    },
    cash: {
        value: 'cash',
        label: 'Cash',
        disabled: false,
    },
    check: {
        value: 'check',
        label: 'Check',
        disabled: false,
    },
    "Bank Transfer": {
        value: 'Bank Transfer',
        label: 'Bank Transfer',
        disabled: false,
    },
    card: {
        value: 'card',
        label: 'Card',
        disabled: false,
    },
    wire: {
        value: 'wire',
        label: 'Wire',
        disabled: false,
    },
    ACH: {
        value: 'ACH',
        label: 'ACH',
        disabled: false,
    },
    "Mobile Deposit": {
        value: 'Mobile Deposit',
        label: 'Mobile Deposit',
        disabled: false,
    },

}

export enum PaymentMethods {
    NA = '',
    CASH = 'cash',
    CHECK = 'check',
    BANK_TRANSFER = 'Bank Transfer',
    CARD = 'card',
    WIRE = 'wire',
    ACH = 'ACH',
    Mobiledeposit = 'Mobile Deposit',
}
export enum ProfitAndLossTypeIds {
    income = "10",
    otherIncome = "13",
    expense = "12",
    otherExpense = "14",
    costOfGoodsSold = "11",
}
export type AccoutypeEnum =
    "Accounts receivable (A/R)" |
    "Other Current Assets" |
    "Bank" |
    "Fixed Assets" |
    "Other Assets" |
    "Accounts payable (A/P)" |
    "Credit Card" |
    "Other Current Liabilities" |
    "Long Term Liabilities" |
    "Equity" |
    "Income" |
    "Other Income" |
    "Cost of Goods Sold" |
    "Expenses" |
    "Other Expense"

export const PaymentMethodsOptions = Object.values(PaymentMethods).map((method) => ({
    value: method,
    label: paymentMethodsInfoObject[method].label,
    disabled: paymentMethodsInfoObject[method].disabled,
}));

export const invoiceStatusEnumOptions = ["Pending", "Partial", "Paid", "Overdue"].map((method) => ({
    value: method,
    label: method,
}));
export enum invoiceStatus {
    PENDING = "Pending",
    Partial = "Partial",
    PAID = "Paid",
    RECEIVED = "Received",
    OVERDUE = "Overdue"
}