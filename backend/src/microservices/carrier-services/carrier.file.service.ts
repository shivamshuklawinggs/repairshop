import { CARRIER_DOCUMENTS_DIR,CARRIER_INSURANCE_DOCUMENTS_DIR} from 'config';
import fs from 'fs/promises';
import path from 'path';
import { IFile } from 'types/file';

export class FileService {
    private static UPLOAD_DIR = CARRIER_DOCUMENTS_DIR
    private static CARRIER_INSURANCE_DOCUMENTS_DIR = CARRIER_INSURANCE_DOCUMENTS_DIR

    static async initialize(): Promise<void> {
        try {
            await fs.access(this.UPLOAD_DIR);
            await fs.access(this.CARRIER_INSURANCE_DOCUMENTS_DIR);
        } catch {
            await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
            await fs.mkdir(this.CARRIER_INSURANCE_DOCUMENTS_DIR, { recursive: true });
        }
    }
    static async deleteExistedFiles(files: IFile[]): Promise<void> {
        for (const file of files) {
            try {
                 
                await fs.unlink(path.join(this.UPLOAD_DIR, file.filename));
            } catch (error) {
                Promise.resolve()
                console.warn(`Error deleting file ${file.filename}:`, error);
            }
        }
    }
    static async deleteFiles(files: IFile[] | string[]): Promise<void> {
        for (const file of files) {
            try {
                const filename = typeof file === 'string' ? file : file.filename;
                 if(!filename) return 
                await fs.unlink(path.join(this.UPLOAD_DIR, filename));
                Promise.resolve()
            } catch (error) {
                console.warn(`Error deleting file ${typeof file === 'string' ? file : file.filename}:`, error);
                Promise.resolve()
            }
        }
    }
    static async deleteInsuranceFiles(files: IFile[] | string[]): Promise<void> {
        for (const file of files) {
            try {
                const filename = typeof file === 'string' ? file : file.filename;
                 if(!filename) return 
                await fs.unlink(path.join(this.CARRIER_INSURANCE_DOCUMENTS_DIR, filename));
                Promise.resolve()
            } catch (error) {
                console.warn(`Error deleting file ${typeof file === 'string' ? file : file.filename}:`, error);
                Promise.resolve()
            }
        }
    }
    static async deleteInsuranceExistedFiles(files: IFile[]): Promise<void> {
        for (const file of files) {
            try {
                 if(!file?.filename) return 
                await fs.unlink(path.join(this.CARRIER_INSURANCE_DOCUMENTS_DIR, file.filename));
            } catch (error) {
                console.warn(`Error deleting file ${file.filename}:`, error);
                Promise.resolve()
            }
        }
    }

    static getUploadPath(): string {
        return this.UPLOAD_DIR;
    }

    static getFileUrl(filename: string): string {
        return `/api/carriers/${filename}`;
    }
}

// Initialize upload directory
FileService.initialize();
