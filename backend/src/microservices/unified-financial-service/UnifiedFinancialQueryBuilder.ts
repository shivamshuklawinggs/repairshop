import { Request ,Response} from "express";
import { PipelineStage, Types } from "mongoose";
import { getCompanyType } from "microservices/company-services/company.controller";
import { companyType } from "models/company.model";
import { IUserDocument } from "models/user.model";
import { ActionType, ResourceType, UserPermissionChecker } from "utils/roleBaseAccessControl";
import { getServicesByCreatedBy } from "utils/CreatedBy.Pipeline.Service";

export interface PaginationConfig {
  page: number;
  limit: number;
}

export interface SearchQuery {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  billNumber?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  customerId?: string;
  vendorId?: string;
  pagination?: {
    invoices: PaginationConfig;
    bills: PaginationConfig;
    payments: PaginationConfig;
    customers: PaginationConfig;
    loads: PaginationConfig;
    carriers: PaginationConfig;
  };
}

// Configuration interfaces for reusable filter building
interface FilterConfig {
  type: 'invoice' | 'bill' | 'payment' | 'customer' | 'carrier';
  searchFields: string[];
  numberField?: string;
  dateField?: string;
  amountField?: string;
  customerField?: string;
  vendorField?: string;
  carrierField?: string;
}

class UnifiedFinancialQueryBuilder {
  // Type-based search field configurations
  private static readonly TYPE_SEARCH_FIELDS = {
    invoice: ['invoiceNumber', 'customerNotes', 'terms_conditions'],
    bill: ['BillNumber', 'customerNotes', 'terms_conditions'],
    payment: ['referenceNo', 'paymentMethod', 'checkNumber', 'transactionId'],
    customer: ['company', 'email', 'phone', 'mcNumber', 'usdot', 'contactPerson'],
    carrier: ['company', 'email', 'phone', 'mcNumber', 'usdot', 'contactPerson']
  };

  // Reusable helper functions
  
  /**
   * Create base filter with company ID
   */
  private static createBaseFilter(companyId: Types.ObjectId): Record<string, any> {
    return { companyId };
  }

  /**
   * Get search fields based on type
   */
  private static getSearchFieldsByType(type: FilterConfig['type']): string[] {
    return this.TYPE_SEARCH_FIELDS[type] || [];
  }
 /**
   * Role-based middleware
   */
  static hasAccessRole =async ({action,res,resource,req,allowedCompanyTypes}:{allowedCompanyTypes?:companyType[],action: ActionType, resource: ResourceType[], req: Request,res:Response}) => {
    try {
      const checker = new UserPermissionChecker(req.user as IUserDocument);
      const companyType = await getCompanyType(res.locals.companyId)
      const hasPermission = checker.hasPermission({ action: action, resources: resource, companyType, allowedCompanyTypes: allowedCompanyTypes });
      return hasPermission
    } catch (error: any) {
      return false
    }

  };
  /**
   * Add search conditions to filter using type-based search fields
   */
  private static async addSearchConditions(
    filter: Record<string, any>,
    search: string,
    config: FilterConfig,
    query: SearchQuery,
  ): Promise<void> {
    if (!search) return;

    // Use type-based search fields if not explicitly provided
    const searchFields = config.searchFields.length > 0 
      ? config.searchFields 
      : this.getSearchFieldsByType(config.type);

    const searchConditions: Array<Record<string, any>> = searchFields.map(field => ({
      [field]: { $regex: search, $options: 'i' }
    }));

    // Add customer search conditions if applicable
    if (config.customerField && query.customerId) {
        searchConditions.push({
          [config.customerField]: new Types.ObjectId(query.customerId)
        });
    }

    // Add carrier search conditions if applicable
    if (config.carrierField || config.vendorField) {
        const field = config.carrierField || config.vendorField;
        if (field && query.vendorId) {
          searchConditions.push({
            [field]: new Types.ObjectId(query.vendorId)
          });
        }
      
    }

    // For payments, search both customers and carriers
    if (config.type === 'payment' && config.customerField && query.customerId) {
        searchConditions.push({
          [config.customerField]:new Types.ObjectId(query.customerId)
        });
      
    }

    filter.$or = searchConditions;
  }

  /**
   * Add date range filter
   */
  private static addDateRangeFilter(
    filter: Record<string, any>,
    startDate?: string,
    endDate?: string,
    dateField: string = 'createdAt'
  ): void {
    if (startDate || endDate) {
      filter[dateField] = {};
      if (startDate) filter[dateField].$gte = new Date(startDate);
      if (endDate) filter[dateField].$lte = new Date(endDate);
    }
  }

  /**
   * Add amount range filter
   */
  private static addAmountRangeFilter(
    filter: Record<string, any>,
    minAmount?: number,
    maxAmount?: number,
    amountField: string = 'amount'
  ): void {
    if (minAmount !== undefined || maxAmount !== undefined) {
      filter[amountField] = {};
      if (minAmount !== undefined) filter[amountField].$gte = minAmount;
      if (maxAmount !== undefined) filter[amountField].$lte = maxAmount;
    }
  }

