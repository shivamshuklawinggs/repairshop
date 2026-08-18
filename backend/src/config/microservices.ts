/**
 * Centralized microservices configuration
 * Imports all microservice config.json files and organizes them by service key
 */

// Import all microservice configs
import accountsConfig from 'microservices/accounts-services/config.json';
import authServiceConfig from 'microservices/auth-service/config.json';
import chartAccountsServicesConfig from 'microservices/chart-accounts-services/config.json';
import companyServicesConfig from 'microservices/company-services/config.json';
import dashboardServicesConfig from 'microservices/dashboard-services/config.json';
import documentServicesConfig from 'microservices/document-services/config.json';
// import incomeServicesConfig from 'microservices/income-services/config.json';
import journalEntryServicesConfig from 'microservices/journal-entry-services/config.json';
import unifiedFinancialServiceConfig from 'microservices/unified-financial-service/config.json';
import noteServicesConfig from 'microservices/note-services/config.json';
import notificationServicesConfig from 'microservices/notification-services/config.json';
import paymentServicesConfig from 'microservices/payment-services/config.json';
import paymentTermsServicesConfig from 'microservices/payment-terms-services/config.json';
import plansServiceConfig from 'microservices/plans-service/config.json';
import productsServicesConfig from 'microservices/products-services/config.json';
import ratingReportServicesConfig from 'microservices/rating-report-services/config.json';
import reportServicesConfig from 'microservices/report-services/config.json';
import saferServiceConfig from 'microservices/safer-service/config.json';
import superadminServiceConfig from 'microservices/superadmin-service/config.json';
import taxServicesConfig from 'microservices/tax-services/config.json';
import transactionServicesConfig from 'microservices/transaction-services/config.json';
import userServicesConfig from 'microservices/user-service/config.json';
import invoiceReminderTemplatesConfig from 'microservices/invoice-reminder-templates/config.json';

// Define the interface for microservice config
interface MicroserviceConfig {
  baseUrl: string;
  author: string;
  service: string;
  CreatedAt: string;
  UpdateddAt: string;
}

// Centralized microservices configuration object
export const microservicesConfig: Record<string, MicroserviceConfig> = {
  accounts: accountsConfig  as MicroserviceConfig,
  auth: authServiceConfig  as MicroserviceConfig,
  'chart-accounts': chartAccountsServicesConfig  as MicroserviceConfig,
  company: companyServicesConfig  as MicroserviceConfig,
  dashboard: dashboardServicesConfig  as MicroserviceConfig,
  document: documentServicesConfig  as MicroserviceConfig,
  // income: incomeServicesConfig  as MicroserviceConfig,
  'journal-entry': journalEntryServicesConfig  as MicroserviceConfig,
  'unified-financial': unifiedFinancialServiceConfig as MicroserviceConfig,
  note: noteServicesConfig  as MicroserviceConfig,
  notification: notificationServicesConfig  as MicroserviceConfig,
  payment: paymentServicesConfig  as MicroserviceConfig,
  'payment-terms': paymentTermsServicesConfig  as MicroserviceConfig,
  plans: plansServiceConfig  as MicroserviceConfig,
  products: productsServicesConfig  as MicroserviceConfig,
  'rating-report': ratingReportServicesConfig  as MicroserviceConfig,
  report: reportServicesConfig  as MicroserviceConfig,
  safer: saferServiceConfig  as MicroserviceConfig,
  superadmin: superadminServiceConfig  as MicroserviceConfig,
  tax: taxServicesConfig  as MicroserviceConfig,
  transaction: transactionServicesConfig  as MicroserviceConfig,
  user: userServicesConfig  as MicroserviceConfig,
  'invoice-reminder-templates': invoiceReminderTemplatesConfig as MicroserviceConfig,
};
// Default export
export default microservicesConfig;
