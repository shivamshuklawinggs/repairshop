import { Router } from 'express';
import { journalEntryController } from './controller';
import { Middleware } from "middlewares";
import multer from "multer";
import path from "path";
import { AppError } from "middlewares/error";
import { v4 as uuidv4 } from 'uuid';
import { JOURNAL_ENTRY_DIR } from 'config';
const {verifyToken,decryptDataMiddleware}=Middleware

const router = Router();
// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
    cb(null, path.join(JOURNAL_ENTRY_DIR));
    },
    filename: function (_req, file, cb) {
      const uniqueId = uuidv4();
      const ext = path.extname(file.originalname);
      cb(null, `journal-entry-${uniqueId}${ext}`);
    }
  });
  
  const fileFilter = (_req: any, file: any, cb: any) => {
   try {
      if (file.mimetype.includes("image")) {
        cb(null, true);
      } else {
         throw new AppError('Invalid file type. Only Images are allowed.', 400);
      }
   } catch (error) {
      cb(error, false);
   }
  };
  
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/import', verifyToken, csvUpload.single('file'), journalEntryController.importJournalEntries);
router.post('/', verifyToken,upload.single('attachments'),decryptDataMiddleware , journalEntryController.createJournalEntry);
router.get('/', verifyToken, journalEntryController.getJournalEntries);
router.get('/next-journal-number', verifyToken, journalEntryController.getNextJournalNumber);
router.get('/:id', verifyToken, journalEntryController.getJournalEntryById);
router.put('/:id', verifyToken ,upload.single('attachments'),decryptDataMiddleware , journalEntryController.updateJournalEntry);
router.delete('/:id', verifyToken, journalEntryController.deleteJournalEntry);

export default router;
