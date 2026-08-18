// utils/parseCsvToJson.ts

import { parse } from 'csv-parse/sync';
import { AppError } from 'middlewares/error';

type CsvInput = Express.Multer.File | Buffer | string;

/**
 * Converts a CSV input into a list of JSON objects.
 * Accepts a Multer file, a Buffer, or a raw CSV string.
 * @param input The CSV input.
 * @param data Extra fields to merge into each record.
 * @returns Array of JSON records
 */
export const parseCsvToJson = (input: CsvInput, data: Record<string, any> = {}): Record<string, any>[] => {
  if (!input) {
    throw new AppError('CSV input is required', 400);
  }

  const csvContent = Buffer.isBuffer(input)
    ? input.toString('utf8')
    : typeof input === 'string'
    ? input
    : input.buffer.toString('utf8');

  try {
    const records: Record<string, any>[] = parse(csvContent, {
      columns: true, // first row as keys
      skip_empty_lines: true,
      trim: true,
    });

    if (!Array.isArray(records) || records.length === 0) {
      throw new AppError('No data found in CSV', 400);
    }

    return records.map((record: Record<string, any>) => {
      return {
        ...record,
        ...data
      }
    });
  } catch (err) {
    throw new AppError(`Invalid CSV format`, 400,err as any);
  }
};