  /**
   * Add text match filter
   */
  private static addTextMatchFilter(
    filter: Record<string, any>,
    field: string,
    value?: string
  ): void {
    if (value) {
      filter[field] = { $regex: value, $options: 'i' };
    }
  }

  /**
   * Add status filter
   */
  private static addStatusFilter(
    filter: Record<string, any>,
    status?: string
  ): void {
    if (status) {
      filter.status = status;
    }
  }

  /**
   * Generic filter builder that uses configuration
   */
  private static async buildGenericFilter(
    query: SearchQuery,
    companyId: Types.ObjectId,
    config: FilterConfig,
    req:Request
  ): Promise<Record<string, any>> {
    const filter = this.createBaseFilter(companyId);

    // Add search conditions
    if (query.search) {
      await this.addSearchConditions(filter, query.search, config, query);
    }

    // Add specific field filters
    if (config.numberField && query.invoiceNumber) {
      this.addTextMatchFilter(filter, config.numberField, query.invoiceNumber);
    }
    if (config.numberField && query.billNumber) {
      this.addTextMatchFilter(filter, config.numberField, query.billNumber);
    }
   

    // Add status filter
    this.addStatusFilter(filter, query.status);

    // Add payment method filter
    if (query.paymentMethod) {
      this.addTextMatchFilter(filter, 'paymentMethod', query.paymentMethod);
    }

    // Add date range filter
    this.addDateRangeFilter(filter, query.startDate, query.endDate, config.dateField);

    // Add amount range filter
    if(!["customer","carrier"].includes(config.type)){
      this.addAmountRangeFilter(filter, query.minAmount, query.maxAmount, config.amountField);
    }
    if(config.type==="customer"){
     return getServicesByCreatedBy({ req, matchStage: filter,})[0]["$match"]
    }
    return filter;
  }
  // Public filter building methods using the generic builder

  /**
   * Build search filter for invoices
   */
  static async buildInvoiceFilter(query: SearchQuery, companyId: Types.ObjectId,req:Request): Promise<Record<string, any>> {
    const config: FilterConfig = {
      type: 'invoice',
      searchFields: [], // Will use type-based search fields
      numberField: 'invoiceNumber',
      dateField: 'postingDate',
      amountField: 'summary.finalAmount',
      customerField: 'customerId'
    };

    return this.buildGenericFilter(query, companyId, config,req);
  }

  /**
   * Build search filter for bills
   */
  static async buildBillFilter(query: SearchQuery, companyId:Types.ObjectId,req:Request): Promise<Record<string, any>> {
    const config: FilterConfig = {
      type: 'bill',
      searchFields: [], // Will use type-based search fields
      numberField: 'BillNumber',
      dateField: 'postingDate',
      amountField: 'summary.finalAmount',
      vendorField: 'vendorId'
    };

    return this.buildGenericFilter(query, companyId, config,req);
  }

  /**
   * Build search filter for payments
   */
  static async buildPaymentFilter(query: SearchQuery, companyId:Types.ObjectId,req:Request): Promise<Record<string, any>> {
    const config: FilterConfig = {
      type: 'payment',
      searchFields: [], // Will use type-based search fields
      dateField: 'paymentDate',
      amountField: 'amount',
      customerField: 'customerId'
    };

    return this.buildGenericFilter(query, companyId, config,req);
  }

  /**
   * Build search filter for customers
   */
  static async buildCustomerFilter(query: SearchQuery, companyId:Types.ObjectId,req:Request): Promise<Record<string, any>> {
    const config: FilterConfig = {
      type: 'customer',
      searchFields: [], // Will use type-based search fields
    };

    return this.buildGenericFilter(query, companyId, config,req);
  }

  

  /**
   * Build search filter for carriers
   */
  static async buildCarrierFilter(query: SearchQuery, companyId:Types.ObjectId,req:Request): Promise<Record<string, any>> {
    const config: FilterConfig = {
      type: 'carrier',
      searchFields: [], // Will use type-based search fields
    };

    return this.buildGenericFilter(query, companyId, config,req);
  }

  /**
   * Build a basic aggregate pipeline with match, sort, skip, and limit stages
   */
  static buildBasicPipeline(
    filter: Record<string, any>,
    sortOptions: Record<string, 1 | -1>,
    limit: number,
    extraStages:Array<PipelineStage>,
    skip: number = 0
  ): PipelineStage[] {
    return [
      { $match: filter },
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: limit },
      ...extraStages
    ];
  }

  /**
   * Build sort options with enhanced field mapping
   */
  static buildSortOptions(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): Record<string, 1 | -1> {
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    if (sortBy) {
      const fieldMap: Record<string, string> = {
        'date': 'postingDate',
        'amount': 'summary.finalAmount',
        'name': 'company',
        'number': 'invoiceNumber',
        'paymentDate': 'paymentDate',
        'createdAt': 'createdAt'
      };

      const sortField = fieldMap[sortBy] || sortBy;
      return { [sortField]: sortDirection };
    }
    
    return { createdAt: sortDirection };
  }
}
export default UnifiedFinancialQueryBuilder;


