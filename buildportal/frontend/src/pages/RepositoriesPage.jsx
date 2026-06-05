import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchRepos } from '../store/slices/reposSlice.js';
import { fetchBuilds } from '../store/slices/buildsSlice.js';
import { Bell, HelpCircle, Search, Code2, ChevronLeft, AlertCircle, RefreshCw } from 'lucide-react';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';

const AndroidIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.5 10c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm-11 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm11.5 1.5c0-.8-.7-1.5-1.5-1.5H7.5c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5h1v3c0 .6.4 1 1 1s1-.4 1-1v-3h3v3c0 .6.4 1 1 1s1-.4 1-1v-3h1c.8 0 1.5-.7 1.5-1.5v-6zm-1.8-3.7l1.3-1.3c.4-.4.4-1 0-1.4s-1-.4-1.4 0l-1.5 1.5c-.8-.3-1.7-.5-2.6-.5s-1.8.2-2.6.5L9.3 5.1c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4l1.3 1.3C7.6 8.7 6.7 10 6.2 11.5h11.6c-.5-1.5-1.4-2.8-2.6-3.7z" />
  </svg>
);

const IosIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-1 2.94.9.07 2.01-.52 2.83-1.33z" />
  </svg>
);

const STATUS_CONFIG = {
  success:   { label: 'Success',   color: '#16A34A', bg: '#F0FDF4' },
  failed:    { label: 'Failed',    color: '#DC2626', bg: '#FEF2F2' },
  building:  { label: 'Building',  color: '#2563EB', bg: '#EFF6FF' },
  queued:    { label: 'Queued',    color: '#6B7280', bg: '#F9FAFB' },
  cancelled: { label: 'Cancelled', color: '#9CA3AF', bg: '#F3F4F6' },
};

const TABLE_HEADERS = ['Repository', 'Branch', 'Platform', 'Last Build', 'Last Build Time'];

