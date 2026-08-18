
import JournalEntry, { IJournalEntry } from 'models/journal-entry.model';
import { ClientSession, Types } from 'mongoose';
import { AppError } from 'middlewares/error';
import { Request } from 'express';
import fs from "fs"
import { peekNextUniqueId, PrefixType } from 'models/universalid.model';

class JournalEntryService {

  public async createJournalEntry(
  data: Partial<IJournalEntry>,
  session: ClientSession
): Promise<IJournalEntry> {
  /* 1️⃣ Create FIRST */
  const journalEntry = new JournalEntry(data)
  await journalEntry.save({ session })
  return journalEntry;
  }

  public async updateJournalEntry(
    id: string,
    data: Partial<IJournalEntry>,
    companyId: string,
    req: Request,
    session: ClientSession
  ): Promise<IJournalEntry> {
    /* 1️⃣ Update FIRST (inside transaction) */
    const updated = await JournalEntry.findOneAndUpdate(
      { _id: id, companyId },
      data,
      { new: true, session }
    ).populate("entries.account")

    if (!updated) {
      throw new AppError("Journal entry not found", 404);
    }
    /* 3️⃣ Handle attachment */
    if (req.file) {
      if (
        updated.attachments?.path &&
        fs.existsSync(updated.attachments.path)
      ) {
        fs.unlinkSync(updated.attachments.path);
      }
      updated.attachments = req.file;
    }

    /* 4️⃣ Save (still same session) */
    await updated.save({ session });

    return updated;
  }


  public async getJournalEntries(companyId: string,page:number,limit:number): Promise<{
    data:IJournalEntry[],
    total:number,
    totalPages:number
  }> {
    const total=await JournalEntry.countDocuments({ companyId })
    const totalPages=Math.ceil(total/limit)
    const result=await JournalEntry.find({ companyId }).populate('entries.account').populate('entries.nameId').sort({ journalDate: -1 }).skip((page - 1) * limit).limit(limit)
    return {
      data:result,
      total,
      totalPages
    }
  }

  public async getJournalEntryById(id: string): Promise<IJournalEntry | null> {
    return JournalEntry.findById(id);
  }
  public async deleteJournalEntry(id: string,session:ClientSession): Promise<IJournalEntry | null> {
   const data= await JournalEntry.findByIdAndDelete(id).session(session)
   if(data && data.attachments &&fs.existsSync(data.attachments.path)) {
    fs.unlinkSync(data.attachments.path);
   }
    return data
  }

  public async getNextJournalNumber(companyId: string): Promise<string> {
    const newEntry = await peekNextUniqueId({companyId:companyId as unknown as Types.ObjectId ,prefix:"JE-" as PrefixType})
      return newEntry
  }
}

export const journalEntryService = new JournalEntryService();
