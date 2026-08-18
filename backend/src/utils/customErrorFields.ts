import { Request, Response, NextFunction } from 'express';

// Interface for custom error field configuration
export interface CustomErrorField {
  field: string;
  message: string;
  condition?: (req: Request) => boolean;
  modelName?: string;
  renameKey?: string;
}

// Utility to generate custom error fields
export const generateCustomErrorFields = (
  req: Request, 
  customFields: CustomErrorField[]
): Record<string, string> => {
  const errors: Record<string, string> = {};

  customFields.forEach(({ 
    field, 
    message, 
    condition, 
    modelName, 
    renameKey 
  }: CustomErrorField) => {
    // If no condition is specified, or the condition is met
    if (!condition || condition(req)) {
      // Determine the key to use
      const errorKey = renameKey || 
        (modelName ? `${modelName}.${field}` : field);
      
      errors[errorKey] = message;
    }
  });

  return errors;
};

// Create a builder for custom error fields to provide a more flexible API
export class CustomErrorFieldBuilder {
  private fields: CustomErrorField[] = [];

  // Add a new error field
  addField(field: string, message: string): this {
    this.fields.push({ field, message });
    return this;
  }

  // Add a conditional error field
  addConditionalField(
    field: string, 
    message: string, 
    condition: (req: Request) => boolean
  ): this {
    this.fields.push({ field, message, condition });
    return this;
  }

  // Add a model-specific error field
  addModelField(
    modelName: string, 
    field: string, 
    message: string
  ): this {
    this.fields.push({ field, message, modelName });
    return this;
  }

  // Add a field with a renamed key
  addRenamedField(
    originalField: string, 
    message: string, 
    newKey: string
  ): this {
    this.fields.push({ 
      field: originalField, 
      message, 
      renameKey: newKey 
    });
    return this;
  }

  // Add a model-specific field with a renamed key
  addModelRenamedField(
    modelName: string,
    originalField: string, 
    message: string, 
    newKey: string
  ): this {
    this.fields.push({ 
      field: originalField, 
      message, 
      modelName,
      renameKey: newKey 
    });
    return this;
  }

  // Build and return the custom error fields
  build(): CustomErrorField[] {
    return this.fields;
  }
}

// Middleware creator for custom error fields
export const createCustomErrorFieldsMiddleware = (customFields: CustomErrorField[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as any).customErrorFields = generateCustomErrorFields(req, customFields);
    next();
  };
};
