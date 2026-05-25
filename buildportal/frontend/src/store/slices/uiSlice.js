import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true, activeTab: 'build' },
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
    setActiveTab(state, action) { state.activeTab = action.payload; },
  },
});

export const { toggleSidebar, setActiveTab } = uiSlice.actions;
export default uiSlice.reducer;