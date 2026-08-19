import { SidebarMenuItem, Role } from "@/types";
import { paths } from "@/utils/paths";

// Base menu items with all possible entries
const baseMenuItems: SidebarMenuItem[] = [
  {
    path: paths.dashboard,
    title: 'Dashboard',
    icon: 'dashboard',
    action: 'view',
    resource: ['dashboard'],
    roles: []
  },
  {
    path: paths.superadminDashboard,
    title: 'Dashboard',
    icon: 'dashboard',
    currentCompany: false,
    action: 'view',
    resource: ['superadmin'],
    roles: [Role.SUPERADMIN],
  },
  {
    path: `${paths.users}`,
    title: 'Users',
    icon: 'users',
    action: 'view',
    resource: ['users', 'superadmin'],
    roles: [Role.SUPERADMIN, Role.ADMIN,Role.ACCOUNTANT],
  },

   {
      path: paths.plans,
      title: 'Plans',
      icon: 'priceChange',
      currentCompany: false,
      action: 'view',
      resource: ['superadmin'],
      roles: [Role.SUPERADMIN],
    },
  {
    path: `${paths.viewcompany}`,
    title: 'Company',
    icon: 'company',
    action: 'view',
    resource: ['company'],
    roles: [Role.ADMIN]
  },
  
  {
    path: paths.documents,
    title: 'Documents',
    icon: 'file',
    action: 'view',
    resource: ['documents'],
    roles: [Role.ADMIN]
  },
 
  {
    path: paths.accounting,
    title: 'Accounting',
    icon: 'accountBalanceWallet',
    action: 'view',
    resource: ['accounting'],
    children: [
      {
        path: '/accounting/sales',
        title: 'Sales',
        icon: 'sales',
        action: 'view',
        resource: ['accounting'],
        children: [
          { path: '/accounting/sales/invoices', title: 'Invoices', icon: 'invoices', action: 'view', resource: ['accounting'], roles: [Role.ADMIN, Role.ACCOUNTANT] },
          { path: '/accounting/sales/estimates', title: 'Estimates', icon: 'estimates', action: 'view', resource: ['accounting'], roles: [Role.ADMIN, Role.ACCOUNTANT] },
          { path: '/accounting/sales/accounts/customers', title: 'Customers', icon: 'CustomerIcon', action: 'view', resource: ['accounting'], roles: [Role.ADMIN, Role.ACCOUNTANT,Role.ACCOUNTANT] },
          { path: '/accounting/sales/accounts/recievedpayment', title: 'Receive Payment', icon: 'ReceivePaymentIcon', action: 'create', resource: ['accounting'], roles: [Role.ADMIN, Role.ACCOUNTANT] },
        ],
        roles: [Role.ADMIN, Role.ACCOUNTANT]
      },
      {
        path: '/accounting/purchase',
        title: 'Purchase',
        icon: 'purchase',
        action: 'view',
        resource: ['accounting'],
        roles: [Role.ADMIN, Role.ACCOUNTANT],
        children: [
          { path: '/accounting/purchase/vendors', title: 'Vendors', icon: 'vendors', action: 'view', resource: ['accounting'], roles: [Role.ADMIN, Role.ACCOUNTANT] },
          { path: '/accounting/purchase/bills', title: 'Bills', icon: 'bills', action: 'view', resource: ['accounting'], roles: [Role.ADMIN, Role.ACCOUNTANT] },
          { path: '/accounting/purchase/accounts/recievedbill', title: 'Bill Payment', icon: 'BillPaymentIcon', action: 'create', resource: ['accounting'], roles: [Role.ADMIN, Role.ACCOUNTANT] },
        ],
      },
      { path: `/accounting${paths.paymentterms}`, title: 'Payment Terms', icon: 'PaymentTermsIcon', action: 'view', resource: ['accounting'], roles: [Role.ADMIN, Role.ACCOUNTANT] },
      // { path: `/accounting${paths.invoiceReminderTemplates}`, title: 'Invoice Reminder', icon: 'email', action: 'view', resource: ["InvoiceReminderTemplatesList"], roles: [Role.ADMIN, Role.ACCOUNTANT,Role.ACCOUNTANT] },
      { path: `/accounting${paths.taxoptions}`, title: 'Tax Rate', icon: 'tax', action: 'view', resource: ['accounting'], roles: [Role.ADMIN, Role.ACCOUNTANT] },
      { path: `/accounting${paths.productservices}`, title: 'Product Services', icon: 'product', action: 'view', resource: ['accounting'], roles: [Role.ADMIN, Role.ACCOUNTANT] },
      { path: `/accounting${paths.chartofaccounts}`, title: 'Chart Of Accounts', icon: 'chartAccounts', action: 'view', resource: ['accounting'], roles: [Role.ADMIN, Role.ACCOUNTANT] },
      { path: `/accounting${paths.JournalEntryList}`, title: 'Journal Entry', icon: 'JournalEntryIcon', action: 'view', resource: ['accounting'], roles: [Role.ADMIN, Role.ACCOUNTANT] },
      { path: `/accounting${paths.payments}`, title: 'Payments', icon: 'PaymentsNew', action: 'view', resource: ['accounting'], roles: [Role.ADMIN, Role.ACCOUNTANT] },
    ],
    roles:[Role.ADMIN,Role.ACCOUNTANT,Role.ACCOUNTANT]
  },
  {
    path: paths.Reports,
    title: 'Reports',
    icon: 'reports',
    action: 'view',
    resource: ['accounting'],
    roles: [Role.ADMIN, Role.ACCOUNTANT]
  },

];

export default baseMenuItems