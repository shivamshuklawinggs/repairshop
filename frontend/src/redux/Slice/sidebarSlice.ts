import { SidebarMenuItem, SidebarState } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';



const initialState: SidebarState = {
  isOpen: true,
  activeMenu: '',
  openMenus: [],
};

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isOpen = !state.isOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
    setActiveMenu: (state, action: PayloadAction<string>) => {
      state.activeMenu = action.payload;
    },
    setOpenMenus: (state, action: PayloadAction<string[]>) => {
      state.openMenus = action.payload;
    },
  
  },
});

export const { toggleSidebar, setSidebarOpen, setActiveMenu, setOpenMenus } = sidebarSlice.actions;
export default sidebarSlice.reducer;