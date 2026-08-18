
// types.ts
export type CategoryType = 'inventory' | 'non inventory' | 'service';

export interface IProductServiceData {
  category: Array<{ value: CategoryType; label: string }>;
}
export const ProductServiceData: IProductServiceData = {

  category: [
    { value: "inventory", label: "Inventory" },
    { value: "non inventory", label: "Non Inventory" },
    { value: "service", label: "Service" }
  ],
};
    