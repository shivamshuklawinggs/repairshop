import apiService from "@/service/apiService";

// Interfaces for better type safety
interface PaginationParams {
  page: number;
  limit: number;
  isAll?: string;
  search?: string;
  hasOpenBalance?: boolean;
}

interface ApiResponse<T> {
  data: T[];
  pagination?: {
    hasmore: boolean;
    total?: number;
    page?: number;
  };
}

type ApiFunction<T> = (params: PaginationParams) => Promise<ApiResponse<T>>;

interface FetchAllOptions {
  limit?: number;
  isAll?: string;
  search?: string;
  hasOpenBalance?: boolean;
}

/**
 * A generic function to fetch all data from paginated API endpoints
 */
export async function fetchAllData<T>(
  apiFn: ApiFunction<T>,
  options: FetchAllOptions = {}
): Promise<T[]> {
  let hasMore = true;
  let page = 1;
  const limit = options.limit || 10;
  const data: T[] = [];

  while (hasMore) {
    try {
      const response = await apiFn({ page, limit, isAll: options.isAll, search: options.search, hasOpenBalance:options.hasOpenBalance });
      const items = Array.isArray(response?.data) ? response.data : [];

      if (items.length === 0) {
        break;
      }

      data.push(...items);
      hasMore = Number(response.pagination?.total) > page * limit;
      page++;
    } catch (error) {
      break;
    }
  }

  return data;
}

/**
 * A helper factory so you don't need to repeat boilerplate for each API.
 */
function makeFetchAll<T>(apiFn: ApiFunction<T>) {
  return (options: FetchAllOptions = {limit: 100}) => fetchAllData(apiFn, options);
}

// Example usage
export const getAllDataOfBillCustomers = makeFetchAll(apiService.getAllVendorsAndCarriers);
export const getAllDataOfVendors = makeFetchAll(apiService.getVendors);
export const getAllDataOfCustomers = makeFetchAll(apiService.getAccountsCustomers);
