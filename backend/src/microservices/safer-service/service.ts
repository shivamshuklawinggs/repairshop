import axios, { AxiosInstance } from 'axios';
import { AppError } from 'middlewares/error';

// Create an Axios instance
const apiClient:AxiosInstance = axios.create({
    baseURL: 'https://saferwebapi.com/v2', // Replace with your actual base URL
    timeout: 10000,
});

// Add a request interceptor
apiClient.interceptors.request.use(
    (config: any) => {
        // Add any custom headers or authentication tokens here
        config.headers['x-api-key'] = process.env.SAFER_API_KEY as string
        return config;
    },
    (error:Error) => {
        // Handle request error
        return Promise.reject(error);
    }
);

// Add a response interceptor
apiClient.interceptors.response.use(
    (response: any) => {
        // Handle response data
        return response;
    },
    (error:any) => {
        // Handle response error
        if(error?.response?.data) {
            throw new AppError(error.response.data.message,400);
        }
        return Promise.reject(error);
    }
);
export default apiClient;