import { formatCurrency, formatDate } from './index';

export interface ExportData {
  category: string;
  amount: number;
  description?: string;
}

export interface ReportData {
  totals: {
    Income: number;
    COGS: number;
    grossProfit: number;
    Expenses: number;
    netOperatingIncome: number;
    OtherIncome: number;
    OtherExpense: number;
    netOtherIncome: number;
    netProfit: number;
  };
  data?: any;
  monthlyTotals?: any;
}

export const exportToCSV = (reportData: ReportData, reportTitle: string, fromDate: string, toDate: string): string => {
  const csvData: string[] = [];
  
  // Add header
  csvData.push(`${reportTitle}`);
  csvData.push(`Period: ${formatDate(new Date(fromDate))} - ${formatDate(new Date(toDate))}`);
  csvData.push(''); // Empty line
  
  // Add column headers
  csvData.push('Category,Amount');
  
  // Process data sections
  const sections = [
    { name: 'Income', total: reportData.totals.Income },
    { name: 'Cost of Goods Sold', total: reportData.totals.COGS },
    { name: 'Gross Profit', total: reportData.totals.grossProfit },
    { name: 'Expenses', total: reportData.totals.Expenses },
    { name: 'Net Operating Income', total: reportData.totals.netOperatingIncome },
    { name: 'Other Income', total: reportData.totals.OtherIncome },
    { name: 'Other Expenses', total: reportData.totals.OtherExpense },
    { name: 'Net Other Income', total: reportData.totals.netOtherIncome },
    { name: 'Net Income', total: reportData.totals.netProfit }
  ];
  
  sections.forEach(section => {
    csvData.push(`"${section.name}",${section.total}`);
  });
  
  // Create CSV content
  return csvData.join('\n');
};

export const exportToJSON = (reportData: ReportData, reportTitle: string, fromDate: string, toDate: string): string => {
  const exportData = {
    reportTitle,
    period: {
      fromDate: formatDate(new Date(fromDate)),
      toDate: formatDate(new Date(toDate))
    },
    totals: reportData.totals,
    data: reportData.data,
    monthlyTotals: reportData.monthlyTotals,
    exportedAt: new Date().toISOString()
  };
  
  return JSON.stringify(exportData, null, 2);
};

export const exportToTXT = (reportData: ReportData, reportTitle: string, fromDate: string, toDate: string): string => {
  let txtContent = `${reportTitle}\n`;
  txtContent += `Period: ${formatDate(new Date(fromDate))} - ${formatDate(new Date(toDate))}\n`;
  txtContent += `Generated: ${new Date().toLocaleString()}\n`;
  txtContent += '='.repeat(50) + '\n\n';
  
  const sections = [
    { name: 'Income', total: reportData.totals.Income },
    { name: 'Cost of Goods Sold', total: reportData.totals.COGS },
    { name: 'Gross Profit', total: reportData.totals.grossProfit },
    { name: 'Expenses', total: reportData.totals.Expenses },
    { name: 'Net Operating Income', total: reportData.totals.netOperatingIncome },
    { name: 'Other Income', total: reportData.totals.OtherIncome },
    { name: 'Other Expenses', total: reportData.totals.OtherExpense },
    { name: 'Net Other Income', total: reportData.totals.netOtherIncome },
    { name: 'Net Income', total: reportData.totals.netProfit }
  ];
  
  sections.forEach(section => {
    txtContent += `${section.name}: ${formatCurrency(section.total)}\n`;
  });
  
  return txtContent;
};

export const generateFileName = (reportTitle: string, fromDate: string, toDate: string, format: string): string => {
  const formattedFromDate = formatDate(new Date(fromDate));
  const formattedToDate = formatDate(new Date(toDate));
  const cleanTitle = reportTitle.replace(/\s+/g, '_');
  return `${cleanTitle}_${formattedFromDate}_to_${formattedToDate}.${format}`;
};

export type ExportFormat = 'csv' | 'json' | 'txt';

export const exportReportData = (
  reportData: ReportData, 
  reportTitle: string, 
  fromDate: string, 
  toDate: string, 
  format: ExportFormat
): string => {
  switch (format) {
    case 'csv':
      return exportToCSV(reportData, reportTitle, fromDate, toDate);
    case 'json':
      return exportToJSON(reportData, reportTitle, fromDate, toDate);
    case 'txt':
      return exportToTXT(reportData, reportTitle, fromDate, toDate);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};
