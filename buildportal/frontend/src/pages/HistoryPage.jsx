import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBuilds, cancelBuild, updateBuildStatus, addBuildLog } from '../store/slices/buildsSlice.js';
import { subscribeToBuild, unsubscribeFromBuild } from '../services/socket.js';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';

const AndroidIcon = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.5 10c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm-11 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm11.5 1.5c0-.8-.7-1.5-1.5-1.5H7.5c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5h1v3c0 .6.4 1 1 1s1-.4 1-1v-3h3v3c0 .6.4 1 1 1s1-.4 1-1v-3h1c.8 0 1.5-.7 1.5-1.5v-6zm-1.8-3.7l1.3-1.3c.4-.4.4-1 0-1.4s-1-.4-1.4 0l-1.5 1.5c-.8-.3-1.7-.5-2.6-.5s-1.8.2-2.6.5L9.3 5.1c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4l1.3 1.3C7.6 8.7 6.7 10 6.2 11.5h11.6c-.5-1.5-1.4-2.8-2.6-3.7z" />
  </svg>
);

const IosIcon = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-1 2.94.9.07 2.01-.52 2.83-1.33z" />
  </svg>
);

const STATUS_COLORS = {
  queued: Colors.warning,
  building: Colors.primary,
  success: Colors.success,
  failed: Colors.error,
  cancelled: Colors.cancelled,
};


