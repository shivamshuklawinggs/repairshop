interface CsvRow {
    [key: string]: any;
  }
  
  interface MismatchResult {
    invoiceNumber: string;
    field: string;
    mismatchedValues: any[]; // list of differing values found in CSV
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
            invoiceNumber: identifier,
            field,
            mismatchedValues: uniqueValues,
          });
        }
      }
    }
  
    return mismatches;
  }
/**
 * Check CSV rows for consistency of specified fields and also nested array fields like expense.productservice.
 * @param csvData Parsed CSV rows
 * @param fieldsToCheck Fields to check for consistency (e.g., ["client", "date"])
 */