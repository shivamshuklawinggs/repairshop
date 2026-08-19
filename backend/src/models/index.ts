
// TypeScript types for model reference system
export type ModelName =
  | 'companies'
  | 'User'
  | 'accountsinvoices'
  | 'vendorbills'
  | 'estimates'
  | 'Customer'
  | 'Carrier'
  | 'accountspayments'
  | 'PaymentTerms'
  | 'taxservices'
  | 'Note'
  | 'Notifications'
  | 'Report'
  | 'JournalEntry'
  | 'chartofaccounts'
  | 'accountdetailtypes'
  | 'Accounttypes'
  | 'productservices'
  | 'Plan'
  | 'ledgertransactions'
  | 'InvoiceReminderTemplate';

export interface ModelReference {
  model: ModelName;
  property: string;
  isArray?: boolean;
  isNested?: boolean;
  nestedPath?: string;
}

export interface ModelReferences {
  references: ModelReference[];
  referencedBy: ModelReference[];
}

export type ModelReferenceMap = Record<ModelName, ModelReferences>;

// Helper type for getting reference properties
export type ReferenceProperties<T extends ModelName> = ModelReferenceMap[T]['references'];
export type ReferencedByProperties<T extends ModelName> = ModelReferenceMap[T]['referencedBy'];

// Helper type for nested references
export type NestedReferenceProperties<T extends ModelName> = Extract<ModelReferenceMap[T]['references'][number], { isNested: true }>;
export type FlatReferenceProperties<T extends ModelName> = Extract<ModelReferenceMap[T]['references'][number], { isNested?: false }>;

// Type guard for model names
export function isValidModelName(model: string): model is ModelName {
  return [
    'Company', 'User', 'accountsinvoices', 'Bill', 'estimates', 'Customer',
    'Carrier', 'Driver', 'ContactPerson', 'ContactCarrier', 'Expense',
    'expensefees', 'Payment', 'PaymentTerms', 'taxservices', 'Note',
    'Notifications', 'Report', 'VendorRating', 'JournalEntry',
    'chartofaccounts', 'accountdetailtypes', 'Accounttypes',
    'productservices', 'accountstatements', 'Session', 'Counter', 'Plan'
  ].includes(model);
}

