import  mongoose , { ClientSession, Query } from "mongoose";
// const getContext = function (ctx: any) {
//   // 1. If subdocument → get parent
//   if (ctx?.ownerDocument) {
//     const parent = ctx.ownerDocument();
//     if (parent) return parent;
//   }

//   // 2. If query context
//   if (ctx?.getQuery) {
//     return ctx.getQuery();
//   }

//   // 3. fallback
//   return ctx;
// };
export const existsValidator = (
  _buildQuery: (ctx: any, value: any) => Record<string, any>,
  _modelName: | "chartofaccounts" | "Customer" | "Carrier" | "productservices" | "expensefees" | "Load" | "Driver" | "PaymentTerms" | "accountspayments"| "taxservices"
) => {
  return async function (this: any, value: any): Promise<boolean> {
    try {
      // ✅ Skip invalid ObjectId
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return true;
      }
      return true
      // const rawCtx = this;
      // const ctx = getContext(rawCtx);
      // const Model = mongoose.model(modelName);
      // const matchQuery: Record<string, any> = buildQuery(ctx, value);
      // // Get session from document context if available
      // const session = ctx?.$session?.() || ctx?.$session || undefined;
      // // Use session if available to see uncommitted documents in transaction
      // const exists = session 
      //   ? await Model.exists(matchQuery).session(session)
      //   : await Model.exists(matchQuery);

      // return !!exists;
    } catch {
      console.log("error in ctx validator")
      return false;
    }
  };
};

export async function executeWithSession<T>(
  query: Query<T, any>,
  session?: ClientSession | null
): Promise<T> {
  if (session) {
    query.session(session);
  }

  return query;
}