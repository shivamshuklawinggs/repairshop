export const unflatten = (data: Record<string, any>) => {
    const result: any = {};
    for (const key in data) {
      const keys = key.split('.');
      keys.reduce((acc, part, index) => {
        if (index === keys.length - 1) {
          acc[part] = data[key];
          return;
        }
        if (!acc[part]) acc[part] = {};
        return acc[part];
      }, result);
    }
    return result;
  };
  