
import { lazy } from 'react';
import { paths } from '@/utils/paths';
import {  Role } from '@/types';
import { Route } from '.';
// CHART OF ACCOUNTS
const ChartAccounts = lazy(() => import('@/pages/chart-accounts-service'));
const AccountRegister = lazy(() => import('@/pages/chart-accounts-service/AccountRegister'));
// journal entry
const JournalEntry = lazy(() => import('@/pages/journal-entry-service'));
const JournalEntryList = lazy(() => import('@/pages/journal-entry-service/JournalEntryList'));

/** ----------------- Accounting ----------------- */
// Reports
const Reports = lazy(() => import('@/pages/report-service'));
// payments
const Payments = lazy(() => import('@/pages/payment-service'));

// Sales
const  InvoiseSectionEdit = lazy(() => import('@/pages/customer-service/CustomerTransactionList/Modals/InvoiseSectionEdit'))

const GetInvoices = lazy(() => import('@/pages/invoice-service'))
const GetEstimates = lazy(() => import('@/pages/estimate-service/LoadInvoices'))
const GetRecievedPayment = lazy(() => import('@/pages/invoice-service/InvoiceRecieptes/RecievedPayment'))
const CustomerTransactionList = lazy(() => import('@/pages/customer-service/CustomerTransactionList'))
const RecievedPaymentEdit = lazy(() => import('@/pages/invoice-service/InvoiceRecieptes/Edit/RecievedPayment'))
// Purchase
const Vendors = lazy(() => import('@/pages/carrier-service/Vendors'));
const  BillSectionEdit = lazy(() => import('@/pages/carrier-service/VendorTransactionList/Modals/BillSectionEdit'))
const VendorBills = lazy(() => import('@/pages/carrier-service/VendorBills'))
const VendorTransactionList = lazy(() => import('@/pages/carrier-service/VendorTransactionList'))
const GetRecievedPaymentPurchase = lazy(() => import('@/pages/carrier-service/BillRecieptes/RecievedPayment'))
const RecievedPaymentEditPurchase = lazy(() => import('@/pages/carrier-service/BillRecieptes/Edit/RecievedPayment'))
const GetTaxOptions = lazy(() => import('@/pages/tax-service'))
const PaymentTermsList = lazy(() => import('@/pages/payment-terms-service/PaymentTermsList'));
const InvoiceReminderTemplates = lazy(() => import('@/pages/invoice-reminder-templates-service'));
const AccountsCustomers = lazy(() => import('@/pages/customer-service'));
const ProductServices = lazy(() => import('@/pages/product-service'));
// users
const Users = lazy(() => import('@/pages/user-service'));
const MarginReportPage = lazy(() => import('@/pages/user-service/MarginReport'));
// superadmin: data management
const SuperadminDashboard = lazy(() => import('@/pages/superadmin-service/SuperadminDashboard'));
const Plans = lazy(() => import('@/pages/superadmin-service/Plans'));
// Carriers
const CarrierRatingDetails = lazy(() => import('@/components/VendorRating/VendoRatingDetails'));
const CarrierReport = lazy(() => import('@/pages/carrier-service/CarrierReport'));
const CustomerRatingDetails = lazy(() => import('@/components/CustomerRating/CustomerRatingDetails'));

// Dashboard
const Dashboard = lazy(() => import('@/pages/dashboard-service'));
// Company
const ViewCompany = lazy(() => import('@/pages/company-service'));
// Documents
const Documents = lazy(() => import('@/pages/document-service'));
// auth pages
const ProfileUpdate = lazy(() => import('@/pages/auth-service/ProfileUpdate'));

// Advanced Search
const AdvancedSearch = lazy(() => import('@/components/common/GlobalSearch/AdvancedSearchPage'));

