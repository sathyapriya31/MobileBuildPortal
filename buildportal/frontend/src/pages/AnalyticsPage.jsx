import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBuilds } from '../store/slices/buildsSlice.js';
import { fetchRepos } from '../store/slices/reposSlice.js';
import { Bell, HelpCircle, ChevronDown, ChevronRight, Calendar, CheckCircle2, AlertCircle, XCircle, AlertTriangle, Clock, Cpu, Code2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';

export default function AnalyticsPage() {
  const styles = getStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const { builds } = useSelector(s => s.builds);
  const { repos } = useSelector(s => s.repos);

  const [dateRange, setDateRange] = useState('last30');
  const [barChartRange, setBarChartRange] = useState('last7');

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
  const totalBuilds = filteredBuilds.length;
  const completedBuilds = filteredBuilds.filter(b => !['queued', 'building'].includes(b.status));
  const successfulBuilds = filteredBuilds.filter(b => b.status === 'success').length;
  const successRate = completedBuilds.length > 0
    ? Math.round((successfulBuilds / completedBuilds.length) * 100)
    : 0;

  const avgBuildTime = completedBuilds.length > 0
    ? Math.round(completedBuilds.reduce((sum, b) => sum + (b.duration || 0), 0) / completedBuilds.length)
    : 0;

  // Group builds by platform
  const androidBuilds = filteredBuilds.filter(b => b.platform === 'android').length;
  const iosBuilds = filteredBuilds.filter(b => b.platform === 'ios').length;

  // Failed builds in last 24h
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const failedLast24h = builds.filter(b =>
    b.status === 'failed' && b.createdAt && new Date(b.createdAt) >= cutoff24h
  ).length;

  // Resource usage: active builds as a fraction of recent total (min 20%)
  const activeBuilds = builds.filter(b => ['queued', 'building'].includes(b.status)).length;
  const resourceUsagePct = Math.min(100, activeBuilds > 0
    ? Math.round((activeBuilds / Math.max(totalBuilds, 1)) * 100 + 20)
    : 20);

  // Top repos
  const topRepos = repos
    .map(r => ({
      ...r,
      buildCount: filteredBuilds.filter(b => b.projectName === r.name).length,
    }))
    .sort((a, b) => b.buildCount - a.buildCount)
    .slice(0, 5);

  // Recent errors
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

  // Bar chart uses its own range (independent of the KPI date range)
  const barDays = barChartRange === 'last7' ? 7 : barChartRange === 'last30' ? 30 : 90;
  const barCutoff = new Date(Date.now() - barDays * 24 * 60 * 60 * 1000);
  const barBuilds = builds.filter(b => b.createdAt && new Date(b.createdAt) >= barCutoff);

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

        {/* ── Page Header ── */}
        <div style={styles.pageHeader}>
          <div style={styles.headerLeft}>
            <h1 style={styles.headerTitle}>Analytics</h1>
            <p style={styles.headerSubtitle}>Monitor build performance, resource usage, and success metrics.</p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.dateSelectWrapper}>
              <Calendar size={15} style={styles.dateSelectCalIcon} />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={styles.dateRangeSelect}
              >
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="last90">Last 90 Days</option>
              </select>
              <ChevronDown size={14} style={styles.dateSelectChevron} />
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div style={styles.metricsGrid} className="analytics-metrics-grid">
          <KpiCard
            title="Build Success Rate"
            value={`${successRate}%`}
            trend="↑ 2.4%"
            trendColor="#16A34A"
            iconBg="#EFF6FF"
            icon={<CheckCircle2 size={20} color="#2563EB" />}
            styles={styles}
          />
          <KpiCard
            title="Avg. Build Time"
            value={formatTime(avgBuildTime)}
            trend="↓ 12s"
            trendColor="#2563EB"
            iconBg="#EFF6FF"
            icon={<Clock size={20} color="#2563EB" />}
            styles={styles}
          />
          <KpiCard
            title="Resource Usage"
            value={`${resourceUsagePct}%`}
            trend="Stable"
            trendColor="#6B7280"
            iconBg="#F0FDF4"
            icon={<Cpu size={20} color="#16A34A" />}
            styles={styles}
          />
          <KpiCard
            title="Failed Builds (24h)"
            value={failedLast24h.toString()}
            trend="↑ 1"
            trendColor="#DC2626"
            iconBg="#FEF2F2"
            icon={<AlertCircle size={20} color="#DC2626" />}
            styles={styles}
          />
        </div>

        {/* ── Charts ── */}
        <div style={styles.chartsContainer} className="analytics-charts-container">
          <div style={styles.chartColumnLeft}>
            <AvgBuildTimeChart
              builds={barBuilds}
              barChartRange={barChartRange}
              setBarChartRange={setBarChartRange}
              styles={styles}
            />
          </div>
          <div style={styles.chartColumnRight}>
            <PlatformDonutChart
              android={androidBuilds}
              ios={iosBuilds}
              total={totalBuilds}
              styles={styles}
            />
          </div>
        </div>

        {/* ── Bottom Section ── */}
        <div style={styles.bottomGrid}>
          {/* Top Repositories */}
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

          {/* Recent Errors */}
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
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ title, value, trend, trendColor, iconBg, icon, styles }) {
  return (
    <div style={styles.kpiCard} className="metric-card">
      <div style={styles.kpiTopRow}>
        <div style={{ ...styles.kpiIconBox, background: iconBg }}>
          {icon}
        </div>
        <span style={{ ...styles.kpiTrend, color: trendColor }}>{trend}</span>
      </div>
      <p style={styles.kpiLabel}>{title}</p>
      <p style={styles.kpiValue} className="analytics-metric-value">{value}</p>
    </div>
  );
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────

function AvgBuildTimeChart({ builds, barChartRange, setBarChartRange, styles }) {
  const weekData = getWeeklyBuildTimes(builds);
  const todayDayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];

  return (
    <div style={styles.chartCard}>
      <div style={styles.chartHeaderRow}>
        <div>
          <h3 style={styles.chartTitle}>Average Build Times over Time</h3>
          <p style={styles.chartSubtitle}>Tracking performance metrics across all active pipelines</p>
        </div>
        <div style={styles.dateSelectWrapper}>
          <Calendar size={15} style={styles.dateSelectCalIcon} />
          <select
            value={barChartRange}
            onChange={(e) => setBarChartRange(e.target.value)}
            style={styles.dateRangeSelect}
          >
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="last90">Last 90 Days</option>
          </select>
          <ChevronDown size={14} style={styles.dateSelectChevron} />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={weekData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barCategoryGap="15%">
          <CartesianGrid vertical={false} stroke="#F3F4F6" strokeDasharray="0" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={({ x, y, payload }) => {
              const isToday = payload.value === todayDayName;
              return (
                <text
                  x={x}
                  y={y + 14}
                  textAnchor="middle"
                  fill={isToday ? '#1E3A8A' : '#9CA3AF'}
                  fontWeight={isToday ? 700 : 400}
                  fontSize={12}
                  fontFamily="Google Sans, sans-serif"
                >
                  {payload.value}
                </text>
              );
            }}
          />
          <YAxis hide />
          <Tooltip
            formatter={(v) => [`${Math.round(v)}s avg`, 'Build Time']}
            contentStyle={{
              background: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'Google Sans, sans-serif',
            }}
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          />
          <Bar dataKey="avgTime" radius={[4, 4, 0, 0]} fill="#0F4CB5">
            {weekData.map((_, index) => (
              <Cell key={index} fill="#0F4CB5" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function getWeeklyBuildTimes(builds) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const dayName = dayNames[d.getDay()];
    const dayBuilds = builds.filter(b => {
      if (!b.createdAt || !b.duration) return false;
      const bd = new Date(b.createdAt);
      bd.setHours(0, 0, 0, 0);
      return bd.getTime() === d.getTime();
    });

    const avgTime = dayBuilds.length > 0
      ? Math.round(dayBuilds.reduce((s, b) => s + (b.duration || 0), 0) / dayBuilds.length)
      : 0;

    result.push({ day: dayName, avgTime });
  }

  return result;
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function PlatformDonutChart({ android, ios, total, styles }) {
  const androidPct = total > 0 ? Math.round((android / total) * 100) : 0;
  const iosPct = total > 0 ? 100 - androidPct : 0;
  const DONUT_SIZE = 180;

  const data = total > 0
    ? [{ name: 'Android', value: android }, { name: 'iOS', value: ios }]
    : [{ name: 'No Data', value: 1 }];

  const COLORS = total > 0 ? ['#16A34A', '#2563EB'] : ['#E5E7EB'];

  return (
    <div style={{ ...styles.chartCard, display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={styles.chartTitle}>Platform Distribution</h3>
        <p style={styles.chartSubtitle}>Build volume by OS</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        {/* Donut with centered label */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <PieChart width={DONUT_SIZE} height={DONUT_SIZE}>
            <Pie
              data={data}
              cx={DONUT_SIZE / 2 - 1}
              cy={DONUT_SIZE / 2 - 1}
              innerRadius={60}
              outerRadius={85}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
          <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: '26px', fontWeight: '700', color: '#111827', fontFamily: 'Google Sans, sans-serif', lineHeight: 1 }}>
              {total.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'Google Sans, sans-serif', marginTop: '4px' }}>
              Total Builds
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '13px', color: '#374151' }}>Android</span>
            </div>
            <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '13px', fontWeight: '600', color: '#111827' }}>{androidPct}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '13px', color: '#374151' }}>iOS</span>
            </div>
            <span style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '13px', fontWeight: '600', color: '#111827' }}>{iosPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function getStyles() {
  return {
    /* PAGE HEADER */
    pageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '24px',
      flexWrap: 'wrap',
    },
    headerLeft: { flex: 1 },
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
      fontSize: '14px',
      fontWeight: '400',
      color: '#94A3B8',
      margin: '6px 0 0 0',
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
      borderRadius: '8px',
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
      minWidth: '140px',
      padding: '0 30px 0 30px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
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
      borderRadius: '8px',
      color: '#374151',
      cursor: 'pointer',
      flexShrink: 0,
      padding: 0,
    },

    /* KPI CARDS */
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '20px',
    },
    kpiCard: {
      background: Colors.cardBg,
      border: `1px solid ${Colors.cardBorder}`,
      borderRadius: '12px',
      padding: '20px 24px 24px',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      boxShadow: Colors.cardShadow,
    },
    kpiTopRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px',
    },
    kpiIconBox: {
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    kpiTrend: {
      fontSize: '13px',
      fontFamily: 'Google Sans, sans-serif',
      fontWeight: '600',
    },
    kpiLabel: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '13px',
      fontWeight: '500',
      color: '#6B7280',
      margin: '0 0 6px 0',
    },
    kpiValue: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '36px',
      fontWeight: '700',
      color: '#111827',
      margin: 0,
      lineHeight: '1',
    },

    /* CHARTS SECTION */
    chartsContainer: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '20px',
      alignItems: 'stretch',
    },
    chartColumnLeft: { minWidth: 0 },
    chartColumnRight: { minWidth: 0 },
    chartCard: {
      background: Colors.cardBg,
      border: `1px solid ${Colors.cardBorder}`,
      borderRadius: '12px',
      padding: '24px',
      boxSizing: 'border-box',
      height: '100%',
      boxShadow: Colors.cardShadow,
    },
    chartHeaderRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '16px',
      marginBottom: '16px',
    },
    chartTitle: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: '#111827',
      margin: 0,
    },
    chartSubtitle: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '12px',
      color: '#9CA3AF',
      margin: '4px 0 0 0',
    },

    /* BOTTOM SECTION */
    bottomGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
    },
    bottomCard: {
      background: Colors.cardBg,
      border: `1px solid ${Colors.cardBorder}`,
      borderRadius: '12px',
      padding: '24px',
      boxShadow: Colors.cardShadow,
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
      fontSize: '16px',
      fontWeight: '700',
      color: '#0f172a',
      margin: 0,
    },
    errorBadge: {
      display: 'inline-block',
      padding: '4px 10px',
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

    /* TABLE */
    tableContainer: {
      background: Colors.cardBg,
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

    /* ERRORS LIST */
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
