export const CUSTOM_FIELD_SCHEMAS = [
  'Invoice',
  'Bill',
  'Customer',
  'Carrier',
  'Payment',
  'ProductService',
] as const;

// ─── Schema type — string from backend ───────────────────────────────────────
export type CustomFieldSchema = typeof CUSTOM_FIELD_SCHEMAS[number];
// ─── Schema option returned by GET /custom-fields/schemas ────────────────────
export interface ISchemaOption {
  key:   CustomFieldSchema;
  label: string;
}

export type CustomFieldType =
  | 'text' | 'textarea' | 'number' | 'email' | 'phone'
  | 'date' | 'boolean' | 'select' | 'currency';

// ─── One pre-approved field from definitions.ts ─────────────────────────────
export interface IFieldDefinition {
 key:         string;          // must match a key in definitions/<schemaName>.json
  label:       string;          // admin can override the default label
  type:        CustomFieldType;
  section:     string;
  placeholder: string;
  required:    boolean;
  readonly:    boolean;
  hidden:      boolean;
  order:       number;
  width:       3 | 4 | 6 | 8 | 12;
  options?:    string[];        // for select type
  formVisible:   boolean;
  tableVisible:  boolean;
  detailVisible: boolean
  immutable:boolean
}

