import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Bell, HelpCircle, Play, Search, Settings } from 'lucide-react';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';
import { triggerBuild } from '../store/slices/buildsSlice.js';

export const BP_WORKSPACES_KEY = 'bp_workspaces';

export default function WorkspacePage() {
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const [search, setSearch] = useState('');
  const [workspaces, setWorkspaces] = useState(() =>
    JSON.parse(localStorage.getItem(BP_WORKSPACES_KEY) || '[]')
  );

  const filtered = workspaces.filter(w =>
    w.repositoryName &&
    (!search ||
    w.repositoryName?.toLowerCase().includes(search.toLowerCase()) ||
    w.repositoryFullName?.toLowerCase().includes(search.toLowerCase()))
  );

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
          <div>
            <h1 style={styles.headerTitle}>Connected Workspaces</h1>
            <p style={styles.headerSubtitle}>Manage repositories, monitor build activity, and trigger new builds.</p>
          </div>
        </div>

        <div style={styles.contentColumn}>
          <div style={styles.searchWrapper}>
            <Search size={16} style={{ color: Colors.textMuted, flexShrink: 0 }} />
            <input
              style={styles.searchInput}
              placeholder="Search workspaces..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={styles.empty}>
              <span style={{ fontSize: '3rem' }}>🔗</span>
              <p style={styles.emptyText}>
                {search
                  ? 'No workspaces match your search.'
                  : 'No connected workspaces yet. Trigger a build to create one automatically.'}
              </p>
              {!search && (
                <button style={styles.newBuildBtn} onClick={() => navigate('/build')}>
                  + New Build
                </button>
              )}
            </div>
          ) : (
            <div style={styles.grid}>
              {filtered.map(ws => (
                <WorkspaceCard key={ws.id} workspace={ws} navigate={navigate} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function WorkspaceCard({ workspace, navigate }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [triggering, setTriggering] = useState(false);

  const {
    projectId,
    repoUrl,
    repositoryName,
    repositoryFullName,
    branch,
    platform,
    buildType,
    androidFormat,
    triggeredAt,
  } = workspace;

  const isIncomplete = !projectId || !branch;

  const handleTrigger = async () => {
    if (isIncomplete) {
      navigate('/build');
      return;
    }
    setTriggering(true);
    const result = await dispatch(triggerBuild({
      projectId,
      projectName: repositoryName,
      repoUrl,
      provider: user.provider,
      branch,
      platform,
      androidFormat: (platform === 'android' || platform === 'both') ? androidFormat : undefined,
      versionName: '1.0.0',
      buildType: buildType || 'testing',
    }));
    setTriggering(false);
    if (triggerBuild.fulfilled.match(result)) {
      toast.success('Build queued!');
      const existing = JSON.parse(localStorage.getItem(BP_WORKSPACES_KEY) || '[]');
      const idx = existing.findIndex(w => w.id === workspace.id);
      if (idx !== -1) {
        existing[idx] = { ...existing[idx], triggeredAt: new Date().toISOString(), lastBuildStatus: 'queued' };
        localStorage.setItem(BP_WORKSPACES_KEY, JSON.stringify(existing));
      }
    } else {
      toast.error(result.payload || 'Failed to trigger build');
    }
  };

  const platformLabel =
    platform === 'android' ? 'ANDROID' :
    platform === 'ios' ? 'iOS' :
    'ANDROID + iOS';

  const platformColor =
    platform === 'android' ? '#166534' :
    platform === 'ios' ? '#3730A3' :
    '#166534';

  const platformBg =
    platform === 'android' ? '#86EFAC' :
    platform === 'ios' ? '#C7D2FE' :
    '#86EFAC';

  const buildLabel =
    platform === 'android' && androidFormat
      ? androidFormat.toUpperCase()
      : buildType
        ? buildType.charAt(0).toUpperCase() + buildType.slice(1)
        : 'Build';

  const lastBuild = triggeredAt
    ? formatDistanceToNow(new Date(triggeredAt), { addSuffix: true })
    : 'Never';

  return (
    <div style={{ ...cardStyles.card, flexDirection: 'column', alignItems: 'stretch', gap: '0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={cardStyles.leftSection}>
        <div style={cardStyles.titleRow}>
          <span style={cardStyles.repoName}>{repositoryName}</span>
          <span style={{
            ...cardStyles.platformBadge,
            color: platformColor,
            background: platformBg,
          }}>
            {platformLabel}
          </span>
        </div>
        <div style={cardStyles.fullName}>{repositoryFullName}</div>
      </div>

      <div style={cardStyles.rightSection}>
        <button
          style={cardStyles.settingsBtn}
          title="Settings"
          onClick={() => navigate(`/workspaces/${workspace.id}/settings`)}
        >
          <Settings size={18} color="#9CA3AF" />
        </button>
        <button
          style={{
            ...cardStyles.triggerBtn,
            ...(isIncomplete ? { background: '#6B7280' } : {}),
            ...(triggering ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
          }}
          onClick={handleTrigger}
          disabled={triggering}
          title={isIncomplete ? 'Incomplete — click to reconfigure in New Build' : 'Trigger Build'}
        >
          <Play size={18} color="#ffffff" fill="#ffffff" />
        </button>
      </div>
      </div>
      {isIncomplete && (
        <div style={cardStyles.incompleteNote}>
          Incomplete — click ▶ to reconfigure
        </div>
      )}
    </div>
  );
}

const cardStyles = {
  card: {
    background: Colors.cardBg,
    border: `1px solid ${Colors.cardBorder}`,
    borderRadius: '16px',
    minHeight: '108px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: Colors.cardShadow,
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  repoName: {
    ...Fonts.Bold,
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
  },
  platformBadge: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '0 12px',
    height: '24px',
    borderRadius: '9999px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    display: 'inline-flex',
    alignItems: 'center',
  },
  fullName: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#6B7280',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  settingsBtn: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FFFFFF',
    border: `1px solid ${Colors.cardBorder}`,
    borderRadius: '10px',
    cursor: 'pointer',
    padding: 0,
  },
  triggerBtn: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#15803D',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    padding: 0,
  },
  incompleteNote: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#9CA3AF',
    paddingLeft: '2px',
  },
};

const styles = {
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
    flexWrap: 'wrap',
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
    fontSize: '14px',
    fontWeight: '400',
    color: '#94A3B8',
    margin: '6px 0 0 0',
  },
  contentColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '780px',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: Colors.cardBg,
    border: `1px solid ${Colors.cardBorder}`,
    borderRadius: '8px',
    padding: '10px 14px',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '14px',
    color: '#0f172a',
    ...Fonts.Regular,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '64px 0',
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: '40ch',
    fontSize: '14px',
    ...Fonts.Regular,
    margin: 0,
  },
  newBuildBtn: {
    padding: '10px 24px',
    background: Colors.primary,
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    ...Fonts.SemiBold,
    cursor: 'pointer',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
};
