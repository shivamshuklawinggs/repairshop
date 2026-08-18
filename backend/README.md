# FreightBooks API

> Transport Service Accounting System - Backend API

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Database | MongoDB (Mongoose 7.5) |
| Auth | Session-based (express-session) |
| Queue | BullMQ + Redis |
| Email | Nodemailer |
| PDF | Puppeteer + EJS templates |
| Validation | Yup |
| File Upload | Multer |
| Encryption | CryptoJS (request/response encryption) |
| Process Mgr | PM2 |
| Logging | Winston + Morgan |
| Scheduling | node-cron + Agenda |

---

## Project Structure

```
src/
  config/           # Environment config, constants
  controllers/      # (empty - logic lives in microservices)
  libs/             # Shared utility libraries
  microservices/    # Feature-based service modules (routes + controllers)
  middlewares/      # Auth, encryption, error handling, session
  migrations/       # Data migration scripts
  models/           # Mongoose schemas & models
  routes/           # Root router, auto-loads microservices
  scripts/          # Utility scripts (zip, etc.)
  seeders/          # Default data seeders (users, account types)
  shared/           # Shared utilities & helpers
  types/            # TypeScript type definitions
  utils/            # Utility functions (RBAC, calculations, etc.)
```

---

## Roles

There are **5 roles** defined in the system:

| Role | Description |
|------|-------------|
| **superadmin** | Platform-level admin. Manages plans, sessions, system cleanup, account types. Has NO access to company-level resources. |
| **admin** | Company-level owner. Full access to ALL company resources (loads, customers, carriers, accounting, users, etc.). Bypasses permission checks. |
| **manager** | Company staff. Can manage companies, carriers (import). Has granular `menuPermission` for other resources. |
| **dispatcher** | Operations staff. Primarily handles loads and dispatch. Has granular `menuPermission` for assigned resources. |
| **accountant** | Finance staff. Handles invoices, bills, estimates, statements, chart of accounts, vendors. Has granular `menuPermission`. |

### Role Hierarchy

```
superadmin
  └── admin (can create/manage: dispatcher, manager, accountant)
        ├── manager
        ├── dispatcher
        └── accountant
```

- **superadmin** can only create/update **admin** users
- **admin** can only create/update **dispatcher**, **manager**, **accountant** users
- Role is **immutable** once set on a user

---

## Permission System

### Two-Layer Access Control

1. **Role-based (`requireRole`)** - Checks if user has one of the allowed roles
2. **Permission-based (`requirePermission`)** - Checks user's `menuPermission` object for granular CRUD access

### Menu Permissions (for dispatcher, manager, accountant)

Each non-admin user has a `menuPermission` object with these resource keys:

| Resource Key | Controls Access To |
|---|---|
| `loads` | Load management (CRUD, status, follow-up) |
| `dispatcher` | Dispatcher board |
| `customers` | Customer management (load-customers) |
| `carriers` | Carrier management |
| `documents` | Document center |
| `expense_service` | Expense fee services |

Each resource has 6 permission flags: `create`, `view`, `update`, `delete`, `import`, `export`

### Additional Resource Types (used in frontend routing only)

| Resource | Description |
|---|---|
| `accounting` | Invoices, bills, estimates, chart of accounts, journal entries, payments, reports |
| `users` | User management page |
| `dashboard` | Dashboard page |
| `company` | Company settings |
| `layout` | Main app layout (authenticated wrapper) |
| `public` | Public pages (login, reset password) |
| `superadmin` | Superadmin-only pages |

---

## Role-to-Service Access Matrix

### Superadmin-Only Services

| Service | Operations |
|---|---|
| Superadmin Dashboard | Stats, cleanup (users, financial, operational), reset company |
| Plans | CRUD plans, activate/deactivate |
| Sessions | List, count, terminate, clean expired |
| Account Types | Create, update, delete parent account types |

### Admin + Accountant Services

| Service | Operations |
|---|---|
| Invoices | CRUD, generate PDF, import/export |
| Bills | CRUD, generate PDF, import/export |
| Estimates | CRUD, generate PDF, convert to invoice, accept |
| Statements | CRUD, generate |
| Chart of Accounts | CRUD, stats, ending balance |
| Accounts Customers | CRUD, import/export (delete: admin only) |

### Admin + Manager Services

| Service | Operations |
|---|---|
| Company | Create, update, delete |

### All Roles (view company)

| Service | Operations |
|---|---|
| Company | View (all roles including superadmin) |

### Permission-Based Services (dispatcher, manager, accountant get granular access)

| Service | Resource Key | Notes |
|---|---|---|
| Loads | `loads` | CRUD + status update, follow-up, rate confirmation |
| Customers (load) | `customers` | CRUD, export |
| Carriers | `carriers` | CRUD, documents, SAFER update |
| Expense Fees | `expense_service` | CRUD |

### Admin + Manager + Accountant

| Service | Operations |
|---|---|
| Carrier Import | Import carriers from CSV |

### Admin + Accountant (Vendors)

| Service | Operations |
|---|---|
| Vendors | CRUD (subset of carriers with `isCarrier: false`) |

