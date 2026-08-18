import * as yup from 'yup';

import { SchemaList } from './SchemaList';
import { ParamValidationRules } from './paramParameters';
import { FormDataPaths } from './FormDatapaths';

/** Clean regex artifacts from Express route paths */
function cleanExpressPath(path: string): string {
  // Handle the special case of root router paths that contain regex
  if (path.includes('?(?=/|$)')) {
    path = path.split('?(?=/|$)')[0];
  }
  
  return path
    // Remove regex escaping from slashes
    .replace(/\\\//g, '/')
    // Remove any regex patterns
    .replace(/\(\?=[^)]+\)/g, '')
    // Remove start/end markers
    .replace(/^\^|\$$/g, '')
    // Clean up any double slashes
    .replace(/\/+/g, '/')
    // Remove trailing slash
    .replace(/\/$/, '')
    // Handle empty paths
    .replace(/^$/, '/');
}

/** Dynamically import rootRouter and extract routes */
async function getRoutesFromRouter(): Promise<{ path: string; methods: string[] }[]> {
  console.log('🔍 Starting route extraction...');
  try {
    const { default: rootRouter } = await import('routes'); // adjust path as needed
    console.log('✅ Root router imported successfully');

    const routes: { path: string; methods: string[] }[] = [];

    if (!rootRouter || !('stack' in rootRouter)) {
      console.error('❌ rootRouter is not valid or does not contain stack');
      return [];
    }
    
    console.log(`📚 Found ${rootRouter.stack.length} routes in root router stack`);

  rootRouter.stack.forEach((layer: any) => {
    if (layer.route) {
      const path = cleanExpressPath(layer.route.path);
      const methods = Object.keys(layer.route.methods)
        .filter((method) => layer.route.methods[method])
        .map((method) => method.toUpperCase());

      routes.push({ path, methods });
    } else if (layer.name === 'router' && layer.handle.stack) {
      // Extract the base path from the regexp source
      let basePath = '';
      if (layer.regexp && layer.regexp.source) {
        basePath = layer.regexp.source
          .replace(/\^/, '')
          .replace(/\\/, '')
          .replace(/\?(?:\(\?=\\\/\|\$\))?/, '')
          .replace(/\$/, '');
      }
      
      layer.handle.stack.forEach((nestedLayer: any) => {
        if (nestedLayer.route) {
          const routePath = nestedLayer.route.path || '';
          // Combine paths and clean
          const fullPath = cleanExpressPath(basePath + routePath);
          
          const methods = Object.keys(nestedLayer.route.methods)
            .filter((method) => nestedLayer.route.methods[method])
            .map((method) => method.toUpperCase())
          routes.push({ path: fullPath, methods });
        }
      });
    }
  });

  return routes;
}catch (error) {
    console.error('❌ Error extracting routes from rootRouter:', error);
    return [];
  }
}
 
/** Generate parameter documentation for path parameters */
/** Generate parameter documentation with validation rules */
function generatePathParameters(path: string): any[] {
  try {
    const params = [];
    const seenParams = new Set<string>();
    const paramRegex = /:([^/]+)/g;
    let match;
    
    // Get validation rules for this specific path
    const pathRules = ParamValidationRules[path] || {};

    while ((match = paramRegex.exec(path)) !== null) {
      const paramName = match[1].trim();
      
      // Validate parameter name format
      if (!/^[a-z_][a-z0-9_]*$/i.test(paramName)) {
        console.error(`Invalid parameter name '${paramName}' in path '${path}'. `
          + "Must start with letter/underscore and contain only alphanumeric characters/underscores.");
        continue;
      }

      // Check for duplicates
      if (seenParams.has(paramName)) {
        console.error(`Duplicate parameter '${paramName}' in path '${path}'. Parameters must be unique.`);
        continue;
      }
      seenParams.add(paramName);

      // Create base parameter definition
      const paramDefinition: any = {
        name: paramName,
        in: "path",
        required: true,
        schema: { type: "string" },
        description: `Path parameter: ${paramName}`
      };

      // Apply validation rules if they exist
      if (pathRules[paramName]) {
        const rules = pathRules[paramName];
        
        // Update schema with validation rules
        paramDefinition.schema = { ...paramDefinition.schema, ...rules };
        
        // Keep explicitly defined description or fallback
        if (rules.description) {
          paramDefinition.description = rules.description;
        }
        
        // Set example if provided
        if (rules.example) {
          paramDefinition.schema.example = rules.example;
        }
      } else {
        // Smart type inference for common patterns
        if (/(id|num|count)$/i.test(paramName)) {
          paramDefinition.schema.type = "integer";
          paramDefinition.schema.example = 12345;
        } else if (/(uuid|guid)$/i.test(paramName)) {
          paramDefinition.schema.format = "uuid";
          paramDefinition.schema.example = "550e8400-e29b-41d4-a716-446655440000";
        } else {
          paramDefinition.schema.example = "example-value";
        }
      }

      params.push(paramDefinition);
    }

    return params;
  } catch (error) {
    console.error('Error generating path parameters:', error);
    return [];
  }
}

