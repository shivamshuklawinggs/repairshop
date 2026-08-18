import { AppError } from "middlewares/error";
import mongoose from "mongoose";

interface ReservedNameOptions {
  field?: string;                        // field to check, defaults to "name"
  reservedNames: (string | RegExp)[];    // exact strings or patterns to block
  message?: string;                      // override error message
}

function isReserved(value: any, reservedNames: (string | RegExp)[]): boolean {
  if (typeof value !== "string") return false;
  return reservedNames.some((entry) =>
    entry instanceof RegExp
      ? entry.test(value)
      : entry.toLowerCase() === value.toLowerCase()
  );
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export function reservedNamePlugin(
  schema: mongoose.Schema,
  options: ReservedNameOptions
) {
  const {
    field = "name",
    reservedNames,
    message,
  } = options;

  // ── CREATE / SAVE ──────────────────────────────────────────────────────────
  schema.pre("save", function (this: mongoose.Document, next) {
    const value = getNestedValue(this, field);
    if (isReserved(value, reservedNames)) {
      return next(
        new AppError(
          message || `"${value}" is a reserved name and cannot be used`,
          400
        )
      );
    }
    next();
  });

  // ── insertMany ─────────────────────────────────────────────────────────────
  schema.pre("insertMany", function (_next, docs: any[]) {
    for (const doc of docs ?? []) {
      const value = getNestedValue(doc, field);
      if (isReserved(value, reservedNames)) {
        throw new AppError(
          message || `"${value}" is a reserved name and cannot be used`,
          400
        );
      }
    }
    _next();
  });

  // ── UPDATE operations ──────────────────────────────────────────────────────
  const updateMethods = [
    "updateOne",
    "updateMany",
    "findOneAndUpdate",
    "findByIdAndUpdate",
  ] as const;

  updateMethods.forEach((method) => {
    schema.pre(method as any, function (this: mongoose.Query<any, any>, next) {
      const update: any = this.getUpdate();
      if (!update) return next();

      // Handle both { name: "x" } and { $set: { name: "x" } }
      const direct = getNestedValue(update, field);
      const viaSet = getNestedValue(update.$set || {}, field);
      const value = direct ?? viaSet;

      if (value !== undefined && isReserved(value, reservedNames)) {
        return next(
          new AppError(
            message || `"${value}" is a reserved name and cannot be used`,
            400
          )
        );
      }
      next();
    });
  });
}
