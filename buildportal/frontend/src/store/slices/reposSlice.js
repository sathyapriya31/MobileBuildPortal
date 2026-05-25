import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api.js';

export const fetchRepos = createAsyncThunk('repos/fetch', async ({ provider, search = '' }) => {
  const url = provider === 'github' ? `/repos/github?search=${search}` : `/repos/gitlab?search=${search}`;
  const { data } = await api.get(url);
  return data.repos;
});

export const fetchBranches = createAsyncThunk('repos/branches', async ({ provider, owner, repo, projectId }) => {
  const url = provider === 'github'
    ? `/repos/github/${owner}/${repo}/branches`
    : `/repos/gitlab/${projectId}/branches`;
  const { data } = await api.get(url);
  return data.branches;
});

const reposSlice = createSlice({
  name: 'repos',
  initialState: { repos: [], branches: [], loading: false, branchesLoading: false, selectedRepo: null },
  reducers: {
    selectRepo(state, action) { state.selectedRepo = action.payload; state.branches = []; },
    clearRepos(state) { state.repos = []; state.branches = []; state.selectedRepo = null; },
  },
  extraReducers: (b) => {
    b.addCase(fetchRepos.pending, (s) => { s.loading = true; });
    b.addCase(fetchRepos.fulfilled, (s, a) => { s.repos = a.payload; s.loading = false; });
    b.addCase(fetchRepos.rejected, (s) => { s.loading = false; });
    b.addCase(fetchBranches.pending, (s) => { s.branchesLoading = true; });
    b.addCase(fetchBranches.fulfilled, (s, a) => { s.branches = a.payload; s.branchesLoading = false; });
    b.addCase(fetchBranches.rejected, (s) => { s.branchesLoading = false; });
  },
});

export const { selectRepo, clearRepos } = reposSlice.actions;
export default reposSlice.reducer;