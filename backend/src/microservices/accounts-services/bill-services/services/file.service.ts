import { INVOICE_DIR } from 'config';
import fs from 'fs/promises';
import path from 'path';
import { IFile } from 'types/file';
export class FileService {
    private static UPLOAD_DIR = INVOICE_DIR

    static async initialize(): Promise<void> {
        try {
            await fs.access(this.UPLOAD_DIR);
        } catch {
            await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
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
    static async deleteExistedFiles(files: string[]): Promise<void> {
        for (const file of files) {
            try {
                await fs.unlink(path.join(this.UPLOAD_DIR, file));
            } catch (error) {
                console.warn(`Error deleting file ${file}:`, error);
            }
        }
    }

    static getUploadPath(): string {
        return this.UPLOAD_DIR;
    }

    static getFileUrl(filename: string): string {
        return `/api/invoice/${filename}`;
    }
}

// Initialize upload directory
FileService.initialize();
