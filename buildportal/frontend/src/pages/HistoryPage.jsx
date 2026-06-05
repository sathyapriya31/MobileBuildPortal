import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBuilds, cancelBuild, updateBuildStatus, addBuildLog } from '../store/slices/buildsSlice.js';
import { subscribeToBuild, unsubscribeFromBuild } from '../services/socket.js';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';
import {
  Bell,
  HelpCircle,
  GitBranch,
  Download,
  Search,
  CheckCircle,
  Key,
  Rocket,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertTriangle,
  ChevronDown,
  Smartphone,
  ChevronsUpDown
} from 'lucide-react';

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

const getLogIcon = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes('verifying') || msg.includes('checking'))
    return <Search size={13} style={{ color: '#0ea5e9', marginTop: 2, flexShrink: 0 }} />;
  if (msg.includes('found') || msg.includes('verified') || msg.includes('success') || msg.includes('complete') || msg.includes('dispatched successfully'))
    return <CheckCircle size={13} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />;
  if (msg.includes('keystore') || msg.includes('credential') || msg.includes('key'))
    return <Key size={13} style={{ color: '#f59e0b', marginTop: 2, flexShrink: 0 }} />;
  if (msg.includes('dispatched') || msg.includes('started') || msg.includes('queued'))
    return <Rocket size={13} style={{ color: '#6366f1', marginTop: 2, flexShrink: 0 }} />;
  if (msg.includes('http') || msg.includes('https') || msg.includes('url'))
    return <LinkIcon size={13} style={{ color: '#3b82f6', marginTop: 2, flexShrink: 0 }} />;
  return null;
};

const getGithubRunUrl = (build) => {
  if (build.githubRunUrl) return build.githubRunUrl;
  if (!build.repoUrl) return '';
  const cleanUrl = build.repoUrl.replace(/\.git$/, '');
  const parts = cleanUrl.split('/');
  const repo = parts.pop();
  const owner = parts.pop();
  return owner && repo ? `https://github.com/${owner}/${repo}/actions` : '';
};

