

import { Parser } from 'json2csv';
 export const parseJsonToCsv = (jsonData: any[], fields: { value: string; label: string }[]): string => {
    const parser = new Parser({ fields });
    const csv = parser.parse(jsonData); // CSV string
    const buffer = Buffer.from(csv, 'utf-8');
    const base64 = buffer.toString('base64');
    return base64;
}