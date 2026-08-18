import { todayDate } from "@/config/constant";
import { UpdateRecievedPamentPayload ,RecievedPamentPayload } from "@/types/payment.types";
import { IChartAccount, IDriver, IitemService, INotificationUpdate, IPaymentTerm, IUser, LoginFormData, GetLoadsParams, ITaxOption, IProductService, recievedPaymentparmaSearchProps, IStatementCreate, IPlan, allowedreports } from "@/types";

import api from "@/utils/axiosInterceptor";
import { Moment } from "moment";


const apiService = {
  login: async (userData: LoginFormData) => {
    const response = await api.post("/auth/login", userData);
    return response.data;
  },
  logout: async () => {
    const response = await api.get("/auth/logout");
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get("/auth/current-user");
    return response.data;
  },
  sendDocumentByEmail: async (data: { documentPaths: any[], recipientEmail: string, subject: string, message: string }) => {
    const response = await api.post("/document/sendDocumentByEmail", data);
    return response.data;
  },
  register: async (userData={}) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },
  forgetPassword: async (email: string) => {
    const response = await api.post("/auth/forget-password", { email });
    return response.data;
  },
  resetPassword: async (token: string, password: string) => {
    const response = await api.post("/auth/reset-password", { token, password });
    return response.data;
  },
  //reports
  getReport: async (params: { fromDate?: Date, toDate?: Date, type: allowedreports, allowedType?: "month" | "all", customerId?: string }) => {
    const response = await api.get(`/report/`, {
      params: params
    });
    return response.data;
  },
  // unified financial search
  getUnifiedFinancialData: async (params: Record<string, any> = {}) => {
    const response = await api.get("/unified-financial/", { params });
    return response.data;
  },

  // plans
  getPlans: async (params: Record<string, any> = { limit: 10, page: 1 }) => {
    const response = await api.get("/plans", { params });
    return response.data;
  },
  getPlan: async (id: string) => {
    const response = await api.get(`/plans/${id}`);
    return response.data;
  },
  
  // Get business analytics
  getAnalytics: async (page?: number, limit?: number) => {
    const params: any = {};
    if (page) params.page = page;
    if (limit) params.limit = limit;
    const response = await api.get("/superadmin/analytics", { params });
    return response.data;
  },
  
  // Get system statistics
  getStats: async (companyId?: string) => {
    const params = companyId ? { companyId } : {};
    const response = await api.get("/superadmin/stats", { params });
    return response.data;
  },
  createPlan: async (planData: IPlan) => {
    const response = await api.post("/plans", planData);
    return response.data;
  },
  updatePlan: async (id: string, planData: IPlan) => {
    const response = await api.put(`/plans/${id}`, planData);
    return response.data;
  },
  deletePlan: async (id: string) => {
    const response = await api.delete(`/plans/${id}`);
    return response.data;
  },
  setPlanActive: async (id: string, isActive: boolean) => {
    const response = await api.put(`/plans/activate/${id}`, { isActive });
    return response.data;
  },
  // admin sessions
  getSessions: async (params: Record<string, any> = { limit: 10, page: 1 }) => {
    const response = await api.get("/sessions/list", { params });
    return response.data;
  },
  getSessionCount: async () => {
    const response = await api.get("/sessions/count");
    return response.data;
  },

  getSession: async (id: string) => {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
  },
  updateSession: async (id: string, sessionData: FormData) => {
    const response = await api.put(`/sessions/${id}`, sessionData);
    return response.data;
  },
  deleteSession: async (id: string) => {
    const response = await api.delete(`/sessions/${id}`);
    return response.data;
  },
  cleanExpiredSessions: async () => {
    const response = await api.delete(`/sessions/clean-expired`);
    return response.data;
  },
  // journel entry service
  createJournalEntry: async (journalEntryData: FormData) => {
    const response = await api.post("/journal-entries", journalEntryData);
    return response.data;
  },
  updateJournalEntry: async (id: string, journalEntryData: FormData) => {
    const response = await api.put(`/journal-entries/${id}`, journalEntryData);
    return response.data;
  },
  getJournalEntries: async (params: Record<string, any> = { limit: 10, page: 1 }) => {
    const response = await api.get("/journal-entries", { params });
    return response.data;
  },
  getJournalEntry: async (id: string) => {
    const response = await api.get(`/journal-entries/${id}`);
    return response.data;
  },
  deleteJournalEntry: async (id: string) => {
    const response = await api.delete(`/journal-entries/${id}`);
    return response.data;
  },
  importJournalEntries: async (data: FormData) => {
    const response = await api.post('/journal-entries/import', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getNextJournalNumber: async () => {
    const response = await api.get("/journal-entries/next-journal-number");
    return response.data;
  },

  // company services
  getCompanies: async (params: Record<string, any> = { limit: 10, page: 1 }) => {
    const response = await api.get("/companies", { params });
    return response.data;
  },
  getCompany: async (id: string) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },
  createCompany: async (companyData: FormData) => {
    const response = await api.post("/companies", companyData);
    return response.data;
  },
  updateCompany: async (id: string, companyData: FormData) => {
    const response = await api.put(`/companies/${id}`, companyData);
    return response.data;
  },
  deleteCompany: async (id: string) => {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
  },
  // cHART OF aCCOUNT  services
  getChartAccounts: async (params: { isProductServicesPage:"0"| "1", regularExpression?: string, limit?: number, page?: number, type?: string, search?: string, multiname?: string, removeMasters?: string, isChartData: "1" | "0", nor: string } = { limit: undefined, page: undefined, type: undefined, search: undefined, multiname: undefined, removeMasters: undefined, isChartData: "0", nor: "",isProductServicesPage:"0" }) => {
    const response = await api.get("/chart-accounts", { params });
    return response.data;
  },

  getChartAccount: async (id: string) => {
    const response = await api.get(`/chart-accounts/${id}`);
    return response.data;
  },
  getChartAccountEndingBalance: async (id: string, fromDate?: Date, toDate?: Date) => {
    const response = await api.get(`/chart-accounts/endingbalance/${id}`,{
      params: {
        fromDate: fromDate,
        toDate: toDate
      }
    });
    return response.data;
  },
  getChartAccountstats: async (id: string, page?: number, limit?: number, fromDate?: Date, toDate?: Date) => {
    const response = await api.get(`/chart-accounts/stats/${id}`, {
      params: {
        page: page,
        limit: limit,
        fromDate: fromDate,
        toDate: toDate
      }
    });
    return response.data;
  },
  exportChartAccountstats: async (id: string, exportFormat: 'csv' | 'json', fromDate?: Date, toDate?: Date) => {
    const response = await api.get(`/chart-accounts/stats/${id}`, {
      params: {
        export: exportFormat,
        fromDate: fromDate,
        toDate: toDate
      }
    });
    return response.data;
  },
  createChartAccount: async (chartAccountData: IChartAccount) => {
    const response = await api.post("/chart-accounts", chartAccountData);
    return response.data;
  },
  updateChartAccount: async (id: string, chartAccountData: IChartAccount) => {
    const response = await api.put(`/chart-accounts/${id}`, chartAccountData);
    return response.data;
  },
  deleteChartAccount: async (id: string) => {
    const response = await api.delete(`/chart-accounts/${id}`);
    return response.data;
  },
  importChartAccounts: async (data: FormData) => {
    const response = await api.post('/chart-accounts/import', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getChartAccountTypes: async () => {
    const response = await api.get(`/chart-accounts/accounttypes`);
    return response.data;
  },
  getChartAccountSubTypes: async (id: string) => {
    const response = await api.get(`/chart-accounts/subaccounttypes/${id}`);
    return response.data;
  },
  // dashboard
  Dashboard:{
    getLoadDashboard: async () => {
      const response = await api.get("/dashboard/load");
      return response.data;
    },
    getProfitAndLossDashboard: async ({fromDate,toDate}: {fromDate:Moment,toDate: Moment}) => {
      const response = await api.get("/dashboard/profitAndLoss",{
        params:{fromDate,toDate}
      });
      return response.data;
    },
    getSalesDashboard: async ({fromDate,toDate}: {fromDate:Moment,toDate: Moment}) => {
      const response = await api.get("/dashboard/sales",{
        params:{fromDate,toDate}
      });
      return response.data;
    },
    getAccountsReceivable: async ({fromDate,toDate}: {fromDate:Moment,toDate: Moment}) => {
      const response = await api.get("/dashboard/accountsReceivable",{
        params:{fromDate,toDate}
      });
      return response.data;
    },
    getAccountsPayable: async ({fromDate,toDate}: {fromDate:Moment,toDate: Moment}) => {
      const response = await api.get("/dashboard/accountsPayable",{
        params:{fromDate,toDate}
      });
      return response.data;
    },
    getExpense: async ({fromDate,toDate}: {fromDate:Moment,toDate: Moment}) => {
      const response = await api.get("/dashboard/expense",{
        params:{fromDate,toDate}
      });
      return response.data;
    },
    getInvoicesAndBillsSummary: async () => {
      const response = await api.get("/dashboard/invoicesAndBillsSummary");
      return response.data;
    },
    // customer dashboard
    getCustomerDashboard: async () => {
      const response = await api.get("/dashboard/customer",);
      return response.data;
    },
    // carrier dashboard
    getVendorDashboard: async () => {
      const response = await api.get("/dashboard/vendor");
      return response.data;
    },
    getLoadBreakdown: async () => {
      const response = await api.get("/dashboard/loadBreakdown");
      return response.data;
    },
    getCashFlow: async ({fromDate,toDate}: {fromDate:Moment,toDate: Moment}) => {
      const response = await api.get("/dashboard/cashFlow",{
        params: {
          fromDate,
          toDate
        }
      });
      return response.data;
    },
  },
  // suser services
  getUsers: async (params: Record<string, any> = { limit: 10, page: 1 }) => {
    const response = await api.get("/users", { params });
    return response.data;
  },
  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  createUser: async (userData: IUser) => {
    const response = await api.post("/users", userData);
    return response.data;
  },
  updateUser: async (id: string, userData: IUser) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  ActivateUser: async (id: string, isActive = true) => {
    const response = await api.put(`/users/activate/${id}`, { isActive });
    return response.data;
  },
  BlockUser: async (id: string, isBlocked = true) => {
    const response = await api.put(`/users/block/${id}`, { isBlocked });
    return response.data;
  }
  ,
  // expense service
  ExpenseService: {
    searchExpense: async ({ loadid, service, location,id }: { loadid?: string, service?: string, location?: string,id?:string}) => {
      const response = await api.post(`/expense/search`, {
        loadid,
        service,
        location,
        id
      })
      return response.data;
    },
    getExpenseServiceListByLoadAndLocation: async (loadid: string, location: string) => {
      const response = await api.get(`/expense/service-list/${loadid}/location/${location}`)
      return response.data;
    },
    updateExpenseFollowUp: async (id: string, data: any) => {
      const response = await api.post(`/expense/${id}/followup`, data)
      return response.data;
    },
    getSpecificExpense: async (loadid: string, service: string, location: string) => {
      const response = await api.get(`/expense/load/${loadid}/service/${service}/location/${location}`)
      return response.data;
    },
    getExpensesByLoadId: async (loadid: string) => {
      const response = await api.get(`/expense/load/${loadid}`)
      return response.data;
    },
    createOrUpdateExpense: async ({ loadid, location, service }: { loadid: string, location: string, service: string }, data: FormData) => {
      const response = await api.put(`/expense/load/${loadid}/location/${location}/service/${service}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    UpdateExpense: async ({ id }: { id: string}, data: FormData) => {
      const response = await api.put(`/expense/update/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    deleteExpense: async (id: string) => {
      const response = await api.delete(`/expense/${id}`)
      return response.data;
    },
  },


  // customer service
  getCustomers: async (params: { limit?: number, page?: number, search?: string } = { limit: 2, page: 1, search: "" }) => {

    const response = await api.get("/customers", { params });
    return response.data;
  },
  getCustomersWithLoads: async (params: { limit?: number, page?: number, search?: string } = { limit: 100, page: 1, search: "" }) => {
    const response = await api.get("/customers/loads", { params });
    return response.data;
  },
  getNextLoadNumber: async () => {
    const response = await api.get("/loads/next-load-number");
    return response.data;
  },
  getCustomer: async (id: string) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },
  getCustomerFilters: async () => {
    const response = await api.get(`/customers/filters`);
    return response.data;
  },
  // customer rating services
  getCustomerRatingDetails: async (customerId: string) => {
    const response = await api.get(`/customer-rating/customer/${customerId}/details`);
    return response.data;
  },
  getCustomerRatingComments: async (customerId: string) => {
    const response = await api.get(`/rating-report/customer/${customerId}/comments`);
    return response.data;
  },
  deleteCustomerRatingComment: async (commentId: string) => {
    const response = await api.delete(`/rating-report/customer/${commentId}/comments`);
    return response.data;
  },
  addCustomerRatingComment: async (
    customerId: string,
    payload: FormData
  ) => {
    const response = await api.post(`/rating-report/customer/${customerId}/comments`, payload);
    return response.data;
  },
  addCustomerRating: async (
    customerId: string,
    payload: { rating: { communication: number; Behavior: number; } }
  ) => {
    const response = await api.post(`/customer-rating/customer/${customerId}/rating`, payload);
    return response.data;
  },
  // Carrier Rating Services
  getCarrierRatingComments: async (carrierId: string) => {
    const response = await api.get(`/rating-report/carrier/${carrierId}/comments`);
    return response.data;
  },
  deleteCarrierRatingComment: async (commentId: string) => {
    const response = await api.delete(`/rating-report/carrier/${commentId}/comments`);
    return response.data;
  },
  addCarrierRatingComment: async (
    carrierId: string,
    payload: FormData
  ) => {
    const response = await api.post(`/rating-report/carrier/${carrierId}/comments`, payload);
    return response.data;
  },
  // Driver Rating Services
  getDriverRatingComments: async (driverId: string) => {
    const response = await api.get(`/rating-report/driver/${driverId}/comments`);
    return response.data;
  },
  deleteDriverRatingComment: async (commentId: string) => {
    const response = await api.delete(`/rating-report/driver/${commentId}/comments`);
    return response.data;
  },
  addDriverRatingComment: async (
    driverId: string,
    payload: FormData
  ) => {
    const response = await api.post(`/rating-report/driver/${driverId}/comments`, payload);
    return response.data;
  },
  // Get average report rating
  getAverageReportRating: async (entityId: string, entityType: 'customer' | 'carrier' | 'driver') => {
    const response = await api.get(`/rating-report/getAverageReportRating/${entityId}/${entityType}`);
    return response.data;
  },
  createCustomer: async (customer: FormData) => {
    const response = await api.post("/customers", customer);
    return response.data;
  },
  updateCustomer: async (id: string, customer: FormData) => {
    const response = await api.put(`/customers/${id}`, customer);
    return response.data;
  },
  deleteCustomer: async (id: string) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
  exportCustomers: async (params: { limit?: number, page?: number, search?: string } = { limit: 2, page: 1, search: "" }, type: "" | "accounts" = "") => {
    const response = await api.get(`${type}/customers/export`, { params });
    return response.data;
  },
  getAccountsCustomers: async (params: { limit?: number, page?: number, search?: string, all?: boolean, id?: string } = { limit: 2, page: 1, search: "", all: false, id: "" }) => {
    const response = await api.get("/accounts/customers", { params });
    return response.data;
  },
  importCustomers: async (data: FormData) => {
    const response = await api.post(`/accounts/customers/import`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  getAccountsCustomersWithLoads: async (params: { limit?: number, page?: number, search?: string } = { limit: 100, page: 1, search: "" }) => {
    const response = await api.get("/accounts/customers/loads", { params });
    return response.data;
  },
  updateAccountsCustomer: async (id: string, customer: FormData) => {
    const response = await api.put(`/accounts/customers/${id}`, customer);
    return response.data;
  },
  deleteAccountsCustomer: async (id: string) => {
    const response = await api.delete(`/accounts/customers/${id}`);
    return response.data;
  },
  createAccountsCustomer: async (customer: FormData) => {
    const response = await api.post("/accounts/customers", customer);
    return response.data;
  },
  addContactPerson: async (id = "", customer = {}) => {
    const response = await api.post(`/contact-person/${id}`, customer);
    return response.data;
  },
  updateContactPerson: async (id = "", customer = {}) => {
    const response = await api.put(`/contact-person/${id}`, customer);
    return response.data;
  },
  getAllContactPerson: async (id = "",) => {
    const response = await api.get(`/contact-person/${id}`);
    return response.data;
  },
  getSingleContactPerson: async (id = "",) => {
    const response = await api.get(`/contact-person/contact/${id}`);
    return response.data;
  },
  deleteContactPerson: async (id = "",) => {
    const response = await api.delete(`/contact-person/${id}`);
    return response.data;
  },
  getAccountsCustomer: async (id: string) => {
    const response = await api.get(`/accounts/customers/${id}`);
    return response.data;
  },
  // End customer service
  // estimate service
  convertEstimateToInvoice: async (id: string) => {
    const response = await api.post(`/accounts/estimates/convert-estimate-to-invoice/${id}`);
    return response.data;
  },
  generateEstimateInvoice: async (invoiceData = {}, type: "customer" | "carrier" | "other") => {
    const response = await api.post(`/accounts/estimates/generate/${type}`, invoiceData);
    return response.data;
  },
  updateEstimateInvoice: async (id: string, invoiceData: unknown, type: "customer" | "carrier" | "other") => {
    const response = await api.put(`/accounts/estimates/update/${id}/${type}`, invoiceData);
    return response.data;
  },
  generateEstimateInvoicePdf: async (invoiceId: string) => {
    const response = await api.get(`/accounts/estimates/${invoiceId}`,{
      params:{
        isPdf:"false"
      }
    });
    return response.data;
  },
  getAccountEstimates: async (params = { limit: 10, page: 1, type: "", }) => {
    const response = await api.get("/accounts/estimates", { params });
    return response.data;
  },
  deleteEstimateInvoice: async (id: string) => {
    const response = await api.delete(`/accounts/estimates/${id}`);
    return response.data;
  },
  getAccountEstimatesById: async (id: string) => {
    const response = await api.get(`/accounts/estimates/getInvoiceById/${id}`);
    return response.data;
  },
  getEstimatesByCustomerId: async (customerId: string) => {
    const response = await api.get(`/transaction/getEstimates?customerId=${customerId}`);
    return response.data;
  },
  
  // invoice service
  sendInvoiceReminderManually: async (data={}) => {
    const response = await api.post(`/accounts/invoices/invoice-reminder/send`,data);
    return response.data;
  },
  runInvoiceRemindersManually: async () => {
    const response = await api.get(`/accounts/invoices/invoice-reminder/run-all`);
    return response.data;
  },
  getInvoiceReminderLogs: async (id: string) => {
    const response = await api.get(`/accounts/invoices/invoice-reminder/logs/${id}`);
    return response.data;
  },
  getAccountInvoiceById: async (id: string) => {
    const response = await api.get(`/accounts/invoices/getInvoiceById/${id}`);
    return response.data;
  },
  generateAccountInvoice: async (invoiceData = {}) => {
    const response = await api.post(`/accounts/invoices/generate/other`, invoiceData);
    return response.data;
  },
  updateAccountInvoice: async (id: string, invoiceData: unknown,) => {
    const response = await api.put(`/accounts/invoices/update/${id}/other`, invoiceData);
    return response.data;
  },
  checkAccountInvoiceNumberExist: async (invoiceNumber: string = "", type: "customer" | "carrier" | "other" = "other") => {
    const response = await api.get(`/accounts/invoices/check-invoicenumberexist`, { params: { invoiceNumber, type } });
    return response.data;
  },
  generateAccountInvoicePdf: async (invoiceId: string) => {
    const response = await api.get(`/accounts/invoices/${invoiceId}`,{
      params:{
        isPdf:"false"
      }
    });
    return response.data;
  },
  getAccountInvoice: async (id: string) => {
    const response = await api.get(`/accounts/invoices/${id}`);
    return response.data;
  },
  getAccountInvoices: async (params = { limit: 10, page: 1 }) => {
    const response = await api.get("/accounts/invoices", { params });
    return response.data;
  },
  deleteAccountInvoice: async (id: string) => {
    const response = await api.delete(`/accounts/invoices/${id}`);
    return response.data;
  },
  importInvoice: async (data: FormData) => {
    const response = await api.post(`/accounts/invoices/import`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  exportInvoice: async () => {
    const response = await api.get(`/accounts/invoices/export`);
    return response.data;
  },
  getInvoiceCustomersById: async (params: recievedPaymentparmaSearchProps) => {
    const response = await api.get(`/accounts/invoices/getcustomers/get`, { params });
    return response.data;
  },
  getCustomerInvoiceDetails: async (customerId: string,) => {
    const response = await api.get(`/transaction/getCustomerInvoiceDetails?customerId=${customerId}`);
    return response.data;
  },
  getTransactionsByCustomerId: async (customerId: string, page: number = 1, limit: number = 10, year: number = todayDate.getFullYear()) => {
    const response = await api.get(`/transaction/getTransactions`, {
      params: {
        customerId,
        page,
        limit,
        year
      }
    });
    return response.data;
  },
  getCustomerBillTransactionByCustomerId: async (customerId: string, page: number = 1, limit: number = 10, year = todayDate.getFullYear()) => {
    const response = await api.get(`/transaction/getCustomerBillTransaction`, {
      params: {
        customerId,
        page,
        limit,
        year
      }
    });
    return response.data;
  },
  getTotalTransactionCountByCustomerId: async (customerId: string, type: "vendor" | "customer") => {
    const response = await api.get(`/transaction/TotalTransactionCount`, {
      params: {
        customerId,
        type
      }
    });
    return response.data;
  },
  exportTransactionyCustomerId: async (customerId: string, type: "vendor" | "customer") => {
    const response = await api.get(`/transaction/export`, {
      params: {
        customerId,
        type
      }
    });
    return response.data;
  },
  createStatements: async (data: IStatementCreate, { startDate, endDate, customerId }: { startDate?: Date; endDate?: Date; customerId: string }) => {
    const response = await api.post(`/accounts/statements`, data, {
      params: {
        startDate,
        endDate,
        customerId
      }
    });
    return response.data;
  },
  getStatementsByCustomerId: async (customerId: string,) => {
    const response = await api.get(`/accounts/statements`, {
      params: {
        customerId
      }
    });
    return response.data;
  },
  deleteStatement: async (id: string) => {
    const response = await api.delete(`/accounts/statements/${id}`);
    return response.data;
  },
  generateStatementsByCustomerId: async (customerId: string, params: {
    startDate?: Date,
    endDate?: Date
  }) => {
    const response = await api.get(`/accounts/statements/generate/${customerId}`, {
      params: params
    });
    return response.data;
  },


  // Follow Up Notes Service
  getNotes: async (loadid: string) => {
    const response = await api.get(`/notes/${loadid}`);
    return response.data;
  },
  updateNotes: async (id: string, customer = {}) => {
    const response = await api.put(`/notes/${id}`, customer
    );
    return response.data;
  },
  createNotes: async (loadid: string, customer = {}) => {
    const response = await api.post(`/notes/${loadid}`, customer
    );
    return response.data;
  },
  deleteNotes: async (id: string) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },
  // Follow Up Notes Service
  getNotifications: async (isRead: boolean = false) => {
    const response = await api.get(`/notifications`, {
      params: {
        isRead
      }
    });
    return response.data;
  },
  updateNotifications: async (id: string, customer: INotificationUpdate) => {
    const response = await api.put(`/notifications/${id}`, customer
    );
    return response.data;
  },
  updateAllNotifications: async (ids: string[]) => {

    const response = await api.put(`/notifications/readall`, { ids: ids }
    );
    return response.data;
  },
  createNotifications: async (id: string, customer = {}) => {
    const response = await api.post(`/notifications/${id}`, customer
    );
    return response.data;
  },
  deleteNotifications: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
  // contact person service

  // Carriers Service
  getCarriers: async (params: { limit?: number; page?: number; search?: string } = { limit: 10, page: 1, search: "" }) => {
    const response = await api.get("/carriers", { params });
    return response.data;
  },
  getCarriersWithLoads: async (params: { limit?: number; page?: number; search?: string } = { limit: 10, page: 1, search: "" }) => {
    const response = await api.get("/carriers/loads", { params });
    return response.data;
  },
  getCarrierDetailByLoad: async (id: string, invoiceNumber: string) => {
    const response = await api.get(`/carriers/detail/${id}/${invoiceNumber}`);
    return response.data;
  },
  getCarrier: async (id: string) => {
    const response = await api.get(`/carriers/${id}`);
    return response.data;
  },
  createCarrier: async (carrierData: FormData) => {
    const response = await api.post("/carriers", carrierData);
    return response.data;
  },
  updateCarrier: async (id: string, carrierData: FormData) => {
    const response = await api.put(`/carriers/${id}`, carrierData);
    return response.data;
  },
  saferUpdateCarrier: async (id: string, carrierData = {}) => {
    const response = await api.put(`/carriers/${id}/safer`, carrierData);
    return response.data;
  },
  updateCarrierDocuments: async (id: string, carrierData: any) => {
    const response = await api.put(`/carriers/${id}/documents`, carrierData);
    return response.data;
  },
  getCarrierDocuments: async (id: string) => {
    const response = await api.get(`/carriers/${id}/documents`);
    return response.data;
  },
  deleteCarrierDocument: async (id: string, filename: string) => {
    const response = await api.delete(`/carriers/${id}/documents/${filename}`);
    return response.data;
  },
  deleteCarrier: async (id: string,) => {
    const response = await api.delete(`/carriers/${id}`);
    return response.data;
  },
  addPowerunit: async (id: string, powerunit: string) => {
    const response = await api.post(`/carriers/powerunit/${id}`, { powerunit });
    return response.data;
  },
  addTrailer: async (id: string, trailer: string) => {
    const response = await api.post(`/carriers/trailer/${id}`, { trailer });
    return response.data;
  },
  getCarrierFilters: async () => {
    const response = await api.get(`/carriers/filters`);
    return response.data;
  },
  // contact carrier service
  ContactCarrier: {
    addContactPerson: async (id = "", customer = {}) => {
      const response = await api.post(`/contact-carriers/${id}`, customer);
      return response.data;
    },
    updateContactPerson: async (id = "", customer = {}) => {
      const response = await api.put(`/contact-carriers/${id}`, customer);
      return response.data;
    },
    getAllContactPerson: async (id = "",) => {
      const response = await api.get(`/contact-carriers/${id}`);
      return response.data;
    },
    getSingleContactPerson: async (id = "",) => {
      const response = await api.get(`/contact-carriers/contact/${id}`);
      return response.data;
    },
    deleteContactPerson: async (id = "",) => {
      const response = await api.delete(`/contact-carriers/${id}`);
      return response.data;
    },
  },

  // drivers

  createDriver: async (driverData: IDriver) => {
    let formData = new FormData()
    for (const key in driverData) {
      if (key === "file") {
        if (driverData[key] instanceof File) {
          formData.append(key, (driverData as any)[key])
        }
      } else {
        formData.append(key, (driverData as any)[key])
      }
    }
    const response = await api.post("/drivers", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  getDrivers: async (params: { limit?: number, page?: number, search?: string, carrierId?: string, driverIds?: string } = { limit: 10, page: 1, search: "", carrierId: "", driverIds: "" }) => {
    const response = await api.get("/drivers", { params });
    return response.data;
  },
  getDriver: async (id: string) => {
    const response = await api.get(`/drivers/${id}`);
    return response.data;
  },
  updateDriver: async (id: string, driverData: IDriver) => {
    let formData = new FormData()
    for (const key in driverData) {
      if (key === "file") {
        if (driverData[key] instanceof File) {
          formData.append(key, (driverData as any)[key])
        }
      } else {
        formData.append(key, (driverData as any)[key])
      }
    }
    const response = await api.put(`/drivers/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  deleteDriver: async (id: string) => {
    const response = await api.delete(`/drivers/${id}`);
    return response.data;
  },
  getDriverFullReport: async (id: string, params: { page?: number, limit?: number, status?: string } = {}) => {
    const response = await api.get(`/drivers/${id}/full-report`, { params });
    return response.data;
  },
  exportCarrier: async (params: { limit?: number, page?: number, search?: string, carrierIds?: string } = { limit: 10, page: 1, search: "", carrierIds: "" }) => {
    const response = await api.get("/carriers/export", { params });
    return response.data;
  },
  // vendors
  getVendors: async (params: { limit?: number, page?: number, search?: string, isAll?: string } = { limit: 10, page: 1, search: "", isAll: "" }) => {
    const response = await api.get("/carriers/vendors", { params });
    return response.data;
  },
  importVendors: async (data: FormData) => {
    const response = await api.post(`/carriers/import`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getAllVendorsAndCarriers: async (params: { limit?: number, page?: number, search?: string, id?: string } = { limit: 10, page: 1, search: "", id: "" }) => {
    const response = await api.get("/carriers/allvendorsandcarriers", { params });
    return response.data;
  },
  updateVendor: async (id: string, vendorData: FormData) => {
    const response = await api.put(`/carriers/vendors/${id}`, vendorData);
    return response.data;
  },
  deleteVendor: async (id: string) => {
    const response = await api.delete(`/carriers/vendors/${id}`);
    return response.data;
  },
  createVendor: async (vendorData: FormData) => {
    const response = await api.post(`/carriers/vendors`, vendorData);
    return response.data;
  },
  getVendor: async (id: string) => {
    const response = await api.get(`/carriers/vendors/${id}`);
    return response.data;
  },
  getLocations: async (type: string, search: string) => {
    const response = await api.get(`/locations`, {
      params: {
        type: type,
        search: search,
        limit: 10,
        page: 1,

      }
    });
    return response.data;
  },
  checkInLocation: async (loadid: string, type: "checkin" | "checkout", formData: FormData) => {

    const response = await api.put(`/locations/check-in/${loadid}/${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // load service
  getLoads: async (params: GetLoadsParams = {
   
    limit: 10,
      page: 1,
      status: "",
  }) => {
   
    const response = await api.get("/loads", { params: params });
    return response.data;

  },
  getLoad: async (id: string) => {
    const response = await api.get(`/loads/${id}`);
    return response.data;
  },
  createLoad: async (formData: unknown) => {
    const response = await api.post("/loads", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  },
  generaterateConfirmationPDF: async (loadData = {}) => {
    const response = await api.post(`/loads/generate-rate-confirmation`, loadData);
    return response.data;
  },
  getRateConfirmation: async (loadid: string) => {
    const response = await api.get(`/loads/generate-rate-confirmation/${loadid}`);
    return response.data;
  },
  updateLoad: async (id: string, formData: unknown) => {
    const response = await api.put(`/loads/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  },
  updateLoadStatus: async (id: string, data: unknown) => {
    const response = await api.put(`/loads/${id}/status`, data);
    return response.data;
  },
  deleteLoad: async (id: string) => {
    const response = await api.delete(`/loads/${id}`);
    return response.data;
  },
  LoadActivate: async (id: string) => {
    const response = await api.put(`/loads/activate/${id}`);
    return response.data;
  },
  // getdatabyusdotnumber
  getDataByUsdotNumber: async (usdotNumber: string) => {
    const response = await api.get(`/safer-service/usdot/${usdotNumber}`);
    return response.data;
  },
  // Account Bill service
  generateAccountBill: async (invoiceData = {}) => {
    const response = await api.post(`/accounts/bills/generate/other`, invoiceData);
    return response.data;
  },
  importBill: async (data: FormData) => {
    const response = await api.post(`/accounts/bills/import`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  exortBill: async () => {
    const response = await api.get(`/accounts/bills/export`);
    return response.data;
  },
  updateAccountBill: async (id: string, invoiceData: unknown,) => {
    const response = await api.put(`/accounts/bills/update/${id}/other`, invoiceData);
    return response.data;
  },
  getAccountBillById: async (id: string) => {
    const response = await api.get(`/accounts/bills/getInvoiceById/${id}`);
    return response.data;
  },
  checkAccountBillNumberExist: async (BillNumber: string = "") => {
    const response = await api.get(`/accounts/bills/check-invoicenumberexist`, { params: { BillNumber: BillNumber } });
    return response.data;
  },
 
  generateAccountBillPdf: async (invoiceId: string) => {
    const response = await api.get(`/accounts/bills/${invoiceId}`);
    return response.data;
  },

  getAccountBill: async (id: string) => {
    const response = await api.get(`/accounts/bills/${id}`);
    return response.data;
  },

  getAccountBills: async (params = { limit: 10, page: 1 }) => {
    const response = await api.get("/accounts/bills", { params });
    return response.data;
  },

  deleteAccountBill: async (id: string) => {
    const response = await api.delete(`/accounts/bills/${id}`);
    return response.data;
  },
  getBillCustomerById: async (params: recievedPaymentparmaSearchProps) => {
    const response = await api.get(`/accounts/bills/getcustomers/get`, { params });
    return response.data;
  },
  getCustomerBillDetails: async (customerId: string,) => {
    const response = await api.get(`/transaction/getCustomerBillDetails?customerId=${customerId}`);
    return response.data;
  },
  // end account bill service

  updateInvoicePayments: async (data:RecievedPamentPayload , type: "invoice" | "bill") => {
    const response = await api.post('/payments', data, { params: { type } });
    return response.data;
  },
  getrecivedPayment: async (id: string, params: {
    invoiceNumber: string, fromDate: string, toDate: string, overdueOnly: string, type: "invoice" | "bill"
  }) => {
    const response = await api.get(`/payments/recived/${id}`, { params });
    return response.data;
  },
  updateRecivedPayment: async (id: string, data: UpdateRecievedPamentPayload, type: "invoice" | "bill") => {
    const response = await api.put(`/payments/recived/${id}`, data, { params: { type } });
    return response.data;
  },
  deleteRecivedPayment: async (id: string) => {
    const response = await api.delete(`/payments/recived/${id}`);
    return response.data;
  },

  getAllPayments: async (params?: { fromDate?: string, toDate?: string }) => {
    const response = await api.get("/payments", { params });
    return response.data;
  },
  getPaymentTerms: async (params: { limit?: number, page?: number, customerId?: string, search?: string } = { limit: 10, page: 1, customerId: "", search: "" }) => {
    const response = await api.get("/payment-terms", { params });
    return response.data;
  },
  importPaymentTerms: async (data: FormData) => {
    const response = await api.post('/payment-terms/import', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  createPaymentTerm: async (paymentTermData: IPaymentTerm, customerId?: string) => {
    const response = await api.post("/payment-terms", paymentTermData, { params: { customerId } });
    return response.data;
  },
  updatePaymentTerm: async (id: string, paymentTermData: IPaymentTerm, customerId?: string) => {
    const response = await api.put(`/payment-terms/${id}`, paymentTermData, { params: { customerId } });
    return response.data;
  },
  deletePaymentTerm: async (id: string, customerId?: string) => {
    const response = await api.delete(`/payment-terms/${id}`, { params: { customerId } });
    return response.data;
  },

  getPaymentTermById: async (id: string, customerId?: string) => {
    const response = await api.get(`/payment-terms/${id}`, { params: { customerId } });
    return response.data;
  },
  //  Item Services APIs
  createItemService: async (paymentTermData: IitemService) => {
    const response = await api.post("/expensefees", paymentTermData);
    return response.data;
  },
  updateItemService: async (id: string, paymentTermData: IitemService) => {
    const response = await api.put(`/expensefees/${id}`, paymentTermData);
    return response.data;
  },
  deleteItemService: async (id: string) => {
    const response = await api.delete(`/expensefees/${id}`);
    return response.data;
  },
  getItemServices: async (loadId?:string) => {
    const response = await api.get("/expensefees",
      {
        params:{loadId}
    });
    return response.data;
  },
  importExpenseFees: async (data: FormData) => {
    const response = await api.post('/expensefees/import', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getItemServiceById: async (id: string) => {
    const response = await api.get(`/expensefees/${id}`);
    return response.data;
  },
  getProductServiceData: async (isPagination?: { limit?: number, page?: number }) => {
    const response = await api.get("/productservices", { params: isPagination });
    return response.data;
  },
  createProductServiceData: async (paymentTermData: IProductService) => {
    const response = await api.post("/productservices", paymentTermData);
    return response.data;
  },
  updateProductServiceData: async (id: string, paymentTermData: IProductService) => {
    const response = await api.put(`/productservices/${id}`, paymentTermData);
    return response.data;
  },
  importProductServices: async (data: FormData) => {
    const response = await api.post('/productservices/import', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  deleteProductServiceData: async (id: string) => {
    const response = await api.delete(`/productservices/${id}`);
    return response.data;
  },
  getTaxOptions: async () => {
    const response = await api.get("/tax-options");
    return response.data;
  },
  importTaxOptions: async (data: FormData) => {
    const response = await api.post('/tax-options/import', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getSalesTax: async () => {
    const response = await api.get("/tax-options/SalesTax");
    return response.data;
  },
  getPurchaseTax: async () => {
    const response = await api.get("/tax-options/PurchaseTax");
    return response.data;
  },
  updateTaxOption: async (id: string, paymentTermData: ITaxOption) => {
    const response = await api.put(`/tax-options/${id}`, paymentTermData);
    return response.data;
  },
  createTaxOption: async (paymentTermData: ITaxOption) => {
    const response = await api.post("/tax-options", paymentTermData);
    return response.data;
  },
  deleteTaxOption: async (id: string) => {
    const response = await api.delete(`/tax-options/${id}`);
    return response.data;
  },
  // Document Services
  getDocuments: async (params = { page: 1, limit: 10, type: "" }) => {
    const response = await api.get("/document", { params });
    return response.data;
  },
  getSubDocuments: async (params = { page: 1, limit: 10, type: "" }) => {
    const response = await api.get("/document/subdocument", { params });
    return response.data;
  },
  getMenuRoutes: async () => {
    const response = await api.get("/dashboard/menu-routes");
    return response.data;
  },
  // vendor rating services
  getVendorRating: async (loadId: string) => {
    const response = await api.get(`/vendor-rating/carrier/${loadId}`);
    return response.data;
  },
  updateVendorRating: async (loadId: string, carrierId: string, data: any) => {
    const response = await api.patch(`/vendor-rating/carrier/${loadId}/${carrierId}`, data);
    return response.data;
  },
  getLoadRating: async (loadId: string) => {
    const response = await api.get(`/vendor-rating/load/${loadId}`);
    return response.data;
  },
  getVendoRatingDetails: async (carrierId: string) => {
    const response = await api.get(`/vendor-rating/ratingScore/${carrierId}`);
    return response.data;
  },

  // ── Custom Field Master ───────────────────────────────────────────────────
  getCustomFieldSchemas: async () => {
    const response = await api.get('/custom-fields/schemas');
    return response.data;
  },
  getCustomFieldDefinitions: async (schemaName: string) => {
    const response = await api.get(`/custom-fields/definitions/${schemaName}`);
    return response.data;
  },
  // ── VIN Service ───────────────────────────────────────────────────────────
  decodeVin: async (vin: string) => {
    const response = await api.get(`/vin/decode/${vin}`);
    return response.data;
  },
  saveVinMapping: async (data: {
    vin: string;
    ownerId?: string;
    lesseId?: string;
    dotNumber?: string;
  }) => {
    const response = await api.post(`/vin/save`, data);
    return response.data;
  },
  getVinInvoicePrefill: async (vin: string) => {
    const response = await api.get(`/vin/invoice-prefill/${vin}`);
    return response.data;
  },
  getVinHistory: async (vin: string) => {
    const response = await api.get(`/vin/history/${vin}`);
    return response.data;
  },
  getVinFraudFlags: async (vin: string) => {
    const response = await api.get(`/vin/fraud/${vin}`);
    return response.data;
  },
  listVinRecords: async (params = { page: 1, limit: 20 }) => {
    const response = await api.get(`/vin/list`, { params });
    return response.data;
  },
  lookupCustomerByUsdot: async (usdot: string) => {
    const response = await api.get(`/vin/customer-by-usdot/${encodeURIComponent(usdot)}`);
    return response.data;
  },

  // ── Credit Notes ───────────────────────────────────────────────────────────
  CreditNotes: {
    getNextNumber: async () => {
      const response = await api.get('/credit-debit-notes/credit-notes/next-number');
      return response.data;
    },
    create: async (data: Record<string, any>) => {
      const response = await api.post('/credit-debit-notes/credit-notes', { creditNoteData: data });
      return response.data;
    },
    getAll: async (params: {
      page?: number;
      limit?: number;
      status?: string;
      customerId?: string;
      fromDate?: string;
      toDate?: string;
    } = { page: 1, limit: 10 }) => {
      const response = await api.get('/credit-debit-notes/credit-notes', { params });
      return response.data;
    },
    getById: async (id: string) => {
      const response = await api.get(`/credit-debit-notes/credit-notes/${id}`);
      return response.data;
    },
    updateStatus: async (id: string, data: { status?: string; reason?: string; customerNotes?: string }) => {
      const response = await api.put(`/credit-debit-notes/credit-notes/${id}`, data);
      return response.data;
    },
    applyAmount: async (id: string, amount: number) => {
      const response = await api.patch(`/credit-debit-notes/credit-notes/${id}/apply`, { amount });
      return response.data;
    },
    remove: async (id: string) => {
      const response = await api.delete(`/credit-debit-notes/credit-notes/${id}`);
      return response.data;
    },
  },

  // ── Debit Notes ────────────────────────────────────────────────────────────
  DebitNotes: {
    getNextNumber: async () => {
      const response = await api.get('/credit-debit-notes/debit-notes/next-number');
      return response.data;
    },
    create: async (data: Record<string, any>) => {
      const response = await api.post('/credit-debit-notes/debit-notes', { debitNoteData: data });
      return response.data;
    },
    getAll: async (params: {
      page?: number;
      limit?: number;
      status?: string;
      vendorId?: string;
      fromDate?: string;
      toDate?: string;
    } = { page: 1, limit: 10 }) => {
      const response = await api.get('/credit-debit-notes/debit-notes', { params });
      return response.data;
    },
    getById: async (id: string) => {
      const response = await api.get(`/credit-debit-notes/debit-notes/${id}`);
      return response.data;
    },
    updateStatus: async (id: string, data: { status?: string; reason?: string; vendorNotes?: string }) => {
      const response = await api.put(`/credit-debit-notes/debit-notes/${id}`, data);
      return response.data;
    },
    applyAmount: async (id: string, amount: number) => {
      const response = await api.patch(`/credit-debit-notes/debit-notes/${id}/apply`, { amount });
      return response.data;
    },
    remove: async (id: string) => {
      const response = await api.delete(`/credit-debit-notes/debit-notes/${id}`);
      return response.data;
    },
  },

  // ── Invoice Reminder Templates ───────────────────────────────────────────────
  InvoiceReminderTemplates: {
    initializeDefaultTemplates: async (companyId: string, ownerAdminId: string) => {
      const response = await api.post('/invoice-reminder-templates/initialize', { companyId, ownerAdminId });
      return response.data;
    },
    createTemplate: async (data: {
      templateType: 'before' | 'after' | 'on_due';
      name: string;
      subject: string;
      htmlContent: string;
    }) => {
      const response = await api.post('/invoice-reminder-templates', data);
      return response.data;
    },
    getTemplates: async () => {
      const response = await api.get('/invoice-reminder-templates');
      return response.data;
    },
    getActiveTemplateByType: async (type: 'before' | 'after' | 'on_due') => {
      const response = await api.get(`/invoice-reminder-templates/active/${type}`);
      return response.data;
    },
    getTemplateById: async (id: string) => {
      const response = await api.get(`/invoice-reminder-templates/${id}`);
      return response.data;
    },
    updateTemplate: async (id: string, data: {
      name?: string;
      subject?: string;
      htmlContent?: string;
      isActive?: boolean;
    }) => {
      const response = await api.put(`/invoice-reminder-templates/${id}`, data);
      return response.data;
    },
    deleteTemplate: async (id: string) => {
      const response = await api.delete(`/invoice-reminder-templates/${id}`);
      return response.data;
    },
    setActiveTemplate: async (id: string) => {
      const response = await api.put(`/invoice-reminder-templates/${id}/set-active`);
      return response.data;
    },
    duplicateTemplate: async (id: string) => {
      const response = await api.post(`/invoice-reminder-templates/${id}/duplicate`);
      return response.data;
    },
  },

  // ── Report Exports ─────────────────────────────────────────────────────────
  exportChartOfAccounts: async () => {
    const response = await api.get('/report/export/chart-of-accounts');
    return response.data;
  },
  exportReport: async (params: { type: string; fromDate?: Date; toDate?: Date; allowedType?: string; format?: string }) => {
    const response = await api.get('/report/export', { params });
    return response.data;
  },
  exportReportBlob: async (params: { type: string; fromDate?: Date; toDate?: Date; allowedType?: string; format?: string }) => {
    const response = await api.get('/report/export', { 
      params,
      responseType: 'blob'
    });
    return response.data;
  },

};

export default apiService;