const renderLogMessage = (message, level) => {
  if (!message) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = message.split(urlRegex);

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#0c5df4',
            textDecoration: 'underline',
            fontWeight: 600,
            wordBreak: 'break-all',
            cursor: 'pointer'
          }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function HistoryPage() {
  const dispatch = useDispatch();
  const { builds, loading, total, metrics } = useSelector(s => s.builds);
  const { user } = useSelector(s => s.auth);

  const [localProject, setLocalProject] = useState('');
  const [localStatus, setLocalStatus] = useState('all');
  const [localPlatform, setLocalPlatform] = useState('all');
  const [localDate, setLocalDate] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);

  const loadBuilds = (currentPage = page, searchParams = {}) => {
    dispatch(fetchBuilds({
      page: currentPage,
      limit: 10,
      projectName: searchParams.projectName !== undefined ? searchParams.projectName : localProject,
      status: searchParams.status !== undefined ? searchParams.status : localStatus,
      platform: searchParams.platform !== undefined ? searchParams.platform : localPlatform,
      date: searchParams.date !== undefined ? searchParams.date : localDate,
    }));
  };

  useEffect(() => { loadBuilds(1); }, []);

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

  const handleCancel = (id) => dispatch(cancelBuild(id));
  const toggleLogs = (id) => setExpanded(expanded === id ? null : id);
  const handleApplyFilters = () => { setPage(1); loadBuilds(1); };
  const handleClearFilters = () => {
    setLocalProject(''); setLocalStatus('all'); setLocalPlatform('all'); setLocalDate('');
    setPage(1);
    loadBuilds(1, { projectName: '', status: 'all', platform: 'all', date: '' });
  };
  const handlePageChange = (newPage) => { setPage(newPage); loadBuilds(newPage); };

  // Metrics
  const displayTotalBuilds = metrics ? metrics.totalBuilds : 0;
  const totalBuildsTrend = metrics ? metrics.totalBuildsTrend : 0;

  const successRate = metrics ? metrics.successRate.toFixed(1) : '0.0';
  const successRateTrend = metrics ? metrics.successRateTrend : 0;

  const avgDurationSeconds = metrics ? metrics.avgDuration : 0;
  const avgM = Math.floor(avgDurationSeconds / 60);
  const avgS = Math.round(avgDurationSeconds % 60);
  const avgDurationTrend = metrics ? metrics.avgDurationTrend : 0;

  const activeRunners = metrics ? metrics.activeRunners : 0;
  const filledSegments = Math.min(4, Math.max(0, Math.round((activeRunners / 12) * 4)));

  // Pagination
  const startIdx = total > 0 ? (page - 1) * 10 + 1 : 0;
  const endIdx = Math.min(page * 10, total);
  const totalPages = Math.ceil(total / 10);
  const pageNumbers = [];
  for (let i = 1; i <= Math.min(5, totalPages); i++) pageNumbers.push(i);

  const renderStatus = (status) => {
    const map = {
      success: { bg: '#e6f4ea', color: '#137333', dot: '#137333', label: 'SUCCESS' },
      failed: { bg: '#fce8e6', color: '#c5221f', dot: '#c5221f', label: 'FAILED' },
      cancelled: { bg: '#f1f3f4', color: '#3c4043', dot: '#3c4043', label: 'CANCELLED' },
      building: { bg: '#e8f0fe', color: '#1a73e8', dot: '#1a73e8', label: 'RUNNING' },
      queued: { bg: '#fef7e0', color: '#b06000', dot: '#b06000', label: 'QUEUED' },
    };
    const s = map[status] || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: status.toUpperCase() };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 12px', borderRadius: 999,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
        backgroundColor: s.bg, color: s.color
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.dot, flexShrink: 0 }} />
        {s.label}
      </span>
    );
  };

  const formatStackedDate = (dateVal) => {
    if (!dateVal) return <span style={{ color: '#5f6368' }}>-</span>;
    const d = new Date(dateVal);
    const month = d.toLocaleDateString(undefined, { month: 'short' });
    const day = d.toLocaleDateString(undefined, { day: 'numeric' });
    const year = d.getFullYear();
    return (
      <div style={{ fontSize: 12, fontWeight: 600, color: '#3c4043', whiteSpace: 'nowrap' }}>
        {month} {day}, {year}
      </div>
    );
  };

  const formatDuration = (d, status) => {
    if (d) { const m = Math.floor(d / 60); const s = Math.round(d % 60); return `${m}m ${s}s`; }
    if (['queued', 'building'].includes(status)) return '--';
    return '-';
  };

  // Shared input style
  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    height: 36,
    padding: '0 12px',
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f1f3f4',
    border: '1px solid #dadce0',
    borderRadius: 8,
    outline: 'none',
  };

  const selectStyle = {
    ...inputStyle,
    paddingRight: 32,
    appearance: 'none',
    cursor: 'pointer',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 10,
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 4,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: Colors.bg, ...Fonts.Regular }}>

      {/* ── Top Header Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '24px',
        backgroundColor: Colors.headerBg,
        borderBottom: '1px solid ' + Colors.headerBorder,
        padding: '16px 32px',
        height: '64px',
        boxSizing: 'border-box'
      }}>
        <button style={{ background: 'none', border: 'none', color: Colors.headerIcon, cursor: 'pointer', position: 'relative', padding: 0 }}>
          <Bell size={20} />
          <span style={{ position: 'absolute', top: 1, right: 1, width: 6, height: 6, backgroundColor: Colors.trendRed, borderRadius: '50%' }} />
        </button>
        <button style={{ background: 'none', border: 'none', color: Colors.headerIcon, cursor: 'pointer', padding: 0 }}>
          <HelpCircle size={20} />
        </button>
        {user && <img src={user.avatar} alt={user.name} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid ' + Colors.headerBorder }} />}
      </div>

      {/* ── Page Content Container ── */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>

        {/* ── Metric Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>

          {/* Total Builds */}
          <div className="metric-card" style={{ backgroundColor: Colors.cardBg, border: '1px solid ' + Colors.cardBorder, borderRadius: 12, padding: '16px 20px', boxShadow: Colors.cardShadow }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: Colors.textMuted, fontFamily: Fonts.Medium.fontFamily, letterSpacing: '0.01em' }}>Total Builds</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 28, color: Colors.metricPrimary, ...Fonts.Bold, lineHeight: 1 }}>
                {displayTotalBuilds.toLocaleString()}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 10, fontWeight: '600', color: totalBuildsTrend >= 0 ? Colors.trendGreen : Colors.trendRed, fontFamily: Fonts.Regular.fontFamily, lineHeight: 1.2 }}>
                <span>{totalBuildsTrend >= 0 ? `+${totalBuildsTrend}%` : `${totalBuildsTrend}%`}</span>
                <span style={{ fontSize: 11, fontWeight: 'bold' }}>{totalBuildsTrend >= 0 ? '↑' : '↓'}</span>
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="metric-card" style={{ backgroundColor: Colors.cardBg, border: '1px solid ' + Colors.cardBorder, borderRadius: 12, padding: '16px 20px', boxShadow: Colors.cardShadow }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: Colors.textMuted, fontFamily: Fonts.Medium.fontFamily, letterSpacing: '0.01em' }}>Success Rate</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 28, color: Colors.metricSuccess, ...Fonts.Bold, lineHeight: 1 }}>
                {successRate}%
              </span>
              <span style={{ fontSize: 10, fontWeight: '500', color: successRateTrend >= 0 ? Colors.trendGreen : Colors.trendRed, fontFamily: Fonts.Regular.fontFamily, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                {successRateTrend >= 0 ? `+${successRateTrend}%` : `${successRateTrend}%`} <span style={{ fontSize: 11 }}>{successRateTrend >= 0 ? '↑' : '↓'}</span>
              </span>
            </div>
          </div>

          {/* Avg Duration */}
          <div className="metric-card" style={{ backgroundColor: Colors.cardBg, border: '1px solid ' + Colors.cardBorder, borderRadius: 12, padding: '16px 20px', boxShadow: Colors.cardShadow }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: Colors.textMuted, fontFamily: Fonts.Medium.fontFamily, letterSpacing: '0.01em' }}>Avg. Duration</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 28, color: Colors.metricSlate, ...Fonts.Bold, lineHeight: 1 }}>
                {avgM}m {avgS}s
              </span>
              <span style={{ fontSize: 10, fontWeight: '600', color: avgDurationTrend <= 0 ? Colors.trendGreen : Colors.trendRed, fontFamily: Fonts.Regular.fontFamily, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                {avgDurationTrend <= 0 ? `${avgDurationTrend}s` : `+${avgDurationTrend}s`} <span style={{ fontSize: 11 }}>{avgDurationTrend <= 0 ? '↓' : '↑'}</span>
              </span>
            </div>
          </div>

          {/* Active Runners */}
          <div className="metric-card" style={{ backgroundColor: Colors.cardBg, border: '1px solid ' + Colors.cardBorder, borderRadius: 12, padding: '16px 20px', boxShadow: Colors.cardShadow }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: Colors.textMuted, fontFamily: Fonts.Medium.fontFamily, letterSpacing: '0.01em' }}>Active Runners</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 28, color: Colors.metricPrimary, ...Fonts.Bold, lineHeight: 1 }}>
                {activeRunners}
              </span>
              <span style={{ fontSize: 11, color: Colors.sidebarActiveText, fontWeight: '500', fontFamily: Fonts.Regular.fontFamily }}>
                of 12 capacity
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              {[1, 2, 3, 4].map(seg => (
                <div key={seg} style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: seg <= filledSegments ? Colors.progressFilled : Colors.progressEmpty,
                  transition: 'background-color 0.3s'
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Connected Filter Bar & Table Container ── */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Filter Bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #dadce0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>

              {/* Project Name */}
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={labelStyle}>Project Name</label>
                <input
                  style={inputStyle}
                  placeholder="Search projects..."
                  value={localProject}
                  onChange={e => setLocalProject(e.target.value)}
                />
              </div>

              {/* Status */}
              <div style={{ width: 130 }}>
                <label style={labelStyle}>Status</label>
                <div style={{ position: 'relative' }}>
                  <select style={selectStyle} value={localStatus} onChange={e => setLocalStatus(e.target.value)}>
                    <option value="all">All</option>
                    <option value="queued">Queued</option>
                    <option value="building">Running</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <ChevronsUpDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#5f6368', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Platform */}
              <div style={{ width: 130 }}>
                <label style={labelStyle}>Platform</label>
                <div style={{ position: 'relative' }}>
                  <select style={selectStyle} value={localPlatform} onChange={e => setLocalPlatform(e.target.value)}>
                    <option value="all">All</option>
                    <option value="android">Android</option>
                    <option value="ios">iOS</option>
                    <option value="both">Both</option>
                  </select>
                  <ChevronsUpDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#5f6368', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Date */}
              <div style={{ width: 170 }}>
                <label style={labelStyle}>Date</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={localDate}
                  onChange={e => setLocalDate(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 0 }}>
                <button onClick={handleApplyFilters} style={{
                  height: 36, padding: '0 16px', backgroundColor: '#00388d', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 650, cursor: 'pointer'
                }}>Apply</button>
                <button onClick={handleClearFilters} style={{
                  height: 36, padding: '0 16px', backgroundColor: '#fff', color: '#64748b',
                  border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, fontWeight: 650, cursor: 'pointer'
                }}>Clear</button>
              </div>
            </div>
          </div>

          {loading && (
            <div style={{ width: '100%', height: 3, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{ width: '60%', height: '100%', backgroundColor: '#00388d' }} />
            </div>
          )}

          {/* Table wrapper */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f3f4', borderBottom: '1px solid #dadce0' }}>
                  {['Project Name', 'Branch', 'Platform', 'Status', 'Queued At', 'Duration', 'Date', 'Artifacts', 'Log'].map((h) => (
                    <th key={h} style={{
                      padding: '10px 10px',
                      fontSize: 11, fontWeight: 700, color: '#475569',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {builds.map((build) => {
                  const buildDate = new Date(build.createdAt);
                  const timeStr = buildDate.toLocaleTimeString(undefined, {
                    hour: '2-digit', minute: '2-digit', hour12: false
                  }) + (buildDate.getHours() >= 12 ? ' PM' : ' AM');
                  const isExpanded = expanded === build._id;
                  const isActive = ['queued', 'building'].includes(build.status);

                  return (
                    <React.Fragment key={build._id}>
                      <tr style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>

                        {/* Project Name */}
                        <td style={{ padding: '10px 10px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{build.projectName}</div>
                          <div style={{ fontSize: 11, color: '#5f6368', marginTop: 2, fontFamily: Fonts.Regular.fontFamily }}>#MB-{build.buildNumber}</div>
                        </td>

                        {/* Branch */}
                        <td style={{ padding: '10px 10px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 8px', backgroundColor: '#e8eaed',
                            borderRadius: 4, fontSize: 12, color: '#3c4043',
                            fontFamily: Fonts.Regular.fontFamily
                          }}>
                            <GitBranch size={11} style={{ color: '#5f6368', flexShrink: 0 }} />
                            <span style={{ maxWidth: 85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{build.branch}</span>
                          </span>
                        </td>

                        {/* Platform */}
                        <td style={{ padding: '10px 10px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#3c4043' }}>
                            {build.platform === 'ios' && <IosIcon size={14} style={{ color: '#5f6368' }} />}
                            {build.platform === 'android' && <AndroidIcon size={14} style={{ color: '#5f6368' }} />}
                            {build.platform === 'both' && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <AndroidIcon size={14} style={{ color: '#5f6368' }} />
                                <IosIcon size={14} style={{ color: '#5f6368' }} />
                              </div>
                            )}
                            <span>
                              {build.platform === 'ios' ? 'iOS' : build.platform === 'android' ? 'Android' : 'Both'}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '10px 10px' }}>{renderStatus(build.status)}</td>

                        {/* Queued At */}
                        <td style={{ padding: '10px 10px', color: '#3c4043', fontWeight: 500, fontSize: 12.5, whiteSpace: 'nowrap' }}>{timeStr}</td>

                        {/* Duration */}
                        <td style={{ padding: '10px 10px', color: '#3c4043', fontWeight: 500, fontSize: 12.5 }}>
                          {formatDuration(build.duration, build.status)}
                        </td>

                        {/* Date */}
                        <td style={{ padding: '10px 10px' }}>{formatStackedDate(build.createdAt)}</td>

                        {/* Artifacts */}
                        <td style={{ padding: '10px 10px', textAlign: (!build.artifacts?.android?.presignedUrl && !build.artifacts?.ios?.presignedUrl) ? 'center' : 'left' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: (!build.artifacts?.android?.presignedUrl && !build.artifacts?.ios?.presignedUrl) ? 'center' : 'flex-start' }}>
                            {build.artifacts?.android?.presignedUrl && (
                              <a href={build.artifacts.android.presignedUrl} target="_blank" rel="noopener noreferrer" style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '4px 10px', backgroundColor: '#e6f4ea', color: '#137333',
                                borderRadius: 999, fontSize: 11, fontWeight: 600, textDecoration: 'none'
                              }}>
                                <Download size={11} style={{ strokeWidth: 2.5 }} />
                                <span>{build.artifacts.android.fileName?.endsWith('.aab') ? 'AAB' : 'APK'}</span>
                              </a>
                            )}
                            {build.artifacts?.ios?.presignedUrl && (
                              <a href={build.artifacts.ios.presignedUrl} target="_blank" rel="noopener noreferrer" style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '4px 10px', backgroundColor: '#e6f4ea', color: '#137333',
                                borderRadius: 999, fontSize: 11, fontWeight: 600, textDecoration: 'none'
                              }}>
                                <Download size={11} style={{ strokeWidth: 2.5 }} />
                                <span>IPA</span>
                              </a>
                            )}
                            {!build.artifacts?.android?.presignedUrl && !build.artifacts?.ios?.presignedUrl && (
                              <span style={{ color: '#9ca3af', fontWeight: 500 }}>-</span>
                            )}
                          </div>
                        </td>

                        {/* Log */}
                        <td style={{ padding: '10px 10px', textAlign: 'left' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 6 }}>
                            <button onClick={() => toggleLogs(build._id)} style={{
                              backgroundColor: isExpanded ? '#e2e8f0' : '#f8fafc',
                              color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6,
                              padding: '4px 10px', fontSize: 11, fontWeight: 650, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: 4, width: 75, justifyContent: 'center'
                            }}>
                              <FileText size={13} />
                              <span>{isExpanded ? 'Close' : 'Logs'}</span>
                            </button>
                            {isActive && (
                              <button onClick={() => handleCancel(build._id)} style={{
                                backgroundColor: '#fff1f2', color: '#ef4444',
                                border: '1px solid #fecdd3', borderRadius: 6,
                                padding: '4px 10px', fontSize: 11, fontWeight: 650, cursor: 'pointer',
                                width: 75, textAlign: 'center', justifyContent: 'center'
                              }}>Cancel</button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Log Panel */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="9" style={{ backgroundColor: '#f8fafc', padding: '0 20px 20px 20px', borderBottom: '1px solid #e5e7eb' }}>
                            <div style={{ paddingTop: 16 }}>
                              {build.status === 'failed' && (build.error || build.logs?.some(l => l.level === 'error')) && (
                                <div style={{
                                  backgroundColor: '#fff1f2', borderLeft: '4px solid #f43f5e',
                                  padding: '12px 16px', borderRadius: '0 8px 8px 0',
                                  display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12
                                }}>
                                  <AlertTriangle size={16} style={{ color: '#f43f5e', flexShrink: 0, marginTop: 1 }} />
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#9f1239' }}>
                                    <strong>Build Failure Details:</strong>
                                    <div style={{ fontFamily: Fonts.Regular.fontFamily, marginTop: 6, fontSize: 11, backgroundColor: 'rgba(255,255,255,0.6)', padding: '6px 10px', borderRadius: 6, border: '1px solid #fecdd3' }}>
                                      {build.error || 'Check compilation error logs below.'}
                                    </div>
                                  </div>
                                </div>
                              )}
                              {build.provider === 'github' && build.platform !== 'ios' && (
                                <div style={{
                                  backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1',
                                  padding: '12px 16px', borderRadius: '8px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155' }}>
                                    <span role="img" aria-label="github" style={{ fontSize: 16 }}>🐙</span>
                                    <span>GitHub Actions workflow execution logs can be monitored directly in real-time.</span>
                                  </div>
                                  <a href={getGithubRunUrl(build)} target="_blank" rel="noopener noreferrer" style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '6px 14px', borderRadius: '6px', backgroundColor: '#0f172a',
                                    color: '#ffffff', fontSize: 12, fontWeight: 500, transition: 'background-color 0.2s',
                                    textDecoration: 'none'
                                  }}>
                                    View Full Logs
                                  </a>
                                </div>
                              )}
                              {build.platform === 'ios' && build.githubRunUrl && (
                                <div style={{
                                  backgroundColor: '#f0f7ff', border: '1px solid #bae6fd',
                                  padding: '12px 16px', borderRadius: '8px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#0369a1' }}>
                                    <IosIcon size={16} style={{ color: '#0369a1' }} />
                                    <span>Xcode Cloud build runs can be monitored directly on App Store Connect in real-time.</span>
                                  </div>
                                  <a href={build.githubRunUrl} target="_blank" rel="noopener noreferrer" style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '6px 14px', borderRadius: '6px', backgroundColor: '#0f172a',
                                    color: '#ffffff', fontSize: 12, fontWeight: 500, transition: 'background-color 0.2s',
                                    textDecoration: 'none'
                                  }}>
                                    View Full Logs
                                  </a>
                                </div>
                              )}
                              <div style={{
                                backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                                padding: '20px 24px', maxHeight: 320, overflowY: 'auto',
                                display: 'flex', flexDirection: 'column', gap: 14
                              }}>
                                {(!build.logs || build.logs.length === 0) ? (
                                  <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No logs recorded for this build.</div>
                                ) : (
                                  build.logs.map((log, index) => {
                                    const time = new Date(log.timestamp).toLocaleTimeString([], {
                                      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                                    });
                                    const icon = getLogIcon(log.message);
                                    return (
                                      <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, fontSize: 13, lineHeight: 1.5 }}>
                                        <div style={{ width: 90, flexShrink: 0, fontFamily: Fonts.Regular.fontFamily, color: '#9ca3af', userSelect: 'none' }}>{time}</div>
                                        <div style={{ display: 'flex', gap: 8, color: '#334155' }}>
                                          {icon}
                                          <span style={{ color: log.level === 'error' ? '#e11d48' : log.level === 'warn' ? '#d97706' : undefined, fontWeight: log.level === 'error' || log.level === 'warn' ? 500 : undefined }}>
                                            {renderLogMessage(log.message, log.level)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {!loading && builds.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ padding: '64px 0', textAlign: 'center', color: '#9ca3af' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>No builds match the specified filters.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: '1px solid #f1f5f9', padding: '14px 24px',
            backgroundColor: '#f8fafc', gap: 16, flexWrap: 'wrap'
          }}>
            <div style={{ fontSize: 12.5, color: '#64748b' }}>
              Showing <strong style={{ color: '#1e293b' }}>{startIdx}</strong>–<strong style={{ color: '#1e293b' }}>{endIdx}</strong> of <strong style={{ color: '#1e293b' }}>{total}</strong> builds
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: 8, backgroundColor: '#fff', color: '#475569', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
                ><ChevronLeft size={15} /></button>
                {pageNumbers.map(pNum => (
                  <button key={pNum} onClick={() => handlePageChange(pNum)} style={{
                    width: 30, height: 30, borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: 'none',
                    backgroundColor: page === pNum ? '#00388d' : '#fff',
                    color: page === pNum ? '#fff' : '#475569',
                    outline: page === pNum ? 'none' : '1px solid #e2e8f0'
                  }}>{pNum}</button>
                ))}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: 8, backgroundColor: '#fff', color: '#475569', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
                ><ChevronRight size={15} /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}