export default function HistoryPage() {
  const styles = getStyles();
  const dispatch = useDispatch();
  const { builds, loading, total } = useSelector(s => s.builds);

  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      dispatch(fetchBuilds({
        limit: 50,
        projectName: filterProject,
        status: filterStatus,
        platform: filterPlatform,
        date: filterDate,
      }));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [filterProject, filterStatus, filterPlatform, filterDate]);

  useEffect(() => {
    // Subscribe to active builds
    const activeBuilds = builds.filter(b => ['queued', 'building'].includes(b.status));
    activeBuilds.forEach(b => {
      subscribeToBuild(b._id);
    });
    return () => activeBuilds.forEach(b => unsubscribeFromBuild(b._id));
  }, [builds]);

  const handleCancel = (id) => dispatch(cancelBuild(id));
  const toggleLogs = (id) => setExpanded(expanded === id ? null : id);

  return (
    <div style={styles.page} className="page-history">
      <header className="page-header-flex">
        <h1 style={styles.title} className="text-lg md:text-xl">Build History</h1>
        <span style={styles.badge}>{total} Total</span>
      </header>

      {/* Advanced Filters */}
      <div className="grid-filters">
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Project Name</label>
          <input
            style={styles.input}
            placeholder="Search projects..."
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Status</label>
          <select
            style={styles.select}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Platform</label>
          <select
            style={styles.select}
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
          >
            <option value="all">All</option>
            <option value="android">Android</option>
            <option value="ios">iOS</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Date</label>
          <input
            type="date"
            style={styles.input}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      {loading && <div style={styles.loadingBar} />}

      {/* Tabular Layout */}
      <div style={styles.tableContainer}>
        <table style={styles.table} className="table-history">
          <thead>
            <tr>
              <th style={{ ...styles.th, width: '60px', textAlign: 'center' }}>#</th>
              <th style={styles.th}>Project</th>
              <th style={styles.th}>Branch</th>
              <th style={styles.th}>Platform</th>
              <th style={styles.th}>Triggered By</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Queued At</th>
              <th style={styles.th}>Duration</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Artifact</th>
              <th style={{ ...styles.th, width: '100px', textAlign: 'center' }}>Logs</th>
            </tr>
          </thead>
          <tbody>
            {builds.map((build) => {
              const triggerUser = build.userId;
              const hasAndroid = build.artifacts?.android?.presignedUrl;
              const hasIos = build.artifacts?.ios?.testFlightLink || build.artifacts?.ios?.presignedUrl;

              const dateStr = new Date(build.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              const timeStr = new Date(build.createdAt).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <React.Fragment key={build._id}>
                  <tr style={styles.trRow}>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span style={styles.idBadge}>#{build.buildNumber}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.projectName}>{build.projectName}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.branchBadge}>{build.branch}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.platformChip,
                        color: build.platform === 'android' ? Colors.android : build.platform === 'ios' ? Colors.ios : Colors.primary,
                        background: build.platform === 'android' ? Colors.androidBg : build.platform === 'ios' ? Colors.iosBg : Colors.primaryBg
                      }}>
                        {build.platform === 'android' && <AndroidIcon size={14} style={{ marginRight: '6px' }} />}
                        {build.platform === 'ios' && <IosIcon size={14} style={{ marginRight: '6px' }} />}
                        {build.platform === 'both' && (
                          <span style={{ display: 'inline-flex', gap: '2px', marginRight: '6px', alignItems: 'center' }}>
                            <AndroidIcon size={12} />
                            <IosIcon size={12} />
                          </span>
                        )}
                        {build.platform === 'android' ? 'Android' : build.platform === 'ios' ? 'iOS' : 'Both'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.userCell}>
                        {triggerUser?.avatar ? (
                          <img src={triggerUser.avatar} style={styles.avatarImg} alt={triggerUser.username} />
                        ) : (
                          <div style={styles.avatarFallback}>
                            {(triggerUser?.username || 'S')[0].toUpperCase()}
                          </div>
                        )}
                        <span style={styles.username}>{triggerUser?.username || 'system'}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusChip,
                        background: STATUS_COLORS[build.status] + '22',
                        color: STATUS_COLORS[build.status]
                      }}>
                        {build.status === 'building' ? 'running' : build.status}
                      </span>
                    </td>
                    <td style={styles.td}>{timeStr}</td>
                    <td style={styles.td}>
                      {build.duration ? `⏱ ${build.duration}s` : ['queued', 'building'].includes(build.status) ? '⌛ --' : '-'}
                    </td>
                    <td style={styles.td}>{dateStr}</td>
                    <td style={styles.td}>
                      <div style={styles.artifactCell}>
                        {hasAndroid && (
                          <a href={build.artifacts.android.presignedUrl} target="_blank" rel="noopener noreferrer" style={{ ...styles.actionBtn, ...styles.downloadBtn }}>
                            ⬇ {build.artifacts.android.fileName?.endsWith('.aab') ? 'AAB' : 'APK'}
                          </a>
                        )}
                        {build.artifacts?.ios?.testFlightLink && (
                          <a href={build.artifacts.ios.testFlightLink} target="_blank" rel="noopener noreferrer" style={{ ...styles.actionBtn, ...styles.testFlightBtn }}>
                            ✈ Flight
                          </a>
                        )}
                        {build.artifacts?.ios?.presignedUrl && !build.artifacts?.ios?.testFlightLink && (
                          <a href={build.artifacts.ios.presignedUrl} target="_blank" rel="noopener noreferrer" style={{ ...styles.actionBtn, ...styles.ipaBtn }}>
                            ⬇ IPA
                          </a>
                        )}
                        {!hasAndroid && !hasIos && <span style={{ color: Colors.textFaint }}>-</span>}
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={styles.logsActionCell}>
                        {['queued', 'building'].includes(build.status) && (
                          <button style={styles.cancelBtn} onClick={() => handleCancel(build._id)}>Cancel</button>
                        )}
                        <button
                          style={{
                            ...styles.actionBtn,
                            ...styles.logsBtn,
                            ...(build.status === 'failed' ? styles.errorLogsBtn : {}),
                          }}
                          onClick={() => toggleLogs(build._id)}
                        >
                          {build.status === 'failed' ? '⚠️ Error Logs' : expanded === build._id ? '▲ Logs' : '▼ Logs'}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded log console overlay */}
                  {expanded === build._id && (
                    <tr>
                      <td colSpan="11" style={styles.logsRowTd}>
                        {build.status === 'failed' && (build.error || build.logs?.some(l => l.level === 'error')) && (
                          <div style={styles.errorBanner}>
                            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                            <div>
                              <strong>Build Failure Details:</strong>
                              <div style={styles.errorMessage}>
                                {build.error || 'Check compilation error logs below.'}
                              </div>
                            </div>
                          </div>
                        )}
                        <div style={styles.logsPanel}>
                          {(build.logs || []).length === 0 ? (
                            <span style={{ color: Colors.textFaint }}>No logs yet.</span>
                          ) : (
                            build.logs.map((log, i) => (
                              <div key={i} style={{ ...styles.logLine, color: log.level === 'error' ? Colors.consoleTextError : log.level === 'warn' ? Colors.consoleTextWarn : Colors.textMuted }}>
                                <span style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span>{log.message}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {!loading && builds.length === 0 && (
              <tr>
                <td colSpan="11" style={styles.tdEmpty}>
                  <div style={styles.empty}>
                    <span style={{ fontSize: '3rem' }}>📭</span>
                    <p style={{ margin: 'var(--space-2) 0 0 0', color: 'var(--text-muted)' }}>No builds match the specified filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getStyles() {
  return {
    page: { maxWidth: 1200, margin: '0 auto' },
    title: { ...Fonts.ExtraBold, color: Colors.text },
    badge: { padding: '3px 10px', borderRadius: 'var(--radius-full)', background: Colors.surface, border: `1px solid ${Colors.border}`, fontSize: 'var(--text-xs)', color: Colors.text },
    loadingBar: { height: 2, background: Colors.primary, borderRadius: 2, marginBottom: 'var(--space-4)', animation: 'pulse 1.5s ease infinite' },

    filterGroup: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' },
    filterLabel: { fontSize: 'var(--text-xs)', ...Fonts.SemiBold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: { padding: 'var(--space-2) var(--space-3)', background: Colors.surface2, border: `1px solid ${Colors.border}`, borderRadius: 'var(--radius-md)', color: Colors.text, fontSize: 'var(--text-sm)', outline: 'none', transition: 'border-color var(--transition)' },
    select: { padding: 'var(--space-2) var(--space-3)', background: Colors.surface2, border: `1px solid ${Colors.border}`, borderRadius: 'var(--radius-md)', color: Colors.text, fontSize: 'var(--text-sm)', outline: 'none', cursor: 'pointer' },

    tableContainer: { background: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: 'var(--radius-lg)', overflowX: 'auto', width: '100%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' },
    th: { padding: 'var(--space-3) var(--space-4)', background: Colors.surface2, borderBottom: `1px solid ${Colors.border}`, color: Colors.textMuted, ...Fonts.SemiBold, fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    td: { padding: 'var(--space-4)', borderBottom: `1px solid ${Colors.border}`, verticalAlign: 'middle', color: Colors.text },
    trRow: { transition: 'background var(--transition)', borderBottom: `1px solid ${Colors.border}` },
    tdEmpty: { padding: 'var(--space-12)', textAlign: 'center' },

    idBadge: { fontFamily: 'monospace', fontWeight: 600, color: Colors.textMuted, background: Colors.surface3, padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' },
    projectName: { ...Fonts.SemiBold, fontSize: 'var(--text-sm)', color: Colors.text, display: 'block' },
    branchBadge: { fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: Colors.textMuted, background: Colors.surface2, padding: '2px 8px', borderRadius: 'var(--radius-full)', border: `1px solid ${Colors.border}`, display: 'inline-block' },
    platformChip: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', ...Fonts.SemiBold, padding: '2px 8px', borderRadius: 'var(--radius-full)' },

    userCell: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' },
    avatarImg: { width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', background: Colors.surface3, border: `1px solid ${Colors.border}` },
    avatarFallback: { width: 24, height: 24, borderRadius: '50%', background: Colors.primaryBg, color: Colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', ...Fonts.SemiBold, border: `1px solid ${Colors.border}` },
    username: { fontSize: 'var(--text-xs)', color: Colors.text, ...Fonts.Medium },

    statusChip: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', ...Fonts.SemiBold, textTransform: 'capitalize' },

    artifactCell: { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', alignItems: 'flex-start' },
    actionBtn: { padding: '4px 10px', borderRadius: 'var(--radius-md)', border: `1px solid ${Colors.border}`, fontSize: 'var(--text-xs)', ...Fonts.SemiBold, cursor: 'pointer', transition: 'all var(--transition)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' },
    downloadBtn: { border: `1px solid ${Colors.android}`, color: Colors.android, background: Colors.androidBg },
    testFlightBtn: { border: `1px solid ${Colors.ios}`, color: Colors.ios, background: Colors.iosBg },
    ipaBtn: { border: `1px solid ${Colors.primary}`, color: Colors.primary, background: Colors.primaryBg },

    logsActionCell: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' },
    cancelBtn: { padding: '4px 10px', borderRadius: 'var(--radius-md)', border: `1px solid ${Colors.error}`, color: Colors.error, fontSize: 'var(--text-xs)', ...Fonts.SemiBold, background: Colors.errorBg, cursor: 'pointer' },
    logsBtn: { color: Colors.textMuted, background: Colors.surface2 },
    errorLogsBtn: { background: Colors.errorBg, color: Colors.consoleTextError, border: `1px solid ${Colors.error}66` },

    logsRowTd: { padding: '0', background: Colors.consoleBg, borderBottom: `1px solid ${Colors.border}` },
    errorBanner: { background: Colors.errorBg, borderLeft: `4px solid ${Colors.error}`, padding: 'var(--space-3) var(--space-5)', color: '#fca5a5', fontSize: 'var(--text-sm)', display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', borderBottom: `1px solid ${Colors.error}33` },
    errorMessage: { fontFamily: 'monospace', marginTop: '4px', background: 'rgba(0, 0, 0, 0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: 'var(--text-xs)', whiteSpace: 'pre-wrap' },
    logsPanel: { padding: 'var(--space-4) var(--space-5)', background: Colors.consoleBg, fontFamily: 'monospace', fontSize: '0.78rem', maxHeight: 240, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' },
    logLine: { display: 'flex', gap: 'var(--space-3)' },
    logTime: { color: Colors.textFaint, flexShrink: 0 },
    empty: { textAlign: 'center', padding: 'var(--space-8)', color: Colors.textMuted },
  };
}