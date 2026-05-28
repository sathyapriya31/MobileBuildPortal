import axios from 'axios';
import { AppError } from '../middleware/errorHandler.js';

// ── GitHub repos & branches ───────────────────────────────
export async function getGithubRepos(req, res) {
  const { page = 1, per_page = 30, search = '' } = req.query;

  let username = req.user.username;
  if (!username) {
    try {
      const { data } = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${req.user.accessToken}` },
      });
      username = data.login;
      req.user.username = username;
      await req.user.save();
    } catch (err) {
      username = req.user.name.toLowerCase().replace(/\s+/g, '');
    }
  }

  const url = search
    ? `https://api.github.com/search/repositories?q=${encodeURIComponent(search)}+user:${username}&per_page=${per_page}&page=${page}`
    : `https://api.github.com/user/repos?per_page=${per_page}&page=${page}&sort=updated&type=owner`;

  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${req.user.accessToken}`, Accept: 'application/vnd.github.v3+json' },
  });
  const repos = search ? data.items : data;
  res.json({
    repos: repos.map(r => ({
      id: String(r.id),
      name: r.name,
      fullName: r.full_name,
      cloneUrl: r.clone_url,
      private: r.private,
      defaultBranch: r.default_branch,
      description: r.description,
      updatedAt: r.updated_at,
    })),
  });
}

export async function getGithubBranches(req, res) {
  const { owner, repo } = req.params;
  const { data } = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches`, {
    headers: { Authorization: `Bearer ${req.user.accessToken}` },
  });
  res.json({ branches: data.map(b => ({ name: b.name, sha: b.commit.sha })) });
}

// ── GitLab repos & branches ───────────────────────────────
export async function getGitlabRepos(req, res) {
  const { page = 1, per_page = 30, search = '' } = req.query;
  const gitlabUrl = req.user.gitlabUrl || process.env.GITLAB_URL || 'https://gitlab.com';
  const params = new URLSearchParams({ page, per_page, order_by: 'last_activity_at', owned: 'true' });
  if (search) params.append('search', search);
  const { data } = await axios.get(`${gitlabUrl}/api/v4/projects?${params}`, {
    headers: { Authorization: `Bearer ${req.user.accessToken}` },
  });
  res.json({
    repos: data.map(r => ({
      id: String(r.id),
      name: r.name,
      fullName: r.path_with_namespace,
      cloneUrl: r.http_url_to_repo,
      private: r.visibility !== 'public',
      defaultBranch: r.default_branch,
      description: r.description,
      updatedAt: r.last_activity_at,
    })),
  });
}

export async function getGitlabBranches(req, res) {
  const { projectId } = req.params;
  const gitlabUrl = req.user.gitlabUrl || process.env.GITLAB_URL || 'https://gitlab.com';
  const { data } = await axios.get(`${gitlabUrl}/api/v4/projects/${projectId}/repository/branches`, {
    headers: { Authorization: `Bearer ${req.user.accessToken}` },
  });
  res.json({ branches: data.map(b => ({ name: b.name, sha: b.commit.id })) });
}