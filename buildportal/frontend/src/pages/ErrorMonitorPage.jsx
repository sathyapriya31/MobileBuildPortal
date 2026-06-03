import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBuilds } from '../store/slices/buildsSlice.js';
import { ArrowLeft, AlertCircle, AlertTriangle, XCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';

export default function ErrorMonitorPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { builds, loading } = useSelector(s => s.builds);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    dispatch(fetchBuilds({ limit: 500, status: 'failed' }));
  }, [dispatch]);

  const formatRelativeTime = (ts) => {
    try {
      const diffMs = Date.now() - new Date(ts).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch { return '—'; }
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (secs) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60), s = secs % 60;
    return m === 0 ? `${s}s` : `${m}m ${s}s`;
  };

  const failedBuilds = builds
    .filter(b => b.status === 'failed')
    .filter(b => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (b.repo || b.projectName || '').toLowerCase().includes(q)
        || (b.errorMessage || '').toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getIcon = (title = '') => {
    if (/warning/i.test(title)) return { Icon: AlertTriangle, color: '#F59E0B' };
    if (/expired|profile/i.test(title)) return { Icon: XCircle, color: '#DC2626' };
    return { Icon: AlertCircle, color: '#DC2626' };
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.pageHeader}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => navigate('/analytics')}>
            <ArrowLeft size={16} />
            <span>Analytics</span>
          </button>
          <div style={s.titleRow}>
            <h1 style={s.title}>Error Monitor</h1>
            <span style={s.activeBadge}>{failedBuilds.length} Failed Builds</span>
          </div>
          <p style={s.subtitle}>All build failures across your repositories.</p>
        </div>
      </div>

      {/* Search */}
      <div style={s.searchBar}>
        <Search size={15} style={s.searchIcon} />
        <input
          style={s.searchInput}
          placeholder="Search by repo or error message…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Error List */}
      <div style={s.card}>
        {loading && <div style={s.statusCell}>Loading errors…</div>}
        {!loading && failedBuilds.length === 0 && (
          <div style={s.statusCell}>
            <AlertCircle size={28} style={{ color: '#D1D5DB', marginBottom: '8px' }} />
            <div style={{ color: '#9CA3AF', fontFamily: 'Google Sans, sans-serif', fontSize: '14px' }}>No failed builds found.</div>
          </div>
        )}

        {failedBuilds.map((build, idx) => {
          const title = build.errorMessage || 'Build Failed';
          const { Icon, color } = getIcon(title);
          const isOpen = expanded === build._id;
          const hasLogs = (build.logs || []).length > 0;

          return (
            <div key={build._id} style={{ borderBottom: idx < failedBuilds.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
              {/* Row */}
              <div style={s.errorRow}>
                <Icon size={20} style={{ color, flexShrink: 0, marginTop: 2 }} />

                <div style={s.errorBody}>
                  <div style={s.errorTopRow}>
                    <span style={s.errorTitle}>{title}</span>
                    <span style={s.timestamp}>{formatRelativeTime(build.completedAt || build.createdAt)}</span>
                  </div>
                  <div style={s.meta}>
                    <span>Repo: <strong>{build.repo || build.projectName || 'Unknown'}</strong></span>
                    <span style={s.dot}>•</span>
                    <span>Build #{build.buildNumber || build._id?.slice(-6)}</span>
                    <span style={s.dot}>•</span>
                    <span>{build.platform || 'unknown'}</span>
                    <span style={s.dot}>•</span>
                    <span>{formatDuration(build.duration)}</span>
                    <span style={s.dot}>•</span>
                    <span>{formatDate(build.createdAt)}</span>
                  </div>
                  {build.error && (
                    <div style={s.codeTag}>{build.error}</div>
                  )}
                </div>

                {hasLogs && (
                  <button style={s.logsBtn} onClick={() => setExpanded(isOpen ? null : build._id)}>
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>Logs</span>
                  </button>
                )}
              </div>

              {/* Log panel */}
              {isOpen && hasLogs && (
                <div style={s.logsPanel}>
                  {build.logs.map((log, i) => (
                    <div key={i} style={{ ...s.logLine, color: log.level === 'error' ? '#EF4444' : log.level === 'warn' ? '#F59E0B' : '#94A3B8' }}>
                      <span style={s.logTime}>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  page: { maxWidth: 1400, margin: '0 auto', padding: '48px' },

  pageHeader: { marginBottom: '32px' },

  headerLeft: {},

  backBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontFamily: 'Google Sans, sans-serif', fontSize: '13px', fontWeight: '600', padding: '0 0 8px 0' },

  titleRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },

  title: { fontFamily: 'Google Sans, sans-serif', fontSize: '32px', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' },

  activeBadge: { display: 'inline-block', padding: '6px 12px', background: '#FEE2E2', color: '#DC2626', borderRadius: '6px', fontSize: '12px', fontFamily: 'Google Sans, sans-serif', fontWeight: '600' },

  subtitle: { fontFamily: 'Google Sans, sans-serif', fontSize: '15px', color: '#64748b', margin: 0 },

  searchBar: { position: 'relative', marginBottom: '20px' },

  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' },

  searchInput: { width: '100%', height: '40px', paddingLeft: '36px', paddingRight: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontFamily: 'Google Sans, sans-serif', fontSize: '14px', color: '#374151', background: '#ffffff', outline: 'none', boxSizing: 'border-box' },

  card: { background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' },

  statusCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' },

  errorRow: { display: 'flex', gap: '14px', padding: '18px 24px', alignItems: 'flex-start' },

  errorBody: { flex: 1, minWidth: 0 },

  errorTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '5px' },

  errorTitle: { fontFamily: 'Google Sans, sans-serif', fontSize: '15px', fontWeight: '600', color: '#111827', flex: 1 },

  timestamp: { fontFamily: 'Google Sans, sans-serif', fontSize: '12px', color: '#6B7280', flexShrink: 0, whiteSpace: 'nowrap' },

  meta: { fontFamily: 'Google Sans, sans-serif', fontSize: '13px', color: '#6B7280', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', marginBottom: '6px' },

  dot: { color: '#D1D5DB' },

  codeTag: { display: 'inline-block', padding: '2px 8px', background: '#F3F4F6', color: '#6B7280', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  logsBtn: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', background: '#F9FAFB', cursor: 'pointer', fontFamily: 'Google Sans, sans-serif', fontSize: '12px', fontWeight: '500', color: '#374151', flexShrink: 0 },

  logsPanel: { background: '#0f172a', borderRadius: '0 0 12px 12px', padding: '16px 24px', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.7', maxHeight: '320px', overflowY: 'auto' },

  logLine: { display: 'flex', gap: '12px' },

  logTime: { color: '#475569', flexShrink: 0, minWidth: '72px' },
};