/** Generate common request body schemas based on route and method */
async function generateRequestBody(path: string, method: string): Promise<any> {
  if (method === 'post' || method === 'put') {
    // const resource = path.split('/')[2];
    let contentType="application/json";
   if(FormDataPaths.includes(path)) contentType="multipart/form-data";

    // Try to get validation schema
  
    
    return {
      required: true,
      content: {
        [contentType]: {
          schema: {
            type: 'object',
            properties: generateCommonProperties(path)
          }
        }
      }
    };
  }
  return null;
}


// First, let's define an extended type for the Yup schema description
type ExtendedSchemaDescription = yup.SchemaFieldDescription & {
  oneOf?: any[];
  // Add other properties that might be missing from the default type
};

 function  generatePropertiesFromYup  (
  schema: yup.AnySchema, // input is yup.AnySchema
  disabledFields: string[] = []
): Record<string, any> {
  if (!schema || typeof schema.describe !== 'function') {
    console.warn('Invalid Yup schema provided');
    return {};
  }

  try {
    const properties: Record<string, any> = {};

    if (schema instanceof yup.ObjectSchema) {
      const fields = (schema as yup.ObjectSchema<any, any>).fields;

      for (const [key, fieldSchema] of Object.entries(fields)) {
        if (disabledFields.includes(key)) continue;
        
        const fieldDesc = fieldSchema.describe()as ExtendedSchemaDescription;
        const propSchema: any = {
          type: fieldDesc.type,
        };

        // Handle oneOf validation (enums)
        if (fieldDesc.oneOf && fieldDesc.oneOf.length > 0) {
          propSchema.enum = fieldDesc.oneOf;
          // If it's a string type with oneOf, set the type explicitly
          if (fieldDesc.type === 'string') {
            propSchema.type = 'string';
          } else if (fieldDesc.type === 'number') {
            propSchema.type = 'number';
          }
        }

        // Handle date format
        if (fieldDesc.type === 'date') {
          propSchema.format = 'date-time';
        }

        // Handle arrays
        if (fieldDesc.type === 'array') {
          const arraySchema = fieldSchema as yup.ArraySchema<any, any, any, any>;
          const innerType = arraySchema.innerType as yup.AnySchema;

          if (innerType) {
            const innerDesc = innerType.describe();
            
            // Handle oneOf in array items
            if (innerDesc.oneOf && innerDesc.oneOf.length > 0) {
              propSchema.items = {
                type: innerDesc.type,
                enum: innerDesc.oneOf
              };
            } else if (innerDesc.type === 'object') {
              propSchema.items = {
                type: 'object',
                properties: generatePropertiesFromYup(innerType, disabledFields),
              };
            } else if (innerDesc.type === 'array') {
              propSchema.items = {
                type: 'array',
                items: generatePropertiesFromYup(innerType, disabledFields),
              };
            } else {
              propSchema.items = generatePropertiesFromYup(innerType, disabledFields);
            }
          }
        }

        // Handle nested objects
        if (fieldDesc.type === 'object') {
          propSchema.type = 'object';
          propSchema.properties = generatePropertiesFromYup(
            fieldSchema as yup.ObjectSchema<any, any>,
            disabledFields
          );
        }

        properties[key] = propSchema;
      }
    }

    return properties;
  } catch (error) {
    console.error('Error generating properties from Yup schema:', error);
    return {};
  }
};



/** Generate common properties based on resource type */
function generateCommonProperties(resource: string,): Record<string, any> {

  const commonProps: Record<string, any> = {
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    _id: { type: 'string' }
  };

  try {
  
    return  (SchemaList as any)[resource]  || {}
}catch (error) {
    console.error('Error generating common properties for resource:', resource, error);
    return commonProps;
  }
}

/** Generate Swagger-compatible paths object from routes */
async function generateSwaggerPaths(
  routes: { path: string; methods: string[] }[]
): Promise<Record<string, any>> {
  const paths: Record<string, any> = {};

  // Process all routes in parallel
  await Promise.all(routes.map(async ({ path, methods }) => {
    // Convert Express path params (:id) to Swagger format ({id})
    const swaggerPath = path.replace(/:([^/]+)/g, '{$1}');
    
    if (!paths[swaggerPath]) {
      paths[swaggerPath] = {};
    }

    // Process all methods in parallel
    await Promise.all(methods.map(async (method) => {
      const lowerMethod = method.toLowerCase();
      const pathParams = generatePathParameters(path);
      const requestBody = (method === 'POST' || method === 'PUT')
        ? await generateRequestBody(path, lowerMethod)
        : null;
      
      const operation: any = {
        summary: `${method} ${path}`,
        tags: [path.split('/')[2] || 'default'],
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    data: {
                      type: 'object'
                    },
                    message: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad Request',
          },
          401: {
            description: 'Unauthorized',
          },
          500: {
            description: 'Internal Server Error',
          }
        }
      };

      // Add parameters if they exist
      if (pathParams.length > 0) {
        operation.parameters = pathParams;
      }

      // Add request body if it exists
      if (requestBody) {
        operation.requestBody = requestBody;
      }
      paths[swaggerPath][lowerMethod] = operation;
    }))
  }));

  return paths;
}



export {generateSwaggerPaths,getRoutesFromRouter,generatePropertiesFromYup,generateCommonProperties,generateRequestBody,cleanExpressPath,generatePathParameters};

export default generatePropertiesFromYup