### Authenticated-Only Services (any logged-in user via `verifyToken`)

| Service | Operations |
|---|---|
| Dashboard | Load data, P&L, sales, AR, AP, expense, customer, vendor |
| Documents | List, sub-documents, send by email |
| Expenses | CRUD by load/location/service, follow-up |
| Drivers | CRUD |
| Notes | CRUD per load |
| Notifications | CRUD, read all |
| Payments | CRUD received payments |
| Payment Terms | CRUD |
| Tax Services | CRUD, sales tax, purchase tax |
| Product Services | CRUD |
| Journal Entries | CRUD |
| Transactions | List, export, email |
| Reports | Generate reports |
| Contact Persons | CRUD (customer and carrier) |
| Customer Ratings | View details, add rating |
| Vendor Ratings | View, update, remove |
| Rating Reports | Add/get/delete reports (customer, carrier, driver) |
| Locations | List, check-in/check-out |
| SAFER API | Lookup by USDOT number |

### Public (No Auth)

| Service | Operations |
|---|---|
| Auth | Login, logout, forgot password, reset password, current user |
| Universal ID | Generate unique IDs |

---

## Models

| Model | Collection | Description |
|---|---|---|
| **User** | `users` | System users with role, menuPermission, visibleCompany, ActivePlan |
| **Company** | `companies` | Company profiles with logo |
| **Load** | `loads` | Freight loads with pickup/delivery locations, carrier assignments, status tracking |
| **Customer** | `customers` | Load-level customers (shippers) with USDOT/MC, insurance, documents |
| **Carrier** | `carriers` | Carriers/vendors with USDOT/MC, insurance, powerunits, trailers, documents |
| **ContactPerson** | `contactpersons` | Contact persons linked to customers |
| **CarrierContactPerson** | `carriercontactpersons` | Contact persons linked to carriers |
| **Driver** | `drivers` | Drivers with CDL info and license documents |
| **Invoice** | `invoices` | Customer invoices with line items (expenses), payment tracking |
| **Bill** | `bills` | Vendor bills with line items (expenses), payment tracking |
| **Estimate** | `estimates` | Estimates that can be converted to invoices |
| **Payment** | `payments` | Received payments linked to invoices/bills |
| **Expense** | `expenses` | Load-level expenses by location and service |
| **ExpenseFee** | `expensefees` | Expense service types/categories |
| **TaxService** | `taxservices` | Tax rates (label + percentage) linked to chart of accounts |
| **ProductService** | `productservices` | Products/services for invoice line items |
| **PaymentTerms** | `paymentterms` | Payment term definitions (days, discount) |
| **ChartOfAccounts** | `chartofaccounts` | Chart of accounts with account types and detail types |
| **AccountType** | `Accounttypes` | Top-level account categories (asset, liability, equity, income, expense) |
| **AccountDetailType** | `accountdetailtypes` | Sub-categories under parent account types |
| **JournalEntry** | `journalentries` | Manual journal entries with debit/credit lines |
| **Statement** | `statements` | Customer/vendor statements |
| **Note** | `notes` | Notes attached to loads |
| **Notification** | `notifications` | User notifications with read status |
| **Session** | `sessions` | Express sessions stored in MongoDB |
| **UniversalId** | `universalids` | Auto-incrementing ID sequences (loads, invoices, bills, etc.) |
| **UserPlan** | `userplans` | Subscription plans |
| **VendorRating** | `vendorratings` | Carrier/vendor ratings per load |
| **RatingReport** | `ratingreports` | Rating reports/comments for customers, carriers, drivers |

---

## Key Model Relationships

```
User ──> Company (visibleCompany[])
User ──> UserPlan (ActivePlan.PlanId)

Load ──> Customer (customerId)
Load ──> Carrier (carriers[].carrier)
Load ──> Driver (carriers[].assignDrivers[])
Load ──> Pickup/Delivery Locations (embedded)

Invoice ──> Customer (customerId)
Invoice ──> Load (loadId)
Invoice ──> Expense[] (embedded, with ProductService + Tax refs)
Invoice ──> Payment (recievedPaymentAmount[])

Bill ──> Carrier/Vendor (vendorId)
Bill ──> Load (loadId)
Bill ──> Expense[] (embedded)
Bill ──> Payment (recievedPaymentAmount[])

Expense ──> Load (loadId)
Expense ──> ExpenseFee (service)

ChartOfAccounts ──> AccountType (accountType)
ChartOfAccounts ──> AccountDetailType (detailType)

TaxService ──> ChartOfAccounts (ChartOfAccountId)
ProductService ──> ChartOfAccounts (incomeAccount, expenseAccount, inventoryAccount)
```

---

## Microservices

Each microservice lives in `src/microservices/<name>/` with:
- `config.json` - Base URL configuration
- `route.ts` - Express router with middleware
- `*.controller.ts` - Request handlers
- `*.validate.ts` - Yup validation schemas (where present)

