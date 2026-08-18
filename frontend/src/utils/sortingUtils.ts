import { useState } from 'react';

// Sort field interface for sorting functionality
export interface SortField {
  field: string;
  order: 'asc' | 'desc';
}

// Reusable sorting state and handlers for tables
export interface UseSortingProps {
  initialField?: string;
  initialOrder?: 'asc' | 'desc';
}

export interface UseSortingReturn {
  sortFields: SortField[];
  currentSortField: string;
  currentSortOrder: 'asc' | 'desc';
  handleSort: (property: string) => void;
  resetSorting: () => void;
}

export const useSorting = ({
  initialField ,
  initialOrder
}: UseSortingProps = {}): UseSortingReturn => {
  const [sortFields, setSortFields] = useState<SortField[]>(initialField && initialOrder ?[
    { field: initialField, order: initialOrder }
  ]:[]);

  const handleSort = (property: string) => {
    setSortFields(prev => {
      const existingSortIndex = prev.findIndex(sort => sort.field === property);
      let newSortFields: SortField[];
      
      if (existingSortIndex !== -1) {
        // Toggle existing sort field
        newSortFields = [...prev];
        newSortFields[existingSortIndex] = {
          field: property,
          order: newSortFields[existingSortIndex].order === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // Add new sort field to the beginning
        newSortFields = [{ field: property, order: 'asc' }, ...prev];
      }
      
      return newSortFields;
    });
  };

  const resetSorting = () => {
    setSortFields([]);
  };

  return {
    sortFields,
    currentSortField: sortFields[0]?.field || initialField || "",
    currentSortOrder: sortFields[0]?.order || initialOrder,
    handleSort,
    resetSorting
  };
};
// 
// Helper function to create sort handlers for DataTable
export const createDataTableSortHandler = (
  handleSort: (property: string) => void,
  isSortable: boolean
) => (property: string) => () => {
  if (isSortable) {
    handleSort(property);
  }
};
