import  { Model, SchemaType } from "mongoose";

// ======================================================
// DISABLE IMMUTABLE FIELDS TEMPORARILY
// ======================================================

type ImmutableFieldMap = Record<string, boolean | undefined>;

export const disableImmutableFields = (
  model: Model<any>
): {
  restore: () => void;
  disabledFields: string[];
} => {
  const originalImmutableMap: ImmutableFieldMap = {};
  const disabledFields: string[] = [];

  model.schema.eachPath((pathname: string, schemaType: SchemaType) => {
    const currentImmutable = (schemaType.options as any)?.immutable;

    if (currentImmutable) {
      originalImmutableMap[pathname] = currentImmutable;

      // Disable immutable
      (schemaType.options as any).immutable = false;

      disabledFields.push(pathname);
    }
  });

  // Restore function
  const restore = () => {
    model.schema.eachPath((pathname: string, schemaType: SchemaType) => {
      if (pathname in originalImmutableMap) {
        (schemaType.options as any).immutable =
          originalImmutableMap[pathname];
      }
    });
  };

  return {
    restore,
    disabledFields,
  };
};