| Microservice | Base URL | Description |
|---|---|---|
| auth-service | `/api/auth-service` | Login, logout, password reset |
| user-service | `/api/user-service` | User CRUD, activate, block |
| company-services | `/api/company-services` | Company CRUD with logo upload |
| load-services | `/api/load-services` | Load CRUD, status, dispatch, rate confirmation |
| customer-services | `/api/customer-services` | Load-level customer CRUD |
| carrier-services | `/api/carrier-services` | Carrier CRUD, vendors, import/export |
| driver-services | `/api/driver-services` | Driver CRUD with license upload |
| accounts-services | `/api/accounts-services` | Parent router for invoices, bills, estimates, statements, account-customers |
| chart-accounts-services | `/api/chart-accounts-services` | Chart of accounts, account types |
| expense-services | `/api/expense-services` | Load-level expenses |
| expense-fees-services | `/api/expense-fees-services` | Expense service categories |
| tax-services | `/api/tax-services` | Tax rate management |
| products-services | `/api/products-services` | Product/service items |
| payment-services | `/api/payment-services` | Received payments |
| payment-terms-services | `/api/payment-terms-services` | Payment terms |
| journal-entry-services | `/api/journal-entry-services` | Journal entries |
| transaction-services | `/api/transaction-services` | Transaction lists, export |
| report-services | `/api/report-services` | Financial reports |
| document-services | `/api/document-services` | Document aggregation |
| notification-services | `/api/notification-services` | Notifications with Agenda scheduling |
| dashboard-services | `/api/dashboard-services` | Dashboard analytics |
| note-services | `/api/note-services` | Load notes |
| location-services | `/api/location-services` | Location check-in/check-out |
| contact-person-service | `/api/contact-person-service` | Customer contact persons |
| carrier-contact-person-service | `/api/carrier-contact-person-service` | Carrier contact persons |
| customer-rating-services | `/api/customer-rating-services` | Customer ratings |
| vendor-rating-services | `/api/vendor-rating-services` | Vendor/carrier ratings |
| rating-report-services | `/api/rating-report-services` | Rating reports for customers, carriers, drivers |
| safer-service | `/api/safer-service` | USDOT/SAFER API lookup |
| session-services | `/api/session-services` | Session management (superadmin) |
| superadmin-service | `/api/superadmin-service` | System stats, cleanup, reset |
| plans-service | `/api/plans-service` | Subscription plan management |
| universal-id-services | `/api/universal-id-services` | Auto-incrementing ID generation |

---

## Gaps and Issues Found

### Security / Access Control

1. **Missing permission checks on many services** - Dashboard, documents, expenses, drivers, notes, notifications, payments, payment terms, tax, products, journal entries, transactions, reports, contact persons, ratings, locations all use only `verifyToken` (any authenticated user). No role or permission check is enforced. A dispatcher could theoretically access journal entries or tax settings.
2. **`accounting` resource not enforced on backend** - The frontend routes define `accounting` as a resource type, but the backend `menuPermission` schema does NOT include `accounting`. Backend uses `requireRole([Role.ADMIN, Role.ACCOUNTANT])` instead of permission-based checks for accounting services.
3. **`dashboard`, `company`, `users` resources not in menuPermission** - These are defined as `ResourceType` in RBAC but have no corresponding entry in the user's `menuPermission` schema. They only work because admin bypasses all checks.
4. **Universal ID endpoint has no auth** - `GET /api/universal-id-services/:id` has zero authentication.
5. **Some `getById` routes lack auth** - `GET /api/load-services/:id`, `GET /api/products-services/:id`, and `GET /api/company-services/:id` have no middleware at all.

### Data Integrity

6. **Expense calculations type mismatch** - `updateExpensesWithCalculations` expects populated tax objects but the schema stores `ObjectId`. Callers must `.populate('tax')` before calling.
7. **No soft-delete** - Models use `deleteGuardPlugin` but there is no soft-delete pattern. Deletes are hard deletes.

### Missing Features / Incomplete

8. **No test files** - `src/test/` directory is empty. No unit or integration tests exist.
9. **Empty controllers/services directories** - `src/controllers/` and `src/services/` are empty; all logic lives in microservices.
10. **No audit/activity log model** - Frontend has `IActivityLog` type but no corresponding backend model or service.
11. **No customer import at load-level** - Only accounts-level customer import exists.
12. **Statement service only for accountant+admin** - No vendor-side statement generation.

### Code Quality

13. **Inconsistent auth patterns** - Some routes use `requireRole`, some use `requirePermission`, some use `verifyToken`. No consistent pattern across services.
14. **Duplicate customer services** - Two separate customer services exist: `customer-services` (load-level) and `accounts-services/customer-services` (accounting-level) with different access controls.
15. **Missing validation on many routes** - Only a few services use `requestValidate`. Most accept unvalidated input.

---

## Scripts

```bash
npm run dev            # Development with nodemon
npm run build          # TypeScript compile + alias resolution + copy assets
npm run start          # Install + production build + PM2 start
npm run start:pm2      # Production with PM2 + systemd startup
npm run restart:pm2    # Rebuild + restart PM2
npm run zip            # Create project zip
npm run type-check:watch  # Watch mode type checking
```

---

## Environment

Requires `.env` file with:
- MongoDB connection string
- Session secret
- Redis connection (for BullMQ)
- Email SMTP credentials
- Encryption keys
- File upload directory paths
