import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';
import {
  Bell,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Cpu,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Ban
} from 'lucide-react';

const SkeletonMetric = () => (
  <div style={{
    backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12,
    padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)', animation: 'pulse-skeleton 1.5s infinite ease-in-out'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '60%' }}>
        <div style={{ height: 12, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
        <div style={{ height: 24, backgroundColor: '#e2e8f0', borderRadius: 4, width: '80%' }} />
      </div>
      <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#e2e8f0' }} />
    </div>
    <div style={{ height: 10, backgroundColor: '#e2e8f0', borderRadius: 4, width: '40%' }} />
  </div>
);

const SkeletonChart = () => (
  <div style={{
    backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12,
    padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)', animation: 'pulse-skeleton 1.5s infinite ease-in-out'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '50%' }}>
        <div style={{ height: 16, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
        <div style={{ height: 10, backgroundColor: '#e2e8f0', borderRadius: 4, width: '80%' }} />
      </div>
      <div style={{ width: 80, height: 28, borderRadius: 8, backgroundColor: '#e2e8f0' }} />
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 160, padding: '0 8px', marginTop: 12 }}>
      {[35, 50, 40, 65, 58, 85, 48].map((val, idx) => (
        <div key={idx} style={{ width: '10%', height: `${val}%`, backgroundColor: '#e2e8f0', borderRadius: '4px 4px 0 0' }} />
      ))}
    </div>
  </div>
);

const SkeletonDonut = () => (
  <div style={{
    backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12,
    padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)', animation: 'pulse-skeleton 1.5s infinite ease-in-out'
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ height: 16, backgroundColor: '#e2e8f0', borderRadius: 4, width: '70%' }} />
      <div style={{ height: 10, backgroundColor: '#e2e8f0', borderRadius: 4, width: '50%' }} />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140 }}>
      <div style={{ width: 100, height: 100, borderRadius: '50%', border: '12px solid #e2e8f0', boxSizing: 'border-box' }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
      <div style={{ height: 10, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
      <div style={{ height: 10, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
    </div>
  </div>
);

const SkeletonMap = () => (
  <div style={{
    backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12,
    padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)', animation: 'pulse-skeleton 1.5s infinite ease-in-out'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ height: 16, backgroundColor: '#e2e8f0', borderRadius: 4, width: '30%' }} />
      <div style={{ width: 120, height: 10, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
    </div>
    <div style={{ width: '100%', height: 280, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }} />
  </div>
);

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');
  const [ping, setPing] = useState(120); // Simulated baseline ping in ms
  const [hoveredDay, setHoveredDay] = useState(null);

  const fetchStats = async () => {
    const start = performance.now();
    try {
      const res = await api.get('/builds/analytics');
      setData(res.data);
      const latency = Math.round(performance.now() - start);
      setPing(latency > 0 ? latency : 120);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: Colors.bg, ...Fonts.Regular }}>
        <style>{`
          @keyframes pulse-skeleton {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
        `}</style>

        {/* Top Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: Colors.headerBg,
          borderBottom: '1px solid ' + Colors.headerBorder,
          padding: '16px 32px',
          height: '64px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 style={{ fontSize: 22, ...Fonts.Bold, color: '#0f172a', margin: 0 }}>Analytical Dashboard</h1>
            <div style={{ width: 90, height: 20, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#e2e8f0' }} />
            <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#e2e8f0' }} />
          </div>
        </div>

        {/* Dashboard Grid Skeleton Loader */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Metric Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <SkeletonMetric />
            <SkeletonMetric />
            <SkeletonMetric />
            <SkeletonMetric />
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: 12 }}>
            <SkeletonChart />
            <SkeletonDonut />
          </div>

          {/* Map Row */}
          <SkeletonMap />
        </div>
      </div>
    );
  }

  const { metrics, dailyAverages, platformDistribution } = data;
  const presentDayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
  const activeDay = hoveredDay || presentDayName;

  const formatDuration = (s) => {
    if (!s) return '0s';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  // 1. Success Rate Metric
  const successRate = metrics.successRate !== undefined ? metrics.successRate : 0;
  const successRateTrend = metrics.successRateTrend !== undefined ? metrics.successRateTrend : 0;

  // 2. Avg Build Time Metric
  const avgDuration = metrics.avgDuration || 0;
  const avgDurationTrend = metrics.avgDurationTrend || 0;

  // 3. Resource Usage Metric
  const resourceUsage = metrics.resourceUsage || 0;
  const resourceStatus = metrics.resourceStatus || 'Stable';

  // 4. Failed Builds Metric
  const failedBuilds24h = metrics.failedBuilds24h || 0;
  const failedBuildsTrend = metrics.failedBuildsTrend || 0;

  // 4b. Cancelled Builds Metric
  const cancelledBuilds24h = metrics.cancelledBuilds24h || 0;
  const cancelledBuildsTrend = metrics.cancelledBuildsTrend || 0;

  // Platform Donut calculation
  const totalBuilds = platformDistribution.totalBuilds || 0;
  const androidCount = platformDistribution.androidCount || 0;
  const iosCount = platformDistribution.iosCount || 0;
  const androidPercent = platformDistribution.androidPercent || 50;
  const iosPercent = platformDistribution.iosPercent || 50;

  // Render donut SVG paths
  const radius = 60;
  const strokeWidth = 12;
  const circ = 2 * Math.PI * radius;
  const androidStroke = (androidPercent / 100) * circ;
  const iosStroke = (iosPercent / 100) * circ;
  const iosOffset = circ - androidStroke;

  // Calculate dynamic regional latency based on API response ping
  const latencies = {
    usWest: ((ping * 0.004) + 0.8).toFixed(1),
    euCentral: ((ping * 0.009) + 2.8).toFixed(1),
    apSoutheast: ((ping * 0.003) + 0.5).toFixed(1)
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: Colors.bg, ...Fonts.Regular }}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.3; }
        }
        @keyframes blink {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        .live-dot {
          animation: blink 2.5s infinite ease-in-out;
        }
        .pulsing-ring {
          animation: pulse 2s infinite ease-in-out;
        }
        .metric-card {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s ease;
          cursor: pointer;
        }
        .metric-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -8px rgba(0, 56, 141, 0.15), 0 4px 10px -4px rgba(0, 56, 141, 0.1);
        }
      `}</style>

      {/* ── Top Header Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.headerBg,
        borderBottom: '1px solid ' + Colors.headerBorder,
        padding: '16px 32px',
        height: '64px',
        boxSizing: 'border-box'
      }}>
        {/* Title and Live Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ fontSize: 22, ...Fonts.Bold, color: '#0f172a', margin: 0 }}>Analytical Dashboard</h1>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            backgroundColor: '#e6f4ea', border: '1px solid #137333',
            padding: '3px 8px', borderRadius: 4, height: 20, boxSizing: 'border-box'
          }}>
            <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#137333', display: 'inline-block' }} />
            <span style={{ fontSize: 9, ...Fonts.Bold, color: '#137333', letterSpacing: '0.04em' }}>LIVE UPDATING</span>
          </div>
        </div>

        {/* Global actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button style={{ background: 'none', border: 'none', color: Colors.headerIcon, cursor: 'pointer', padding: 0 }}>
            <Bell size={20} />
          </button>
          <button style={{ background: 'none', border: 'none', color: Colors.headerIcon, cursor: 'pointer', padding: 0 }}>
            <HelpCircle size={20} />
          </button>
        </div>
      </div>

      {/* ── Main Dashboard Panel ── */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Metric Cards Grid (4 Columns) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>

          {/* Success Rate */}
          <div className="metric-card" style={{
            backgroundColor: Colors.cardBg, border: '1px solid ' + Colors.cardBorder,
            borderRadius: 12, padding: '12px 16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 550, color: Colors.textMuted }}>Build Success Rate</span>
                <span style={{ fontSize: 26, ...Fonts.Bold, color: '#0f172a', lineHeight: 1 }}>{successRate}%</span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 8, backgroundColor: '#edf3fe', color: '#0c5df4'
              }}>
                <ShieldCheck size={20} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11.5, fontWeight: 600,
                color: successRateTrend >= 0 ? '#16a34a' : '#ef4444'
              }}>
                {successRateTrend >= 0 ? <ArrowUp size={12} strokeWidth={2.5} /> : <ArrowDown size={12} strokeWidth={2.5} />}
                {Math.abs(successRateTrend)}%
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>vs last 30d</span>
            </div>
          </div>

          {/* Avg Build Time */}
          <div className="metric-card" style={{
            backgroundColor: Colors.cardBg, border: '1px solid ' + Colors.cardBorder,
            borderRadius: 12, padding: '12px 16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 550, color: Colors.textMuted }}>Avg. Build Time</span>
                <span style={{ fontSize: 26, ...Fonts.Bold, color: '#0f172a', lineHeight: 1 }}>{formatDuration(avgDuration)}</span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 8, backgroundColor: '#f0fdf4', color: '#16a34a'
              }}>
                <Clock size={20} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11.5, fontWeight: 600,
                color: avgDurationTrend <= 0 ? '#16a34a' : '#ef4444'
              }}>
                {avgDurationTrend <= 0 ? <ArrowDown size={12} strokeWidth={2.5} /> : <ArrowUp size={12} strokeWidth={2.5} />}
                {formatDuration(Math.abs(avgDurationTrend))}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>vs last 30d</span>
            </div>
          </div>

          {/* Failed Builds */}
          <div className="metric-card" style={{
            backgroundColor: Colors.cardBg, border: '1px solid ' + Colors.cardBorder,
            borderRadius: 12, padding: '12px 16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 550, color: Colors.textMuted }}>Failed Builds (24h)</span>
                <span style={{ fontSize: 26, ...Fonts.Bold, color: '#ef4444', lineHeight: 1 }}>{failedBuilds24h}</span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 8, backgroundColor: '#fef2f2', color: '#dc2626'
              }}>
                <ShieldAlert size={20} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11.5, fontWeight: 600,
                color: failedBuildsTrend <= 0 ? '#16a34a' : '#ef4444'
              }}>
                {failedBuildsTrend <= 0 ? <ArrowDown size={12} strokeWidth={2.5} /> : <ArrowUp size={12} strokeWidth={2.5} />}
                {Math.abs(failedBuildsTrend)}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>vs previous 24h</span>
            </div>
          </div>

          {/* Cancelled Builds */}
          <div className="metric-card"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = Colors.cardBg}
            style={{
              backgroundColor: Colors.cardBg, border: '1px solid ' + Colors.cardBorder,
              borderRadius: 12, padding: '12px 16px'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 550, color: Colors.textMuted }}>Cancelled Builds (24h)</span>
                <span style={{ fontSize: 26, ...Fonts.Bold, color: '#475569', lineHeight: 1 }}>{cancelledBuilds24h}</span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 8, backgroundColor: '#f8fafc', color: '#475569'
              }}>
                <Ban size={20} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11.5, fontWeight: 600,
                color: cancelledBuildsTrend <= 0 ? '#16a34a' : '#ef4444'
              }}>
                {cancelledBuildsTrend <= 0 ? <ArrowDown size={12} strokeWidth={2.5} /> : <ArrowUp size={12} strokeWidth={2.5} />}
                {Math.abs(cancelledBuildsTrend)}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>vs previous 24h</span>
            </div>
          </div>

        </div>

        {/* ── Charts Grid (Average Build Times & Platform Distribution) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: 12, minHeight: 320 }}>

          {/* Average Build Times over Time */}
          <div style={{
            backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
            padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: Colors.cardShadow
          }}>
            {/* Chart Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h2 style={{ fontSize: 17, ...Fonts.Bold, color: '#0f172a', margin: 0 }}>Average Build Times over Time</h2>
                <span style={{ fontSize: 12, color: Colors.textMuted }}>Tracking performance metrics across all active pipelines</span>
              </div>

              {/* Range Select */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: '#f1f3f4', border: '1px solid #dadce0',
                borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 600,
                color: '#3c4043', cursor: 'pointer'
              }}>
                <span>Last 7 Days</span>
                {/* <ChevronDown size={13} style={{ color: '#5f6368' }} /> */}
              </div>
            </div>

            {/* Custom Bar Chart Graphic */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end', gap: 8 }}>
              {/* Columns container */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 160, padding: '0 8px' }}>
                {dailyAverages.map((dayData, idx) => {
                  const maxDuration = Math.max(...dailyAverages.map(d => d.avgDuration), 1);
                  const barHeightPercent = dayData.totalBuilds === 0 ? 0 : Math.max(10, (dayData.avgDuration / maxDuration) * 90);
                  const isHighlighted = dayData.day === activeDay;
                  const hoverColor = isHighlighted ? '#0644b4' : '#b2daf8';
                  const baseColor = isHighlighted ? '#0c5df4' : '#d2e9fc';

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'flex-end', height: '100%',
                        flex: 1, gap: 10, position: 'relative'
                      }}
                      className="group-bar"
                      onMouseEnter={() => setHoveredDay(dayData.day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {/* Bar columns */}
                      <div style={{
                        width: '72%', height: `${barHeightPercent}%`,
                        backgroundColor: baseColor, borderRadius: '6px 6px 0 0',
                        cursor: 'pointer', transition: 'background-color 0.2s, height 0.3s'
                      }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = hoverColor}
                        onMouseLeave={(e) => e.target.style.backgroundColor = baseColor}
                      />

                      {/* Tooltip on Hover */}
                      <div className="tooltip" style={{
                        position: 'absolute', bottom: `${barHeightPercent + 10}%`,
                        backgroundColor: '#0f172a', color: '#fff', fontSize: 10,
                        padding: '4px 8px', borderRadius: 4, whiteSpace: 'nowrap',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)', pointerEvents: 'none',
                        opacity: 0, transition: 'opacity 0.25s'
                      }}>
                        {dayData.avgDuration > 0 ? formatDuration(dayData.avgDuration) : 'No builds'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X axis labels */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0',
                paddingTop: 8, fontSize: 11, fontWeight: 700, color: '#94a3b8'
              }}>
                {dailyAverages.map((dayData, idx) => (
                  <span
                    key={idx}
                    style={{
                      flex: 1, textAlign: 'center',
                      color: dayData.day === activeDay ? '#0c5df4' : '#94a3b8',
                      transition: 'color 0.2s'
                    }}
                  >
                    {dayData.day}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Platform Distribution (Circular/Donut Chart) */}
          <div style={{
            backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
            padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: Colors.cardShadow
          }}>
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h2 style={{ fontSize: 17, ...Fonts.Bold, color: '#0f172a', margin: 0 }}>Platform Distribution</h2>
              <span style={{ fontSize: 12, color: Colors.textMuted }}>Build volume by OS</span>
            </div>

            {/* SVG Donut Chart */}
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 140 }}>
              <svg width="150" height="150" viewBox="0 0 150 150">
                {/* Background circle */}
                <circle cx="75" cy="75" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidth} />

                {/* Android (Green) Path */}
                <circle
                  cx="75" cy="75" r={radius} fill="transparent"
                  stroke="#10b981" strokeWidth={strokeWidth}
                  strokeDasharray={`${androidStroke} ${circ}`}
                  transform="rotate(-90 75 75)"
                  strokeLinecap="round"
                />

                {/* iOS (Blue) Path */}
                <circle
                  cx="75" cy="75" r={radius} fill="transparent"
                  stroke="#0c5df4" strokeWidth={strokeWidth}
                  strokeDasharray={`${iosStroke} ${circ}`}
                  strokeDashoffset={iosOffset}
                  transform="rotate(-90 75 75)"
                  strokeLinecap="round"
                />
              </svg>

              {/* Text inside the Donut */}
              <div style={{
                position: 'absolute', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: 24, ...Fonts.Bold, color: '#0f172a' }}>{totalBuilds.toLocaleString()}</span>
                <span style={{ fontSize: 10, fontWeight: 550, color: Colors.textMuted, marginTop: 2 }}>Total Builds</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
              {/* Android */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ color: '#334155', fontWeight: 500 }}>Android</span>
                </div>
                <strong style={{ color: '#0f172a' }}>{androidPercent}%</strong>
              </div>
              {/* iOS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0c5df4' }} />
                  <span style={{ color: '#334155', fontWeight: 500 }}>iOS</span>
                </div>
                <strong style={{ color: '#0f172a' }}>{iosPercent}%</strong>
              </div>
            </div>
          </div>

        </div>

        {/* ── Regional Build Latency Map ── */}
        <div style={{
          backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
          padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: Colors.cardShadow
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h2 style={{ fontSize: 17, ...Fonts.Bold, color: '#0f172a', margin: 0 }}>Regional Build Latency</h2>
            </div>
            {/* Map Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, fontWeight: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ color: '#64748b' }}>Optimal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <span style={{ color: '#64748b' }}>Congested</span>
              </div>
            </div>
          </div>

          {/* Premium Vector World Map Canvas */}
          <div style={{
            position: 'relative', width: '100%', height: 280, backgroundColor: '#b2b7ba',
            borderRadius: 8, overflow: 'hidden', border: '1px solid #d1d5db',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {/* Aspect-Ratio Main Map container to align pins geographically */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              maxWidth: '581px', // 280 * (1000/482)
              aspectRatio: '1000 / 482'
            }}>
              {/* Dotted World Map Background layer */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: 'url("/world-map.svg")',
                backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                opacity: 0.95,
                pointerEvents: 'none'
              }} />

              {/* SVG Arcs overlay */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} viewBox="0 0 1000 482">
                {/* White connection arcs matching the mockup */}
                <path d="M 270,125 Q 465,150 660,304" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.25" />
                <path d="M 660,304 Q 710,220 750,250" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.25" />
                <path d="M 120,400 Q 180,200 270,125" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <path d="M 220,380 Q 200,220 270,125" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <path d="M 900,420 Q 850,300 750,250" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
                <path d="M 820,100 Q 790,170 750,250" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <path d="M 50,200 Q 150,150 270,125" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <path d="M 270,125 Q 350,80 500,100" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" />
                <path d="M 270,125 Q 200,80 100,150" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" />
                <path d="M 270,125 Q 220,150 150,300" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <path d="M 660,304 Q 500,250 400,380" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" />
                <path d="M 750,250 Q 800,150 900,120" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
              </svg>

              {/* Pulsing Locator Dots and Label Cards */}

              {/* US-WEST */}
              <div style={{ position: 'absolute', left: '27%', top: '26%', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
                <div style={{ position: 'relative', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="pulsing-ring" style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.4)' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', zIndex: 1, border: '2px solid #fff' }} />
                </div>
                {/* Card Label */}
                <div style={{
                  backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 4,
                  padding: '6px 8px', fontSize: 10, fontWeight: '800', color: '#0f172a',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.08)', marginTop: 4, textAlign: 'center',
                  lineHeight: 1.2, minWidth: 70
                }}>
                  <div>US-</div>
                  <div>WEST</div>
                  <div style={{ fontSize: 9.5, fontWeight: '900', marginTop: 2 }}>({latencies.usWest}s)</div>
                </div>
              </div>

              {/* EU-CENTRAL */}
              <div style={{ position: 'absolute', left: '66%', top: '63%', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
                <div style={{ position: 'relative', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="pulsing-ring" style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.4)' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b', zIndex: 1, border: '2px solid #fff' }} />
                </div>
                {/* Card Label */}
                <div style={{
                  backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 4,
                  padding: '6px 8px', fontSize: 10, fontWeight: '800', color: '#0f172a',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.08)', marginTop: 4, textAlign: 'center',
                  lineHeight: 1.2, minWidth: 70
                }}>
                  <div>EU-</div>
                  <div>CENTRAL</div>
                  <div style={{ fontSize: 9.5, fontWeight: '900', marginTop: 2 }}>({latencies.euCentral}s)</div>
                </div>
              </div>

              {/* AP-SOUTHEAST */}
              <div style={{ position: 'absolute', left: '75%', top: '52%', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
                <div style={{ position: 'relative', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="pulsing-ring" style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.4)' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', zIndex: 1, border: '2px solid #fff' }} />
                </div>
                {/* Card Label */}
                <div style={{
                  backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 4,
                  padding: '6px 8px', fontSize: 10, fontWeight: '800', color: '#0f172a',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.08)', marginTop: 4, textAlign: 'center',
                  lineHeight: 1.2, minWidth: 70
                }}>
                  <div>AP-</div>
                  <div>SOUTHEAST</div>
                  <div style={{ fontSize: 9.5, fontWeight: '900', marginTop: 2 }}>({latencies.apSoutheast}s)</div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Inject custom chart bar hover tooltips styling */}
      <style>{`
        .group-bar:hover .tooltip {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
