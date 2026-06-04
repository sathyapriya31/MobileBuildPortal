const KEY = 'bp_workspaces';

export function getWorkspaces() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function upsertWorkspace(workspace) {
  const all = getWorkspaces();
  const idx = all.findIndex(w => String(w.id) === String(workspace.id));
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...workspace };
  } else {
    all.unshift(workspace);
  }
  localStorage.setItem(KEY, JSON.stringify(all));
}
