import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import createIndexedDBStorage from "redux-persist-indexeddb-storage";
import { encryptTransform } from "redux-persist-transform-encrypt";
import sidebarReducer from "./Slice/sidebarSlice";
import toastReducer from "./Slice/toastSlice";
import userReducer,{UserState} from "./Slice/UserSlice";
import columnFilterReducer,{ColumnFilterState} from './Slice/ColumnFilterSlice'
import documentsSliceReducer from './Slice/DocumentSlice'
import subDocumentsSliceReducer from './Slice/SubDocumentSlice'
import reportReducer ,{ReportState} from '../store/reports';
import dashboardReducer from './Slice/DashboardSlice';
import superadminReducer from './Slice/SuperadminSlice';
import globalSearchReducer from './Slice/globalSearchSlice';
import { resetAppState } from "./actions";
// Import types for proper typing with redux-persist
import { PersistConfig } from 'redux-persist';
import {  SidebarState } from "@/types";
import { TypedUseSelectorHook,useSelector, useDispatch } from "react-redux";
export const indexedDBStorage = createIndexedDBStorage("myAppDB");
const encryptionTransform = encryptTransform({
  secretKey: import.meta.env.VITE_API_INDEX_DB_STORAGE,
  onError: (error: Error) => {
    console.warn("Encryption error:", error);
  },
});


const columnFilterpersistConfig: PersistConfig<ColumnFilterState> = {
  key: "columnFilter",
  storage: indexedDBStorage,
  transforms: [encryptionTransform],
};
const reportFilterpersistConfig: PersistConfig<ReportState> = {
  key: "reportFilter",
  storage: indexedDBStorage,
};


const sidebarpersistConfig: PersistConfig<SidebarState> = {
  key: "sidebar",
  storage: indexedDBStorage,
  transforms: [encryptionTransform],
};
const AuthPersistConfig: PersistConfig<UserState> = {
  key: "company",
  storage: indexedDBStorage,
  transforms: [encryptionTransform],
};
const appReducer = combineReducers({
  sidebar: persistReducer(sidebarpersistConfig, sidebarReducer),
  toast: toastReducer,
  user: persistReducer(AuthPersistConfig, userReducer),
  columnFilter: persistReducer(columnFilterpersistConfig, columnFilterReducer),
  report: persistReducer(reportFilterpersistConfig, reportReducer),
  dashboard: dashboardReducer,
  documents: documentsSliceReducer,
  subDocuments: subDocumentsSliceReducer,
  superadmin: superadminReducer,
  globalSearch: globalSearchReducer,
});

export const rootReducer = (state: any, action: any) => {
  if (action.type === resetAppState.type) {
    const user = state?.user;
    const sidebar=state?.sidebar
    state = {
      user, // preserve auth data if desired
      sidebar
    };
  }

  return appReducer(state, action);
};
// Create the store with properly typed reducers
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
