import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchBuilds } from '../store/slices/buildsSlice.js';
import { Bell, HelpCircle, AlertCircle, AlertTriangle, XCircle, CheckCircle2, Search, ChevronLeft, X } from 'lucide-react';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';

const SEVERITY_CONFIG = {
  error:   { Icon: AlertCircle,  color: '#DC2626', bg: '#FEF2F2', label: 'Error' },
  warning: { Icon: AlertTriangle, color: '#F59E0B', bg: '#FFFBEB', label: 'Warning' },
  expired: { Icon: XCircle,      color: '#DC2626', bg: '#FEF2F2', label: 'Expired' },
};

const getSeverity = (error) => {
  if (!error) return 'error';
  const e = error.toLowerCase();
  if (e.includes('warning')) return 'warning';
  if (e.includes('expired') || e.includes('revoked')) return 'expired';
  return 'error';
};

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

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'error',   label: 'Errors' },
  { key: 'warning', label: 'Warnings' },
];

export default function ErrorMonitorPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(s => s.auth);
  const { builds, loading } = useSelector(s => s.builds);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Repo context passed via navigation state from Analytics page
  const repoContext = location.state?.repo || location.state?.repoName || null;

  useEffect(() => {
    dispatch(fetchBuilds({ limit: 200 }));
  }, [dispatch]);

  const errors = builds
    .filter(b => b.status === 'failed')
    .filter(b => {
      if (repoContext && b.projectName !== repoContext) return false;
      const searchLower = search.toLowerCase();
      if (searchLower && !b.projectName?.toLowerCase().includes(searchLower) && !b.error?.toLowerCase().includes(searchLower)) return false;
      if (severityFilter !== 'all' && getSeverity(b.error) !== severityFilter) return false;
      return true;
    })
    .map(b => ({
      id: b._id,
      title: b.error || 'Build Failed',
      repo: b.projectName || 'Unknown',
      buildNumber: b.buildNumber || b._id?.slice(-6) || '—',
      platform: b.platform || null,
      branch: b.branch || null,
      timestamp: b.finishedAt || b.createdAt,
      severity: getSeverity(b.error),
    }));

  const totalFailed = builds.filter(b => b.status === 'failed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: Colors.bg, ...Fonts.Regular }}>

      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '24px', backgroundColor: Colors.headerBg, borderBottom: '1px solid ' + Colors.headerBorder, padding: '16px 32px', height: '64px', boxSizing: 'border-box' }}>
        <button style={{ background: 'none', border: 'none', color: Colors.headerIcon, cursor: 'pointer', position: 'relative', padding: 0 }}>
          <Bell size={20} />
          {totalFailed > 0 && (
            <span style={{ position: 'absolute', top: 1, right: 1, width: 6, height: 6, backgroundColor: Colors.trendRed, borderRadius: '50%' }} />
          )}
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
              Error Monitor
            </h1>
            <p style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '14px', color: '#5F6368', margin: '4px 0 0 0' }}>
              {loading
                ? 'Loading errors…'
                : `${errors.length} error${errors.length !== 1 ? 's' : ''}${repoContext ? ` for ${repoContext}` : ''}`}
            </p>
          </div>
        </div>

        {/* Filters Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

          {/* Repo context chip */}
          {repoContext && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '13px', fontFamily: 'Google Sans, sans-serif', color: '#2563EB', fontWeight: '500', flexShrink: 0 }}>
              Repo: {repoContext}
              <button
                onClick={() => navigate('/error-monitor', { replace: true })}
                style={{ background: 'none', border: 'none', padding: '0 0 0 2px', cursor: 'pointer', color: '#2563EB', display: 'flex', alignItems: 'center' }}
                title="Clear repo filter"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search errors or repositories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 38px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', fontFamily: 'Google Sans, sans-serif', background: '#fff', color: '#374151', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Severity Pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setSeverityFilter(f.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'Google Sans, sans-serif',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: severityFilter === f.key ? 'none' : '1px solid #E5E7EB',
                  background: severityFilter === f.key ? '#1E293B' : '#fff',
                  color: severityFilter === f.key ? '#fff' : '#6B7280',
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 16px', gap: '14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: Colors.cardShadow }}>
            <div style={{ width: 30, height: 30, border: '3px solid #E5E7EB', borderTop: '3px solid #2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '14px', color: '#9CA3AF' }}>Loading error data…</span>
          </div>
        ) : errors.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 16px', gap: '16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: Colors.cardShadow }}>
            <CheckCircle2 size={44} color={Colors.success} style={{ opacity: 0.7 }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>
                {search || repoContext || severityFilter !== 'all' ? 'No matching errors' : 'All clear!'}
              </div>
              <div style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '13px', color: '#9CA3AF' }}>
                {search || repoContext || severityFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No failed builds found — everything looks healthy'}
              </div>
            </div>
            {(search || severityFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setSeverityFilter('all'); }}
                style={{ padding: '7px 16px', background: 'none', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '13px', fontFamily: 'Google Sans, sans-serif', fontWeight: '600', cursor: 'pointer' }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {errors.map((error) => {
              const { Icon, color, bg } = SEVERITY_CONFIG[error.severity];
              return (
                <div
                  key={error.id}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px 20px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
                >
                  {/* Severity icon */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, background: bg, borderRadius: '8px', flexShrink: 0, marginTop: 2 }}>
                    <Icon size={18} color={color} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '15px', fontWeight: '600', color: '#111827', flex: 1, lineHeight: '1.4' }}>
                        {error.title}
                      </span>
                      <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '12px', color: '#9CA3AF', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {formatRelativeTime(error.timestamp)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                        Repo: <strong style={{ color: '#374151' }}>{error.repo}</strong>
                      </span>
                      <span style={{ color: '#D1D5DB' }}>•</span>
                      <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                        Build <strong style={{ color: '#374151' }}>#{error.buildNumber}</strong>
                      </span>
                      {error.branch && (
                        <>
                          <span style={{ color: '#D1D5DB' }}>•</span>
                          <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '12px', color: '#6B7280' }}>{error.branch}</span>
                        </>
                      )}
                      {error.platform && (
                        <>
                          <span style={{ color: '#D1D5DB' }}>•</span>
                          <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '12px', fontWeight: '600', color: error.platform === 'android' ? '#16A34A' : '#2563EB' }}>
                            {error.platform === 'android' ? 'Android' : 'iOS'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Severity badge */}
                  <span style={{ display: 'inline-block', padding: '3px 10px', background: bg, color, borderRadius: '999px', fontSize: '11px', fontFamily: 'Google Sans, sans-serif', fontWeight: '600', flexShrink: 0, alignSelf: 'flex-start', marginTop: 4, whiteSpace: 'nowrap' }}>
                    {SEVERITY_CONFIG[error.severity].label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
