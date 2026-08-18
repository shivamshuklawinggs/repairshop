// utils/batchFetcher.ts
import { PipelineStage, Model } from "mongoose";

interface BatchFetchOptions {
  model: Model<any>;
  match: Record<string, any>;
  pipeline?: PipelineStage[];
  batchSize?: number;
  total?: number;
  sort?: Record<string, 1 | -1>;
}

export async function fetchAllInBatches<T>({
  model,
  match,
  total=0,
  pipeline = [],
  batchSize = 1000,
  sort = { createdAt: -1 }
}: BatchFetchOptions): Promise<T[]> {
  let results: T[] = [];
  let processed = 0;

  const totalCount =total || await model.countDocuments(match).populate('')

  while (processed < totalCount) {
    const docs = await model.aggregate<T>([
      { $match: match },
      ...pipeline,
      { $sort: sort },
      { $skip: processed },
      { $limit: batchSize }
    ]);

    results.push(...docs);
    processed += docs.length;

    if (docs.length === 0) break; // safety stop
  }

  return results;
}

