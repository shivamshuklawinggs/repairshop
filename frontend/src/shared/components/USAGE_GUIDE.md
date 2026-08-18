# Shared Components Usage Guide

This guide shows how to use the simplified shared components system that eliminates code duplication across carrier, customer, and vendor forms.

## 🎯 Simple Usage

### Before (Multiple Duplicates)
```tsx
// Old way - multiple duplicate components
import CarrierInsuranceForm from '@/pages/carrier-service/InsuranceForm';
import CustomerInsuranceForm from '@/pages/customer-service/.../InsuranceForm';
import VendorInsuranceForm from '@/pages/carrier-service/VendorForm/.../InsuranceForm';
```

### After (Single Shared System)
```tsx
// New way - single import for all entities
import { 
  SharedInsuranceForm,
  SharedAdditionalInfo,
  SharedContactList,
  SharedDocuments,
  SharedCompanySection
} from '@/shared/components';
```

## 📦 Available Components

### 1. SharedInsuranceForm
**Purpose**: Unified insurance form for all entity types
```tsx
<SharedInsuranceForm 
  open={open} 
  InsurerDocsUploadComponent={CustomUploadComponent} 
/>
```

### 2. SharedAdditionalInfo
**Purpose**: Additional information fields with configurable options
```tsx
<SharedAdditionalInfo 
  entity="customer"           // 'carrier' | 'customer' | 'vendor'
  showPaymentTerms={true}     // Show payment terms dropdown
  showPaymentMethod={true}    // Show payment method dropdown
  showNotes={false}          // Show notes textarea
  setOpenDialog={setOpenDialog} // For payment terms modal
/>
```

### 3. SharedContactList
**Purpose**: Contact person management (add, edit, delete)
```tsx
<SharedContactList 
  control={control}
  setValue={setValue}
  watch={watch}
  errors={errors}
/>
```

### 4. SharedDocuments
**Purpose**: Document upload with configurable styling
```tsx
<SharedDocuments 
  uploadUrl="CARRIER_DOCUMENTS_UPLOAD_URL"  // API endpoint
  title="Documents"                         // Section title
  borderStyle="1.5px"                      // Border width
  iconSize={32}                            // Upload icon size
  typographyVariant="body2"                // Text variant
/>
```

### 5. SharedCompanySection
**Purpose**: Company information with USDOT integration
```tsx
<SharedCompanySection 
  entity="carrier"              // Entity type
  localUsdot={localUsdot}        // USDOT state (carriers only)
  setLocalUsdot={setLocalUsdot}  // USDOT setter (carriers only)
  showUSDOT={true}              // Show USDOT field
  showMCNumber={true}           // Show MC Number field
  showRate={true}               // Show Rate field
/>
```

## 🚀 Entity-Specific Configurations

### Load Customer
```tsx
companySection: (props) => <SharedCompanySection {...props} entity="customer" />
additionalSections: [
  {
    title: 'Additional Information',
    component: (props) => <SharedAdditionalInfo {...props} entity="customer" showPaymentTerms showPaymentMethod />
  },
  {
    title: 'Documents',
    component: (props) => <SharedDocuments {...props} uploadUrl="CUSTOMER_DOCUMENTS_UPLOAD_URL" />
  }
]
```

### Carrier
```tsx
companySection: (props) => <SharedCompanySection {...props} entity="carrier" localUsdot={localUsdot} setLocalUsdot={setLocalUsdot} />
additionalSections: [
  {
    title: 'Additional Information',
    component: (props) => <SharedAdditionalInfo {...props} entity="carrier" />
  },
  {
    title: 'Documents',
    component: (props) => <SharedDocuments {...props} uploadUrl="CARRIER_DOCUMENTS_UPLOAD_URL" />
  }
]
```

### Account Customer
```tsx
companySection: (props) => <SharedCompanySection {...props} entity="account-customer" showUSDOT={false} showMCNumber={false} />
additionalSections: [
  {
    title: 'Documents',
    component: (props) => <SharedDocuments {...props} uploadUrl="CUSTOMER_DOCUMENTS_UPLOAD_URL" title="Notes & Attachments" />
  }
]
```

### Vendor
```tsx
companySection: (props) => <SharedCompanySection {...props} entity="vendor" showUSDOT={false} showMCNumber={false} />
additionalSections: [
  {
    title: 'Documents',
    component: (props) => <SharedDocuments {...props} uploadUrl="CARRIER_DOCUMENTS_UPLOAD_URL" title="Notes And Attachments" />
  }
]
```

## 📈 Benefits Achieved

✅ **Eliminated 8+ duplicate components**  
✅ **Single source of truth** - Fix bugs once, apply everywhere  
✅ **Consistent UI/UX** - Same experience across all forms  
✅ **Smaller bundle size** - Less duplicate code  
✅ **Easy maintenance** - One place to update logic  
✅ **Flexible configuration** - Props handle entity differences  
✅ **Type safety** - Full TypeScript support  

## 🛠 Migration Complete

The following duplicate components have been eliminated:

- ❌ `CarrierInsuranceForm.tsx` → ✅ `SharedInsuranceForm`
- ❌ `CustomerInsuranceForm.tsx` → ✅ `SharedInsuranceForm`
- ❌ `CarrierAdditionalInfo.tsx` → ✅ `SharedAdditionalInfo`
- ❌ `CustomerAdditionalInfo.tsx` → ✅ `SharedAdditionalInfo`
- ❌ `CarrierContactList/` → ✅ `SharedContactList`
- ❌ `CustomerContactList/` → ✅ `SharedContactList`
- ❌ `CarrierDocumentUpload.tsx` → ✅ `SharedDocuments`
- ❌ `CustomerDocumentUpload.tsx` → ✅ `SharedDocuments`
- ❌ `CarrierCompanySection.tsx` → ✅ `SharedCompanySection`
- ❌ `CustomerCompanySection.tsx` → ✅ `SharedCompanySection`

## 🎉 Result

You now have a **simple, unified system** where:
- One import statement replaces many
- Props control entity-specific behavior
- Code is DRY and maintainable
- UI is consistent across all forms
