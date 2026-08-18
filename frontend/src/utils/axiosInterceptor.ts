import axios from "axios";
import { store } from "@/redux/store";
import { logout } from "@/redux/Slice/UserSlice";
import { API_URL } from "@/config";
import { decryptErrorResponse, decryptResponse, encryptRequest } from "./aes";
import { paths } from "./paths";
const API_KEY = import.meta.env.VITE_API_KEY;

// Create an Axios instance
const api = axios.create({
  baseURL: API_URL + "api",
  withCredentials: true,
  headers: {
    "x-api-key": API_KEY,
  }
});

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    // Get token from Redux store or localStorage
    const state = store.getState();
    const companyId = state.user.currentCompany;
    const token=state.user.token
    // config.headers["isencrypted"]="true"
    config.headers["isencrypted"]="false"
    
    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } 
    
    if (companyId) {
      config.headers.companyId = companyId;
    }
    // Encrypt request data for POST and PUT requests
   if(config.headers.isencrypted =='true') { 
    encryptRequest(config)
  }
    return config;
  },
  (error:any) => {
    console.warn("errrr",error)
    Promise.reject(error)
  }
);

// Response Interceptor
api.interceptors.response.use(
   (response) => {
    try {
      // Handle encrypted responses
     if(response.config.headers.isencrypted =='true') {
      
       decryptResponse(response)
     } 
      return response;
    } catch (error:any) {
      if( error.config.headers.isencrypted=='true' ){ 
         decryptErrorResponse(error)
      }
      return Promise.reject(error);
    }
  },
  async (error:any) => {
    if( error.config.headers.isencrypted=='true' ) { 
      decryptErrorResponse(error)
    }
    // Handle response errors
        switch (error.response?.status) {
      case 401:
        // Handle unauthorized error
        store.dispatch(logout());
        window.location.assign(`${paths.login}`);
        // toast.error("Session expired. Please login again.");
        error.message="Session expired. Please login again.";
        break;
      case 403:
        // toast.error("Access denied");
        error.message="Access denied";
        break;
      default:
        if (error.response?.data?.message) {
          // toast.error(error.response.data.message);
          error.message=error.response.data.message;
        } else {
          // toast.error("An error occurred");
          error.message=error.message
        }
    }
    return Promise.reject(error);
  }
);

export default api;