// utils/aes.ts
import { AxiosRequestConfig,AxiosResponse } from 'axios';
import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_API_ENCRYPTION_KEY || "qWdrFk61g1VtXRPJGmpLnyuZQJd5BQdA"; // Must match in frontend & backend

export const encryptData = (data: any): string => {
  try {
    const json = JSON.stringify(data);
    return CryptoJS.AES.encrypt(json, SECRET_KEY).toString();
  } catch (error) {
    console.warn('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

export const decryptData = (cipherText: string): Promise<any> => {
  try {
    if (!cipherText) {
      throw new Error('No data to decrypt');
    }
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Decryption failed');
    }
    return JSON.parse(decrypted);
  } catch (error) {
    console.warn('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Helper to check if data is encrypted
export const isEncrypted = (text: string): boolean => {
  try {
    const pattern = /^[A-Za-z0-9+/=]+$/;
    return pattern.test(text) && text.length > 32;
  } catch {
    return false;
  }
};

  // Encrypt request data for POST and PUT requests
 export  const encryptRequest=(config:AxiosRequestConfig)=>{
    if (config.method?.toLowerCase() === "post" || config.method?.toLowerCase() === "put") {
      if (config.data) {
        // Check if data is FormData
        if (config.data instanceof FormData) {
          // Create payload for non-file data
          let payload: any = {}
          let files: { key: string, value: File }[] = [];
          
          // First pass: collect files and data
          config.data.forEach((value: any, key: string) => {
            if (value instanceof File) {
              files.push({ key, value });
            } else {
              payload[key] = value;
            }
          });

          // Create new FormData with only files
          const newFormData = new FormData();
          
          // Add files back
          files.forEach(({key, value}) => {
            newFormData.append(key, value);
          });

          // Add encrypted payload
          if (Object.keys(payload).length > 0) {
            newFormData.append("payload", encryptData(payload));
          }

          // Replace old FormData with new one
          config.data = newFormData;
          // convert to multi-part
          if(config.headers){
            config.headers['Content-Type'] = 'multipart/form-data';
          }
        } else {
          // For regular JSON data, encrypt it
          config.data = { payload: encryptData(config.data) };
        }
      }
    }
  }
  export const  decryptErrorResponse=(error:any)=>{
    const response:any=error.response
    const Request:any=error.request
      if (response.data && response.data.payload) {
        const decrypted = decryptData(response.data.payload);
        // Parse the decrypted data if it's a string
        response.data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
      }
      if (Request.response && Request.response.data && Request.response.data.payload) {
        const decrypted = decryptData(Request.response.data.payload);
        // Parse the decrypted data if it's a string
        Request.response.data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
      }
      if (Request.response && Request.response.data && Request.response.data.payload) {
        const decrypted = decryptData(Request.response.data.payload);
        // Parse the decrypted data if it's a string
        Request.response.data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
      }
    }
export const  decryptResponse=(response:AxiosResponse)=>{
    if (response.data && response.data.payload) {
      const decrypted = decryptData(response.data.payload);
      // Parse the decrypted data if it's a string
      response.data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
    }
  }
