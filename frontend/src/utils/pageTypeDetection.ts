import { paths } from './paths';

type PageType = 'dashboard' | 'table' | 'report' | 'form' | 'customer-list' | 'carrier-list' | 'invoice-list' | 'transaction-list' | 'report-detail' | 'edit-transaction' | 'default';

/**
 * Determines the page type based on the current pathname
 * @param pathname - The current URL pathname
 * @returns The detected page type
 */
export const detectPageType = (pathname: string): PageType => {
  // Dashboard pages
  if (pathname === paths.dashboard || pathname.includes('dashboard')) {
    return 'dashboard';
  }

  // Transaction list pages (customer/vendor specific)
  if (pathname.includes('/customertransactionlist') || pathname.includes('/vendortransactionlist')) {
    return 'transaction-list';
  }

  // Edit transaction pages (invoices, bills, payments)
  if (
    pathname.includes('/editinvoice') ||
    pathname.includes('/editbill') ||
    pathname.includes('/recievedpayment/') ||
    pathname.includes('/recievedbill/')
  ) {
    return 'edit-transaction';
  }

  // Customer list page
  if (pathname === paths.customers || (pathname.includes('/customers') && !pathname.includes('/rating') && !pathname.includes('/report'))) {
    return 'customer-list';
  }

  // Carrier list page
  if (pathname === paths.carriers || (pathname.includes('/carriers') && !pathname.includes('/rating') && !pathname.includes('/report') && !pathname.includes('/driver'))) {
    return 'carrier-list';
  }

 

  // Invoice/Bills/Estimates list pages
  if (
    pathname.includes('/invoices') ||
    pathname.includes('/bills') ||
    pathname.includes('/estimates') ||
    pathname.includes('/vendors')
  ) {
    return 'invoice-list';
  }
  // Report detail pages (specific report types)
  if (
    pathname.includes('/reports/') ||
    (pathname.includes(paths.Reports) && pathname.split('/').length > 2)
  ) {
    return 'report-detail';
  }

  // Report index page
  if (pathname === paths.Reports || pathname.includes('report')) {
    return 'report';
  }

  // Form pages (create/edit)
  if (
    pathname.includes('/create') ||
    pathname.includes('/edit') ||
    pathname.includes('/add') ||
    pathname.includes('/form') ||
    pathname.includes('/register') ||
    pathname.includes('/profile')
  ) {
    return 'form';
  }

  // Table pages (list views)
  if (
    pathname.includes(paths.documents)||
    pathname.includes(paths.users) ||
    pathname.includes(paths.viewcompany) ||
    pathname.includes('/payments') ||
    pathname.includes('/productservices') ||
    pathname.includes('/journal') ||
    pathname.includes('/chart-accounts') ||
    pathname.includes('/tax') ||
    pathname.includes('/payment-terms')
  ) {
    return 'table';
  }

  return 'default';
};
