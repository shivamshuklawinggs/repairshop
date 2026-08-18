import { AppError } from "middlewares/error";

interface CsvRow {
    [key: string]: any;
  }
  
  interface MismatchResult {
    [key: string]: string;
    field: string;
    mismatchedValues: any; // list of differing values found in CSV
  }
  
  /**
   * Validate CSV data so that for each invoiceNumber/billNumber,
   * the specified fieldsToCheck have consistent values across all rows.
   */
  export function checkInvoiceConsistency(
    csvData: CsvRow[],
    fieldsToCheck: string[],
    identifierField: string
  ): MismatchResult[] {
    const mismatches: MismatchResult[] = [];
  
    // Group rows by invoiceNumber or billNumber
    const groups: Record<string, CsvRow[]> = {};
    for (const row of csvData) {
      const identifier = row[identifierField];
      if (!groups[identifier]) {
        groups[identifier] = [];
      }
      groups[identifier].push(row);
    }
  
    // Validate each group
    for (const [identifier, rows] of Object.entries(groups)) {
      for (const field of fieldsToCheck) {
        const uniqueValues = Array.from(new Set(rows.map(r => r[field])));
        if (uniqueValues.length > 1) {
          mismatches.push({
            [identifierField as any]: identifier,
            field,
            mismatchedValues: uniqueValues as any,
          });
        }
      }
    }
  
    return mismatches;
  }

// const formatFieldName = (field: string): string => {
//     return field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
// };

/**
 * Check CSV rows for consistency of specified fields and also nested array fields like expense.productservice.
 * @param csvData Parsed CSV rows
 * @param fieldsToCheck Fields to check for consistency (e.g., ["client", "date"])
 */
export const duplicateProductServiceValidator=async (IdentifierField:"invoiceNumber"|"BillNumber",transformedData:any,_parsedData:any,productMap:any,customerMap:any,taxMap:any,termsMap:any)=>{
    const allErrors: string[] = [];
    const customerOrVendor=IdentifierField=="invoiceNumber"?"customerId":"vendorId"
    const label=IdentifierField=="invoiceNumber"?"Customers":"Vendors"
    // Check for duplicate productservice within each invoice's expense array
    // const expenseDuplicates: { [IdentifierField]: string, duplicatedProducts: string[] }[] = [];
    // for (const invoice of transformedData) {
    //     const productServices = invoice.expense.map((exp: any) => exp.productservice);
    //     const seenProducts = new Set<string>();
    //     const duplicates: string[] = [];
    //     for (const productService of productServices) {
    //         if (productService && seenProducts.has(productService)) {
    //             duplicates.push(productService);
    //         } else if(productService) {
    //             seenProducts.add(productService);
    //         }
    //     }
    //     if (duplicates.length > 0) {
    //         expenseDuplicates.push({
    //             [IdentifierField]: invoice[IdentifierField],
    //             duplicatedProducts: [...new Set(duplicates)] // get unique duplicates
    //             ,
    //         });
    //     }
    // }
    // if (expenseDuplicates.length > 0) {
    //     const errorMessage = expenseDuplicates.map((d:any) => 
    //         `For ${label} ${d[IdentifierField]}, the following products are listed more than once: ${d.duplicatedProducts.join(', ')}. Please ensure each product is listed only once per document.`
    //     ).join('\n');
    //     allErrors.push(errorMessage);
    // }

      // //  chgeck mismatch data 
      // const mismatchData = checkInvoiceConsistency(parsedData, ["invoiceDate", "dueDate","tax","location","terms","customerNotes","terms_conditions","discountPercent","deposit","paymentOptions",customerOrVendor,"email","address","name"], IdentifierField);
      // if (mismatchData.length > 0) {
      //   const message=mismatchData.map((item)=>{
      //     return `For ${label} ${item[IdentifierField as keyof MismatchResult]}, the field '${formatFieldName(item.field)}' has conflicting values: ${item.mismatchedValues.join(' vs ')}. Please ensure this field is the same for all rows with the same ${IdentifierField}.`;
      //   }).join("\n")
      //   allErrors.push(message);
      // }
     //   now check expense in every invoice 
     const notMatchedProducts = [
        ...new Set(
          transformedData
            .flatMap((item: any) => item?.expense?.map((exp: any) => exp?.productservice))
            .filter((p: any) => p && !productMap.has(p))
        ),
      ];
     if (notMatchedProducts.length > 0) {
        allErrors.push(`The following products are not registered in your company: ${notMatchedProducts.join(", ")}. Please add them as new products or correct the names in the CSV file.`);
     }
 
     const notMatchedCustomers = [
       ...new Set(transformedData.map((item: any) => item[customerOrVendor]).filter((id: any) => !customerMap.has(id))),
     ];
 
     if (notMatchedCustomers.length > 0) {
        allErrors.push(`The following ${label} are not registered in your company: ${notMatchedCustomers.join(", ")}. Please add them or correct the IDs in the CSV file.`);
     }
 
     const notMatchedTaxes = [
       ...new Set(
         transformedData
           .flatMap((item: any) => item?.expense?.map((exp: any) => exp?.tax))
           .filter((t: any) => t && !taxMap.has(t))
       ),
     ];
 
     if (notMatchedTaxes.length > 0) {
        allErrors.push(`The following taxes are not registered in your company: ${notMatchedTaxes.join(", ")}. Please add them or correct the names in the CSV file.`);
     }
     const notMatchedTerms = [
       ...new Set(
         transformedData
           .flatMap((item: any) => item?.terms)
           .filter((t: any) => t && !termsMap.has(t))
       ),
     ];
 
     if (notMatchedTerms.length > 0) {
        allErrors.push(`The following payment terms are not registered in your company: ${notMatchedTerms.join(", ")}. Please add them or correct the names in the CSV file.`);
     }

    if (allErrors.length > 0) {
        throw new AppError(allErrors.join('\n\n'), 400,{
          allErrors
        });
    }
}