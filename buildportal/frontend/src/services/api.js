import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach stored token on init
const token = sessionStorage.getItem('bp_token');
if (token) api.defaults.headers.Authorization = `Bearer ${token}`;