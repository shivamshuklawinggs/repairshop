import { CUSTOMER_DOCUMENTS_DIR } from 'config';
import fs from 'fs/promises';
import path from 'path';
import { IFile } from 'types/file';

export class FileService {
    private static UPLOAD_DIR = CUSTOMER_DOCUMENTS_DIR

    static async initialize(): Promise<void> {
        try {
            await fs.access(this.UPLOAD_DIR);
        } catch {
            await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
        }
    }
    static async deleteExistedFiles(files: IFile[]): Promise<void> {
        for (const file of files) {
            try {
                 
                await fs.unlink(path.join(this.UPLOAD_DIR, file.filename));
            } catch (error) {
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
            } catch (error) {
                console.warn(`Error deleting file ${typeof file === 'string' ? file : file.filename}:`, error);
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
