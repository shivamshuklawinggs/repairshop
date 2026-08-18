# Report Export Documentation

## Overview
This document describes the export functionality for all financial reports in the FreightBooks API. All reports can be exported in three formats: **CSV**, **PDF**, and **JSON**.

## Supported Reports

1. **Profit and Loss Report** (`profit-and-loss`)
2. **Balance Sheet** (`balance-sheet`)
3. **Trial Balance Report** (`TrialBalanceReport`)
4. **General Ledger Report** (`GeneralLedgerReport`)
5. **Accounts Receivable Summary** (`AccountsReceiveable`)
6. **Accounts Payable Summary** (`AccountsPayable`)
7. **Accounts Receivable Detail** (`AccountsRecieveableDetail`)
8. **Accounts Payable Detail** (`AccountsPayableDetail`)

## API Endpoint

```
GET /api/reports/export
```

## Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `type` | string | Yes | Report type identifier | `profit-and-loss` |
| `format` | string | No | Export format (csv, pdf, json) | `pdf` (default: `csv`) |
| `fromDate` | string | Yes | Start date for report | `2024-01-01` |
| `toDate` | string | Yes | End date for report | `2024-12-31` |
| `allowedType` | string | No | For P&L report filtering | `accrual` or `cash` |
| `page` | number | No | Page number for paginated reports | `1` |
| `limit` | number | No | Items per page | `1000` |
| `accountId` | string | No | Specific account ID (for General Ledger) | `507f1f77bcf86cd799439011` |
| `paymentsPage` | number | No | Payment transactions page | `1` |
| `paymentsLimit` | number | No | Payment transactions limit | `1000` |

## Export Formats

### 1. CSV Export
Returns a comma-separated values file suitable for Excel and other spreadsheet applications.

**Example Request:**
```bash
GET /api/reports/export?type=profit-and-loss&format=csv&fromDate=2024-01-01&toDate=2024-12-31&allowedType=accrual
```

**Response Headers:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="profit-and-loss-report.csv"
```

### 2. PDF Export
Returns a professionally formatted PDF document with company branding.

**Example Request:**
```bash
GET /api/reports/export?type=balance-sheet&format=pdf&fromDate=2024-01-01&toDate=2024-12-31
```

**Response Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="balance-sheet-report.pdf"
```

### 3. JSON Export
Returns the raw report data in JSON format.

**Example Request:**
```bash
GET /api/reports/export?type=TrialBalanceReport&format=json&fromDate=2024-01-01&toDate=2024-12-31
```

**Response:**
```json
{
  "data": {
    "result": [...],
    "totals": {...}
  },
  "status": 200,
  "message": "TrialBalanceReport report exported successfully as JSON"
}
```

## Report-Specific Examples

### Profit and Loss Report
```bash
# CSV Export
GET /api/reports/export?type=profit-and-loss&format=csv&fromDate=2024-01-01&toDate=2024-12-31&allowedType=accrual

# PDF Export
GET /api/reports/export?type=profit-and-loss&format=pdf&fromDate=2024-01-01&toDate=2024-12-31&allowedType=accrual
```

### Balance Sheet
```bash
# CSV Export
GET /api/reports/export?type=balance-sheet&format=csv&fromDate=2024-01-01&toDate=2024-12-31

# PDF Export
GET /api/reports/export?type=balance-sheet&format=pdf&fromDate=2024-01-01&toDate=2024-12-31
```

### Trial Balance Report
```bash
# CSV Export
GET /api/reports/export?type=TrialBalanceReport&format=csv&fromDate=2024-12-31

# PDF Export
GET /api/reports/export?type=TrialBalanceReport&format=pdf&fromDate=2024-12-31
```

### General Ledger Report
```bash
# CSV Export (All Accounts)
GET /api/reports/export?type=GeneralLedgerReport&format=csv&fromDate=2024-01-01&toDate=2024-12-31

# PDF Export (Specific Account)
GET /api/reports/export?type=GeneralLedgerReport&format=pdf&fromDate=2024-01-01&toDate=2024-12-31&accountId=507f1f77bcf86cd799439011
```

