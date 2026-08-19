import { detectPageType } from './pageTypeDetection';
import { paths } from './paths';

// Test function to verify page type detection
export const testPageTypeDetection = () => {
  const testCases = [
    // Dashboard
    { path: paths.dashboard, expected: 'dashboard' },
    { path: '/dashboard', expected: 'dashboard' },
    
    // Customer pages
    { path: paths.customers, expected: 'customer-list' },
    { path: '/customers', expected: 'customer-list' },
    
    // Carrier pages
    { path: paths.carriers, expected: 'carrier-list' },
    { path: '/carriers', expected: 'carrier-list' },
    
    // Invoice/Bills pages
    { path: '/invoices', expected: 'invoice-list' },
    { path: '/bills', expected: 'invoice-list' },
    { path: '/estimates', expected: 'invoice-list' },
    { path: '/vendors', expected: 'invoice-list' },
    
    // Transaction lists
    { path: '/customertransactionlist/123', expected: 'transaction-list' },
    { path: '/vendortransactionlist/456', expected: 'transaction-list' },
    
    // Edit transactions
    { path: '/editinvoice/123', expected: 'edit-transaction' },
    { path: '/editbill/456', expected: 'edit-transaction' },
    { path: '/recievedpayment/789', expected: 'edit-transaction' },
    { path: '/recievedbill/101', expected: 'edit-transaction' },
    
    // Reports
    { path: paths.Reports, expected: 'report' },
    { path: '/reports', expected: 'report' },
    { path: '/reports/profit-and-loss', expected: 'report-detail' },
    { path: '/reports/balance-sheet', expected: 'report-detail' },
    
    // Table pages
    { path: paths.users, expected: 'table' },
    { path: paths.documents, expected: 'table' },
    { path: '/chart-accounts', expected: 'table' },
    { path: '/productservices', expected: 'table' },
    
    // Form pages
    { path: '/profile', expected: 'form' },
    { path: '/register', expected: 'form' },
    
    // Default
    { path: '/unknown-page', expected: 'default' },
  ];

  console.log('Testing page type detection:');
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(({ path, expected }) => {
    const result = detectPageType(path);
    const status = result === expected ? '✅' : '❌';
    if (result === expected) {
      passed++;
    } else {
      failed++;
    }
    console.log(`${status} ${path} -> ${result} (expected: ${expected})`);
  });
  
  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
};

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  testPageTypeDetection();
}
