# FreightBooks CRM

> Transport Service Accounting System - Frontend Application

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 6 |
| UI Library | MUI (Material UI) 6 |
| State Management | Redux Toolkit + Redux Persist (IndexedDB) |
| Server State | TanStack React Query |
| Forms | React Hook Form + Yup validation |
| Routing | React Router DOM 6 |
| HTTP Client | Axios |
| Charts | Recharts + Chart.js |
| Icons | MUI Icons + React Icons |
| Styling | SCSS + Emotion (MUI) |
| PDF Viewer | @react-pdf-viewer |
| Maps | @react-google-maps/api |
| Encryption | CryptoJS (request/response encryption) |
| Animations | Framer Motion |
| Notifications | React Toastify |

---

## Project Structure

```
src/
  components/       # Reusable UI components (layout, tables, forms, modals)
  config/           # API config, environment settings
  data/             # Static data (product categories, enums)
  hooks/            # Custom hooks (auth, permissions, API)
  pages/            # Feature-based page components
  redux/            # Redux slices and reducers
  routes/           # Route definitions and router config
  service/          # API service layer (Axios instances)
  shared/           # Shared utilities
  store/            # Redux store configuration
  types/            # TypeScript type definitions
  utils/            # Utility functions (paths, formatters)
```

---

## Pages / Features

| Page Directory | Feature | Description |
|---|---|---|
| `auth-service/` | Authentication | Login, forgot password, reset password |
| `dashboard-service/` | Dashboard | Analytics: loads, P&L, sales, AR, AP, expenses |
| `load-service/` | Load Management | Create, edit, view loads; dispatcher board |
| `customer-service/` | Customers | Load-customers, account-customers, transaction lists |
| `carrier-service/` | Carriers | Carrier CRUD, vendors, vendor bills, bill payments, driver reports |
| `document-service/` | Documents | Document center with file viewing |
| `invoice-service/` | Invoices | Invoice list, received payments, edit |
| `estimate-service/` | Estimates | Estimate list and management |
| `chart-accounts-service/` | Chart of Accounts | Account list, account register |
| `journal-entry-service/` | Journal Entries | Create, edit, list journal entries |
| `report-service/` | Reports | P&L, balance sheet, AR, AP, trial balance, general ledger |
| `payment-service/` | Payments | Payment list and management |
| `payment-terms-service/` | Payment Terms | Payment term CRUD |
| `tax-service/` | Tax Rates | Tax rate CRUD |
| `product-service/` | Products/Services | Product and service item CRUD |
| `expense-fee-service/` | Expense Services | Expense fee category CRUD |
| `company-service/` | Company | Company profile and settings |
| `user-service/` | Users | User CRUD with role and permission management |
| `superadmin-service/` | Superadmin | Dashboard, data cleanup, plans |

---

## Routing & Access Control

### Frontend Permission Model

Every protected route has:
- **`action`** - Required action type (`create`, `view`, `update`, `delete`, `import`, `export`)
- **`resource`** - Required resource(s) (`loads`, `customers`, `carriers`, `accounting`, `superadmin`, etc.)

The `<ProtectedRoute>` component checks the user's role and `menuPermission` before rendering:
- **superadmin** - Only sees routes with `resource: ['superadmin']`
- **admin** - Sees all routes except `superadmin`
- **dispatcher/manager/accountant** - Sees routes based on their `menuPermission` flags

### Route Groups

#### Public Routes (no auth)
- `/login` - Login page
- `/forget-password` - Forgot password
- `/reset-password/:token` - Reset password
- `/signature` - Signature drawer
- `/not-found` - 404 page
- `/not-authorized` - 403 page

#### Protected Routes (authenticated + authorized)

**Operations**
- `/dashboard` - Dashboard (resource: `dashboard`)
- `/loads` - Load list (resource: `loads`)
- `/createload` - Create load (resource: `loads`, action: `create`)
- `/editload/:loadId` - Edit load (resource: `loads`, action: `update`)
- `/dispatcher` - Dispatcher board (resource: `dispatcher`)
- `/customers` - Customer list (resource: `customers`)
- `/carriers` - Carrier list (resource: `carriers`)
- `/drivers/rating` - Driver ratings (resource: `carriers`)
- `/documents` - Document center (resource: `documents`)
- `/expense-fees` - Expense services (resource: `expense_service`)

**Accounting (resource: `accounting`)**
- `/accounting/sales/invoices` - Invoices
- `/accounting/sales/estimates` - Estimates
- `/accounting/sales/accounts/customers` - Account customers
- `/accounting/sales/accounts/recievedpayment/:customerId?` - Receive payment
- `/accounting/purchase/vendors` - Vendors
- `/accounting/purchase/bills` - Bills
- `/accounting/purchase/accounts/recievedbill/:customerId?` - Bill payment
- `/accounting/paymentterms` - Payment terms
- `/accounting/taxoptions` - Tax rates
- `/accounting/productservices` - Product services
- `/accounting/chartofaccounts` - Chart of accounts
- `/accounting/journal-entry` - Journal entry (create)
- `/accounting/journal-entry-list` - Journal entry list
- `/accounting/payments` - Payments
- `/reports/:type?` - Reports

**Admin / Settings**
- `/company` - Company settings (resource: `company`)
- `/users` - User management (resource: `users`, `superadmin`)

**Superadmin (resource: `superadmin`)**
- `/superadmin/dashboard` - Superadmin dashboard
- `/superadmin/data-cleanup` - Data cleanup
- `/plans` - Plan management

---

## Role Visibility Summary

| Feature | superadmin | admin | dispatcher | manager | accountant |
|---|---|---|---|---|---|
| Dashboard | - | Yes | menuPerm | menuPerm | menuPerm |
| Loads | - | Yes | menuPerm | menuPerm | menuPerm |
| Dispatcher | - | Yes | menuPerm | menuPerm | menuPerm |
| Customers | - | Yes | menuPerm | menuPerm | menuPerm |
| Carriers | - | Yes | menuPerm | menuPerm | menuPerm |
| Documents | - | Yes | menuPerm | menuPerm | menuPerm |
| Expense Services | - | Yes | menuPerm | menuPerm | menuPerm |
| Accounting (all) | - | Yes | - | - | Yes* |
| Company | - | Yes | - | Yes | - |
| Users | - | Yes | - | - | - |
| Superadmin Pages | Yes | - | - | - | - |
| Plans | Yes | - | - | - | - |

> *Accounting access is enforced by `requireRole([ADMIN, ACCOUNTANT])` on the backend, not by `menuPermission`.

---

## Scripts

```bash
npm run dev              # Start Vite dev server
npm run build            # TypeScript check + Vite production build
npm run tsc-b            # TypeScript build only
npm run preview          # Preview production build
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run type-check       # TypeScript type check (no emit)
npm run type-check:watch # Watch mode type checking
npm run validate         # Type check + lint
```

---

## Environment

Requires environment variables for:
- API base URL
- Google Maps API key
- Encryption keys (matching backend)
