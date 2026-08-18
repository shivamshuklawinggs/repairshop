# Shared Components

This folder contains reusable components that are shared across different entity types (Customer, Carrier, Vendor, etc.).

## Components

### InsuranceForm.tsx
A unified insurance form component that handles:
- Insurer Company information
- Agent details (Name, Address, Email, Phone, Extension)
- Commercial General Liability
- Automobile Liability  
- Cargo Liability
- Insurer Documents (via passed component)

**Usage:**
```tsx
import SharedInsuranceForm from '@/shared/components/InsuranceForm';
import InsurerDocsUpload from './InsurerDocsUploadField';

<SharedInsuranceForm 
  open={open} 
  InsurerDocsUploadComponent={InsurerDocsUpload} 
/>
```

### InsurerDocsUploadField.tsx
A flexible document upload component for insurance documents that handles:
- Drag & drop file upload
- Multiple file type support (images, PDF, Word, Excel)
- File preview for images
- File size display
- Delete functionality
- Configurable styling

**Props:**
- `uploadUrl`: URL for file preview
- `borderStyle`: Border width ('1px' | '1.5px')
- `iconSize`: Cloud upload icon size
- `typographyVariant`: Text variant
- `listItemStyles`: Custom styling for list items

**Usage:**
```tsx
import SharedInsurerDocsUploadField from '@/shared/components/InsurerDocsUploadField';

<SharedInsurerDocsUploadField 
  uploadUrl={UPLOAD_URL}
  borderStyle="1.5px"
  iconSize={32}
  typographyVariant="body2"
  listItemStyles={{
    pb: 0,
    pt: 0,
    avatarMinWidth: '43px',
    avatarWidth: 32,
    avatarHeight: 32
  }}
/>
```

### Wrappers

Pre-configured wrappers for specific entity types:

#### LoadCustomerInsuranceForm
- Uses `LoadCustomerInsurerDocsUpload` component
- For load/freight customers

#### CarrierInsuranceForm  
- Uses `CarrierInsurerDocsUpload` component
- For carriers

## Benefits

1. **DRY Principle** - Single source of truth for insurance forms
2. **Consistency** - Same UI/UX across all entity types
3. **Maintainability** - Fix bugs once, applies everywhere
4. **Performance** - Reduced bundle size by eliminating duplicate code

## Migration

Components previously duplicated:
- `src/pages/customer-service/load-customers/components/FormCompnents/InsuranceForm/index.tsx`
- `src/pages/carrier-service/InsuranceForm.tsx`

These can now be replaced with the shared component wrappers.