export default function RepositoriesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const { repos, loading } = useSelector(s => s.repos);
  const { builds } = useSelector(s => s.builds);
  const [search, setSearch] = useState('');
  const [fetchError, setFetchError] = useState(false);

  const load = () => {
    setFetchError(false);
    if (user?.provider) {
      dispatch(fetchRepos({ provider: user.provider }))
        .unwrap()
        .catch(() => setFetchError(true));
    }
    dispatch(fetchBuilds({ limit: 100 }));
  };

  useEffect(() => { load(); }, [user?.provider]);

  const formatRelativeTime = (ts) => {
    if (!ts) return 'N/A';
    try {
      const diffMs = Date.now() - new Date(ts).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch { return 'N/A'; }
  };

  const filtered = repos.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: Colors.bg, ...Fonts.Regular }}>

      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '24px', backgroundColor: Colors.headerBg, borderBottom: '1px solid ' + Colors.headerBorder, padding: '16px 32px', height: '64px', boxSizing: 'border-box' }}>
        <button style={{ background: 'none', border: 'none', color: Colors.headerIcon, cursor: 'pointer', position: 'relative', padding: 0 }}>
          <Bell size={20} />
          <span style={{ position: 'absolute', top: 1, right: 1, width: 6, height: 6, backgroundColor: Colors.trendRed, borderRadius: '50%' }} />
        </button>
        <button style={{ background: 'none', border: 'none', color: Colors.headerIcon, cursor: 'pointer', padding: 0 }}>
          <HelpCircle size={20} />
        </button>
        {user && (
          <img src={user.avatar} alt={user.name} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid ' + Colors.headerBorder }} />
        )}
      </div>

      {/* Page Content */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '6px 12px', color: '#6B7280', fontSize: '13px', fontFamily: 'Google Sans, sans-serif', cursor: 'pointer', flexShrink: 0 }}
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div>
            <h1 style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '24px', fontWeight: '700', color: '#1E293B', margin: 0, letterSpacing: '-0.02em', lineHeight: '1.1' }}>
              All Repositories
            </h1>
            <p style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '14px', color: '#5F6368', margin: '4px 0 0 0' }}>
              {loading ? 'Loading repositories…' : `${filtered.length} repositor${filtered.length !== 1 ? 'ies' : 'y'} found`}
            </p>
          </div>
        </div>

        {/* Search + Refresh row */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search repositories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', fontFamily: 'Google Sans, sans-serif', background: '#fff', color: '#374151', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={load}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '13px', fontFamily: 'Google Sans, sans-serif', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            <RefreshCw size={15} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Table Card */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: Colors.cardShadow, overflow: 'hidden', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 16px', gap: '14px' }}>
              <div style={{ width: 30, height: 30, border: '3px solid #E5E7EB', borderTop: '3px solid #2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '14px', color: '#9CA3AF' }}>Loading repositories…</span>
            </div>
          ) : fetchError ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 16px', gap: '14px' }}>
              <AlertCircle size={36} color="#DC2626" style={{ opacity: 0.6 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>Failed to load repositories</div>
                <div style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '13px', color: '#9CA3AF' }}>Check your connection and try again</div>
              </div>
              <button
                onClick={load}
                style={{ padding: '9px 20px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontFamily: 'Google Sans, sans-serif', fontWeight: '600', cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 16px', gap: '14px' }}>
              <Code2 size={36} color="#9CA3AF" style={{ opacity: 0.5 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                  {search ? `No results for "${search}"` : 'No repositories found'}
                </div>
                <div style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '13px', color: '#9CA3AF' }}>
                  {search ? 'Try a different search term' : 'Connect a workspace to see repositories here'}
                </div>
              </div>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ padding: '7px 16px', background: 'none', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '13px', fontFamily: 'Google Sans, sans-serif', fontWeight: '600', cursor: 'pointer' }}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                  {TABLE_HEADERS.map(h => (
                    <th key={h} style={{ padding: '12px 16px', color: '#6B7280', fontFamily: 'Google Sans, sans-serif', fontWeight: '500', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((repo, idx) => {
                  const repoBuilds = builds
                    .filter(b => b.projectName === repo.name)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                  const lastBuild = repoBuilds[0] || null;
                  const statusConf = lastBuild ? (STATUS_CONFIG[lastBuild.status] || STATUS_CONFIG.cancelled) : null;
                  const branch = lastBuild?.branch || repo.default_branch || repo.defaultBranch || null;

                  return (
                    <tr
                      key={repo.id || repo.name + idx}
                      style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Repository */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, background: '#EFF6FF', borderRadius: '6px', flexShrink: 0 }}>
                            <Code2 size={14} color="#2563EB" />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '14px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                              {repo.name}
                            </div>
                            {repo.full_name && repo.full_name !== repo.name && (
                              <div style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '12px', color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                                {repo.full_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Branch */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '13px', color: '#6B7280' }}>
                          {branch || <span style={{ color: '#D1D5DB' }}>—</span>}
                        </span>
                      </td>

                      {/* Platform */}
                      <td style={{ padding: '14px 16px' }}>
                        {lastBuild?.platform ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', background: lastBuild.platform === 'android' ? '#F0FDF4' : '#EFF6FF', color: lastBuild.platform === 'android' ? '#16A34A' : '#2563EB', borderRadius: '999px', fontSize: '12px', fontFamily: 'Google Sans, sans-serif', fontWeight: '500' }}>
                            {lastBuild.platform === 'android' ? <AndroidIcon size={12} /> : <IosIcon size={12} />}
                            {lastBuild.platform === 'android' ? 'Android' : 'iOS'}
                          </span>
                        ) : (
                          <span style={{ color: '#D1D5DB', fontFamily: 'Google Sans, sans-serif', fontSize: '13px' }}>—</span>
                        )}
                      </td>

                      {/* Last Build Status */}
                      <td style={{ padding: '14px 16px' }}>
                        {statusConf ? (
                          <span style={{ display: 'inline-block', padding: '3px 10px', background: statusConf.bg, color: statusConf.color, borderRadius: '999px', fontSize: '12px', fontFamily: 'Google Sans, sans-serif', fontWeight: '600', whiteSpace: 'nowrap' }}>
                            {statusConf.label}
                          </span>
                        ) : (
                          <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>No builds</span>
                        )}
                      </td>

                      {/* Last Build Time */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '13px', color: '#6B7280' }}>
                          {lastBuild ? formatRelativeTime(lastBuild.finishedAt || lastBuild.createdAt) : <span style={{ color: '#D1D5DB' }}>—</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
