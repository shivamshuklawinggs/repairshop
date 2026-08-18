import { generatePropertiesFromYup } from './expressListRoutes'; // Fixed import
import { paymentTermSchema } from 'microservices/payment-terms-services/payment-terms.validate';
import { TaxSchema } from 'microservices/tax-services/tax.validate';
import { AuthLoginSchema } from 'microservices/auth-service/user.validate';
import { CreateuserSchema, updateUserSchema } from '../microservices/user-service/user-service.validate';
const commonfieldsDisabled = ['createdAt', 'updatedAt','createdBy','updatedBy','userId','_id','files','deletedfiles'];
type FieldType = 'loadData' | 'ItemData' | 'TaxData' | 'PaymentTermData' | 'AuthLoginData' | 'CreateuserData' | 'UpdateuserData';

const DataTransform = (
    schema: any,
    isJson: boolean = false,
    field?: FieldType
  ): Record<string, any> => {
    const schemaProperties = generatePropertiesFromYup(schema, commonfieldsDisabled);
    const result: Record<string, any> = {};
  
    if (isJson && field === 'loadData') {
      // Place both JSON string and files as top-level fields
      result[field] = {
        type: 'string',
        description: 'Stringified JSON object (use JSON.stringify on the client)',
        example: JSON.stringify(schemaProperties, null, 2),
      };
      result['files'] = {
        type: 'string',
        format: 'binary',
        description: 'File to upload',
        example: 'file.pdf',
      };
      return result;
    }
  
    // For other cases
    if (field) {
      result[field] = field === 'loadData'
        ? {
            type: 'string',
            description: 'Stringified JSON object (use JSON.stringify on the client)',
            example: JSON.stringify(schemaProperties, null, 2),
          }
        : schemaProperties;
      return result;
    }
  
    // Default return (no field passed)
    return isJson
      ? {
          data: {
            type: 'string',
            description: 'Stringified JSON object (use JSON.stringify)',
            example: JSON.stringify(schemaProperties, null, 2),
          },
        }
      : schemaProperties;
  };
  
  
export const SchemaList = {

   
    "/api/loads/:id/status": {
        status: {
            type: 'string',
            enum: [ 'Pending', 'In Progress', 'Dispatched', 'Delivered', 'Cancelled', 'Picked Up',],
            description: 'Status of the load',
            example: 'In Progress'
        }
    },
    
    "/api/payment-terms": paymentTermSchema 
        ? DataTransform(paymentTermSchema) 
        : {},
    "/api/payment-terms/:id": paymentTermSchema 
        ? DataTransform(paymentTermSchema) 
        : {},
    "/api/tax-options": TaxSchema 
        ? DataTransform(TaxSchema) 
        : {},
    "/api/tax-options/:id": TaxSchema 
        ? DataTransform(TaxSchema) 
        : {},
    "/api/auth/login": TaxSchema 
        ? DataTransform(AuthLoginSchema) 
        : {},
    "/api/users": TaxSchema 
        ? DataTransform(CreateuserSchema) 
        : {},
    "/api/users/:id": TaxSchema 
        ? DataTransform(updateUserSchema) 
        : {},
        "/api/customers/import": {
            file:{
                type:'string',
                format:'binary',
                description:'File to upload',
                example:'file.csv'
            }
        }
        
   
}

