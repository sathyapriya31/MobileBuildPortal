import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBuilds } from '../store/slices/buildsSlice.js';
import { fetchRepos } from '../store/slices/reposSlice.js';
import { ArrowLeft, Code2, Search } from 'lucide-react';

export default function RepositoriesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const { builds } = useSelector(s => s.builds);
  const { repos, loading } = useSelector(s => s.repos);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.provider) dispatch(fetchRepos({ provider: user.provider }));
    dispatch(fetchBuilds({ limit: 500 }));
  }, [dispatch, user?.provider]);

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins === 0 ? `${secs}s` : `${mins}m ${secs}s`;
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const enriched = repos
    .map(r => {
      const repoBuilds = builds.filter(b => b.projectName === r.name);
      const completed = repoBuilds.filter(b => !['queued', 'building'].includes(b.status));
      const successful = repoBuilds.filter(b => b.status === 'success').length;
      const health = completed.length > 0 ? Math.round((successful / completed.length) * 100) : 0;
      const avgDuration = completed.length > 0
        ? Math.round(completed.reduce((sum, b) => sum + (b.duration || 0), 0) / completed.length)
        : 0;
      const lastBuild = repoBuilds.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      return { ...r, buildCount: repoBuilds.length, health, avgDuration, lastBuildAt: lastBuild?.createdAt || null, lastStatus: lastBuild?.status || null };
    })
    .filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.buildCount - a.buildCount);

  const totalBuilds = builds.length;
  const avgHealth = enriched.length > 0 ? Math.round(enriched.reduce((s, r) => s + r.health, 0) / enriched.length) : 0;

  return (
    <div style={s.page} className="page-repos">
      {/* Header */}
      <div style={s.pageHeader} className="repos-page-header">
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => navigate('/analytics')}>
            <ArrowLeft size={16} />
            <span>Analytics</span>
          </button>
          <h1 style={s.title} className="repos-title">All Repositories</h1>
          <p style={s.subtitle}>Build health and performance across all connected repositories.</p>
        </div>
        <div className="repos-header-stats">
          <div style={s.statPill}><span style={s.statNum}>{repos.length}</span><span style={s.statLbl}>Repositories</span></div>
          <div style={s.statPill}><span style={s.statNum}>{totalBuilds.toLocaleString()}</span><span style={s.statLbl}>Total Builds</span></div>
          <div style={s.statPill}><span style={{ ...s.statNum, color: avgHealth >= 90 ? '#16A34A' : avgHealth >= 70 ? '#F59E0B' : '#EF4444' }}>{avgHealth}%</span><span style={s.statLbl}>Avg Health</span></div>
        </div>
      </div>

      {/* Search */}
      <div style={s.searchBar}>
        <Search size={15} style={s.searchIcon} />
        <input
          style={s.searchInput}
          placeholder="Search repositories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div style={s.card}>
        <div className="repos-table-scroll">
        <table style={{ ...s.table, minWidth: '680px' }}>
          <thead>
            <tr style={s.thead}>
              <th style={s.th}>Repository</th>
              <th style={s.th}>Builds</th>
              <th style={s.th}>Avg Duration</th>
              <th style={s.th}>Health</th>
              <th style={s.th}>Last Build</th>
              <th style={s.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={s.loadingCell}>Loading repositories…</td></tr>
            )}
            {!loading && enriched.length === 0 && (
              <tr><td colSpan={6} style={s.emptyCell}>No repositories found.</td></tr>
            )}
            {enriched.map((repo, idx) => {
              const healthColor = repo.health === 0 ? '#9CA3AF' : repo.health >= 90 ? '#16A34A' : repo.health >= 70 ? '#F59E0B' : '#EF4444';
              const statusColor = { success: '#16A34A', failed: '#DC2626', queued: '#F59E0B', building: '#2563EB', cancelled: '#9CA3AF' };
              return (
                <tr key={idx} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.repoCell}>
                      <div style={s.iconBox}><Code2 size={14} color="#2563EB" /></div>
                      <span style={s.repoName}>{repo.name}</span>
                    </div>
                  </td>
                  <td style={s.td}><span style={s.num}>{repo.buildCount.toLocaleString()}</span></td>
                  <td style={s.td}><span style={s.muted}>{formatTime(repo.avgDuration)}</span></td>
                  <td style={s.td}>
                    <div style={s.barWrap}>
                      <div style={s.barTrack}>
                        <div style={{ ...s.barFill, width: `${repo.health > 0 ? Math.max(repo.health, 2) : 0}%`, background: healthColor }} />
                      </div>
                      <span style={{ ...s.barPct, color: healthColor }}>{repo.health}%</span>
                    </div>
                  </td>
                  <td style={s.td}><span style={s.muted}>{formatDate(repo.lastBuildAt)}</span></td>
                  <td style={s.td}>
                    {repo.lastStatus ? (
                      <span style={{ ...s.statusChip, background: (statusColor[repo.lastStatus] || '#9CA3AF') + '20', color: statusColor[repo.lastStatus] || '#9CA3AF' }}>
                        {repo.lastStatus}
                      </span>
                    ) : <span style={s.muted}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { maxWidth: 1400, margin: '0 auto' },

  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', gap: '24px', flexWrap: 'wrap' },

  headerLeft: { flex: 1 },

  backBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontFamily: 'Google Sans, sans-serif', fontSize: '13px', fontWeight: '600', padding: '0 0 8px 0' },

  title: { fontFamily: 'Google Sans, sans-serif', fontSize: '32px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.02em' },

  subtitle: { fontFamily: 'Google Sans, sans-serif', fontSize: '15px', color: '#64748b', margin: 0 },

  headerStats: { display: 'flex', gap: '16px', flexShrink: 0, flexWrap: 'wrap' },

  statPill: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px 20px', minWidth: '90px' },

  statNum: { fontFamily: 'Google Sans, sans-serif', fontSize: '22px', fontWeight: '700', color: '#111827', lineHeight: '1.2' },

  statLbl: { fontFamily: 'Google Sans, sans-serif', fontSize: '11px', fontWeight: '500', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' },

  searchBar: { position: 'relative', marginBottom: '20px' },

  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' },

  searchInput: { width: '100%', height: '40px', paddingLeft: '36px', paddingRight: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontFamily: 'Google Sans, sans-serif', fontSize: '14px', color: '#374151', background: '#ffffff', outline: 'none', boxSizing: 'border-box' },

  card: { background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' },

  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },

  thead: { background: '#F8FAFC', borderBottom: '1px solid #E5E7EB', height: '48px' },

  th: { padding: '0 16px', fontFamily: 'Google Sans, sans-serif', fontSize: '11px', fontWeight: '500', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' },

  tr: { borderBottom: '1px solid #E5E7EB', height: '62px' },

  td: { padding: '0 16px', fontFamily: 'Google Sans, sans-serif', fontSize: '14px', color: '#374151' },

  repoCell: { display: 'flex', alignItems: 'center', gap: '10px' },

  iconBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: '#EFF6FF', borderRadius: '6px', flexShrink: 0 },

  repoName: { fontFamily: 'Google Sans, sans-serif', fontSize: '14px', fontWeight: '600', color: '#111827' },

  num: { fontFamily: 'Google Sans, sans-serif', fontSize: '14px', fontWeight: '500', color: '#374151' },

  muted: { fontFamily: 'Google Sans, sans-serif', fontSize: '14px', color: '#6B7280' },

  barWrap: { display: 'flex', alignItems: 'center', gap: '8px' },

  barTrack: { width: '60px', height: '6px', background: '#E5E7EB', borderRadius: '999px', overflow: 'hidden', flexShrink: 0 },

  barFill: { height: '100%', borderRadius: '999px' },

  barPct: { fontFamily: 'Google Sans, sans-serif', fontSize: '12px', fontWeight: '600', minWidth: '30px' },

  statusChip: { display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600', fontFamily: 'Google Sans, sans-serif', textTransform: 'capitalize' },

  loadingCell: { textAlign: 'center', padding: '48px', color: '#6B7280', fontFamily: 'Google Sans, sans-serif', fontSize: '14px' },

  emptyCell: { textAlign: 'center', padding: '48px', color: '#9CA3AF', fontFamily: 'Google Sans, sans-serif', fontSize: '14px' },
};