// Model reference map with specific properties
export const MODEL_REFERENCES: Omit<ModelReferenceMap, "accountstatements"> = {
  companies: {
    references: [],
    referencedBy: [
      { model: 'accountsinvoices', property: 'companyId' },
      { model: 'vendorbills', property: 'companyId' },
      { model: 'estimates', property: 'companyId' },
      { model: 'Carrier', property: 'companyId' },
      { model: 'Customer', property: 'companyId' },
      { model: 'PaymentTerms', property: 'companyId' },
      { model: 'taxservices', property: 'companyId' },
      { model: 'productservices', property: 'companyId' },
      { model: 'Notifications', property: 'companyId' },
      { model: 'JournalEntry', property: 'companyId' },
      { model: 'chartofaccounts', property: 'companyId' },
      { model: 'Report', property: 'companyId' },
    ]
  },
  User: {
    references: [
      { model: 'Plan', property: 'ActivePlan.PlanId' }
    ],
    referencedBy: [
      { model: 'accountsinvoices', property: 'createdBy' },
      { model: 'vendorbills', property: 'createdBy' },
      { model: 'estimates', property: 'createdBy' },
      { model: 'User', property: 'createdBy' },
      { model: 'User', property: 'manager' },
      { model: 'Carrier', property: 'createdBy' },
      { model: 'Customer', property: 'createdBy' },
      { model: 'PaymentTerms', property: 'createdBy' },
      { model: 'taxservices', property: 'createdBy' },
      { model: 'productservices', property: 'createdBy' },
      { model: 'Plan', property: 'createdBy' },
    ]
  },
  accountsinvoices: {
    references: [
      { model: 'Customer', property: 'customerId' },
      { model: 'PaymentTerms', property: 'terms' },
      { model: 'accountspayments', property: 'recievedPaymentAmount.recievedPaymentId', isArray: true },
      // Nested references in expense array
      { model: 'productservices', property: 'expense', isArray: true, isNested: true, nestedPath: 'productservice' },
      { model: 'taxservices', property: 'expense', isArray: true, isNested: true, nestedPath: 'tax' }
    ],
    referencedBy: [
      { model: 'accountspayments', property: 'invoiceIds', isArray: true },
    ]
  },
  vendorbills: {
    references: [
      { model: 'Carrier', property: 'vendorId' },
      { model: 'PaymentTerms', property: 'terms' },
      { model: 'accountspayments', property: 'recievedPaymentAmount.recievedPaymentId', isArray: true },
      // Nested references in expense array
      { model: 'productservices', property: 'expense', isArray: true, isNested: true, nestedPath: 'productservice' },
      { model: 'taxservices', property: 'expense', isArray: true, isNested: true, nestedPath: 'tax' }
    ],
    referencedBy: [
      { model: 'accountspayments', property: 'billids', isArray: true },
    ]
  },
  estimates: {
    references: [
      { model: 'Customer', property: 'customerId' },
      { model: 'PaymentTerms', property: 'terms' },
      { model: 'accountspayments', property: 'recievedPaymentAmount.recievedPaymentId', isArray: true },
      // Nested references in expense array
      { model: 'productservices', property: 'expense', isArray: true, isNested: true, nestedPath: 'productservice' },
      { model: 'taxservices', property: 'expense', isArray: true, isNested: true, nestedPath: 'tax' }
    ],
    referencedBy: []
  },
  Customer: {
    references: [
      { model: 'PaymentTerms', property: 'paymentTerms' },
      { model: 'Customer', property: 'parentCustomer' }
    ],
    referencedBy: [
      { model: 'accountsinvoices', property: 'customerId' },
      { model: 'vendorbills', property: 'vendorId' },
      { model: 'estimates', property: 'customerId' },
      { model: 'Report', property: 'customerId' },
    ]
  },
  Carrier: {
    references: [
      { model: 'Carrier', property: 'parentCustomer' },
      { model: 'PaymentTerms', property: 'paymentTerms' }
    ],
    referencedBy: [
      { model: 'vendorbills', property: 'vendorId' },
    ]
  },
  accountspayments: {
    references: [
      { model: 'Customer', property: 'customerId' },
      { model: 'accountsinvoices', property: 'invoiceIds', isArray: true },
      { model: 'vendorbills', property: 'billids', isArray: true },
      { model: 'User', property: 'createdBy' },
      { model: 'chartofaccounts', property: 'depositTo' }
    ],
    referencedBy: [
      { model: 'accountsinvoices', property: 'recievedPaymentAmount.recievedPaymentId', isArray: true },
      { model: 'vendorbills', property: 'recievedPaymentAmount.recievedPaymentId', isArray: true },
      { model: 'estimates', property: 'recievedPaymentAmount.recievedPaymentId', isArray: true }
    ]
  },
  PaymentTerms: {
    references: [
      { model: 'User', property: 'createdBy' },
    ],
    referencedBy: [
      { model: 'Customer', property: 'paymentTerms' },
      { model: 'Carrier', property: 'paymentTerms' },
      { model: 'accountsinvoices', property: 'terms' },
      { model: 'vendorbills', property: 'terms' },
      { model: 'estimates', property: 'terms' }
    ]
  },
  taxservices: {
    references: [
      { model: 'chartofaccounts', property: 'ChartOfAccountId' }
    ],
    referencedBy: [
      // Nested references from expense arrays
      { model: 'accountsinvoices', property: 'expense', isArray: true, isNested: true, nestedPath: 'tax' },
      { model: 'vendorbills', property: 'expense', isArray: true, isNested: true, nestedPath: 'tax' },
      { model: 'estimates', property: 'expense', isArray: true, isNested: true, nestedPath: 'tax' }
    ]
  },
  Note: {
    references: [],
    referencedBy: []
  },
  Notifications: {
    references: [],
    referencedBy:[]
  },
  Report: {
    references: [],
    referencedBy:[]
  },
  JournalEntry: {
    references: [
      { model: 'chartofaccounts', property: 'entries.account', isArray: true },
      { model: 'Customer', property: 'entries.nameId', isArray: true },
      { model: 'Carrier', property: 'entries.nameId', isArray: true }
    ],
    referencedBy: []
  },
  chartofaccounts: {
    references: [
      { model: 'User', property: 'createdBy' },
      { model: 'chartofaccounts', property: 'AccountId' }
    ],
    referencedBy: [
      { model: 'taxservices', property: 'ChartOfAccountId' },
      { model: 'productservices', property: 'incomeAccount' },
      { model: 'productservices', property: 'expenseAccount' },
      { model: 'productservices', property: 'inventoryAccount' },
      { model: 'JournalEntry', property: 'entries.account', isArray: true },
      { model: 'accountspayments', property: 'depositTo' },
      { model: 'ledgertransactions', property: 'accountId' }
    ]
  },
  accountdetailtypes: {
    references: [
      { model: 'Accounttypes', property: 'typeId' }
    ],
    referencedBy: [
      { model: 'chartofaccounts', property: 'detailType' }
    ]
  },
  Accounttypes: {
    references: [],
    referencedBy: [
      { model: 'accountdetailtypes', property: 'typeId' },
      { model: 'chartofaccounts', property: 'accountType' }
    ]
  },
  productservices: {
    references: [
      { model: 'chartofaccounts', property: 'incomeAccount' },
      { model: 'chartofaccounts', property: 'expenseAccount' },
      { model: 'chartofaccounts', property: 'inventoryAccount' }
    ],
    referencedBy: [
      // Nested references from expense arrays
      { model: 'accountsinvoices', property: 'expense', isArray: true, isNested: true, nestedPath: 'productservice' },
      { model: 'vendorbills', property: 'expense', isArray: true, isNested: true, nestedPath: 'productservice' },
      { model: 'estimates', property: 'expense', isArray: true, isNested: true, nestedPath: 'productservice' }
    ]
  },
  Plan: {
    references: [
      { model: 'User', property: 'createdBy' },
    ],
    referencedBy: [
      { model: 'User', property: 'ActivePlan.PlanId' }
    ]
  },
  ledgertransactions: {
    references: [
      { model: 'chartofaccounts', property: 'accountId' },
    ],
    referencedBy: []
  },
  InvoiceReminderTemplate: {
    references: [],
    referencedBy: []
  }
};

