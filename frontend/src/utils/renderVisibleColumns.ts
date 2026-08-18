interface RenderVisibleColumnsProps<T extends Record<string, any>> {
  visibleColumns: string[];
  data: T[];
}

export const filterVisibleData = <T extends Record<string, any>>({
  visibleColumns,
  data,
}: RenderVisibleColumnsProps<T>): Partial<T>[] => {
  return data.map((item) => {
    const result: Partial<T> = {};
    visibleColumns.forEach((key) => {
      if (key in item) {
        (result as any)[key] = item[key];
      }
    });
    return result;
  });
};

