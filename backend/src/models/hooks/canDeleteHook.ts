import DeleteCheckService from "models/service/delete-check.service";
import mongoose from "mongoose";

export async function canDeleteHook(this: mongoose.Query<any, any>) {
  const session: mongoose.ClientSession | null = this.getOptions().session || null;

  const doc = await this.model.findOne(this.getQuery()).session(session);
  if (!doc) return;

  await DeleteCheckService.canDeleteDocument(
    "companies",
    doc._id,
    session as mongoose.ClientSession
  );
}


export async function canDeleteManyHook(this: mongoose.Query<any, any>) {
  const session: mongoose.ClientSession | null = this.getOptions().session || null;

  // Get delete filter
  const filter = this.getFilter();

  // Fetch all documents that are about to be deleted
  const docs = await this.model.find(filter).session(session);

  for (const doc of docs) {
    await DeleteCheckService.canDeleteDocument(
      "companies",
      doc._id,
      session as mongoose.ClientSession
    );
  }
}
