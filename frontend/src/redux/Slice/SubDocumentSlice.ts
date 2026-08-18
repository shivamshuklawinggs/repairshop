import { createSlice } from '@reduxjs/toolkit';
import { fetchSubDocuments } from '../api';

interface ISubDocumentState {
  data: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: ISubDocumentState = {
  data: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
  },
  loading: false,
  error: null,
};

const subDocumentsSlice = createSlice({
  name: 'subDocuments',
  initialState,
  reducers: {
    setSubDocuments: (state, action) => {
      state.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          limit: action.payload.limit,
        };
      })
      .addCase(fetchSubDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSubDocuments } = subDocumentsSlice.actions;
export default subDocumentsSlice.reducer;