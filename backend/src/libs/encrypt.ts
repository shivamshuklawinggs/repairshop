
import { AppError } from 'middlewares/error';
import CryptoJS from 'crypto-js';
export class encrypt {
  //  variables s and require uitlities function for middleares
  public static encryptData = (text: string): string => {
    try {
      const json = JSON.stringify(text);
      return CryptoJS.AES.encrypt(json, process.env.CRYPTO_ENCRYPTION_KEY as string).toString();
    } catch (error) {
      console.warn('Encryption error:', error);
      throw new AppError('Failed to encrypt data', 400);
    }
  }
  public static decryptData = async (cipherText: string): Promise<any> => {
    try {

      if (!cipherText) {
        throw new AppError('No data to decrypt', 400);
      }
      const bytes = CryptoJS.AES.decrypt(cipherText, process.env.CRYPTO_ENCRYPTION_KEY as string);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) {
        throw new AppError('Decryption failed', 400);
      }
      return JSON.parse(decrypted);
    } catch (error) {
      console.warn('Decryption error:', error);
      throw new AppError('Failed to decrypt data', 400);
    }
  };
}