### Accounts Receivable Summary
```bash
# CSV Export
GET /api/reports/export?type=AccountsReceiveable&format=csv&fromDate=2024-01-01&toDate=2024-12-31

# PDF Export
GET /api/reports/export?type=AccountsReceiveable&format=pdf&fromDate=2024-01-01&toDate=2024-12-31
```

### Accounts Payable Summary
```bash
# CSV Export
GET /api/reports/export?type=AccountsPayable&format=csv&fromDate=2024-01-01&toDate=2024-12-31

# PDF Export
GET /api/reports/export?type=AccountsPayable&format=pdf&fromDate=2024-01-01&toDate=2024-12-31
```

### Accounts Receivable Detail
```bash
# CSV Export
GET /api/reports/export?type=AccountsRecieveableDetail&format=csv&fromDate=2024-01-01&toDate=2024-12-31

# PDF Export
GET /api/reports/export?type=AccountsRecieveableDetail&format=pdf&fromDate=2024-01-01&toDate=2024-12-31
```

### Accounts Payable Detail
```bash
# CSV Export
GET /api/reports/export?type=AccountsPayableDetail&format=csv&fromDate=2024-01-01&toDate=2024-12-31

# PDF Export
GET /api/reports/export?type=AccountsPayableDetail&format=pdf&fromDate=2024-01-01&toDate=2024-12-31
```

## Implementation Details

### Architecture

The export functionality is implemented using:

1. **EJS Templates** (`src/microservices/report-services/templates/`)
   - `profit-and-loss.ejs`
   - `balance-sheet.ejs`
   - `trial-balance.ejs`
   - `general-ledger.ejs`
   - `accounts-receivable.ejs`
   - `accounts-payable.ejs`
   - `accounts-receivable-detail.ejs`
   - `accounts-payable-detail.ejs`

2. **Export Service** (`src/microservices/report-services/services/ReportExportMultiFormat.service.ts`)
   - Handles data transformation
   - Generates CSV from structured data
   - Renders EJS templates to HTML
   - Converts HTML to PDF using Puppeteer

3. **Controller** (`src/microservices/report-services/report.controller.ts`)
   - `exportReport()` method handles all export requests
   - Routes to appropriate export service based on report type

### PDF Generation

PDFs are generated using:
- **Puppeteer**: Headless Chrome for HTML to PDF conversion
- **EJS**: Template engine for dynamic HTML generation
- **Company Branding**: Automatically includes company name, address, phone, and email

### CSV Generation

CSV files include:
- Proper escaping of special characters
- Headers matching the report structure
- Hierarchical data representation with indentation
- Total rows for summary data

## Error Handling

The export endpoint returns appropriate HTTP status codes:

- `200 OK`: Successful export
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Report type not found
- `500 Internal Server Error`: Server-side error during export

## Frontend Integration

To integrate with the frontend, use the export button component:

```typescript
const handleExport = async (format: 'csv' | 'pdf' | 'json') => {
  const params = new URLSearchParams({
    type: reportType,
    format: format,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    ...additionalParams
  });
  
  const response = await fetch(`/api/reports/export?${params}`);
  
  if (format === 'pdf' || format === 'csv') {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report.${format}`;
    a.click();
  } else {
    const data = await response.json();
    console.log(data);
  }
};
```

## Build Configuration

The build process automatically copies EJS templates to the dist folder:

```json
"scripts": {
  "copy:assets": "cpx \"src/**/*.ejs\" dist/"
}
```

This ensures templates are available in production builds.

## Dependencies

Required packages (already installed):
- `ejs`: ^3.1.10
- `puppeteer`: ^24.5.0
- `@types/ejs`: ^3.1.5
- `@types/puppeteer`: ^5.4.7

## Notes

- PDF generation requires Chrome/Chromium to be installed on the server
- Large reports may take longer to generate PDFs
- CSV exports are faster and recommended for large datasets
- All exports respect company-level data isolation
- Date formatting follows US locale (MM/DD/YYYY)
