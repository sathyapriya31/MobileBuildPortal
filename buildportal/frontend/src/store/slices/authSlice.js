import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api.js';

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Unauthorized');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, loading: false, initialized: false },
  reducers: {
    setToken(state, action) {
      state.token = action.payload;
      api.defaults.headers.Authorization = `Bearer ${action.payload}`;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      delete api.defaults.headers.Authorization;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMe.pending, (s) => { s.loading = true; });
    b.addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload; s.loading = false; s.initialized = true; });
    b.addCase(fetchMe.rejected, (s) => { s.loading = false; s.initialized = true; });
  },
});

export const { setToken, logout } = authSlice.actions;
export default authSlice.reducer;