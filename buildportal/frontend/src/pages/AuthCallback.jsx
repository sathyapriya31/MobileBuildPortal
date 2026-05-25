import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setToken, fetchMe } from '../store/slices/authSlice.js';
import { connectSocket } from '../services/socket.js';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      sessionStorage.setItem('bp_token', token);
      localStorage.removeItem('bp_logged_out');
      dispatch(setToken(token));
      dispatch(fetchMe()).then(() => {
        connectSocket(token);
        navigate('/build', { replace: true });
      });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', flexDirection:'column', gap:'1rem' }}>
      <div className="spinner" style={{ width:40, height:40, border:'3px solid var(--border)', borderTopColor:'var(--primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <p style={{ color:'var(--text-muted)' }}>Authenticating...</p>
    </div>
  );
}