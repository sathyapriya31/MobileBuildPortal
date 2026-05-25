import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// ── GitHub ────────────────────────────────────────────────
export function githubAuth(req, res) {
  const queryParams = {
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_REDIRECT_URI,
    scope: 'read:user user:email repo',
  };
  if (req.query.logout === 'true') {
    queryParams.prompt = 'select_account';
  }
  const params = new URLSearchParams(queryParams);
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}

export async function githubCallback(req, res) {
  const { code } = req.query;
  // Exchange code for token
  const tokenRes = await axios.post(
    'https://github.com/login/oauth/access_token',
    { client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code },
    { headers: { Accept: 'application/json' } }
  );
  const accessToken = tokenRes.data.access_token;
  // Get user info
  const { data: ghUser } = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // Upsert user
  const user = await User.findOneAndUpdate(
    { provider: 'github', providerId: String(ghUser.id) },
    {
      name: ghUser.name || ghUser.login,
      username: ghUser.login,
      email: ghUser.email,
      avatar: ghUser.avatar_url,
      accessToken
    },
    { upsert: true, new: true }
  );
  const jwtToken = signToken(user._id);
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${jwtToken}`);
}

// ── GitLab ────────────────────────────────────────────────
export function gitlabAuth(req, res) {
  const queryParams = {
    client_id: process.env.GITLAB_CLIENT_ID,
    redirect_uri: process.env.GITLAB_REDIRECT_URI,
    response_type: 'code',
    scope: 'read_user read_api',
  };
  if (req.query.logout === 'true') {
    queryParams.prompt = 'login';
  }
  const params = new URLSearchParams(queryParams);
  res.redirect(`https://gitlab.com/oauth/authorize?${params}`);
}

export async function gitlabCallback(req, res) {
  const { code } = req.query;
  const tokenRes = await axios.post('https://gitlab.com/oauth/token', {
    client_id: process.env.GITLAB_CLIENT_ID,
    client_secret: process.env.GITLAB_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: process.env.GITLAB_REDIRECT_URI,
  });
  const accessToken = tokenRes.data.access_token;
  const { data: glUser } = await axios.get('https://gitlab.com/api/v4/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const user = await User.findOneAndUpdate(
    { provider: 'gitlab', providerId: String(glUser.id) },
    {
      name: glUser.name,
      username: glUser.username,
      email: glUser.email,
      avatar: glUser.avatar_url,
      accessToken
    },
    { upsert: true, new: true }
  );
  const jwtToken = signToken(user._id);
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${jwtToken}`);
}

export async function getMe(req, res) {
  res.json({ user: req.user });
}

export async function logout(req, res) {
  res.json({ message: 'Logged out' });
}