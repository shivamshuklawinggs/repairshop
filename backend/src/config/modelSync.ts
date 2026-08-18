import mongoose from "mongoose";

export const syncAllModelIndexes = async (): Promise<void> => {
  const modelNames = mongoose.modelNames();

  console.log(`🔧 Syncing indexes for ${modelNames.length} models`);

  const failed: string[] = [];

  for (const name of modelNames) {
    const model = mongoose.model(name);

    try {
      console.log(`\n📌 Processing ${name}`);

      // Check collection exists
      const exists = await model.db.db
        .listCollections({ name: model.collection.name })
        .toArray();

      if (!exists.length) {
        console.log(`⚠️ Collection ${model.collection.name} does not exist`);
        continue;
      }

      // Get existing indexes
      const indexes = await model.collection.indexes();

      // Drop everything except _id
      for (const index of indexes) {
        if (index.name !== "_id_") {
          console.log(`🗑️ Dropping ${name}.${index.name}`);
          await model.collection.dropIndex(index.name);
        }
      }

      // Recreate indexes from schema
      const result = await model.syncIndexes();

      console.log(`✅ ${name} synced`);
      console.log(result);
    } catch (error) {
      console.error(`❌ ${name} failed`, error);
      failed.push(name);
    }
  }

  if (failed.length) {
    throw new Error(
      `Failed to sync indexes for: ${failed.join(", ")}`
    );
  }

  console.log("🎉 All indexes synced successfully");
};