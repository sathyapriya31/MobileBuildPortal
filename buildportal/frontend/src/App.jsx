import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe, setToken } from './store/slices/authSlice.js';
import { connectSocket } from './services/socket.js';
import LoginPage from './pages/LoginPage.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import BuildPage from './pages/BuildPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import WorkspacePage from './pages/WorkspacePage.jsx';
import WorkspaceSettingsPage from './pages/WorkspaceSettingsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';

function PrivateRoute({ children }) {
  const { user, initialized } = useSelector(s => s.auth);
  if (!initialized) return <div className="app-loading"><span className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = sessionStorage.getItem('bp_token');
    if (token) {
      dispatch(setToken(token));
      dispatch(fetchMe()).then(() => connectSocket(token));
    } else {
      dispatch({ type: 'auth/fetchMe/rejected' }); // mark initialized
    }
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/build" replace />} />
        <Route path="build" element={<BuildPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="workspaces" element={<WorkspacePage />} />
        <Route path="workspaces/:workspaceId/settings" element={<WorkspaceSettingsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>
    </Routes>
  );
}