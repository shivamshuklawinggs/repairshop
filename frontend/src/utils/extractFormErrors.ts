import { FieldErrors } from 'react-hook-form';

/**
 * Utility function to extract all validation errors from react-hook-form/Yup
 * Handles nested objects, arrays, and complex error structures
 */
export interface ExtractedError {
  field: string;
  message: string;
}

export const extractFormErrors = (
  errors: FieldErrors | any,
  excludedFields: string[] = [],
  parentKey: string = ''
): ExtractedError[] => {
  if (!errors || typeof errors !== 'object') {
    return [];
  }

  const extractedErrors: ExtractedError[] = [];

  Object.entries(errors).forEach(([key, value]: [string, any]) => {
    // Skip excluded fields
    if (excludedFields.includes(key)) {
      return;
    }

    const fieldPath = parentKey ? `${parentKey}.${key}` : key;

    // Handle array of errors (e.g., items[0].name)
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item && typeof item === 'object') {
          // Recursively extract nested errors in array items
          const nestedErrors = extractFormErrors(item, excludedFields, `${fieldPath}[${index}]`);
          extractedErrors.push(...nestedErrors);
        } else if (typeof item === 'string') {
          extractedErrors.push({
            field: `${fieldPath}[${index}]`,
            message: item
          });
        }
      });
    }
    // Handle nested object errors
    else if (value && typeof value === 'object' && !value.message && !value.type) {
      // Recursively extract nested errors
      const nestedErrors = extractFormErrors(value, excludedFields, fieldPath);
      extractedErrors.push(...nestedErrors);
    }
    // Handle direct error message
    else if (value?.message) {
      extractedErrors.push({
        field: fieldPath,
        message: value.message
      });
    }
    // Handle string error
    else if (typeof value === 'string') {
      extractedErrors.push({
        field: fieldPath,
        message: value
      });
    }
  });

  return extractedErrors;
};

/**
 * Format field name for display (convert camelCase to Title Case)
 */
export const formatFieldName = (fieldName: string): string => {
  return fieldName
    // Handle array indices: items[0].name -> items name (remove index numbers)
    .replace(/\[(\d+)\]/g, '')
    // Split camelCase: itemName -> item Name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Capitalize first letter of each word
    .split(/[._\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
