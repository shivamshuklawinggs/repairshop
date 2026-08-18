// Swagger configuration

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { getRoutesFromRouter, generateSwaggerPaths } from './expressListRoutes';

const generateSwaggerSpec = async () => {

  const swaggerOptions = {
    persistAuthorization: true,
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'FreightBooks API Documentation',
        version: '1.0.0',
        description: 'API documentation for FreightBooks application',
        contact: {
          name: 'FreightBooks Support',
        },
      },
      components: {
        securitySchemes: {
          "Company Id": {
            type: 'apiKey',
            in: 'header',
            name: 'companyid',
            description: 'Company ID for multi-tenant support. Can be provided as "companyid" or "Companyid"',
          },
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: {
          // Common response schemas
          Error: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                example: false
              },
              message: {
                type: 'string'
              },
              error: {
                type: 'object'
              }
            }
          },
          Success: {
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
      },
      security: [
        {
          "Company Id": [],
           bearerAuth: []
        }
      ],
      paths: {},
    },
    apis: [
      path.join(process.cwd(), 'src', 'microservices/**/*.route.ts'),
      path.join(process.cwd(), 'microservices/**/*.route.js'),
    ],
  };

  const jsdocSpec: any = swaggerJsdoc(swaggerOptions);
  const routes = await getRoutesFromRouter();
  const generatedPaths = await generateSwaggerPaths(routes);

  return {
    ...jsdocSpec,
    paths: {
      ...jsdocSpec.paths || {},
      ...generatedPaths,
    },
  };
};

export default generateSwaggerSpec;