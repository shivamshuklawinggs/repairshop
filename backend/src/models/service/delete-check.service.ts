import mongoose, { ClientSession } from 'mongoose';
import { MODEL_REFERENCES, ModelName } from '../';
import { AppError } from 'middlewares/error';
import { ModalNamesFields } from 'models/shared/FIELD_LABELS';

export interface DeleteCheckResult {
  canDelete: boolean;
  referencedBy: {
    model: string;
    property: string;
    count: number;
    isArray?: boolean;
    isNested?: boolean;
    nestedPath?: string;
  }[];
  error?: string;
}

/**
 * Service to check if a document can be safely deleted based on references
 */
export class DeleteCheckService {
  /**
   * Check if a document can be deleted by verifying no other documents reference it
   * @param modelName - The model name to check
   * @param documentId - The document ID to check
   * @returns DeleteCheckResult with deletion status and reference details
   */
  static async canDeleteDocument(
    modelName: ModelName,
    documentId: mongoose.Types.ObjectId,
    session:ClientSession
  ): Promise<DeleteCheckResult> {
    try {
       const modelReferences = MODEL_REFERENCES[modelName as ModelName];
    
    if (!modelReferences) {
      return {
        canDelete: false,
        referencedBy: [],
        error: `Model ${modelName} not found in reference map`
      };
    }

    const referencedBy = modelReferences.referencedBy;
    const referencesFound: DeleteCheckResult['referencedBy'] = [];

    // Check each model that references this model
    for (const ref of referencedBy) {
      try {
        const referencingModel = mongoose.connection.models[ref.model];
        
        if (!referencingModel) {
          console.warn(`Model ${ref.model} not found in mongoose connection`);
          continue;
        }

        let count = 0;
        
        // Handle nested references differently
        if (ref.isNested && ref.nestedPath) {
          count = await this.checkNestedReferences(
            referencingModel, 
            ref.property, 
            ref.nestedPath, 
            documentId, 
            session
          );
        } else {
          // Build query to check for standard references
          const query = this.buildReferenceQuery(ref.property, documentId, ref.isArray);
          count = await referencingModel.countDocuments(query).session(session);
        }
       
        if (count > 0) {
          referencesFound.push({
            model: ModalNamesFields[ref.model],
            property: ref.property,
            count,
            isArray: ref.isArray,
            isNested: ref.isNested,
            nestedPath: ref.nestedPath
          });
        }

        
      } catch (error:any) {
        throw new AppError(
        "An unexpected error occurred while validating document dependencies. Please try again later.",
        500
      );

      }
    }

    const canDelete = referencesFound.length === 0;
    const referencedModels = referencesFound.map((item) => `${item.model} (${item.count} data in ${item.property})`).join(', ');
   if (!canDelete) {
      throw new AppError(
        `Deletion not permitted. The selected ${modelName} is currently referenced by: ${referencedModels}. 
        Please remove the dependent records before attempting to delete.`,
        400
      );
    }

    return {
      canDelete,
      referencedBy: referencesFound,
      error: canDelete ? undefined : `Cannot delete: document is referenced by ${referencesFound.length} model(s)`
    };
    } catch (error) {
       throw error
    }
  }

