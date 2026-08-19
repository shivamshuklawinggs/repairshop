import { IAccountTypeEnum, masterType } from "models/AccountType.model"
interface IdefaultDetail {
     detailType: defaultChartsDetailTypeidIdsEnum, detailTypeId: string, type: IAccountTypeEnum, masterType: masterType 
}
export enum defaultChartsDetailTypeidIdsEnum {
    DISCOUNTS_RECEIVED = "Discounts Received",
    RETAINED_EARNINGS = "Retained Earnings",
    DISCOUNTS_GIVEN = "Discounts Given",
    ACCOUNTS_RECEIVABLE = "Accounts Receivable (A/R)",
    ACCOUNTS_PAYABLE = "Accounts Payable (A/P)",
    SALES_TAX_PAYABLE = "Sales Tax Payable",
    PURCHASE_TAX = "Purchase Tax",
    CLEARING = "Clearing",
    SALES = "Sales",
    COS = "Expense",
    INVENTORY = "Inventory",
}
const defaultChartsDetailTypeidIds:Array<IdefaultDetail> = [
    {
        detailType: defaultChartsDetailTypeidIdsEnum.RETAINED_EARNINGS,
        detailTypeId: "3070",
        type: IAccountTypeEnum.EQUITY,
        masterType: masterType.retainedearnings
    },
    {
        detailType: defaultChartsDetailTypeidIdsEnum.DISCOUNTS_RECEIVED,
        detailTypeId: "5150",
        type: IAccountTypeEnum.INCOME,
        masterType: masterType.other
    },
    {
        detailType: defaultChartsDetailTypeidIdsEnum.DISCOUNTS_RECEIVED,
        detailTypeId: "5150",
        type: IAccountTypeEnum.INCOME,
        masterType: masterType.other
    },
    {
        detailType: defaultChartsDetailTypeidIdsEnum.SALES,
        detailTypeId: "5120",
        type: IAccountTypeEnum.INCOME,
        masterType: masterType.other
    },
    {
        detailType: defaultChartsDetailTypeidIdsEnum.INVENTORY,
        detailTypeId: "1220",
        type: IAccountTypeEnum.ASSET,
        masterType: masterType.other
    },
    {
        detailType: defaultChartsDetailTypeidIdsEnum.COS,
        detailTypeId: "5545",
        type: IAccountTypeEnum.EXPENSE,
        masterType: masterType.other
    },
    {
        detailType: defaultChartsDetailTypeidIdsEnum.DISCOUNTS_GIVEN,
        detailTypeId: "8216",
        type: IAccountTypeEnum.EXPENSE,
        masterType: masterType.other
    },
    {
        detailType: defaultChartsDetailTypeidIdsEnum.ACCOUNTS_RECEIVABLE,
        detailTypeId: "1040",
        type: IAccountTypeEnum.ASSET,
        masterType: masterType.customer
    },
    {
        detailType: defaultChartsDetailTypeidIdsEnum.CLEARING,
        detailTypeId: "1020",
        type: IAccountTypeEnum.ASSET,
        masterType: masterType.other
    },
    {
        detailType: defaultChartsDetailTypeidIdsEnum.ACCOUNTS_PAYABLE,
        detailTypeId: "2010",
        type: IAccountTypeEnum.LIABILITY,
        masterType: masterType.vendor
    },
    {
        detailType: defaultChartsDetailTypeidIdsEnum.SALES_TAX_PAYABLE,
        detailTypeId: "2050",
        type: IAccountTypeEnum.LIABILITY,
        masterType: masterType.other
    },
    {
        detailType: defaultChartsDetailTypeidIdsEnum.PURCHASE_TAX,
        detailTypeId: "3080",
        type: IAccountTypeEnum.LIABILITY,
        masterType: masterType.other
    }
]
// Helper function to get detailTypeId by detailType
export { defaultChartsDetailTypeidIds };

