import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBuilds } from '../store/slices/buildsSlice.js';
import { fetchRepos } from '../store/slices/reposSlice.js';
import { Bell, User, Search, Filter, ChevronRight, ChevronDown, Calendar, CheckCircle2, AlertCircle, XCircle, AlertTriangle, Clock, Rocket, Hourglass, Smartphone, Code2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';

export default function AnalyticsPage() {
  const styles = getStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const { builds, total } = useSelector(s => s.builds);
  const { repos } = useSelector(s => s.repos);

  const [dateRange, setDateRange] = useState('last30');
  const [showFilter, setShowFilter] = useState(false);

  // Fetch repos and builds on mount
  useEffect(() => {
    if (user?.provider) {
      dispatch(fetchRepos({ provider: user.provider }));
    }
    dispatch(fetchBuilds({ limit: 100 }));
  }, [dispatch, user?.provider]);

  // Filter builds by selected date range
  const days = dateRange === 'last7' ? 7 : dateRange === 'last90' ? 90 : 30;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const filteredBuilds = builds.filter(b => b.createdAt && new Date(b.createdAt) >= cutoff);

  // Calculate metrics
  const totalRepos = repos.length;
  const totalBuilds = filteredBuilds.length;
  const activeBuilds = filteredBuilds.filter(b => ['queued', 'building'].includes(b.status)).length;

  const completedBuilds = filteredBuilds.filter(b => !['queued', 'building'].includes(b.status));
  const successfulBuilds = filteredBuilds.filter(b => b.status === 'success').length;
  const successRate = completedBuilds.length > 0
    ? Math.round((successfulBuilds / completedBuilds.length) * 100)
    : 0;

  // Calculate average build time (in seconds)
  const avgBuildTime = completedBuilds.length > 0
    ? Math.round(completedBuilds.reduce((sum, b) => sum + (b.duration || 0), 0) / completedBuilds.length)
    : 0;

  // Group builds by platform
  const androidBuilds = filteredBuilds.filter(b => b.platform === 'android').length;
  const iosBuilds = filteredBuilds.filter(b => b.platform === 'ios').length;

  // Get top repos by build count
  const topRepos = repos
    .map(r => ({
      ...r,
      buildCount: filteredBuilds.filter(b => b.projectName === r.name).length,
    }))
    .sort((a, b) => b.buildCount - a.buildCount)
    .slice(0, 5);

  // Get recent errors
  const recentErrors = filteredBuilds
    .filter(b => b.status === 'failed')
    .slice(0, 3)
    .map(b => ({
      title: b.error || 'Build Failed',
      repo: b.projectName || 'Unknown',
      buildNumber: b.buildNumber || b._id,
      timestamp: b.finishedAt || b.createdAt || new Date().toISOString(),
    }));

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatRelativeTime = (ts) => {
    try {
      const diffMs = Date.now() - new Date(ts).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <div style={styles.page} className="analytics-page">
      {/* Page Header */}
      <header style={styles.pageHeader} className="analytics-page-header">
        <div style={styles.headerLeft}>
          <h1 style={styles.headerTitle}>Engineering Health Overview</h1>
          <p style={styles.headerSubtitle}>Aggregated build performance data from all active clusters.</p>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.dateSelectWrapper}>
            <Calendar size={15} style={styles.dateSelectCalIcon} />
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={styles.dateRangeSelect}>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
            </select>
            <ChevronDown size={14} style={styles.dateSelectChevron} />
          </div>
          <button style={styles.filterBtn} onClick={() => setShowFilter(!showFilter)}>
            <Filter size={17} />
          </button>
        </div>
      </header>

      {/* Metrics Grid */}
      <div style={styles.metricsGrid} className="analytics-metrics-grid">
        <MetricCard
          title="TOTAL BUILDS"
          value={totalBuilds.toLocaleString()}
          trend="+14%"
          trendLabel="vs last mo"
          icon={<Rocket size={24} strokeWidth={2} style={{ color: '#2563eb' }} />}
          styles={styles}
        />
        <MetricCard
          title="SUCCESS RATE"
          value={`${successRate}%`}
          trend="+0.2%"
          trendLabel="vs last mo"
          icon={<CheckCircle2 size={24} strokeWidth={2} style={{ color: '#16a34a' }} />}
          styles={styles}
        />
        <MetricCard
          title="AVG BUILD TIME"
          value={formatTime(avgBuildTime)}
          trend="-8%"
          trendLabel="slower"
          icon={<Clock size={24} strokeWidth={2} style={{ color: '#2563eb' }} />}
          styles={styles}
        />
        <MetricCard
          title="BUILD MINUTES"
          value={Math.round(totalBuilds * 4).toLocaleString()}
          trend="Tier: Enterprise"
          trendLabel=""
          icon={<Hourglass size={24} strokeWidth={2} style={{ color: '#4b5563' }} />}
          styles={styles}
        />
      </div>

      {/* Charts Section */}
      <div style={styles.chartsContainer} className="analytics-charts-container">
        <div style={styles.chartColumn}>
          <div style={{ ...styles.chartCard, flex: 1, boxSizing: 'border-box' }}>
            <BuildSuccessChart builds={filteredBuilds} styles={styles} />
          </div>
        </div>

        <div style={styles.chartColumn}>
          <PlatformChart android={androidBuilds} ios={iosBuilds} styles={styles} />
        </div>
      </div>

      {/* Bottom Section: Two Cards */}
      <div style={styles.bottomGrid}>
        {/* Top Repositories Card */}
        <div style={styles.bottomCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Top Repositories</h3>
            <button style={styles.viewAllLink} onClick={() => navigate('/repositories')}>
              View All <ChevronRight size={14} style={{ marginLeft: 2 }} />
            </button>
          </div>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.tableHeader}>Repository</th>
                  <th style={styles.tableHeader}>Builds</th>
                  <th style={styles.tableHeader}>Avg Duration</th>
                  <th style={styles.tableHeader}>Health</th>
                </tr>
              </thead>
              <tbody>
                {topRepos.map((repo, idx) => {
                  const repoBuilds = filteredBuilds.filter(b => b.projectName === repo.name);
                  const repoSuccess = repoBuilds.filter(b => b.status === 'success').length;
                  const health = repoBuilds.length > 0
                    ? Math.round((repoSuccess / repoBuilds.length) * 100)
                    : 0;
                  const avgDuration = repoBuilds.length > 0
                    ? Math.round(repoBuilds.reduce((sum, b) => sum + (b.duration || 0), 0) / repoBuilds.length)
                    : 0;
                  const healthColor = health === 0 ? 'transparent' : health >= 90 ? '#16A34A' : health >= 70 ? '#F59E0B' : '#EF4444';

                  return (
                    <tr key={idx} style={styles.tableRow}>
                      <td style={styles.tableCell}>
                        <div style={styles.repoNameCell}>
                          <div style={styles.repoIconWrapper}>
                            <Code2 size={14} color="#2563EB" />
                          </div>
                          <span style={styles.repoName}>{repo.name}</span>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={styles.buildsCount}>{repo.buildCount.toLocaleString()}</span>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={styles.durationText}>{formatTime(avgDuration)}</span>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.healthBarTrack}>
                          <div style={{ ...styles.healthBarFill, width: `${health > 0 ? Math.max(health, 4) : 0}%`, background: healthColor }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Errors Card */}
        <div style={styles.bottomCard}>
          <div style={styles.cardHeaderErrors}>
            <h3 style={styles.cardTitle}>Recent Errors</h3>
            <span style={styles.errorBadge}>12 Active Logs</span>
          </div>
          <div style={styles.errorsList}>
            {recentErrors.map((error, idx) => {
              const isWarning = /warning/i.test(error.title);
              const isExpired = /expired/i.test(error.title);
              const ErrorIcon = isWarning ? AlertTriangle : isExpired ? XCircle : AlertCircle;
              const iconColor = isWarning ? '#F59E0B' : '#DC2626';

              return (
                <div key={idx} style={styles.errorRow}>
                  <ErrorIcon size={20} style={{ color: iconColor, flexShrink: 0, marginTop: 2 }} />
                  <div style={styles.errorContent}>
                    <div style={styles.errorTopRow}>
                      <span style={styles.errorTitle}>{error.title}</span>
                      <span style={styles.errorTimestamp}>{formatRelativeTime(error.timestamp)}</span>
                    </div>
                    <div style={styles.errorMeta}>
                      Repo: {error.repo} • Build #{error.buildNumber}
                    </div>
                  </div>
                </div>
              );
            })}
            {recentErrors.length === 0 && (
              <div style={styles.emptyState}>
                <CheckCircle2 size={32} style={{ color: Colors.success, opacity: 0.6 }} />
                <div style={styles.emptyStateText}>No recent errors</div>
              </div>
            )}
          </div>
          <div style={styles.errorFooter}>
            <button style={styles.errorFooterLink} onClick={() => navigate('/error-monitor')}>Open Error Monitor</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, trendLabel, icon, styles }) {
  const isPositive = trend.startsWith('+');
  const isNegative = trend.startsWith('-');

  let trendPrefix, trendColor;
  if (isPositive) {
    trendPrefix = '↗ ';
    trendColor = '#16a34a';
  } else if (isNegative) {
    trendPrefix = '↘ ';
    trendColor = '#dc2626';
  } else {
    trendPrefix = 'ⓘ ';
    trendColor = '#4b5563';
  }

  const trendText = trendLabel ? `${trend} ${trendLabel}` : trend;

  return (
    <div style={styles.metricCard} className="analytics-metric-card">
      <div style={styles.metricHeaderRow}>
        <div style={styles.metricTitle}>{title}</div>
        <div>{icon}</div>
      </div>
      <div style={styles.metricValue} className="analytics-metric-value">{value}</div>
      <div style={{ ...styles.metricTrend, color: trendColor }}>
        {trendPrefix}{trendText}
      </div>
    </div>
  );
}

function BuildSuccessChart({ builds, styles }) {
  const trendData = generateTrendData(builds).map((d, i) => ({ ...d, i }));
  const len = trendData.length;
  const ticks = len > 2
    ? [0, Math.floor((len - 1) / 2), len - 1]
    : len === 2 ? [0, 1] : [0];

  return (
    <div style={styles.chartWrapper}>
      <div style={styles.chartHeaderRow}>
        <h3 style={styles.chartTitleTop}>Build Success Trends</h3>
        <div style={styles.chartLegendTop}>
          <div style={styles.legendItemTop}>
            <div style={{ ...styles.legendDotTop, background: '#2563eb' }} />
            <span style={styles.legendTextTop}>Success</span>
          </div>
          <div style={styles.legendItemTop}>
            <div style={{ ...styles.legendDotTop, background: '#dc2626' }} />
            <span style={styles.legendTextTop}>Failure</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="i"
            type="number"
            domain={[0, Math.max(len - 1, 1)]}
            ticks={ticks}
            tickFormatter={(v) => trendData[v]?.label ?? ''}
            tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 400, fontFamily: 'Google Sans, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelFormatter={(v) => trendData[v]?.label ?? ''}
          />
          <Line
            type="monotone"
            dataKey="success"
            stroke="#93c5fd"
            strokeWidth={2}
            dot={false}
            activeDot={false}
          />
          <Line
            type="monotone"
            dataKey="failure"
            stroke="#fca5a5"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function generateTrendData(builds) {
  const dateGroups = {};

  builds.forEach(build => {
    const date = new Date(build.createdAt || new Date());
    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dateGroups[dateKey]) {
      dateGroups[dateKey] = { success: 0, failure: 0, date, label: dateKey };
    }
    if (build.status === 'success') dateGroups[dateKey].success += 1;
    else if (build.status === 'failed') dateGroups[dateKey].failure += 1;
  });

  const sorted = Object.values(dateGroups).sort((a, b) => a.date - b.date);

  if (sorted.length === 0) {
    return [
      { label: 'Nov 01', success: 10, failure: 2 },
      { label: 'Nov 15', success: 12, failure: 1 },
      { label: 'Today', success: 15, failure: 3 },
    ];
  }

  // Fill every calendar day from the earliest build to today so
  // monotone interpolation has enough points to curve (wave effect).
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(sorted[0].date);
  start.setHours(0, 0, 0, 0);

  const filled = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const key = cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    filled.push(dateGroups[key] ?? { success: 0, failure: 0, date: new Date(cursor), label: key });
    cursor.setDate(cursor.getDate() + 1);
  }

  const result = filled.slice(-30);
  if (result.length > 0) result[result.length - 1].label = 'Today';
  return result;
}

// Note: LineChart is now handled by Recharts in BuildSuccessChart component


function PlatformChart({ android, ios, styles }) {
  const CHART_HEIGHT = 180;
  const BAR_WIDTH = 72;
  const maxVal = Math.max(android, ios, 1);
  const androidBarH = android > 0 ? Math.max(Math.round((android / maxVal) * CHART_HEIGHT), 4) : 0;
  const iosBarH = ios > 0 ? Math.max(Math.round((ios / maxVal) * CHART_HEIGHT), 4) : 0;

  return (
    <div style={{ ...styles.chartCard, flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
      <h3 style={styles.chartTitleTop}>Builds by Platform</h3>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ height: CHART_HEIGHT, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ width: BAR_WIDTH, height: androidBarH, background: '#1456c8', borderRadius: '4px 4px 0 0' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Smartphone size={15} color="#374151" />
              <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Android</span>
            </div>
            <div style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '24px', fontWeight: '700', color: '#111827', textAlign: 'center' }}>
              {android.toLocaleString()}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ height: CHART_HEIGHT, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ width: BAR_WIDTH, height: iosBarH, background: '#6d93ea', borderRadius: '4px 4px 0 0' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Smartphone size={15} color="#374151" />
              <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '13px', fontWeight: '500', color: '#374151' }}>iOS</span>
            </div>
            <div style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '24px', fontWeight: '700', color: '#111827', textAlign: 'center' }}>
              {ios.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, subtext, styles }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <div style={styles.statContent}>
        <div style={styles.statLabel}>{label}</div>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statSubtext}>{subtext}</div>
      </div>
    </div>
  );
}

