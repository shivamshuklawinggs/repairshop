import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs/promises';

type DeleteFilesFn = (dir: string, filenames: string[]) => Promise<void>;
/**
 * Deletes multiple files from a directory safely
 */
 class CleanDatabase {


    private deleteFilesFromDisk: DeleteFilesFn = async (
        dir: string,
        filenames: string[]
    ): Promise<void> => {

        await Promise.allSettled(
            filenames.map(async (filename) => {
                try {
                    const filePath = path.join(dir, filename);

                    // check if file exists
                    await fs.access(filePath);

                    // delete file
                    await fs.unlink(filePath);
                } catch (err: any) {
                    // Ignore if file doesn't exist
                    if (err.code !== 'ENOENT') {
                        console.warn(`Failed to delete file: ${filename}`, err.message);
                    }
                }
            })
        );
    }
    private UPLOAD_BASE_DIR: string = path.join(process.cwd(), "uploads")
    private paths: {
        INVOICE_DIR: string;
        BILL_DIR: string;
        ESTIMATE_DIR: string;
        JOURNAL_DIR: string;
    } = {
            INVOICE_DIR: path.join(this.UPLOAD_BASE_DIR, "invoice"),
            BILL_DIR: path.join(this.UPLOAD_BASE_DIR, "invoice"),
            ESTIMATE_DIR: path.join(this.UPLOAD_BASE_DIR, "invoice"),
            JOURNAL_DIR: path.join(this.UPLOAD_BASE_DIR, "journal-entry"),
        }
    constructor(
        private mongoUri: string,
    ) { }

    async run() {
        try {
            let conn: typeof mongoose | null = null;
            // 🔌 connect using URI
            conn = await mongoose.connect(this.mongoUri);
            const db = conn.connection.db;
            if (!db) throw new Error('Database not initialized');
            // =========================
            // Invoice
            // =========================
            const accountsinvoices = await db.collection('accountsinvoices')
                .find({}, { projection: { files: 1 } })
                .toArray();

            const invoiceFiles = accountsinvoices.flatMap((doc: any) =>
                (doc.files ?? []).map((f: any) => f.filename).filter(Boolean)
            );

            await this.deleteFilesFromDisk(this.paths.INVOICE_DIR, invoiceFiles);
            await db.collection('accountsinvoices').deleteMany({});
            // =========================
            // Bills
            // =========================
            const vendorbills = await db.collection('vendorbills')
                .find({}, { projection: { files: 1 } })
                .toArray();
            const billFiles = vendorbills.flatMap((doc: any) =>
                (doc.files ?? []).map((f: any) => f.filename).filter(Boolean)
            );

            await this.deleteFilesFromDisk(this.paths.BILL_DIR, billFiles);
            await db.collection('vendorbills').deleteMany({});
            // =========================
            // Estimates
            // =========================
            const estimates = await db.collection('estimates')
                .find({}, { projection: { files: 1 } })
                .toArray();
            const estimateFiles = estimates.flatMap((doc: any) =>
                (doc.files ?? []).map((f: any) => f.filename).filter(Boolean)
            );
            await this.deleteFilesFromDisk(this.paths.ESTIMATE_DIR, estimateFiles);
            await db.collection('estimates').deleteMany({});
            // =========================
            // Payments (no files)
            // =========================
            // =========================
            // Journal Entries
            // =========================
            const journals = await db.collection('journalentries')
                .find({}, { projection: { attachments: 1 } })
                .toArray();

            const journalFiles = journals
                .map((j: any) => j.attachments?.filename)
                .filter(Boolean);

            await this.deleteFilesFromDisk(this.paths.JOURNAL_DIR, journalFiles);
            await db.collection('journalentries').deleteMany({});
            // =========================
            // Direct deletes
            // =========================
             await db.collection('accountspayments').deleteMany({});
            await db.collection('ledgertransactions').deleteMany({});
            await db.collection('paymentallocations').deleteMany({});
            await db.collection('accountstatements').deleteMany({});
            await db.collection('chartofaccounts').deleteMany({})
            await db.collection('productservices').deleteMany({})
            await db.collection('taxservices').deleteMany({})
            await db.collection('notifications').deleteMany({})
            await db.collection('invoicereminders').deleteMany({})
            console.log('✅ Database cleaned successfully');
        } catch (error) {
            console.error('❌ Error cleaning database:', error);
            throw error;
        }
    }
}


// 👉 simple arg parser
const args = process.argv.slice(2);

const getArg = (key: string) => {
  const arg = args.find(a => a.startsWith(`--${key}=`));
  return arg ? arg.split('=')[1] : undefined;
};

const mongoUri = getArg('uri');
// ❌ required arg check
if (!mongoUri) {
  console.error('❌ Missing --uri');
  console.log('Example: npm run clean-db -- --uri=mongodb://localhost:27017/test');
  process.exit(1);
}
(async () => {
  try {
    console.log('🚀 Cleaning DB...');
    const cleaner = new CleanDatabase(
      mongoUri,
    );
    await cleaner.run();
    console.log('✅ Done');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err);
    process.exit(1);
  }
})();