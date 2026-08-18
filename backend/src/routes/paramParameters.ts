// Define a validation rules interface
export interface ParamValidationRule {
  type?: 'string' | 'integer' | 'number' | 'boolean';
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  description?: string;
  example?: any;
}

// Define a validation map type
type ParamValidationMap = {
  [path: string]: {
    [paramName: string]: ParamValidationRule;
  };
};

// Example validation rules for different routes
const isValidObjectId='^[a-f\\d]{24}$'
export const ParamValidationRules: ParamValidationMap = {
  '/api/loads/:id': {
    userId: {
      type: 'string',
      pattern:isValidObjectId ,
      description: 'ObjectID',
      example: '507f1f77bcf86cd799439011'
    }
  },
  // Add more route-specific parameter validations here
};

