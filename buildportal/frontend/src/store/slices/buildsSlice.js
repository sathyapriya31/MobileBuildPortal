import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api.js';

export const fetchBuilds = createAsyncThunk('builds/fetch', async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  const { data } = await api.get(`/builds?${q}`);
  return data;
});

export const triggerBuild = createAsyncThunk('builds/trigger', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/builds', payload);
    return data.build;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Build failed');
  }
});

export const cancelBuild = createAsyncThunk('builds/cancel', async (id) => {
  const { data } = await api.post(`/builds/${id}/cancel`);
  return data.build;
});

const buildsSlice = createSlice({
  name: 'builds',
  initialState: { builds: [], total: 0, loading: false, triggerLoading: false, activeBuild: null },
  reducers: {
    updateBuildStatus(state, action) {
      const { buildId, status, artifacts, logs } = action.payload;
      const idx = state.builds.findIndex(b => b._id === buildId);
      if (idx !== -1) {
        state.builds[idx].status = status;
        if (artifacts) state.builds[idx].artifacts = artifacts;
        if (logs) state.builds[idx].logs = [...(state.builds[idx].logs || []), ...logs];
      }
    },
    addBuildLog(state, action) {
      const { buildId, message, level, timestamp } = action.payload;
      const idx = state.builds.findIndex(b => b._id === buildId);
      if (idx !== -1) {
        if (!state.builds[idx].logs) state.builds[idx].logs = [];
        state.builds[idx].logs.push({ message, level, timestamp });
      }
    },
    setActiveBuild(state, action) { state.activeBuild = action.payload; },
  },
  extraReducers: (b) => {
    b.addCase(fetchBuilds.pending, (s) => { s.loading = true; });
    b.addCase(fetchBuilds.fulfilled, (s, a) => { s.builds = a.payload.builds; s.total = a.payload.total; s.loading = false; });
    b.addCase(fetchBuilds.rejected, (s) => { s.loading = false; });
    b.addCase(triggerBuild.pending, (s) => { s.triggerLoading = true; });
    b.addCase(triggerBuild.fulfilled, (s, a) => { s.builds.unshift(a.payload); s.triggerLoading = false; });
    b.addCase(triggerBuild.rejected, (s) => { s.triggerLoading = false; });
    b.addCase(cancelBuild.fulfilled, (s, a) => {
      const idx = s.builds.findIndex(b => b._id === a.payload._id);
      if (idx !== -1) s.builds[idx] = a.payload;
    });
  },
});

export const { updateBuildStatus, addBuildLog, setActiveBuild } = buildsSlice.actions;
export default buildsSlice.reducer;