  /**
   * Check nested references in arrays using aggregation pipeline
   * @param referencingModel - The mongoose model that contains the nested reference
   * @param arrayProperty - The property name of the array (e.g., 'expense')
   * @param nestedPath - The path within array items to check (e.g., 'productservice')
   * @param documentId - The document ID to search for
   * @param session - MongoDB session
   * @returns Promise<number> - Count of documents that reference the target
   */
  private static async checkNestedReferences(
    referencingModel: any,
    arrayProperty: string,
    nestedPath: string,
    documentId: mongoose.Types.ObjectId,
    session: ClientSession
  ): Promise<number> {
    const pipeline = [
      {
        $match: {
          [arrayProperty]: {
            $exists: true,
            $ne: []
          }
        }
      },
      {
        $project: {
          _id: 1,
          matchingItems: {
            $filter: {
              input: `$${arrayProperty}`,
              as: 'item',
              cond: {
                $eq: [`$$item.${nestedPath}`, documentId]
              }
            }
          }
        }
      },
      {
        $match: {
          matchingItems: {
            $exists: true,
            $ne: []
          }
        }
      },
      {
        $count: 'total'
      }
    ];

    const result = await referencingModel.aggregate(pipeline).session(session);
    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Build a MongoDB query to check for references
   * @param property - The property name that references the document
   * @param documentId - The document ID to search for
   * @param isArray - Whether the property is an array
   * @returns MongoDB query object
   */
  private static buildReferenceQuery(
    property: string,
    documentId: mongoose.Types.ObjectId,
    isArray?: boolean
  ): any {
    if (isArray) {
      return { [property]: documentId };
    } else {
      return { [property]: documentId };
    }
  }

  /**
   * Get all documents that reference a specific document
   * @param modelName - The model name of the document being referenced
   * @param documentId - The document ID being referenced
   * @returns Promise<Record<string, any[]>> - Object with model names as keys and arrays of referencing documents as values
   */
  static async getReferencingDocuments(
    modelName: string,
    documentId: mongoose.Types.ObjectId,
  ): Promise<Record<string, any[]>> {
    const modelReferences = MODEL_REFERENCES[modelName as ModelName];
    const referencingDocuments: Record<string, any[]> = {};

    if (!modelReferences) {
      return referencingDocuments;
    }

    const referencedBy = modelReferences.referencedBy;

    for (const ref of referencedBy) {
      try {
        const referencingModel = mongoose.connection.models[ref.model];
        
        if (!referencingModel) {
          continue;
        }

        let documents: any[] = [];
        
        if (ref.isNested && ref.nestedPath) {
          // For nested references, use aggregation to find matching documents
          const pipeline = [
            {
              $match: {
                [ref.property]: {
                  $exists: true,
                  $ne: []
                }
              }
            },
            {
              $project: {
                _id: 1,
                matchingItems: {
                  $filter: {
                    input: `$${ref.property}`,
                    as: 'item',
                    cond: {
                      $eq: [`$$item.${ref.nestedPath}`, documentId]
                    }
                  }
                }
              }
            },
            {
              $match: {
                matchingItems: {
                  $exists: true,
                  $ne: []
                }
              }
            }
          ];
          
          documents = await referencingModel.aggregate(pipeline);
        } else {
          // For standard references
          const query = this.buildReferenceQuery(ref.property, documentId, ref.isArray);
          documents = await referencingModel.find(query).select('_id').lean();
        }
        
        if (documents.length > 0) {
          referencingDocuments[ref.model] = documents;
        }
      } catch (error) {
        console.error(`Error fetching referencing documents for ${ref.model}:`, error);
        throw new AppError(`Error fetching referencing documents for ${ref.model}:`,400)
      }
    }

    return referencingDocuments;
  }

  /**
   * Get summary of all references for a model (useful for admin/debugging)
   * @param modelName - The model name
   * @returns Promise<{ modelName: string; totalReferences: number; referenceDetails: any[] }>
   */
  static async getReferenceSummary(modelName: string): Promise<{
    modelName: string;
    totalReferences: number;
    referenceDetails: Array<{
      model: string;
      property: string;
      count: number;
      isArray?: boolean;
    }>;
  }> {
    const modelReferences = MODEL_REFERENCES[modelName as ModelName];
    
    if (!modelReferences) {
      return {
        modelName,
        totalReferences: 0,
        referenceDetails: []
      };
    }

    const referenceDetails: Array<{
      model: string;
      property: string;
      count: number;
      isArray?: boolean;
    }> = [];

    const referencedBy = modelReferences.referencedBy;

    for (const ref of referencedBy) {
      try {
        const referencingModel = mongoose.connection.models[ref.model];
        
        if (!referencingModel) {
          continue;
        }

        let count = 0;
        
        if (ref.isNested && ref.nestedPath) {
          // For nested references, use aggregation to count matching documents
          const pipeline = [
            {
              $match: {
                [ref.property]: {
                  $exists: true,
                  $ne: []
                }
              }
            },
            {
              $project: {
                _id: 1,
                matchingItems: {
                  $filter: {
                    input: `$${ref.property}`,
                    as: 'item',
                    cond: {
                      $eq: [`$$item.${ref.nestedPath}`, new mongoose.Types.ObjectId('000000000000000000000000')]
                    }
                  }
                }
              }
            },
            {
              $match: {
                matchingItems: {
                  $exists: true,
                  $ne: []
                }
              }
            },
            {
              $count: 'total'
            }
          ];
          
          const result = await referencingModel.aggregate(pipeline);
          count = result.length > 0 ? result[0].total : 0;
        } else {
          // For standard references
          const query = this.buildReferenceQuery(ref.property, new mongoose.Types.ObjectId('000000000000000000000000'), ref.isArray);
          count = await referencingModel.countDocuments(query);
        }

        referenceDetails.push({
          model: ref.model,
          property: ref.property,
          count,
          isArray: ref.isArray
        });
      } catch (error) {
        console.error(`Error counting references for ${ref.model}:`, error);
        throw new AppError(`Error counting references for ${ref.model}:`,400)
      }
    }

    const totalReferences = referenceDetails.reduce((sum, ref) => sum + ref.count, 0);

    return {
      modelName,
      totalReferences,
      referenceDetails
    };
  }
 
}

export default DeleteCheckService;
