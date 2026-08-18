import { NextFunction, Request, Response } from 'express';
import { journalEntryService } from './journal-entry.service';
import { IJournalEntry } from 'models/journal-entry.model';
import { AppError } from 'middlewares/error';
import mongoose, { Types } from 'mongoose';
import journalEntrySchema from './JournalEntrySchema';
import { TransactionType ,ledgerAdapter} from 'models/Ledger.model';
import { parseCleanValidate } from 'middlewares/cleanRequestBodyMiddleware';
import { parseCsvToJson } from 'utils/parseCsvToJson';
import ChartOfAccount from 'models/chartOfAccounts.model';
import JournalEntry from 'models/journal-entry.model';
import { generateUniqueId } from 'models/universalid.model';
class JournalEntryController {
  public createJournalEntry = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    try {
      await session.startTransaction();
      const { companyId, } = res.locals
      req.body.journalNumber=await generateUniqueId({ companyId: companyId as unknown as Types.ObjectId, prefix:"JE-",session })
      req.body = await parseCleanValidate(req.body.journalEntryData, journalEntrySchema)
      const journalEntry: Partial<IJournalEntry> = {
        ...req.body,
        companyId: companyId,
        createdBy: req.user?._id,
        updatedBy: req.user?._id,
        ownerAdminId: req.user?.ownerAdminId,
        manager: req.user?.manager
      };
      if (req.file) {
        journalEntry.attachments = req.file
      }
      const newJournalEntry = await journalEntryService.createJournalEntry(journalEntry, session)
      if (!newJournalEntry) {
        throw new AppError('Failed to create journal entry', 500);
      }
      await ledgerAdapter.recordLedgerById({
        id: newJournalEntry._id,
        session: session,
        type: TransactionType.JOURNAL,
        companyId: new mongoose.Types.ObjectId(res.locals.companyId)
      })
      await session.commitTransaction();
      res.status(201).json({
        data: newJournalEntry
      });
    } catch (error) {
      await session.abortTransaction();
      next(error)
    } finally{
      await session.endSession();
    }
  }

  public getJournalEntries = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = res.locals;
      const { page = 1, limit = 5 } = req.query
      const paginationOptions = {
        page: parseInt((page || 1) as string, 10),
        limit: parseInt((limit || 5) as string, 10)
      }
      const journalEntries = await journalEntryService.getJournalEntries(companyId, paginationOptions.page, paginationOptions.limit);
      res.status(200).json(journalEntries);
    } catch (error) {
      next(error)
    }

  }

  public getJournalEntryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const journalEntry = await journalEntryService.getJournalEntryById(id);
      if (!journalEntry) {
        throw new AppError('Journal entry not found', 404);
      }
      res.status(200).json(journalEntry);
    } catch (error) {
      next(error)
    }
  }

  public updateJournalEntry = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession()
    try {
      await session.startTransaction()
      const { companyId } = res.locals;
      const { id } = req.params;
      req.body = await parseCleanValidate(req.body.journalEntryData, journalEntrySchema)
      req.body.updatedBy = req.user?._id;
      const updatedJournalEntry = await journalEntryService.updateJournalEntry(id, req.body, companyId, req, session);
      await ledgerAdapter.recordLedgerById({
        id: req.params.id as unknown as Types.ObjectId,
        session: session,
        type: TransactionType.JOURNAL,
        companyId: new mongoose.Types.ObjectId(res.locals.companyId)
      })
      await session.commitTransaction()
      res.status(200).json({
        data: updatedJournalEntry
      });
    } catch (error) {
      await session.abortTransaction()
      next(error)
    } finally{
      await session.endSession();
    }

  }

  public deleteJournalEntry = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession()
    try {
      const { id } = req.params;
      await session.withTransaction(async () => {
        const deletedJournalEntry = await journalEntryService.deleteJournalEntry(id, session);
        if (!deletedJournalEntry) {
          throw new AppError('Journal entry not found', 404);
        }
        await ledgerAdapter.deleteTransactionLedgers({
          referenceId: id as unknown as Types.ObjectId,
          session: session,
          companyId: new mongoose.Types.ObjectId(res.locals.companyId)
        })
        res.status(200).json({
          data: { message: 'Journal entry deleted successfully' }
        });
      })
    } catch (error) {
      next(error);
    } finally {
      await session.endSession()
    }
  }

  public getNextJournalNumber = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = res.locals;
      const nextJournalNumber = await journalEntryService.getNextJournalNumber(companyId);
      res.status(200).json({ journalNumber: nextJournalNumber });
    } catch (error) {
      next(error);
    }
  }

  public importJournalEntries = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    await session.startTransaction();
    try {
      const companyId = res.locals.companyId;
      const file = req.file as Express.Multer.File;
      if (!file) throw new AppError('No file uploaded', 400);

      const parsedData = parseCsvToJson(file, {});

      /** ---- Group rows by journalNumber ---- */
      const grouped: Record<string, any> = {};
      for (const row of parsedData) {
        const num = row.journalNumber as string;
        if (!num) throw new AppError('journalNumber is required for every row', 400);
        if (!grouped[num]) {
          grouped[num] = {
            journalNumber: num,
            journalDate: row.journalDate,
            postingDate: row.postingDate || row.journalDate,
            memo: row.memo,
            entries: [],
          };
        }
        grouped[num].entries.push({
          accountName: row.accountName?.trim(),
          debit: parseFloat(row.debit) || 0,
          credit: parseFloat(row.credit) || 0,
          description: row.description,
        });
      }
      const transformedData: any[] = Object.values(grouped);

      /** ---- Duplicate journal number check ---- */
      const journalNumbers = transformedData.map((item: any) => item.journalNumber);
      const existing = await JournalEntry.find(
        { journalNumber: { $in: journalNumbers }, companyId },
        { journalNumber: 1 }
      ).session(session);
      if (existing.length > 0) {
        throw new AppError(`The following journal numbers already exist: ${existing.map((e: any) => e.journalNumber).join(', ')}`, 400);
      }

      /** ---- Resolve account names -> ObjectIds ---- */
      const accountNames = [
        ...new Set(
          transformedData.flatMap((item: any) => item.entries.map((e: any) => e.accountName?.toLowerCase()))
        ),
      ].filter(Boolean) as string[];
      const accountDocs = await ChartOfAccount.find(
        { name: { $in: accountNames }, companyId },
        { _id: 1, name: 1 }
      ).session(session);
      const accountMap = new Map(accountDocs.map((a: any) => [a.name.toLowerCase(), a._id]));
      const missingAccounts = accountNames.filter(n => !accountMap.has(n));
      if (missingAccounts.length > 0) {
        throw new AppError(`The following accounts were not found: ${missingAccounts.join(', ')}`, 400);
      }

      /** ---- Validate debit == credit per journal entry ---- */
      for (const item of transformedData) {
        const totalDebit = item.entries.reduce((s: number, e: any) => s + e.debit, 0);
        const totalCredit = item.entries.reduce((s: number, e: any) => s + e.credit, 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          throw new AppError(
            `Journal ${item.journalNumber}: debit total (${totalDebit}) must equal credit total (${totalCredit})`,
            400
          );
        }
        item.totalDebit = totalDebit;
        item.totalCredit = totalCredit;
      }

      /** ---- Save records ---- */
      const records = [];
      for (const item of transformedData) {
        const entries = item.entries.map((e: any) => ({
          account: accountMap.get(e.accountName?.toLowerCase()),
          debit: e.debit,
          credit: e.credit,
          description: e.description,
        }));
        const doc = new JournalEntry({
          journalNumber: item.journalNumber,
          journalDate: new Date(item.journalDate),
          postingDate: new Date(item.postingDate || item.journalDate),
          memo: item.memo,
          entries,
          totalDebit: item.totalDebit,
          totalCredit: item.totalCredit,
          companyId,
          createdBy: req.user?._id,
          updatedBy: req.user?._id,
          ownerAdminId: req.user?.ownerAdminId,
          manager: req.user?.manager,
        });
        await doc.save({ session });
        await ledgerAdapter.recordLedgerById({
          id: doc._id,
          session,
          type: TransactionType.JOURNAL,
          companyId: new Types.ObjectId(companyId),
        });
        records.push(doc);
      }

      await session.commitTransaction();
      res.status(201).json({ success: true, statusCode: 201, data: records });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      await session.endSession();
    }
  };
}

export const journalEntryController = new JournalEntryController();
