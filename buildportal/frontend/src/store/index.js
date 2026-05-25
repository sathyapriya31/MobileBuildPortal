import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import reposReducer from './slices/reposSlice.js';
import buildsReducer from './slices/buildsSlice.js';
import uiReducer from './slices/uiSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    repos: reposReducer,
    builds: buildsReducer,
    ui: uiReducer,
  },
});