import ejs from 'ejs';
import path from 'path';
import { Response } from 'express';
import Company from 'models/company.model';
import { generatePDF } from 'utils/generatePdfData';
import { ProfitAndLossTypeIds } from "shared/pipelines/enum";
const bucketLabels: Record<string, string> = {
  'current': 'Current',
  '1-30': '1 - 30 Days',
  '31-60': '31 - 60 Days',
  '61-90': '61 - 90 Days',
  '90+': '91 and over'
};

export class ReportExportMultiFormatService {
  
  static async getCompanyInfo(res: Response) {
    const company = await Company.findById(res.locals.companyId);
    return {
      companyName: company?.label || 'Company Name',
      companyAddress: company?.physicalDetails?.address || '',
      companyPhone: company?.physicalDetails?.phone || '',
      companyEmail: company?.physicalDetails?.email || ''
    };
  }

  static formatDate(date: Date | string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  static convertToCSV(headers: string[], rows: any[][]): string {
    const csvRows = [headers.join(',')];
    rows.forEach(row => {
      csvRows.push(row.map(cell => {
        if (cell === null || cell === undefined) return '';
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(','));
    });
    return csvRows.join('\n');
  }

  static async exportProfitAndLoss(reportData: any, res: Response, format: string, dateRange: string) {
    const companyInfo = await this.getCompanyInfo(res);
    
    const findReportByTypeId = (typeId: string) => {
      return reportData?.data?.find((item: any) => item.typeId === typeId);
    };

    const incomeSection = findReportByTypeId(ProfitAndLossTypeIds.income);
    const COGSSection = findReportByTypeId(ProfitAndLossTypeIds.costOfGoodsSold);
    const expenseSection = findReportByTypeId(ProfitAndLossTypeIds.expense);
    const otherIncomeSection = findReportByTypeId(ProfitAndLossTypeIds.otherIncome);
    const otherExpenseSection = findReportByTypeId(ProfitAndLossTypeIds.otherExpense);

    const totals = reportData?.totals || {};
    const totalIncome = totals.Income || 0;
    const totalCOGS = totals.COGS || 0;
    const totalExpense = totals.Expenses || 0;
    const totalOtherIncome = totals.OtherIncome || 0;
    const totalOtherExpense = totals.OtherExpense || 0;
    const grossProfit = totals.grossProfit || 0;
    const totalNetOperatingIncome = totals.netOperatingIncome || 0;
    const totalNetOtherIncome = totals.netOtherIncome || 0;
    const totalNetProfit = totals.netProfit || 0;
 
    const templateData = {
      ...companyInfo,
      dateRange,
      incomeSection,
      COGSSection,
      expenseSection,
      otherIncomeSection,
      otherExpenseSection,
      totalIncome,
      totalCOGS,
      totalExpense,
      totalOtherIncome,
      totalOtherExpense,
      grossProfit,
      totalNetOperatingIncome,
      totalNetOtherIncome,
      totalNetProfit
    };

    if (format === 'pdf') {
      const templatePath = path.join(__dirname, '../templates/profit-and-loss.ejs');
      const html = await ejs.renderFile(templatePath, templateData);
      return await generatePDF({html});
    } else if (format === 'csv') {
      const headers = ['Category', 'Amount'];
      const rows: any[][] = [];

      if (incomeSection?.data || incomeSection?.accounts) {
        rows.push(['Income', '']);
        (incomeSection.data || incomeSection.accounts).forEach((item: any) => {
          rows.push([`  ${item.name}`, (item.totalAmount || item.total || 0).toFixed(2)]);
        });
        rows.push(['Total Income', totalIncome.toFixed(2)]);
      }

      if (COGSSection?.data || COGSSection?.accounts) {
        rows.push(['Cost of Goods Sold', '']);
        (COGSSection.data || COGSSection.accounts).forEach((item: any) => {
          rows.push([`  ${item.name}`, (item.totalAmount || item.total || 0).toFixed(2)]);
        });
        rows.push(['Total Cost of Goods Sold', totalCOGS.toFixed(2)]);
      }

      rows.push(['Gross Profit', grossProfit.toFixed(2)]);

      if (expenseSection?.data || expenseSection?.accounts) {
        rows.push(['Expenses', '']);
        (expenseSection.data || expenseSection.accounts).forEach((item: any) => {
          rows.push([`  ${item.name}`, (item.totalAmount || item.total || 0).toFixed(2)]);
        });
        rows.push(['Total Expenses', totalExpense.toFixed(2)]);
      }

      rows.push(['Net Operating Income', totalNetOperatingIncome.toFixed(2)]);

      if (otherIncomeSection?.data || otherIncomeSection?.accounts) {
        rows.push(['Other Income', '']);
        (otherIncomeSection.data || otherIncomeSection.accounts).forEach((item: any) => {
          rows.push([`  ${item.name}`, (item.totalAmount || item.total || 0).toFixed(2)]);
        });
        rows.push(['Total Other Income', totalOtherIncome.toFixed(2)]);
      }

      if (otherExpenseSection?.data || otherExpenseSection?.accounts) {
        rows.push(['Other Expenses', '']);
        (otherExpenseSection.data || otherExpenseSection.accounts).forEach((item: any) => {
          rows.push([`  ${item.name}`, (item.totalAmount || item.total || 0).toFixed(2)]);
        });
        rows.push(['Total Other Expenses', totalOtherExpense.toFixed(2)]);
      }

      rows.push(['Net Other Income', totalNetOtherIncome.toFixed(2)]);
      rows.push(['Net Income', totalNetProfit.toFixed(2)]);

      return this.convertToCSV(headers, rows);
    } else {
      return reportData;
    }
  }

  static async exportBalanceSheet(reportData: any, res: Response, format: string, dateRange: string) {
    const companyInfo = await this.getCompanyInfo(res);
    
    const totals = reportData?.totals || {};
    const totalAssets = totals.TotalAssets ?? 0;
    const totalLiabilitiesAndEquity = totals.TotalLiabilitiesAndEquity ?? 0;
    
    // Map the data structure to match CRM format
    const templateData = {
      ...companyInfo,
      dateRange,
      Assets: reportData?.Assets || [],
      Liabilities: reportData?.Liabilities || [],
      totalAssets,
      totalLiabilitiesAndEquity
    };

    if (format === 'pdf') {
      const templatePath = path.join(__dirname, '../templates/balance-sheet.ejs');
      const html = await ejs.renderFile(templatePath, templateData);
      return await generatePDF({html});
    } else if (format === 'csv') {
      const headers = ['Category', 'Amount'];
      const rows: any[][] = [];

      rows.push(['ASSETS', '']);
      if (reportData?.Assets) {
        reportData.Assets.forEach((group: any) => {
          rows.push([group.name || group._id, '']);
          if (group.data) {
            group.data.forEach((item: any) => {
              rows.push([`  ${item.name}`, (item.endingBalance || 0).toFixed(2)]);
            });
          }
          rows.push([`Total ${group.name || group._id}`, (group.endingBalance || 0).toFixed(2)]);
        });
      }
      rows.push(['Total Assets', totalAssets.toFixed(2)]);
      rows.push(['', '']);

      rows.push(['LIABILITIES & EQUITY', '']);
      if (reportData?.Liabilities) {
        reportData.Liabilities.forEach((group: any) => {
          rows.push([group.name || group._id, '']);
          if (group.data) {
            group.data.forEach((item: any) => {
              rows.push([`  ${item.name}`, (item.endingBalance || 0).toFixed(2)]);
            });
          }
          rows.push([`Total ${group.name || group._id}`, (group.endingBalance || 0).toFixed(2)]);
        });
      }
      rows.push(['Total Liabilities & Equity', totalLiabilitiesAndEquity.toFixed(2)]);

      return this.convertToCSV(headers, rows);
    } else {
      return reportData;
    }
  }

  static async exportTrialBalance(reportData: any, res: Response, format: string, asOfDate: string) {
    const companyInfo = await this.getCompanyInfo(res);
    
    const accounts = reportData?.result || [];
    const totals = reportData?.totals || {};
    const templateData = {
      ...companyInfo,
      asOfDate,
      accounts,
      totalDebits: totals.totalDebits || 0,
      totalCredits: totals.totalCredits || 0
    };

    if (format === 'pdf') {
      const templatePath = path.join(__dirname, '../templates/trial-balance.ejs');
      const html = await ejs.renderFile(templatePath, templateData);
      return await generatePDF({html});
    } else if (format === 'csv') {
      const headers = ['Account', 'Debit', 'Credit'];
      const rows: any[][] = [];

      accounts.forEach((acc: any) => {
        rows.push([
          acc.name || '-',
          (acc.totalDebits || 0).toFixed(2),
          (acc.totalCredits || 0).toFixed(2)
        ]);
      });

      rows.push(['Total', totals.totalDebits.toFixed(2), totals.totalCredits.toFixed(2)]);

      return this.convertToCSV(headers, rows);
    } else {
      return reportData;
    }
  }

  static async exportGeneralLedger(reportData: any, res: Response, format: string, dateRange: string) {
    const companyInfo = await this.getCompanyInfo(res);
    
    const accounts = reportData?.result || [];
    const totals = reportData?.totals || {};
    
    const accountsWithFormattedDates = accounts.map((acc: any) => ({
      ...acc,
      payments: acc.payments?.map((p: any) => ({
        ...p,
        date: this.formatDate(p.date)
      }))
    }));

    const templateData = {
      ...companyInfo,
      dateRange,
      accounts: accountsWithFormattedDates,
      totalDebits: totals.totalDebits || 0,
      totalCredits: totals.totalCredits || 0
    };

    if (format === 'pdf') {
      const templatePath = path.join(__dirname, '../templates/general-ledger.ejs');
      const html = await ejs.renderFile(templatePath, templateData);
      return await generatePDF({html});
    } else if (format === 'csv') {
      const headers = ['Account/Date', 'Debit', 'Credit'];
      const rows: any[][] = [];

      accounts.forEach((acc: any) => {
        rows.push([acc.name, (acc.totalDebits || 0).toFixed(2), (acc.totalCredits || 0).toFixed(2)]);
        if (acc.payments) {
          acc.payments.forEach((payment: any) => {
            rows.push([
              `  ${this.formatDate(payment.date)}`,
              (payment.debit || 0).toFixed(2),
              (payment.credit || 0).toFixed(2)
            ]);
          });
        }
      });

      rows.push(['Total', totals.totalDebits.toFixed(2), totals.totalCredits.toFixed(2)]);

      return this.convertToCSV(headers, rows);
    } else {
      return reportData;
    }
  }

  static async exportAccountsReceivable(reportData: any, res: Response, format: string, dateRange: string) {
    const companyInfo = await this.getCompanyInfo(res);
    
    const templateData = {
      ...companyInfo,
      dateRange,
      data: reportData?.data || [],
      totalData: reportData?.totalData || {}
    };

    if (format === 'pdf') {
      const templatePath = path.join(__dirname, '../templates/accounts-receivable.ejs');
      const html = await ejs.renderFile(templatePath, templateData);
      return await generatePDF({html});
    } else if (format === 'csv') {
      const headers = ['Customer', 'Current', '1-30', '31-60', '61-90', '91 and over', 'Total'];
      const rows: any[][] = [];

      reportData?.data?.forEach((item: any) => {
        rows.push([
          item.customer?.name || '-',
          (item.currentDueAmount || 0).toFixed(2),
          (item.due_0_30 || 0).toFixed(2),
          (item.due_31_60 || 0).toFixed(2),
          (item.due_61_90 || 0).toFixed(2),
          (item.due_90_plus || 0).toFixed(2),
          (item.totalDueAmount || 0).toFixed(2)
        ]);
      });

      const totalData = reportData?.totalData || {};
      rows.push([
        'Total',
        (totalData.currentDueAmount || 0).toFixed(2),
        (totalData.due_0_30 || 0).toFixed(2),
        (totalData.due_31_60 || 0).toFixed(2),
        (totalData.due_61_90 || 0).toFixed(2),
        (totalData.due_90_plus || 0).toFixed(2),
        (totalData.totalDueAmount || 0).toFixed(2)
      ]);

      return this.convertToCSV(headers, rows);
    } else {
      return reportData;
    }
  }

  static async exportAccountsPayable(reportData: any, res: Response, format: string, dateRange: string) {
    const companyInfo = await this.getCompanyInfo(res);
    
    const templateData = {
      ...companyInfo,
      dateRange,
      data: reportData?.data || [],
      totalData: reportData?.totalData || {}
    };

    if (format === 'pdf') {
      const templatePath = path.join(__dirname, '../templates/accounts-payable.ejs');
      const html = await ejs.renderFile(templatePath, templateData);
      return await generatePDF({html});
    } else if (format === 'csv') {
      const headers = ['Vendor', 'Current', '1-30', '31-60', '61-90', '91 and over', 'Total'];
      const rows: any[][] = [];

      reportData?.data?.forEach((item: any) => {
        rows.push([
          item.customer?.name || '-',
          (item.currentDueAmount || 0).toFixed(2),
          (item.due_0_30 || 0).toFixed(2),
          (item.due_31_60 || 0).toFixed(2),
          (item.due_61_90 || 0).toFixed(2),
          (item.due_90_plus || 0).toFixed(2),
          (item.totalDueAmount || 0).toFixed(2)
        ]);
      });

      const totalData = reportData?.totalData || {};
      rows.push([
        'Total',
        (totalData.currentDueAmount || 0).toFixed(2),
        (totalData.due_0_30 || 0).toFixed(2),
        (totalData.due_31_60 || 0).toFixed(2),
        (totalData.due_61_90 || 0).toFixed(2),
        (totalData.due_90_plus || 0).toFixed(2),
        (totalData.totalDueAmount || 0).toFixed(2)
      ]);

      return this.convertToCSV(headers, rows);
    } else {
      return reportData;
    }
  }

  static async exportAccountsReceivableDetail(reportData: any, res: Response, format: string, dateRange: string) {
    const companyInfo = await this.getCompanyInfo(res);
    
    const dataWithLabels = reportData?.data?.map((group: any) => ({
      ...group,
      bucketLabel: bucketLabels[group.bucket] || group.bucket,
      invoices: group.invoices?.map((inv: any) => ({
        ...inv,
        date: this.formatDate(inv.date),
        dueDate: this.formatDate(inv.dueDate)
      }))
    }));

    const templateData = {
      ...companyInfo,
      dateRange,
      data: dataWithLabels || [],
      totalAmountWithTax: reportData?.totalAmountWithTax || 0,
      totalDueAmount: reportData?.totalDueAmount || 0
    };

    if (format === 'pdf') {
      const templatePath = path.join(__dirname, '../templates/accounts-receivable-detail.ejs');
      const html = await ejs.renderFile(templatePath, templateData);
      return await generatePDF({html});
    } else if (format === 'csv') {
      const headers = ['Date', 'Transaction Type', 'Num', 'Customer', 'Due Date', 'Past Due', 'Amount', 'Open Balance'];
      const rows: any[][] = [];

      reportData?.data?.forEach((group: any) => {
        rows.push([bucketLabels[group.bucket] || group.bucket, '', '', '', '', '', '', '']);
        group.invoices?.forEach((inv: any) => {
          rows.push([
            this.formatDate(inv.date),
            'Invoice',
            inv.num || '-',
            inv.vendorDisplayName || '-',
            this.formatDate(inv.dueDate),
            inv.daysPastDue || 0,
            (inv.amount || 0).toFixed(2),
            (inv.openBalance || 0).toFixed(2)
          ]);
        });
        rows.push([
          `Total for ${bucketLabels[group.bucket]}`,
          '',
          '',
          '',
          '',
          '',
          (group.totalAmount || 0).toFixed(2),
          (group.totalOpenBalance || 0).toFixed(2)
        ]);
      });

      rows.push([
        'Total',
        '',
        '',
        '',
        '',
        '',
        (reportData?.totalAmountWithTax || 0).toFixed(2),
        (reportData?.totalDueAmount || 0).toFixed(2)
      ]);

      return this.convertToCSV(headers, rows);
    } else {
      return reportData;
    }
  }

  static async exportAccountsPayableDetail(reportData: any, res: Response, format: string, dateRange: string) {
    const companyInfo = await this.getCompanyInfo(res);
    
    const dataWithLabels = reportData?.data?.map((group: any) => ({
      ...group,
      bucketLabel: bucketLabels[group.bucket] || group.bucket,
      invoices: group.invoices?.map((inv: any) => ({
        ...inv,
        date: this.formatDate(inv.date),
        dueDate: this.formatDate(inv.dueDate)
      }))
    }));

    const templateData = {
      ...companyInfo,
      dateRange,
      data: dataWithLabels || [],
      totalAmountWithTax: reportData?.totalAmountWithTax || 0,
      totalDueAmount: reportData?.totalDueAmount || 0
    };

    if (format === 'pdf') {
      const templatePath = path.join(__dirname, '../templates/accounts-payable-detail.ejs');
      const html = await ejs.renderFile(templatePath, templateData);
      return await generatePDF({html});
    } else if (format === 'csv') {
      const headers = ['Date', 'Transaction Type', 'Num', 'Vendor', 'Due Date', 'Past Due', 'Amount', 'Open Balance'];
      const rows: any[][] = [];

      reportData?.data?.forEach((group: any) => {
        rows.push([bucketLabels[group.bucket] || group.bucket, '', '', '', '', '', '', '']);
        group.invoices?.forEach((inv: any) => {
          rows.push([
            this.formatDate(inv.date),
            'Bill',
            inv.num || '-',
            inv.vendorDisplayName || '-',
            this.formatDate(inv.dueDate),
            inv.daysPastDue || 0,
            (inv.amount || 0).toFixed(2),
            (inv.openBalance || 0).toFixed(2)
          ]);
        });
        rows.push([
          `Total for ${bucketLabels[group.bucket]}`,
          '',
          '',
          '',
          '',
          '',
          (group.totalAmount || 0).toFixed(2),
          (group.totalOpenBalance || 0).toFixed(2)
        ]);
      });

      rows.push([
        'Total',
        '',
        '',
        '',
        '',
        '',
        (reportData?.totalAmountWithTax || 0).toFixed(2),
        (reportData?.totalDueAmount || 0).toFixed(2)
      ]);

      return this.convertToCSV(headers, rows);
    } else {
      return reportData;
    }
  }

  static async exportProfitAndLossByMonth(reportData: any, res: Response, format: string, dateRange: string) {
    const companyInfo = await this.getCompanyInfo(res);
    
    const findReportByTypeId = (typeId: string) => {
      return reportData?.data?.find((item: any) => item.typeId === typeId);
    };

    const incomeSection = findReportByTypeId(ProfitAndLossTypeIds.income);
    const COGSSection = findReportByTypeId(ProfitAndLossTypeIds.costOfGoodsSold);
    const expenseSection = findReportByTypeId(ProfitAndLossTypeIds.expense);
    const otherIncomeSection = findReportByTypeId(ProfitAndLossTypeIds.otherIncome);
    const otherExpenseSection = findReportByTypeId(ProfitAndLossTypeIds.otherExpense);

    const totals = reportData?.totals || {};
    const totalIncome = totals.Income || 0;
    const totalCOGS = totals.CostOfGoodsSold || 0;
    const totalGrossProfit = totals.grossProfit || 0;
    const totalExpense = totals.Expense || 0;
    const totalOtherIncome = totals.OtherIncome || 0;
    const totalOtherExpense = totals.OtherExpense || 0;
    const totalNetOperatingIncome = totals.netOperatingIncome || 0;
    const totalNetOtherIncome = totals.netOtherIncome || 0;
    const totalNetProfit = totals.netProfit || 0;

    // Extract all unique months from the data
    const months = (() => {
      const monthSet = new Set<string>();
      const sections = [incomeSection, COGSSection, expenseSection, otherIncomeSection, otherExpenseSection];

      // Extract months from section-level monthlyTotals
      sections.forEach(section => {
        section?.monthlyTotals?.forEach((mt: any) => {
          monthSet.add(`${mt.year}-${mt.month}`);
        });
      });

      // Also check reportData.monthlyTotals if sections don't have data
      reportData?.monthlyTotals?.forEach((mt: any) => {
        monthSet.add(`${mt.year}-${mt.month}`);
      });

      const monthArray = Array.from(monthSet).map(key => {
        const [year, month] = key.split('-').map(Number);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        return {
          month,
          year,
          label: `${monthNames[month - 1]} ${year}`
        };
      });

      // Sort by year and month
      return monthArray.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
    })();

    const templateData = {
      ...companyInfo,
      dateRange,
      incomeSection,
      COGSSection,
      expenseSection,
      otherIncomeSection,
      otherExpenseSection,
      months,
      totalIncome,
      totalCOGS,
      totalGrossProfit,
      totalExpense,
      totalOtherIncome,
      totalOtherExpense,
      totalNetOperatingIncome,
      totalNetOtherIncome,
      totalNetProfit
    };
    
    if (format === 'pdf') {
      const templatePath = path.join(__dirname, '../templates/profit-and-loss-month.ejs');
      const html = await ejs.renderFile(templatePath, templateData);
      return await generatePDF({html});
    } else if (format === 'csv') {
      // Create headers with monthly columns
      const headers = ['Account', ...months.map(m => m.label), 'Total'];
      const rows: any[][] = [];

      // Helper function to get month amount
      const getMonthAmount = (item: any, month: number, year: number): number => {
        const monthData = item.monthlyTotals?.find((mt: any) => mt.month === month && mt.year === year);
        return monthData?.totalAmount || 0;
      };

      // Helper function to get section month total
      const getSectionMonthTotal = (section: any, month: number, year: number): number => {
        const sectionMonthData = section?.monthlyTotals?.find((mt: any) => mt.month === month && mt.year === year);
        if (sectionMonthData) {
          return sectionMonthData.totalAmount || 0;
        }
        return section?.data?.reduce((sum: number, row: any) => sum + getMonthAmount(row, month, year), 0) || 0;
      };

      // Income Section
      if (incomeSection?.data || incomeSection?.accounts) {
        rows.push(['Income', ...months.map(() => ''), '']);
        (incomeSection.data || incomeSection.accounts).forEach((item: any) => {
          const monthAmounts = months.map(m => getMonthAmount(item, m.month, m.year).toFixed(2));
          rows.push([`  ${item.name}`, ...monthAmounts, (item.totalAmount || item.total || 0).toFixed(2)]);
        });
        const incomeMonthTotals = months.map(m => getSectionMonthTotal(incomeSection, m.month, m.year).toFixed(2));
        rows.push(['Total Income', ...incomeMonthTotals, totalIncome.toFixed(2)]);
      }

      // Cost of Goods Sold Section
      if (COGSSection?.data || COGSSection?.accounts) {
        rows.push(['Cost of Goods Sold', ...months.map(() => ''), '']);
        (COGSSection.data || COGSSection.accounts).forEach((item: any) => {
          const monthAmounts = months.map(m => getMonthAmount(item, m.month, m.year).toFixed(2));
          rows.push([`  ${item.name}`, ...monthAmounts, (item.totalAmount || item.total || 0).toFixed(2)]);
        });
        const cogsMonthTotals = months.map(m => getSectionMonthTotal(COGSSection, m.month, m.year).toFixed(2));
        rows.push(['Total Cost of Goods Sold', ...cogsMonthTotals, totalCOGS.toFixed(2)]);
      }

      // Gross Profit
      const grossProfitMonthTotals = months.map(m => {
        const incomeMonth = getSectionMonthTotal(incomeSection, m.month, m.year);
        const cogsMonth = getSectionMonthTotal(COGSSection, m.month, m.year);
        return (incomeMonth - cogsMonth).toFixed(2);
      });
      rows.push(['Gross Profit', ...grossProfitMonthTotals, totalGrossProfit.toFixed(2)]);

      // Expenses Section
      if (expenseSection?.data || expenseSection?.accounts) {
        rows.push(['Expenses', ...months.map(() => ''), '']);
        (expenseSection.data || expenseSection.accounts).forEach((item: any) => {
          const monthAmounts = months.map(m => getMonthAmount(item, m.month, m.year).toFixed(2));
          rows.push([`  ${item.name}`, ...monthAmounts, (item.totalAmount || item.total || 0).toFixed(2)]);
        });
        const expenseMonthTotals = months.map(m => getSectionMonthTotal(expenseSection, m.month, m.year).toFixed(2));
        rows.push(['Total Expenses', ...expenseMonthTotals, totalExpense.toFixed(2)]);
      }

      // Net Operating Income
      const netOperatingMonthTotals = months.map(m => {
        const incomeMonth = getSectionMonthTotal(incomeSection, m.month, m.year);
        const cogsMonth = getSectionMonthTotal(COGSSection, m.month, m.year);
        const expenseMonth = getSectionMonthTotal(expenseSection, m.month, m.year);
        return (incomeMonth - cogsMonth - expenseMonth).toFixed(2);
      });
      rows.push(['Net Operating Income', ...netOperatingMonthTotals, totalNetOperatingIncome.toFixed(2)]);

      // Other Income Section
      if (otherIncomeSection?.data || otherIncomeSection?.accounts) {
        rows.push(['Other Income', ...months.map(() => ''), '']);
        (otherIncomeSection.data || otherIncomeSection.accounts).forEach((item: any) => {
          const monthAmounts = months.map(m => getMonthAmount(item, m.month, m.year).toFixed(2));
          rows.push([`  ${item.name}`, ...monthAmounts, (item.totalAmount || item.total || 0).toFixed(2)]);
        });
        const otherIncomeMonthTotals = months.map(m => getSectionMonthTotal(otherIncomeSection, m.month, m.year).toFixed(2));
        rows.push(['Total Other Income', ...otherIncomeMonthTotals, totalOtherIncome.toFixed(2)]);
      }

      // Other Expenses Section
      if (otherExpenseSection?.data || otherExpenseSection?.accounts) {
        rows.push(['Other Expenses', ...months.map(() => ''), '']);
        (otherExpenseSection.data || otherExpenseSection.accounts).forEach((item: any) => {
          const monthAmounts = months.map(m => getMonthAmount(item, m.month, m.year).toFixed(2));
          rows.push([`  ${item.name}`, ...monthAmounts, (item.totalAmount || item.total || 0).toFixed(2)]);
        });
        const otherExpenseMonthTotals = months.map(m => getSectionMonthTotal(otherExpenseSection, m.month, m.year).toFixed(2));
        rows.push(['Total Other Expenses', ...otherExpenseMonthTotals, totalOtherExpense.toFixed(2)]);
      }

      // Net Other Income
      const netOtherMonthTotals = months.map(m => {
        const otherIncomeMonth = getSectionMonthTotal(otherIncomeSection, m.month, m.year);
        const otherExpenseMonth = getSectionMonthTotal(otherExpenseSection, m.month, m.year);
        return (otherIncomeMonth - otherExpenseMonth).toFixed(2);
      });
      rows.push(['Net Other Income', ...netOtherMonthTotals, totalNetOtherIncome.toFixed(2)]);

      // Net Income
      const netIncomeMonthTotals = months.map(m => {
        const incomeMonth = getSectionMonthTotal(incomeSection, m.month, m.year);
        const cogsMonth = getSectionMonthTotal(COGSSection, m.month, m.year);
        const expenseMonth = getSectionMonthTotal(expenseSection, m.month, m.year);
        const otherIncomeMonth = getSectionMonthTotal(otherIncomeSection, m.month, m.year);
        const otherExpenseMonth = getSectionMonthTotal(otherExpenseSection, m.month, m.year);
        return (incomeMonth - cogsMonth - expenseMonth + otherIncomeMonth - otherExpenseMonth).toFixed(2);
      });
      rows.push(['Net Income', ...netIncomeMonthTotals, totalNetProfit.toFixed(2)]);

      return this.convertToCSV(headers, rows);
    } else {
      return reportData;
    }
  }
}
