// src/redux/Slice/toastSlice.js
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ToastState {
  isOpen: boolean;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

const initialState: ToastState = {
  isOpen: false,
  message: "",
  type: "info",
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: (state, action: PayloadAction<{ message: string; type: ToastState["type"] }>) => {
      state.isOpen = true;
      state.message = action.payload.message;
      state.type = action.payload.type;
    },
    hideToast: (state) => {
      state.isOpen = false;
      state.message = "";
      state.type = "info";
    },
  },
});

export const { showToast, hideToast } = toastSlice.actions;

export default toastSlice.reducer;
