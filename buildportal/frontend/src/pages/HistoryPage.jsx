import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBuilds, cancelBuild, updateBuildStatus, addBuildLog } from '../store/slices/buildsSlice.js';
import { subscribeToBuild, unsubscribeFromBuild } from '../services/socket.js';
import Colors from '../config/colors.js';

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

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const GitBranchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const TimerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronLeftIcon = ({ disabled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={disabled ? '#CBD5E1' : '#475569'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = ({ disabled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={disabled ? '#CBD5E1' : '#475569'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const SuccessDot = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" style={{ flexShrink: 0 }}>
    <circle cx="4" cy="4" r="4" fill="#15803D" />
  </svg>
);

const RunningSpinner = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, animation: 'spin 1.2s linear infinite' }}>
    <circle cx="5" cy="5" r="3.5" stroke="#0369A1" strokeWidth="1.5" strokeDasharray="10 5" strokeLinecap="round" />
  </svg>
);

const FailedDot = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
    <circle cx="5" cy="5" r="5" fill="#B91C1C" />
    <path d="M3.2 5h3.6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const QueuedIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
    <rect x="0.5" y="0.5" width="9" height="9" rx="2" fill="#64748B" />
    <rect x="2.5" y="3" width="5" height="1.1" rx="0.55" fill="white" />
    <rect x="2.5" y="5.9" width="5" height="1.1" rx="0.55" fill="white" />
  </svg>
);

const STATUS_PILL = {
  success:   { background: '#BBF7D0', color: '#15803D' },
  building:  { background: '#BFDBFE', color: '#0369A1' },
  failed:    { background: '#FECACA', color: '#B91C1C' },
  queued:    { background: '#DDE3F5', color: '#64748B' },
  cancelled: { background: '#F1F5F9', color: '#64748B' },
};

const ITEMS_PER_PAGE = 10;

function statusLabel(status) {
  if (status === 'building') return 'RUNNING';
  return status.toUpperCase();
}

function StatusIcon({ status }) {
  if (status === 'success') return <SuccessDot />;
  if (status === 'building') return <RunningSpinner />;
  if (status === 'failed') return <FailedDot />;
  if (status === 'queued') return <QueuedIcon />;
  return null;
}

export default function HistoryPage() {
  const dispatch = useDispatch();
  const { builds, loading, total } = useSelector(s => s.builds);

  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(fetchBuilds({
        limit: 50,
        projectName: filterProject,
        status: filterStatus,
        platform: filterPlatform,
        date: filterDate,
      }));
    }, 300);
    return () => clearTimeout(t);
  }, [filterProject, filterStatus, filterPlatform, filterDate]);

  useEffect(() => {
    builds.filter(b => ['queued', 'building'].includes(b.status)).forEach(b => {
      subscribeToBuild(b._id, {
        onStatus: (data) => dispatch(updateBuildStatus(data)),
        onLog: (data) => dispatch(addBuildLog({ buildId: data.buildId, ...data })),
        onComplete: (data) => dispatch(updateBuildStatus(data)),
      });
    });
    return () => builds.forEach(b => unsubscribeFromBuild(b._id));
  }, [builds.length]);

  useEffect(() => { setCurrentPage(1); }, [filterProject, filterStatus, filterPlatform, filterDate]);

  const handleCancel = (id) => dispatch(cancelBuild(id));
  const toggleLogs = (id) => setExpanded(expanded === id ? null : id);

  const totalPages = Math.ceil(builds.length / ITEMS_PER_PAGE);
  const pagedBuilds = builds.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const pageNumbers = (() => {
    const max = 3;
    let s = Math.max(1, currentPage - 1);
    let e = Math.min(totalPages, s + max - 1);
    if (e - s < max - 1) s = Math.max(1, e - max + 1);
    const arr = [];
    for (let i = s; i <= e; i++) arr.push(i);
    return arr;
  })();

  return (
    <div style={S.page} className="page-history">

      {/* ── Header ── */}
      <header style={S.header}>
        <h1 style={S.title}>Build History</h1>
        <span style={S.totalBadge}>{total} TOTAL</span>
      </header>

      {/* ── Filters ── */}
      <div style={S.filtersRow} className="history-filters-row">
        {/* Search */}
        <div style={{ ...S.filterCard, flex: '2.2 1 0' }}>
          <label style={S.filterLabel}>SEARCH REPOSITORIES</label>
          <div style={S.searchWrapper}>
            <SearchIcon />
            <input
              style={S.searchInput}
              placeholder="e.g. NearMind, Sprite-Core..."
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="content-search-input"
            />
          </div>
        </div>

        {/* Status */}
        <div style={{ ...S.filterCard, flex: '1 1 0' }}>
          <label style={S.filterLabel}>STATUS</label>
          <div style={S.selectBox}>
            <select style={S.selectEl} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
            <span style={S.selectChevron}><ChevronDownIcon /></span>
          </div>
        </div>

        {/* Platform */}
        <div style={{ ...S.filterCard, flex: '1 1 0' }}>
          <label style={S.filterLabel}>PLATFORM</label>
          <div style={S.selectBox}>
            <select style={S.selectEl} value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}>
              <option value="all">All Platforms</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
              <option value="both">Both</option>
            </select>
            <span style={S.selectChevron}><ChevronDownIcon /></span>
          </div>
        </div>

        {/* Date */}
        <div style={{ ...S.filterCard, flex: '1.2 1 0' }}>
          <label style={S.filterLabel}>DATE RANGE</label>
          <div style={S.dateBox}>
            <input type="date" style={S.dateInput} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            <span style={S.calendarIcon}><CalendarIcon /></span>
          </div>
        </div>
      </div>

      {loading && <div style={S.loadingBar} />}

      {/* ── Table ── */}
      <div style={S.tableCard}>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table} className="table-history">
            <colgroup>
              <col style={{ width: '100px' }} />
              <col style={{ width: '170px' }} />
              <col style={{ width: '155px' }} />
              <col style={{ width: '115px' }} />
              <col style={{ width: '165px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '88px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '85px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '130px' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...S.th, textAlign: 'center' }}># ID</th>
                <th style={S.th}>PROJECT</th>
                <th style={S.th}>BRANCH</th>
                <th style={S.th}>PLATFORM</th>
                <th style={S.th}>TRIGGERED BY</th>
                <th style={S.th}>STATUS</th>
                <th style={S.th}>QUEUED</th>
                <th style={S.th}>DURATION</th>
                <th style={S.th}>DATE</th>
                <th style={S.th}>ARTIFACT</th>
                <th style={{ ...S.th, textAlign: 'center' }}>LOGS</th>
              </tr>
            </thead>
            <tbody>
              {pagedBuilds.map((build) => {
                const triggerUser = build.userId;
                const hasAndroid = build.artifacts?.android?.presignedUrl;
                const hasIos = build.artifacts?.ios?.testFlightLink || build.artifacts?.ios?.presignedUrl;
                const d = new Date(build.createdAt);
                const dateDay = d.getDate();
                const dateMon = d.toLocaleString('default', { month: 'short' });
                const dateYear = d.getFullYear();
                const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                const pill = STATUS_PILL[build.status] || STATUS_PILL.cancelled;
                const platformColor = build.platform === 'android' ? '#16A34A' : build.platform === 'ios' ? '#0284C7' : '#475569';

                return (
                  <React.Fragment key={build._id}>
                    <tr
                      style={S.tr}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
                    >
                      {/* # ID */}
                      <td style={{ ...S.td, textAlign: 'center', padding: '12px 8px' }}>
                        <span style={S.idBadge}>#{build.buildNumber}</span>
                      </td>

                      {/* PROJECT */}
                      <td style={S.td}>
                        <span style={S.projectName}>{build.projectName}</span>
                      </td>

                      {/* BRANCH */}
                      <td style={S.td}>
                        <div style={S.branchCell}>
                          <GitBranchIcon />
                          <span style={S.branchText}>{build.branch}</span>
                        </div>
                      </td>

                      {/* PLATFORM */}
                      <td style={S.td}>
                        <div style={{ ...S.platformCell, color: platformColor }}>
                          {build.platform === 'android' && <AndroidIcon size={15} />}
                          {build.platform === 'ios' && <IosIcon size={15} />}
                          {build.platform === 'both' && (
                            <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
                              <AndroidIcon size={13} />
                              <IosIcon size={13} />
                            </span>
                          )}
                          <span style={S.platformLabel}>
                            {build.platform === 'android' ? 'Android' : build.platform === 'ios' ? 'iOS' : 'Both'}
                          </span>
                        </div>
                      </td>

                      {/* TRIGGERED BY */}
                      <td style={S.td}>
                        <div style={S.userCell}>
                          {triggerUser?.avatar ? (
                            <img src={triggerUser.avatar} style={S.avatar} alt={triggerUser.username} />
                          ) : (
                            <div style={S.avatarFallback}>
                              {(triggerUser?.username || 'S')[0].toUpperCase()}
                            </div>
                          )}
                          <span style={S.username}>{triggerUser?.username || 'system'}</span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td style={S.td}>
                        <span style={{ ...S.statusPill, ...pill }}>
                          <StatusIcon status={build.status} />
                          {statusLabel(build.status)}
                        </span>
                      </td>

                      {/* QUEUED */}
                      <td style={S.td}>
                        <span style={S.timeText}>{timeStr}</span>
                      </td>

                      {/* DURATION */}
                      <td style={S.td}>
                        <div style={S.durationCell}>
                          {build.duration ? (
                            <>
                              <TimerIcon />
                              <span style={S.durationText}>{build.duration}s</span>
                            </>
                          ) : ['queued', 'building'].includes(build.status) ? (
                            <>
                              <TimerIcon />
                              <span style={S.durationText}>--</span>
                            </>
                          ) : (
                            <span style={S.dash}>-</span>
                          )}
                        </div>
                      </td>

                      {/* DATE */}
                      <td style={S.td}>
                        <div style={S.dateCell}>
                          <span>{dateDay} {dateMon}</span>
                          <span>{dateYear}</span>
                        </div>
                      </td>

                      {/* ARTIFACT */}
                      <td style={S.td}>
                        <div style={S.artifactCell}>
                          {hasAndroid && (
                            <a href={build.artifacts.android.presignedUrl} target="_blank" rel="noopener noreferrer" style={{ ...S.artifactBtn, ...S.apkBtn }}>
                              ⬇ {build.artifacts.android.fileName?.endsWith('.aab') ? 'AAB' : 'APK'}
                            </a>
                          )}
                          {build.artifacts?.ios?.testFlightLink && (
                            <a href={build.artifacts.ios.testFlightLink} target="_blank" rel="noopener noreferrer" style={{ ...S.artifactBtn, ...S.flightBtn }}>
                              ✈ Flight
                            </a>
                          )}
                          {build.artifacts?.ios?.presignedUrl && !build.artifacts?.ios?.testFlightLink && (
                            <a href={build.artifacts.ios.presignedUrl} target="_blank" rel="noopener noreferrer" style={{ ...S.artifactBtn, ...S.ipaBtn }}>
                              ⬇ IPA
                            </a>
                          )}
                          {!hasAndroid && !hasIos && <span style={S.dash}>-</span>}
                        </div>
                      </td>

                      {/* LOGS */}
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <div style={S.logsCell}>
                          {['queued', 'building'].includes(build.status) && (
                            <button style={S.cancelBtn} onClick={() => handleCancel(build._id)}>Cancel</button>
                          )}
                          <button
                            style={{
                              ...S.logsBtn,
                              ...(build.status === 'failed' ? S.errorLogsBtn : {}),
                            }}
                            onClick={() => toggleLogs(build._id)}
                          >
                            {build.status === 'failed' ? '⚠️ Error' : expanded === build._id ? '▲ Logs' : '▼ Logs'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expanded === build._id && (
                      <tr>
                        <td colSpan="11" style={S.logsRowTd}>
                          {build.status === 'failed' && (build.error || build.logs?.some(l => l.level === 'error')) && (
                            <div style={S.errorBanner}>
                              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                              <div>
                                <strong>Build Failure Details:</strong>
                                <div style={S.errorMsg}>{build.error || 'Check compilation error logs below.'}</div>
                              </div>
                            </div>
                          )}
                          <div style={S.logsPanel}>
                            {(build.logs || []).length === 0 ? (
                              <span style={{ color: Colors.textFaint }}>No logs yet.</span>
                            ) : (
                              build.logs.map((log, i) => (
                                <div key={i} style={{ ...S.logLine, color: log.level === 'error' ? Colors.consoleTextError : log.level === 'warn' ? Colors.consoleTextWarn : Colors.textMuted }}>
                                  <span style={S.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</span>
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
                  <td colSpan="11" style={{ padding: '48px', textAlign: 'center' }}>
                    <div style={{ textAlign: 'center', color: Colors.textMuted }}>
                      <span style={{ fontSize: '3rem' }}>📭</span>
                      <p style={{ marginTop: '8px' }}>No builds match the specified filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {builds.length > 0 && (
          <div style={S.paginationRow} className="history-pagination">
            <span style={S.paginationInfo}>
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, builds.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, builds.length)} of {builds.length} builds
            </span>
            <div style={S.pageControls}>
              <button
                style={S.pageChevron}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon disabled={currentPage === 1} />
              </button>

              {pageNumbers.map(n => (
                <button
                  key={n}
                  style={n === currentPage ? S.pageActive : S.pageBtn}
                  onClick={() => setCurrentPage(n)}
                >
                  {n}
                </button>
              ))}

              <button
                style={S.pageChevron}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon disabled={currentPage === totalPages} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const GS = "'Google Sans', sans-serif";

const S = {
  page: { width: '100%' },

  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' },
  title: { fontSize: '32px', fontWeight: '700', lineHeight: '1.2', color: '#0F172A', fontFamily: GS },
  totalBadge: {
    background: '#DBEAFE', color: '#0369A1',
    height: '36px', padding: '0 16px', borderRadius: '18px',
    fontSize: '14px', fontWeight: '700', fontFamily: GS,
    display: 'inline-flex', alignItems: 'center',
  },

  loadingBar: { height: 2, background: '#0F4CB5', borderRadius: 2, marginBottom: '16px', animation: 'pulse 1.5s ease infinite' },

  filtersRow: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
  filterCard: {
    background: '#FFFFFF', border: '1px solid #D6DCE5', borderRadius: '12px',
    padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px',
    minHeight: '88px', justifyContent: 'center', minWidth: '0',
  },
  filterLabel: { fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: GS },

  searchWrapper: {
    display: 'flex', alignItems: 'center', gap: '10px',
    height: '44px', background: '#EEF2F7', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 12px',
  },
  searchInput: { flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#0F172A', fontFamily: GS, minWidth: 0 },

  selectBox: {
    position: 'relative', height: '44px',
    background: '#EEF2F7', border: '1px solid #CBD5E1', borderRadius: '6px',
    display: 'flex', alignItems: 'center',
  },
  selectEl: {
    width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none',
    padding: '0 34px 0 12px', fontSize: '14px', color: '#0F172A', fontFamily: GS,
    appearance: 'none', cursor: 'pointer',
  },
  selectChevron: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' },

  dateBox: {
    position: 'relative', height: '44px',
    background: '#EEF2F7', border: '1px solid #CBD5E1', borderRadius: '6px',
    display: 'flex', alignItems: 'center',
  },
  dateInput: { width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '0 36px 0 12px', fontSize: '14px', color: '#0F172A', fontFamily: GS, cursor: 'pointer' },
  calendarIcon: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' },

  tableCard: { background: '#FFFFFF', border: '1px solid #D6DCE5', borderRadius: '12px', overflow: 'hidden' },
  table: { width: '100%', minWidth: '1200px', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' },

  th: {
    padding: '0 16px', height: '56px', background: '#F1F5F9',
    borderBottom: '1px solid #CBD5E1', color: '#475569',
    fontWeight: '600', fontSize: '12px', textTransform: 'uppercase',
    letterSpacing: '0.05em', fontFamily: GS, whiteSpace: 'nowrap', verticalAlign: 'middle',
  },
  td: {
    padding: '12px 16px', borderBottom: '1px solid #E2E8F0',
    verticalAlign: 'middle', overflow: 'hidden', color: '#0F172A',
  },
  tr: { background: '#FFFFFF', transition: 'background 0.12s ease' },

  idBadge: {
    background: '#DBEAFE', color: '#0369A1',
    padding: '4px 10px', borderRadius: '4px',
    fontSize: '13px', fontWeight: '600', fontFamily: GS,
    display: 'inline-block', whiteSpace: 'nowrap',
  },
  projectName: { fontSize: '15px', fontWeight: '700', color: '#1E293B', fontFamily: GS, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  branchCell: { display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' },
  branchText: { fontSize: '13px', color: '#475569', fontFamily: GS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  platformCell: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600' },
  platformLabel: { fontSize: '14px', fontFamily: GS },

  userCell: { display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' },
  avatar: { width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  avatarFallback: { width: 28, height: 28, borderRadius: '50%', background: '#DBEAFE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0, fontFamily: GS },
  username: { fontSize: '13px', fontWeight: '500', color: '#0F172A', fontFamily: GS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  statusPill: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
    height: '24px', padding: '0 16px', borderRadius: '999px', minWidth: '90px',
    fontSize: '11px', fontWeight: '700', fontFamily: GS, whiteSpace: 'nowrap',
  },

  timeText: { fontSize: '13px', color: '#475569', fontFamily: GS },

  durationCell: { display: 'flex', alignItems: 'center', gap: '5px' },
  durationText: { fontSize: '13px', color: '#475569', fontFamily: GS },
  dash: { fontSize: '13px', color: '#94A3B8', fontFamily: GS },

  dateCell: { display: 'flex', flexDirection: 'column', fontSize: '13px', color: '#475569', lineHeight: '1.35', fontFamily: GS },

  artifactCell: { display: 'flex', flexDirection: 'column', gap: '6px' },
  artifactBtn: { padding: '3px 9px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none', fontFamily: GS, whiteSpace: 'nowrap', width: '80px' },
  apkBtn: { border: '1px solid #16A34A', color: '#16A34A', background: 'rgba(22,163,74,0.08)' },
  flightBtn: { border: '1px solid #0284C7', color: '#0284C7', background: 'rgba(2,132,199,0.08)' },
  ipaBtn: { border: '1px solid #0369A1', color: '#0369A1', background: '#EFF6FF' },

  logsCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', justifyContent: 'center' },
  cancelBtn: { padding: '3px 9px', borderRadius: '4px', border: '1px solid #B91C1C', color: '#B91C1C', fontSize: '12px', fontWeight: '600', background: '#FECACA', cursor: 'pointer', fontFamily: GS, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px' },
  logsBtn: { padding: '3px 9px', borderRadius: '4px', border: '1px solid #CBD5E1', color: '#64748B', fontSize: '12px', fontWeight: '600', background: '#F1F5F9', cursor: 'pointer', fontFamily: GS, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '80px' },
  errorLogsBtn: { background: '#FECACA', color: '#B91C1C', border: '1px solid rgba(185,28,28,0.4)' },

  logsRowTd: { padding: '0', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' },
  errorBanner: { background: 'rgba(220,38,38,0.08)', borderLeft: '4px solid #dc2626', padding: '12px 20px', color: '#fca5a5', fontSize: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start', borderBottom: '1px solid rgba(220,38,38,0.2)' },
  errorMsg: { fontFamily: 'monospace', marginTop: '4px', background: 'rgba(0,0,0,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'pre-wrap', color: '#dc2626' },
  logsPanel: { padding: '16px 20px', background: '#F8FAFC', fontFamily: 'monospace', fontSize: '0.78rem', maxHeight: 240, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' },
  logLine: { display: 'flex', gap: '12px' },
  logTime: { color: '#94a3b8', flexShrink: 0 },

  paginationRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 24px', borderTop: '1px solid #E2E8F0',
  },
  paginationInfo: { fontSize: '13px', color: '#475569', fontFamily: GS },
  pageControls: { display: 'flex', alignItems: 'center', gap: '4px' },
  pageChevron: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  pageActive: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f4cb5', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: GS },
  pageBtn: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontFamily: GS },
};