// Helper function to check if a model references another model
export function hasReference(model: ModelName, targetModel: ModelName): boolean {
  return MODEL_REFERENCES[model]?.references.some(ref => ref.model === targetModel) || false;
}

// Helper function to get all models that reference a specific model
export function getReferencingModels(targetModel: ModelName): ModelName[] {
  const result: ModelName[] = [];
  for (const [model, refs] of Object.entries(MODEL_REFERENCES)) {
    if (refs.referencedBy.some((ref: ModelReference) => ref.model === targetModel)) {
      result.push(model as ModelName);
    }
  }
  return result;
}

// Helper function to get all models that a specific model references
export function getReferencedModels(model: ModelName): ModelName[] {
  return MODEL_REFERENCES[model]?.references.map((ref: ModelReference) => ref.model) || [];
}

// Helper function to get reference properties between two models
export function getReferenceProperties(fromModel: ModelName, toModel: ModelName): { property: string; isArray?: boolean }[] {
  const refs = MODEL_REFERENCES[fromModel]?.references.filter((ref: ModelReference) => ref.model === toModel) || [];
  return refs.map((ref: ModelReference) => ({ property: ref.property, isArray: ref.isArray }));
}

// Helper function to get back-reference properties between two models
export function getBackReferenceProperties(fromModel: ModelName, toModel: ModelName): { property: string; isArray?: boolean }[] {
  const refs = MODEL_REFERENCES[toModel]?.referencedBy.filter((ref: ModelReference) => ref.model === fromModel) || [];
  return refs.map((ref: ModelReference) => ({ property: ref.property, isArray: ref.isArray }));
}

// Helper function to get nested reference properties
export function getNestedReferenceProperties(model: ModelName): { property: string; nestedPath: string; isArray: boolean }[] {
  const nestedRefs = MODEL_REFERENCES[model]?.references.filter((ref: ModelReference) => ref.isNested) || [];
  return nestedRefs.map((ref: ModelReference) => ({
    property: ref.property,
    nestedPath: ref.nestedPath!,
    isArray: ref.isArray || false
  }));
}

// Helper function to check if a model has nested references
export function hasNestedReferences(model: ModelName): boolean {
  return MODEL_REFERENCES[model]?.references.some((ref: ModelReference) => ref.isNested) || false;
}

// Helper function to get all nested references for a specific target model
export function getNestedReferencesToModel(targetModel: ModelName): { fromModel: ModelName; property: string; nestedPath: string }[] {
  const result: { fromModel: ModelName; property: string; nestedPath: string }[] = [];

  for (const [model, refs] of Object.entries(MODEL_REFERENCES)) {
    const nestedRefs = refs.references.filter((ref: ModelReference) =>
      ref.isNested && ref.model === targetModel && ref.nestedPath
    );

    for (const nestedRef of nestedRefs) {
      result.push({
        fromModel: model as ModelName,
        property: nestedRef.property,
        nestedPath: nestedRef.nestedPath!
      });
    }
  }

  return result;
}

// Helper function to build nested lookup query for deletion protection
export function buildNestedLookupQuery(targetModelId: string, nestedRefs: { fromModel: ModelName; property: string; nestedPath: string }[]): any[] {
  return nestedRefs.map(({ fromModel, property, nestedPath }) => ({
    $lookup: {
      from: fromModel,
      let: { targetId: targetModelId },
      pipeline: [
        {
          $match: {
            $expr: {
              $in: [
                targetModelId,
                {
                  $map: {
                    input: `$${property}`,
                    as: 'item',
                    in: `$$item.${nestedPath}`
                  }
                }
              ]
            }
          }
        }
      ],
      as: fromModel
    }
  }));
}
