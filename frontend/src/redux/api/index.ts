import apiService from "@/service/apiService";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { store } from "../store";
import { logout ,IUser} from "../Slice/UserSlice";
import { CustomerResponse, CarrierResponse, ICompany, SystemStats} from "@/types";
import { resetAppState } from "../actions";

// Async thunk to fetch the current user/session from the API.
export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {

      const response = await apiService.getCurrentUser();
      // Expecting the API to return the user object in response.data
      return response.data as IUser;
    } catch (err) {
      return rejectWithValue(null);
    }
  }
);
export const fetchCurrentCompany = createAsyncThunk(
  'company/fetchCurrentCompany',
  async ({companyId}: {companyId:string}, { rejectWithValue }) => {
    try {

      const response = await apiService.getCompany(companyId);
      // Expecting the API to return the user object in response.data

      return response.data as ICompany;
    } catch (err) {
      return rejectWithValue(null);
    }
  }
);

export const fetchVendors = createAsyncThunk(
  'accounts/vendors/fetchVendors',
   async ( { page = 1, limit = 5 ,search=""}: { page?: number; limit?: number;search?:string }, { rejectWithValue }) => {
    try {
      const response = await apiService.getVendors({page,limit,search});
      return response
    } catch (error) {
      console.warn("error",error)
      return rejectWithValue(error);
  }
})

export const fetchCompanies = createAsyncThunk(
  'companies/fetchCompanies',
  async ( { page = 1, limit = 5,search="" }: { page?: number; limit?: number;search?:string }, { rejectWithValue }) => {
    try {
      const response = await apiService.getCompanies({page,limit,search});
      return response
    } catch (error) {
      console.warn("error",error)
      return rejectWithValue(error);
  }
})
export const fetchAllCompanies = createAsyncThunk(
  'companies/fetchAllCompanies',
  async ({check=false}: { check?: boolean; }, { rejectWithValue }) => {
    try {
      // let hasMore = true;
      // let page = 1;
      // let limit = 10;
      // let allData = [];

      // while (hasMore) {
      //   const response = await apiService.getCompanies({ page, limit });
      //   if (!response.data || response.data.length < limit) {
      //     hasMore = false;
      //   }
      //   if (response.data) {
      //     allData.push(...response.data);
      //   }
      //   page++;
      // }

      // return allData;
        const response = await apiService.getCompanies({ page:1, limit:100 });
        return  response.data
    } catch (error) {
      console.warn("Error fetching all companies:", error);
      return rejectWithValue(error);
    }
  }
)
export const fetchAllAccountsCustomers = createAsyncThunk(
  'accounts/customers/fetchAllAccountsCustomers',
  async ({check=false}: { check?: boolean; }, { rejectWithValue }) => {
    try {
      let hasMore = true;
      let page = 1;
      let limit = 10;
      let allData = [];

      while (hasMore) {
        const response = await apiService.getAccountsCustomers({ page, limit });
        if (!response.data || response.data.length < limit) {
          hasMore = false;
        }
        if (response.data) {
          allData.push(...response.data);
        }
        page++;
      }

      return allData;
    } catch (error) {
      console.warn("Error fetching all accounts customers:", error);
      return rejectWithValue(error);
    }
  }
)
export const fetchAllVendorsAndCarriers = createAsyncThunk(
  'accounts/customers/fetchAllVendorsAndCarriers',
  async ({check=false}: { check?: boolean; }, { rejectWithValue }) => {
    try {
      let hasMore = true;
      let page = 1;
      let limit = 10;
      let allData = [];

      while (hasMore) {
        const response = await apiService.getAllVendorsAndCarriers({ page, limit });
        if (!response.data || response.data.length < limit) {
          hasMore = false;
        }
        if (response.data) {
          allData.push(...response.data);
        }
        page++;
      }

      return allData;
    } catch (error) {
      console.warn("Error fetching all vendors and carriers:", error);
      return rejectWithValue(error);
    }
  }
)
export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async ( { page = 1, limit = 5,type="load" }: { page?: number; limit?: number;type?:string }, { rejectWithValue }) => {
    try {
      const response = await apiService.getDocuments({page,limit,type});
      return response
    } catch (error) {
      console.warn("error",error)
      return rejectWithValue(error);
  }
})
export const fetchSubDocuments = createAsyncThunk(
  'documents/fetchSubDocuments',
  async ( params: Record<string,any>= {page:1,limit:5,type:"load"}, { rejectWithValue }) => {
    try {
      const response = await apiService.getSubDocuments(params as any);
      return response
    } catch (error) {
      console.warn("error",error)
      return rejectWithValue(error);
  }
})

export const UserLogout = createAsyncThunk(
  'user/logout',
  async (_, {dispatch, rejectWithValue }) => {
    try {
      await apiService.logout();
      dispatch(logout()); // Dispatch the logout action to clear user state
      dispatch(resetAppState())
      // Optionally, you can also clear any other related state or perform additional cleanup here
      return true; // Indicate successful logout
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);
export const fetchBusinessAnalytics = createAsyncThunk(
  'superadmin/fetchAnalytics',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await apiService.getAnalytics(params.page, params.limit);
      return {
        data: response.data,
        pagination: response.pagination
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchSuperadminStats = createAsyncThunk(
  'superadmin/fetchStats',
  async (companyId: string | undefined, { rejectWithValue }) => {
    try {
      const response = await apiService.getStats(companyId);
      return response.data as SystemStats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);