// Base routes configuration
const baseProtectedRoutes: Route[] = [
  {
    path: paths.dashboard,
    element: Dashboard,
    title: 'Dashboard',
    key: "dashboard",
    icon: 'dashboard',
    icontype: "md",
    currentCompany: false,
    action: 'view',
    resource: ['dashboard'],
    roles:[]
  },
  {
    path: `${paths.customers}/rating/:customerId`,
    element: CustomerRatingDetails,
    title: 'Customer Rating Details',
    key: "customers",
    currentCompany: true,
    hideInMenu: true,
    action: 'view',
    resource: ['customers'],
    roles:[]
  },
  {
    path: `${paths.viewcompany}`,
    element: ViewCompany,
    title: 'Company',
    icon: 'company',
    key: "company",
    currentCompany: false,
    action: 'view',
    resource: ['company'],
    roles:[Role.ADMIN]

  },

  // {
  //   path: `${paths.customers}/report/:customerId`,
  //   element: CustomerReport,
  //   title: 'Customer Report',
  //   key: "customers",
  //   currentCompany: true,
  //   hideInMenu: true,
  //   action: 'view',
  //   resource: ['customers'],
  //   roles:[]
  // },
  {
    path: `${paths.carriers}/report/:carrierId`,
    element: CarrierReport,
    title: 'Carrier Report',
    key: "carriers",
    currentCompany: true,
    hideInMenu: true,
    action: 'view',
    resource: ['carriers'],
    roles:[]

  },
  {
    path: `${paths.carriers}/rating/:carrierId`,
    element: CarrierRatingDetails,
    title: 'Carrier Rating Details',
    key: "carriers",
    currentCompany: true,
    hideInMenu: true,
    action: 'view',
    resource: ['carriers'],
    roles:[]
  },

  {
    path: paths.documents,
    element: Documents,
    title: 'Documents',
    icon: 'file',
    key: "documents",
    currentCompany: true,
    action: 'view',
    resource: ['documents'],
     roles:[Role.ADMIN],
  },
 
  // edit invoice
  {
    path: `${paths.editinvoice}/:id`,
    element: InvoiseSectionEdit,
    title: 'Edit Invoice',
    key: "accounting",
    icon: 'edit',
    currentCompany: true,
    hideInMenu: true,
    action: 'update',
    resource: ['accounting'],
    roles:[]
  },
  // edit invoice
  {
    path: `${paths.editbill}/:id`,
    element: BillSectionEdit,
    title: 'Edit Bill',
    key: "accounting",
    icon: 'edit',
    currentCompany: true,
    hideInMenu: true,
    action: 'update',
    resource: ['accounting'],
    roles:[]
  },
  //  Accounts
  {
    path: `${paths.recievedpayment}/:id`,
    element: RecievedPaymentEdit,
    title: 'Edit Receive Payment',
    key: "accounting",
    icon: 'edit',
    currentCompany: true,
    hideInMenu: true,
    action: 'update',
    resource: ['accounting'],
    roles:[]
  },
  {
    path: `${paths.recievedbill}/:id`,
    element: RecievedPaymentEditPurchase,
    title: 'Edit Bill Payment',
    key: "accounting",
    icon: 'edit',
    currentCompany: true,
    hideInMenu: true,
    action: 'update',
    resource: ['accounting'],
    roles:[]
  },
  {
    path: `${paths.customertransactionlist}/:id`,
    element: CustomerTransactionList,
    title: 'Customer Transaction List',
    key: "accounting",
    icon: 'edit',
    currentCompany: true,
    hideInMenu: true,
    action: 'view',
    resource: ['accounting'],
    roles:[]
  },
  {
    path: `${paths.vendortransactionlist}/:id`,
    element: VendorTransactionList,
    title: 'Vendor Transaction List',
    key: "accounting",
    icon: 'edit',
    currentCompany: true,
    hideInMenu: true,
    action: 'view',
    resource: ['accounting'],
    roles:[]
  },
  {
    path: `${paths.AccountRegister}/:id`,
    element: AccountRegister,
    title: 'Account Register',
    key: "accounting",
    icon: 'edit',
    currentCompany: true,
    hideInMenu: true,
    action: 'view',
    resource: ['accounting'],
    roles:[]
  },

  {
    path: '/accounting',
    title: 'Accounting',
    icon: 'accountBalanceWallet',
    icontype: "md",
    key: "accounting",
    currentCompany: true,
    action: 'view',
    resource: ['accounting'],
    children: [
      {
        title: "Sales",
        path: "/sales",
        icon: "sales",
        key: "accounting",
        action: 'view',
        resource: ['accounting'],
        children: [
          {
            path: '/invoices',
            element: GetInvoices,
            title: 'Invoices',
            key: "accounting",
            icon: 'invoices',
            currentCompany: true,
            action: 'view',
            resource: ['accounting'],
            roles:[Role.ADMIN,Role.ACCOUNTANT]
          },
          {
            path: '/estimates',
            element: GetEstimates,
            title: 'Estimates',
            key: "accounting",
            icon: 'estimates',
            currentCompany: true,
            action: 'view',
            resource: ['accounting'],
             roles:[Role.ADMIN,Role.ACCOUNTANT]

          },

          {
            path: '/accounts/customers',
            element: AccountsCustomers,
            title: 'Customers',
            key: "accounting",
            icon: 'customers',
            currentCompany: true,
            action: 'view',
            resource: ['accounting'],
            roles:[Role.ADMIN,Role.ACCOUNTANT,Role.ACCOUNTANT]
          },
          {
            path: '/accounts/recievedpayment/:customerId?',
            element: GetRecievedPayment,
            title: 'Receive Payment',
            key: "accounting",
            icon: 'amazonPay',
            currentCompany: true,
            action: 'create',
            resource: ['accounting'],
             roles:[Role.ADMIN,Role.ACCOUNTANT]

          },
        ],
        roles:[Role.ADMIN,Role.ACCOUNTANT]
      },
      {
        title: "Purchase",
        path: "/purchase",
        icon: "purchase",
        key: "accounting",
        action: 'view',
        resource: ['accounting'],
        children: [
          {
            path: '/vendors',
            element: Vendors,
            title: 'Vendors',
            key: "accounting",
            icon: 'vendors',
            currentCompany: true,
            action: 'view',
            resource: ['accounting'],
            roles:[Role.ADMIN,Role.ACCOUNTANT,Role.ACCOUNTANT]
          },
          {
            path: '/bills',
            element: VendorBills,
            title: 'Bills',
            key: "accounting",
            icon: 'bills',
            currentCompany: true,
            action: 'view',
            resource: ['accounting'],
             roles:[Role.ADMIN,Role.ACCOUNTANT]

          },
          {
            path: '/accounts/recievedbill/:customerId?',
            element: GetRecievedPaymentPurchase,
            title: 'Bill Payment',
            key: "accounting",
            icon: 'amazonPay',
            currentCompany: true,
            action: 'create',
            resource: ['accounting'],
             roles:[Role.ACCOUNTANT,Role.ADMIN],
          },
        ],
       roles:[Role.ACCOUNTANT,Role.ADMIN],
      },
      {
        path: paths.paymentterms,
        element: PaymentTermsList,
        title: 'Payment Terms',
        key: "accounting",
        icon: 'amazonPay',
        currentCompany: true,
        action: 'view',
        resource: ['accounting'],
        roles:[Role.ACCOUNTANT,Role.ADMIN],
      },
      {
        path: paths.invoiceReminderTemplates,
        element: InvoiceReminderTemplates,
        title: 'Invoice Reminder Templates',
        key: "InvoiceReminderTemplatesList",
        icon: 'email',
        currentCompany: true,
        action: 'view',
        hideInMenu:false,
        resource: ["InvoiceReminderTemplatesList"],
        roles:[Role.ACCOUNTANT,Role.ADMIN,Role.ACCOUNTANT],
      },
      {
        path: '/taxoptions',
        element: GetTaxOptions,
        title: 'Tax Rate',
        key: "accounting",
        icon: 'tax',
        currentCompany: true,
        action: 'view',
        resource: ['accounting'],
         roles:[Role.ACCOUNTANT,Role.ADMIN],
      },
      {
        path: '/productservices',
        element: ProductServices,
        title: 'Product Services',
        key: "accounting",
        icon: 'product',
        currentCompany: true,
        action: 'view',
        resource: ['accounting'],
        roles:[Role.ACCOUNTANT,Role.ADMIN],
      },
      {
        path: paths.chartofaccounts,
        element: ChartAccounts,
        title: 'Chart Of Accounts',
        key: "accounting",
        icon: 'chartAccounts',
        currentCompany: true,
        action: 'view',
        resource: ['accounting'],
        roles:[Role.ACCOUNTANT,Role.ADMIN],
      },
      {
        path: paths.JournalEntry,
        element: JournalEntry,
        title: 'Journal Entry',
        key: "accounting",
        currentCompany: true,
        icon: 'journalEntry',
        action: 'create',
        resource: ['accounting'],
        roles:[Role.ACCOUNTANT,Role.ADMIN],
      },
      {
        path: paths.JournalEntryList,
        element: JournalEntryList,
        title: 'Journal Entry List',
        key: "accounting",
        currentCompany: true,
        icon: 'journalEntry',
        action: 'view',
        resource: ['accounting'],
        roles:[Role.ACCOUNTANT,Role.ADMIN],
      },
      {
        path: `${paths.JournalEntry}/:JournalEntryId`,
        element: JournalEntry,
        title: 'Edit Journal Entry',
        key: "accounting",
        currentCompany: true,
        hideInMenu: true,
        icon: 'journalEntry',
        action: 'update',
        resource: ['accounting'],
         roles:[Role.ACCOUNTANT,Role.ADMIN],
      },
      {
        title: "Payments",
        action: "view",
        currentCompany: true,
        key: "payments",
        icon: 'sales',
        resource: ['accounting'],
        path: `${paths.payments}`,
        element: Payments,
         roles:[Role.ACCOUNTANT,Role.ADMIN],
      },
    ],
    roles:[Role.ADMIN,Role.ACCOUNTANT]
  },
  {
    path: `${paths.Reports}/:type?`,
    element: Reports,
    title: 'Reports',
    key: "reports",
    icon: 'reports',
    currentCompany: true,
    action: 'view',
    resource: ['accounting'],
    roles:[Role.ACCOUNTANT, Role.ADMIN]
  },
  // End Accounts
  {
    path: paths.superadminDashboard,
    element: SuperadminDashboard,
    title: 'Dashboard',
    key: "superadmin-dashboard",
    icon: 'dashboard',
    currentCompany: false,
    action: 'view',
    resource: ['superadmin'],
    roles: [Role.SUPERADMIN],
  },
  {
    path: paths.users,
    element: Users,
    title: 'Users',
    key: "users",
    icon: 'users',
    currentCompany: false,
    action: 'view',
    resource: ['users','superadmin'],
    roles: [Role.SUPERADMIN, Role.ADMIN,Role.ACCOUNTANT],
  },
  {
    path: '/profile',
    element: ProfileUpdate,
    title: 'Update Profile',
    key: "profile",
    currentCompany: false,
    hideInMenu: true,
    action: 'view',
    resource: ["profile"],
    roles:Object.values(Role),
  },
  {
    path: '/margin-report/:userId',
    element: MarginReportPage,
    title: 'Margin Report',
    key: "margin-report",
    icon: 'barChart',
    currentCompany: false,
    action: 'view',
    resource: ['users', 'superadmin'],
    roles: Object.values(Role),
    hideInMenu: true,
  },
  {
    path: paths.plans,
    element: Plans,
    title: 'Plans',
    key: "plans",
    icon: 'priceChange',
    currentCompany: false,
    action: 'view',
    resource: ['superadmin'],
    roles: [Role.SUPERADMIN],
  },
  {
    path: '/advanced-search',
    element: AdvancedSearch,
    title: 'Advanced Search',
    key: "advanced-search",
    currentCompany: true,
    hideInMenu: true,
    action: 'view',
    resource: ['advancedSearch'],
    roles: [],
  },

];
export default baseProtectedRoutes