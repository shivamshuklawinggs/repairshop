import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IDocument } from '@/types';
import { fetchDocuments } from '../api';

interface DocumentState {
  data:IDocument[];
  loading:boolean;
  error:any,
  type:string,
  search:string
  pagination:{
    total:number,
    limit:number,
    page:number,
    totalPages:number
  }
}

const initialState: DocumentState = {
  data: [],
  loading:false,
  error:null,
  type:"load",
  search:"",
  pagination:{
    total:0,
    limit:5,
    page:1,
    totalPages:0
  }
};

const DocumentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setDocuments: (state, action: PayloadAction<IDocument[]>) => {
      state.data = action.payload;
    },
    setDocumentLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setDocumentError: (state, action: PayloadAction<any>) => {
      state.error = action.payload;
    },
    setDocumentType: (state, action: PayloadAction<string>) => {
      state.type = action.payload;
    },
    setDocumentSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setDocumentPagination: (state, action: PayloadAction<{total:number,limit:number,page:number,totalPages:number}>) => {
      state.pagination = action.payload;
    },
  },
  extraReducers(builder){
    builder.addCase(fetchDocuments.pending,(state)=>{
      state.loading=true;
      state.error=null;
      state.pagination={
        total:0,
        limit:5,
        page:1,
        totalPages:0
      }
    })
    builder.addCase(fetchDocuments.fulfilled,(state,action)=>{
      state.loading=false;
      state.error=null;
      state.data=action.payload.data
      state.pagination=action.payload.pagination || {
        total:0,
        limit:5,
        page:1,
        totalPages:0
      };
    })
    builder.addCase(fetchDocuments.rejected,(state,action)=>{
      state.loading=false;
      state.error=action.payload;
      state.data=[]
      state.pagination={
        total:0,
        limit:5,
        page:1,
        totalPages:0
      }
    })
  }
});

export const { setDocuments,setDocumentLoading,setDocumentError,setDocumentType,setDocumentSearch } = DocumentSlice.actions;
export default DocumentSlice.reducer; 