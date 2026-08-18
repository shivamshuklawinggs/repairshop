import { AppError } from "middlewares/error";
import { ModelName, getNestedReferencesToModel, buildNestedLookupQuery } from "models";
import DeleteCheckService from "models/service/delete-check.service";
import mongoose, { ClientSession } from "mongoose";

interface ProtectedFieldRule {
  field: string;           // e.g. "name", "masterType", "isSystem"
  values: (string | boolean | number)[];  // protected values for that field
  message?: string;        // custom error message for this rule
}

interface DeleteGuardOptions {
  modelName: ModelName;
  protectedFields?: ProtectedFieldRule[];
}

// Helper function to get nested property value using dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export function deleteGuardPlugin(
  schema: mongoose.Schema,
  options: DeleteGuardOptions
) {
  const {
    modelName,
    protectedFields = [],
  } = options;

  const hasProtection = protectedFields.length > 0;

  const runCheck = async function (this: mongoose.Query<any, any>) {
    const session: ClientSession | null =
      this.getOptions().session ?? null;

    const filter = this.getFilter();

    // Only fetch fields we actually need
    const projection: Record<string, 1> = { _id: 1 };
    if (hasProtection) {
      for (const rule of protectedFields) {
        projection[rule.field] = 1;
      }
    }

    const docs = await this.model
      .find(filter)
      .select(projection)
      .lean()
      .session(session);
    for (const doc of docs) {
      // 🔒 Block protected system records (check every rule)
      if (hasProtection) {
        for (const rule of protectedFields) {
          const docValue = getNestedValue(doc, rule.field);
          if (rule.values.includes(docValue)) {
            throw new AppError(
              rule.message || `${docValue} is protected and cannot be deleted`,
              400
            );
          }
        }
      }

      // ✅ Dependency / usage check
      await DeleteCheckService.canDeleteDocument(
        modelName,
        new mongoose.Types.ObjectId(doc._id as string),
        session as ClientSession
      );

      // 🔍 Check nested references in expense arrays
      const nestedRefs = getNestedReferencesToModel(modelName);
      if (nestedRefs.length > 0) {
        const docId = doc._id as string;
        
        for (const { fromModel, property, nestedPath } of nestedRefs) {
          const lookupQuery = buildNestedLookupQuery(docId, [{ fromModel, property, nestedPath }]);
          
          const checkResult = await mongoose.model(fromModel).aggregate([
            { $match: { _id: { $in: [docId] } } },
            ...lookupQuery,
            { $match: { [fromModel]: { $exists: true, $ne: [] } } },
            { $limit: 1 }
          ]).session(session);

          if (checkResult.length > 0) {
            throw new AppError(
              `Cannot delete: this document is referenced in ${property} array of ${fromModel}`,
              400
            );
          }
        }
      }
    }
  };

  ([
    "deleteOne",
    "deleteMany",
    "findOneAndDelete",
    "findByIdAndDelete",
  ] as const).forEach((method) => {
    schema.pre(method as any, runCheck);
  });
}
