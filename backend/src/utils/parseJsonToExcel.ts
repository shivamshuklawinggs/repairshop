import ExcelJS from 'exceljs';

export interface ExcelField {
  value: string;
  label: string;
  width?: number;
  alignment?: 'left' | 'center' | 'right';
}

export const parseJsonToExcel = async (
  jsonData: any[],
  fields: ExcelField[]
): Promise<string> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  worksheet.columns = fields.map((field) => {
    const width =
      field.width ??
      Math.max(
        field.label.length,
        ...jsonData.map((row) => String(row?.[field.value] ?? '').length)
      )

    return {
      header: field.label,
      key: field.value,
      width,
    };
  });

  worksheet.addRows(jsonData);

  fields.forEach((field, index) => {
    if (field.alignment) {
      worksheet.getColumn(index + 1).alignment = {
        horizontal: field.alignment,
        vertical: 'middle',
      };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer).toString('base64');
};