function getStyles() {
  return {
    page: {
      maxWidth: 1400,
      margin: '0 auto',
      padding: '48px 48px',
    },

    /* ========== PAGE HEADER ========== */
    pageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '24px',
      marginBottom: '40px',
      flexWrap: 'wrap',
    },

    headerLeft: {
      flex: 1,
    },

    headerTitle: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '32px',
      fontWeight: '700',
      lineHeight: '1.1',
      color: '#0f172a',
      letterSpacing: '-0.02em',
      margin: 0,
    },

    headerSubtitle: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '15px',
      fontWeight: '400',
      lineHeight: '24px',
      color: '#64748b',
      marginTop: '12px',
    },

    headerRight: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      flexShrink: 0,
    },

    dateSelectWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      height: '36px',
      background: '#ffffff',
      border: '1px solid #D1D5DB',
      borderRadius: '3px',
    },

    dateSelectCalIcon: {
      position: 'absolute',
      left: '9px',
      color: '#6B7280',
      pointerEvents: 'none',
      flexShrink: 0,
    },

    dateSelectChevron: {
      position: 'absolute',
      right: '9px',
      color: '#6B7280',
      pointerEvents: 'none',
      flexShrink: 0,
    },

    dateRangeSelect: {
      height: '100%',
      minWidth: '148px',
      padding: '0 30px 0 30px',
      border: 'none',
      borderRadius: '3px',
      fontSize: '14px',
      fontWeight: '600',
      fontFamily: 'Google Sans, sans-serif',
      background: 'transparent',
      color: '#4B5563',
      cursor: 'pointer',
      outline: 'none',
      appearance: 'none',
    },

    filterBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      height: '36px',
      background: '#ffffff',
      border: '1px solid #D1D5DB',
      borderRadius: '3px',
      color: '#374151',
      cursor: 'pointer',
      flexShrink: 0,
      padding: 0,
    },

    /* ========== METRICS GRID ========== */
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '24px',
      marginBottom: '48px',
    },

    metricCard: {
      background: '#ffffff',
      border: '1px solid #d9dee7',
      borderRadius: '12px',
      padding: '24px',
      height: '160px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxSizing: 'border-box',
    },

    metricHeaderRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      width: '100%',
    },

    metricTitle: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '14px',
      fontWeight: '600',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: '#4b5563',
    },

    metricValue: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '48px',
      fontWeight: '700',
      lineHeight: '1',
      color: '#111827',
    },

    metricTrend: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
    },

    /* ========== CHARTS SECTION ========== */
    chartsContainer: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '16px',
      marginBottom: '48px',
      alignItems: 'stretch',
    },

    chartColumn: {
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
    },

    chartCard: {
      background: '#ffffff',
      border: '1px solid #d9dee8',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: 'none',
    },

    chartWrapper: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
    },

    chartHeaderRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 'var(--space-4)',
    },

    chartTitleTop: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '16px',
      fontWeight: 600,
      lineHeight: '24px',
      color: '#111827',
      margin: 0,
    },

    chartLegendTop: {
      display: 'flex',
      gap: 'var(--space-4)',
      alignItems: 'center',
    },

    legendItemTop: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      fontSize: '14px',
      color: Colors.text,
      ...Fonts.Regular,
    },

    legendDotTop: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      flexShrink: 0,
    },

    legendTextTop: {
      ...Fonts.Regular,
      fontSize: '14px',
      color: Colors.text,
    },

    lineChartContainer: {
      width: '100%',
      height: '260px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyChartContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '260px',
      background: Colors.surface2,
      borderRadius: 'var(--radius-md)',
      color: Colors.textMuted,
    },

    emptyChartText: {
      ...Fonts.Regular,
      fontSize: '14px',
      color: Colors.textMuted,
    },

    /* ========== PLATFORM CHART ========== */
    platformChartWrapper: {
      display: 'flex',
      flexDirection: 'column',
      gap: '80px',
    },

    platformChartTitle: {
      ...Fonts.Bold,
      fontSize: '48px',
      fontWeight: 700,
      color: Colors.text,
      margin: 0,
      textAlign: 'left',
      lineHeight: 1.2,
    },

    platformChartContainer: {
      width: '100%',
      height: '260px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    platformBarsContainer: {
      display: 'flex',
      gap: '60px',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 'var(--space-5)',
    },

    platformBarSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      alignItems: 'center',
    },

    platformBarSpace: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      height: '160px',
      width: '80px',
    },

    platformBar: {
      width: '80px',
      borderRadius: '6px 6px 0 0',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 12px rgba(15,23,42,0.08)',
    },

    platformLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      ...Fonts.Medium,
      fontSize: '14px',
      color: Colors.text,
      textAlign: 'center',
    },

    platformLabelIcon: {
      color: Colors.text,
      flexShrink: 0,
    },

    platformLabelText: {
      ...Fonts.Medium,
      fontSize: '14px',
      color: Colors.text,
    },

    platformCount: {
      ...Fonts.SemiBold,
      fontSize: 'var(--text-sm)',
      color: Colors.text,
      textAlign: 'center',
      lineHeight: 1,
      letterSpacing: '0',
    },

    platformBars: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-6)',
    },

    platformBarItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
    },

    platformBarLabel: {
      ...Fonts.Medium,
      fontSize: 'var(--text-sm)',
      color: Colors.text,
    },

    platformBarValue: {
      ...Fonts.Regular,
      fontSize: 'var(--text-xs)',
      color: Colors.textMuted,
    },

    /* ========== BOTTOM SECTION ========== */
    bottomGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
    },

    bottomCard: {
      background: '#ffffff',
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: 'none',
    },

    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },

    cardHeaderErrors: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },

    cardTitle: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '18px',
      fontWeight: '700',
      color: '#0f172a',
      margin: 0,
    },

    errorBadge: {
      display: 'inline-block',
      padding: '6px 12px',
      background: '#FEE2E2',
      color: '#DC2626',
      borderRadius: '6px',
      fontSize: '12px',
      fontFamily: 'Google Sans, sans-serif',
      fontWeight: '600',
    },

    viewAllLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      color: '#2563EB',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      fontFamily: 'Google Sans, sans-serif',
      fontWeight: '600',
    },

    /* ========== TABLE ========== */
    tableContainer: {
      background: '#ffffff',
      borderRadius: '8px',
      overflowX: 'auto',
      width: '100%',
    },

    table: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left',
    },

    tableHeaderRow: {
      background: '#F8FAFC',
      borderBottom: '1px solid #E5E7EB',
      height: '48px',
    },

    tableHeader: {
      padding: '0 16px',
      color: '#6B7280',
      fontFamily: 'Google Sans, sans-serif',
      fontWeight: '500',
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },

    tableRow: {
      borderBottom: '1px solid #E5E7EB',
      height: '62px',
    },

    tableCell: {
      padding: '0 16px',
      color: '#374151',
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '14px',
    },

    repoNameCell: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },

    repoIconWrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      background: '#EFF6FF',
      borderRadius: '6px',
      flexShrink: 0,
    },

    repoName: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '14px',
      fontWeight: '600',
      color: '#111827',
    },

    buildsCount: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
    },

    durationText: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '14px',
      fontWeight: '400',
      color: '#6B7280',
    },

    healthBarTrack: {
      width: '60px',
      height: '6px',
      background: '#E5E7EB',
      borderRadius: '999px',
      overflow: 'hidden',
    },

    healthBarFill: {
      height: '100%',
      borderRadius: '999px',
    },

    /* ========== ERRORS LIST ========== */
    errorsList: {
      display: 'flex',
      flexDirection: 'column',
    },

    errorRow: {
      display: 'flex',
      gap: '12px',
      padding: '16px 0',
      borderBottom: '1px solid #E5E7EB',
      alignItems: 'flex-start',
    },

    errorContent: {
      flex: 1,
      minWidth: 0,
    },

    errorTopRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '8px',
      marginBottom: '4px',
    },

    errorTitle: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '15px',
      fontWeight: '600',
      color: '#111827',
      flex: 1,
    },

    errorTimestamp: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '12px',
      fontWeight: '400',
      color: '#6B7280',
      flexShrink: 0,
      whiteSpace: 'nowrap',
    },

    errorMeta: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '13px',
      fontWeight: '400',
      color: '#6B7280',
    },

    errorFooter: {
      paddingTop: '16px',
      display: 'flex',
      justifyContent: 'center',
    },

    errorFooterLink: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '14px',
      fontWeight: '600',
      color: '#2563EB',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
    },

    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      gap: '12px',
    },

    emptyStateText: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '14px',
      color: '#9CA3AF',
    },
  };
}
