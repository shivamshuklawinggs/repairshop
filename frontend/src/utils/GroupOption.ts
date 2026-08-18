type SelectOption = {
  value: string;
  label: string;
};

type GroupedOption = {
  label: string;
  options: SelectOption[];
};

const groupForSelect = <T extends { _id?: string; name: string }>(
  data: T[],
  groupKey: keyof T
): GroupedOption[] => {
  const grouped: Record<string, SelectOption[]> = {};

  data.forEach((item) => {
    if (!item._id || !item[groupKey]) return;

    const group = String(item[groupKey]);

    if (!grouped[group]) grouped[group] = [];

    grouped[group].push({
      value: item._id,
      label: item.name,
    });
  });

  return Object.entries(grouped).map(([label, options]) => ({
    label,
    options,
  }));
};
